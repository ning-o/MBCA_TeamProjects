# Tikkle AI 유통기한 예측 로직 (실제 파일명 반영 버전)
import joblib
import pandas as pd
from pathlib import Path
from datetime import datetime, timedelta
import os

# 1. 경로 설정 (로그에서 확인된 경로 고정)
MODEL_PATH = Path("/app/app/ml/fridge/model")

class ExpiryPredictor:
    def __init__(self):
        try:
            # [수정] 로그에서 확인된 실제 파일명으로 변경
            self.model = joblib.load(MODEL_PATH / "tikkle_expiry_model.pkl")
            self.le_category = joblib.load(MODEL_PATH / "expiry_le_category.pkl")
            self.le_item = joblib.load(MODEL_PATH / "expiry_le_item.pkl")
            self.le_condition = joblib.load(MODEL_PATH / "expiry_le_condition.pkl")
            
            print(f"🚀 [SUCCESS] AI 모델 로드 완료! (경로: {MODEL_PATH})")

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
            print(f"❌ [ERROR] AI 모델 로드 실패: {e}")

    def calculate_expiry(self, item_name: str, db_category: str, storage_type: str):
        """
        AI 모델을 사용하여 유통기한(일수)을 예측합니다.
        """
        try:
            # 1. 카테고리 매핑
            model_category = self.category_map.get(db_category, '기타가공품')

            # 2. 학습되지 않은 재료명 체크
            if item_name not in self.le_item.classes_:
                print(f"🔍 [INFO] 신규 재료 감지 ({item_name}): 기본값으로 계산합니다.")
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
            print(f"⚠️ [WARN] 예측 중 에러 발생, 기본값 반환: {e}")
            return self.get_default_expiry(db_category)

    def get_default_expiry(self, db_category: str):
        """신규 재료나 에러 발생 시 반환할 안전 기간"""
        defaults = {'신선식품': 7, '육류': 3, '해산물': 2, '유제품': 5, '기타': 14}
        return defaults.get(db_category, 7)

# 싱글톤 인스턴스 생성
tikkle_oracle = ExpiryPredictor()