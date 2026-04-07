# Tikkle AI 유통기한 예측 로직 (실제 파일명 반영 버전)
import joblib
import pandas as pd
from pathlib import Path
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from app.models.fridge.fridge_models import PhurchaseInfo, RefIngredients, Pantry
from rapidfuzz import process, fuzz

# 1. 경로 설정 (로그에서 확인된 경로 고정)
MODEL_PATH = Path("/app/app/ml/fridge/model")

class ExpiryPredictor:
    def __init__(self):
        try:
            self.model = joblib.load(MODEL_PATH / "tikkle_expiry_model.pkl")
            self.le_category = joblib.load(MODEL_PATH / "expiry_le_category.pkl")
            self.le_item = joblib.load(MODEL_PATH / "expiry_le_item.pkl")
            self.le_condition = joblib.load(MODEL_PATH / "expiry_le_condition.pkl")
            
            print(f"[SUCCESS] AI 모델 로드 완료! (경로: {MODEL_PATH})")

            # Pantry의 39개 상세 카테고리를 프론트엔드 5개 대분류로 변환
            self.category_map = {
                '축산물': '육류', '포장육': '육류', '양념육': '육류', '햄류': '육류', '소시지': '육류', '베이컨': '육류',
                '채소류': '신선식품', '과일류': '신선식품', '허브류': '신선식품', '신선편이': '신선식품',
                '수산물': '해산물', '수산가공품': '해산물', '어묵': '해산물',
                '유제품': '유제품', '유가공품': '유제품', '발효유': '유제품', '계란류': '유제품'
            }

            # AI 예측 결과에 적용할 안전 가중치
            self.safety_weights = {
                '신선식품': 0.7, '육류': 0.7, '해산물': 0.8,
                '유제품': 0.8, '기타': 0.9
            }
        except Exception as e:
            print(f"[ERROR] AI 모델 로드 실패: {e}")

    def calculate_expiry(self, item_name: str, db_category: str, storage_type: str):
        """
        AI 모델을 사용하여 유통기한 예측 시작.
        """
        try:
            # 1. DB에서 온 카테고리 그대로 AI에게
            model_category = db_category

            # 2. 프론트엔드 대분류 변환은 가중치 계산용으로만 따로 빼기
            broad_category = self.category_map.get(db_category, '기타')

            # 3. 정확한 일치 확인 및 유사도(Fuzzy) 검색 로직 추가
            if item_name not in self.le_item.classes_:
                best_match = process.extractOne(item_name, self.le_item.classes_, scorer=fuzz.WRatio)
                
                # 유사도 80점 이상이면 해당 단어로 우회
                if best_match and best_match[1] >= 80:
                    similar_item_name = best_match[0]
                    print(f"[AI Fuzzy] '{item_name}' 테이블 없음 -> '{similar_item_name}'(으)로 대체 (유사도: {best_match[1]:.1f})")
                    item_enc = self.le_item.transform([similar_item_name])[0]
                else:
                    # 유사한 단어도 없으면 카테고리 기반 가중치/기본값으로 계산
                    print(f"[INFO] '{item_name}' 및 유사 재료 없음: 카테고리 기본값으로 계산합니다.")
                    return self.get_default_expiry(broad_category)
            else:
                # 정확히 일치하는 경우
                item_enc = self.le_item.transform([item_name])[0]
            
            # 카테고리 에러 방지
            if model_category not in self.le_category.classes_:
                model_category = '기타가공품'

            cat_enc = self.le_category.transform([model_category])[0]
            cond_enc = self.le_condition.transform([storage_type])[0]

            input_data = pd.DataFrame([[cat_enc, item_enc, cond_enc]], 
                                     columns=['category_encoded', 'item_encoded', 'condition_encoded'])
            predicted_days = self.model.predict(input_data)[0]

            # 가중치 계산은 broad_category(육류 등) 기준으로!
            weight = self.safety_weights.get(broad_category, 0.8)
            return int(round(predicted_days * weight))

        except Exception as e:
            print(f"[WARN] 예측 중 에러 발생, 기본값 반환: {e}")
            return self.get_default_expiry(db_category)

    def get_default_expiry(self, db_category: str):
        """신규 재료나 에러 발생 시 반환할 안전 기간"""
        defaults = {
        '신선식품': 10,   # 채소류 등은 조금 더 길게
        '육류': 5,       # 고기류는 짧게
        '해산물': 3,     # 생선류는 아주 짧게
        '유제품': 12,    # 우유 등 (개봉 전 기준)
        '기타': 180      # 라면, 통조림 등 가공식품은 길게
        }
        return defaults.get(db_category, 7) # 매칭 안되면 7일

# 싱글톤 인스턴스 생성
tikkle_oracle = ExpiryPredictor()


# 보관 방식 매핑 정보 (DB 코드 -> 모델 입력용 텍스트)
STORAGE_MAP = {
    1: "냉장",
    2: "냉동",
    3: "실온"
}

# --- 데이터 토스 파이프 라인 ---
def process_ml_receipt_pipeline(db: Session, purchase_id: int, inven_id: int):
    """
    개별 품목별로 트랜잭션을 관리하여, 특정 품목이 실패해도 나머지는 저장되도록 수정함.
    Pantry에 정확한 이름이 없으면 유사도 검색을 통해 가장 가까운 재료를 매칭함.
    """
    try:
        # 1. 영수증 원본 데이터 조회
        receipt = db.query(PhurchaseInfo).filter(PhurchaseInfo.phurchase_id == purchase_id).first()
        if not receipt:
            print(f"[Error] 존재하지 않는 영수증 ID: {purchase_id}")
            return None

        # 2. 식재료 도감(Pantry) 정보 매칭 (유사도 로직 도입)
        # OCR이 읽은 원본 이름(receipt.item_name_bill 등 실제 컬럼명 확인 필요)으로 검색
        target_name = receipt.item_name_bill if hasattr(receipt, 'item_name_bill') else "기타"
        
        # Pantry 전체 목록 로드 (유사도 검색용)
        all_pantry = db.query(Pantry).all()
        pantry_names = [p.ingredient_name for p in all_pantry]
        pantry_map = {p.ingredient_name: p for p in all_pantry}

        # 유사도 검색 실행 (80점 이상이면 매칭 인정)
        best_match = process.extractOne(target_name, pantry_names, scorer=fuzz.WRatio)
        
        if best_match and best_match[1] >= 80:
            matched_pantry_name = best_match[0]
            pantry_item = pantry_map[matched_pantry_name]
            print(f"[Pantry Match] '{target_name}' -> '{matched_pantry_name}' 매칭 (점수: {best_match[1]:.1f})")
        else:
            # 매칭 실패 시 기존 ID 기반으로 시도하거나 '기타' 처리
            pantry_item = db.query(Pantry).filter(Pantry.ingredient_id == receipt.matched_ingredient_id).first()
            print(f"[Pantry Fail] '{target_name}' 유사 재료 없음. 기존 ID 매칭 시도.")

        # 3. 데이터 처리를 개별 try-except로 감싸서 실패 데이터있을 시 롤백 방지
        try:
            # 보관 방식 설정
            storage_code = pantry_item.storage_code if pantry_item else 1
            current_storage_text = STORAGE_MAP.get(storage_code, "냉장")

            # 4. AI 모델 예측
            predicted_days = tikkle_oracle.calculate_expiry(
                item_name=pantry_item.ingredient_name if pantry_item else "기타",
                db_category=pantry_item.category if pantry_item else "기타",
                storage_type=current_storage_text
            )

            # 5. 최종 유통기한 산출
            calculated_d_day = receipt.phurchase_date + timedelta(days=predicted_days)

            # 6. 냉장고 테이블 등록
            new_ref_item = RefIngredients(
                inven_id=inven_id,
                ingredient_id=pantry_item.ingredient_id if pantry_item else receipt.matched_ingredient_id,
                storage_type=str(storage_code),
                quantity=receipt.quantity_bill,
                phurchase_date=receipt.phurchase_date,
                d_days=calculated_d_day
            )

            db.add(new_ref_item)
            db.commit() # 품목 저장
            db.refresh(new_ref_item)
            
            print(f"[AI Pipeline] '{pantry_item.ingredient_name if pantry_item else 'Unknown'}' 저장 완료!")
            return new_ref_item

        except Exception as item_error:
            db.rollback() # 이 품목만 취소
            print(f"[Item Error] 품목 처리 중 에러 발생 (건너뜀): {item_error}")
            return None

    except Exception as e:
        print(f"[ML Error] 파이프라인 치명적 오류: {e}")
        return None
    

# 테스트 로직
if __name__ == "__main__":
    from app.core.database import SessionLocal
    db = SessionLocal()
    try:
        print("[START] 10개 품목 일괄 입고 테스트 시작!")
        
        # 1번부터 10번까지 루프를 돌며 파이프라인 가동
        for i in range(1, 11):
            process_ml_receipt_pipeline(db, purchase_id=i, inven_id=1)
            
        print("[FINISH] 모든 품목 테스트 완료!")
    finally:
        db.close()