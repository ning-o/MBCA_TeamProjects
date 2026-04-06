# Tikkle AI 유통기한 예측 로직 (실제 파일명 반영 버전)
import joblib
import pandas as pd
from pathlib import Path
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from app.models.fridge.fridge_models import PhurchaseInfo, RefIngredients, Pantry

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

            # DB 카테고리(Key) -> 모델 학습 카테고리(Value) 매핑
            self.category_map = {
                '신선식품': '채소류', 
                '육류': '축산물', 
                '해산물': '수산물', 
                '유제품': '유제품',
                '기타': '기타가공품'
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
            # 1. 카테고리 매핑
            model_category = self.category_map.get(db_category, '기타가공품')

            # 2. 학습되지 않은 재료명 체크
            if item_name not in self.le_item.classes_:
                print(f"[INFO] 테이블에 없는 재료 ({item_name}): 기본값으로 계산합니다.")
                return self.get_default_expiry(db_category)

            # 3. 데이터 변환 및 예측
            item_enc = self.le_item.transform([item_name])[0]
            cat_enc = self.le_category.transform([model_category])[0]
            cond_enc = self.le_condition.transform([storage_type])[0]

            input_data = pd.DataFrame([[cat_enc, item_enc, cond_enc]], 
                                     columns=['category_encoded', 'item_encoded', 'condition_encoded'])
            predicted_days = self.model.predict(input_data)[0]

            # 4. 가중치 적용 후 정수 반환
            weight = self.safety_weights.get(db_category, 0.8)
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
    영수증 데이터를 기반으로 AI 모델이 유통기한을 예측하고 냉장고 테이블로 데이터를 이전함
    """
    try:
        # 1. 영수증 원본 데이터 조회
        receipt = db.query(PhurchaseInfo).filter(PhurchaseInfo.phurchase_id == purchase_id).first()
        if not receipt:
            print(f"[Error] 존재하지 않는 영수증 ID: {purchase_id}")
            return None

        # 2. 식재료 도감(Pantry) 정보 매칭
        # OCR 단계에서 매칭된 ingredient_id를 기준으로 도감 정보 확보
        pantry_item = db.query(Pantry).filter(Pantry.ingredient_id == receipt.matched_ingredient_id).first()
        
        # 3. 보관 방식 설정 (Pantry 설정값 우선, 없을 경우 '냉장' 기본값 적용)
        storage_code = pantry_item.storage_code if pantry_item else 1
        current_storage_text = STORAGE_MAP.get(storage_code, "냉장")

        # 4. AI 모델(tikkle_oracle)을 통한 유통기한 예측 실행
        # 품목명, 카테고리, 보관 방식을 AI 모델에 전달하여 예측 일수 확보
        predicted_days = tikkle_oracle.calculate_expiry(
            item_name=pantry_item.ingredient_name if pantry_item else "기타",
            db_category=pantry_item.category if pantry_item else "기타",
            storage_type=current_storage_text
        )

        # 5. 최종 유통기한 산출 (구매일 + AI 예측 일수)
        calculated_d_day = receipt.phurchase_date + timedelta(days=predicted_days)

        # 6. 냉장고(RefIngredients) 테이블로 데이터 신규 등록
        new_ref_item = RefIngredients(
            inven_id=inven_id,
            ingredient_id=receipt.matched_ingredient_id,
            storage_type=str(storage_code), # DB 규격에 맞춰 문자열로 저장
            quantity=receipt.quantity_bill,
            phurchase_date=receipt.phurchase_date,
            d_days=calculated_d_day  # AI 모델의 예측 결과가 반영된 날짜
        )

        db.add(new_ref_item)
        db.commit()
        db.refresh(new_ref_item)
        
        print(f"[AI Pipeline] '{pantry_item.ingredient_name if pantry_item else 'Unknown'}' 입고 완료: AI 예측({predicted_days}일)")
        return new_ref_item

    except Exception as e:
        db.rollback()
        print(f"[ML Error] 파이프라인 프로세스 중단: {e}")
        return None
    

# 테스트 로직
if __name__ == "__main__":
    from app.core.database import SessionLocal
    db = SessionLocal()
    try:
        print("🚀 [START] 10개 품목 일괄 입고 테스트 시작!")
        
        # 1번부터 10번까지 루프를 돌며 파이프라인 가동
        for i in range(1, 11):
            process_ml_receipt_pipeline(db, purchase_id=i, inven_id=1)
            
        print("✅ [FINISH] 모든 품목 테스트 완료!")
    finally:
        db.close()