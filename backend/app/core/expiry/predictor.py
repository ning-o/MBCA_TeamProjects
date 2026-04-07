import re
from pathlib import Path
from typing import Any, Dict, Optional, Tuple

import joblib
import pandas as pd
from rapidfuzz import fuzz, process

# ==========================================
# 1. 경로 및 설정값 정의
# ==========================================
BASE_DIR = Path("/app/app/ml/fridge/model")

# 진 파일 경로
MODEL_PATH = BASE_DIR / "tikkle_expiry_model.pkl"
LE_CATEGORY_PATH = BASE_DIR / "expiry_le_category.pkl"
LE_CONDITION_PATH = BASE_DIR / "expiry_le_condition.pkl"
LE_ITEM_PATH = BASE_DIR / "expiry_le_item.pkl"
TRAIN_DATA_PATH = BASE_DIR / "final_train_data.csv"

# 예측 실패 시 세이프티 가이드라인
GLOBAL_DEFAULT_EXPIRY = 7
DEFAULT_CONDITION = "냉장"
DEFAULT_CATEGORY = "채소류"
DEFAULT_ITEM = "양배추"

class ExpiryPredictor:
    def __init__(self):
        """
        초기화: AI 모델 및 인코더 로드
        """
        try:
            # 모델/인코더 로드
            self.model = joblib.load(MODEL_PATH)
            self.le_category = joblib.load(LE_CATEGORY_PATH)
            self.le_condition = joblib.load(LE_CONDITION_PATH)
            self.le_item = joblib.load(LE_ITEM_PATH)
            
            # 학습 데이터 원본 로드 (통계 기반 백업용)
            self.df = pd.read_csv(TRAIN_DATA_PATH)

            # 인코더에서 학습된 고유 키워드 추출 (검증용)
            self.known_categories = list(self.le_category.classes_)
            self.known_conditions = list(self.le_condition.classes_)
            self.known_items = list(self.le_item.classes_)

            # [백업 로직용] 모델 미매칭 시 사용할 통계 데이터 계산
            self._prepare_fallback_stats()
            
            print(f"[INFO] Tikkle AI Engine Loaded. Item Count: {len(self.known_items)}")
        except Exception as e:
            print(f"[ERROR] 모델 로드 실패: {e}")
            # 로드 실패 시에도 서버가 죽지 않도록 최소한의 데이터 할당
            self.known_items = []

    def _prepare_fallback_stats(self):
        """
        모델 예측 실패 시 사용할 카테고리/보관조건별 평균 일수 사전 계산
        """
        if self.df is not None:
            self.category_mean = self.df.groupby("식품분류")["expiry_days"].mean().to_dict()
            self.condition_mean = self.df.groupby("보관조건")["expiry_days"].mean().to_dict()

    def predict(self, item_name: str, category: str, condition: str, raw_item_text: str = None, **kwargs) -> Dict[str, Any]:
        """
        유통기한 메인 예측 함수
        :param item_name: 정제된 품목명 (ex: 삼겹살)
        :param category: 식품 분류 (ex: 축산물)
        :param condition: 보관 조건 (ex: 냉장)
        """
        # 결과 필드 기본 구조
        result = {
            "item_name": item_name,
            "food_category": category,
            "storage_condition": condition,
            "expiry_days": GLOBAL_DEFAULT_EXPIRY,
            "prediction_source": "none",
            "raw_item_text": raw_item_text
        }

        # 1순위: RF 모델 기반 예측
        try:
            # 텍스트 -> 숫자 인코딩 수행
            item_idx = self.le_item.transform([item_name])[0]
            cat_idx = self.le_category.transform([category])[0]
            cond_idx = self.le_condition.transform([condition])[0]

            # 피처 구성 및 예측
            X = pd.DataFrame([[cat_idx, item_idx, cond_idx]], 
                             columns=["category_encoded", "item_encoded", "condition_encoded"])
            
            pred_days = self.model.predict(X)[0]
            
            result.update({
                "expiry_days": int(round(pred_days)),
                "prediction_source": "rf_model"
            })
            return result

        except (ValueError, Exception) as e:
            # 2순위: 유사도 검색 (Fuzzy Matching) 추가
            # known_items 리스트에서 가장 유사한 단어 추출
            best_match = process.extractOne(item_name, self.known_items, scorer=fuzz.WRatio)
            
            # 유사도가 80점 이상일 경우에만 대체 단어로 예측 수행
            if best_match and best_match[1] >= 80:
                similar_item_name = best_match[0]
                print(f"[AI Fuzzy] '{item_name}' 미매칭 -> '{similar_item_name}'(으)로 유사도 예측 (점수: {best_match[1]:.1f})")
                
                try:
                    item_idx = self.le_item.transform([similar_item_name])[0]
                    cat_idx = self.le_category.transform([category])[0]
                    cond_idx = self.le_condition.transform([condition])[0]

                    X = pd.DataFrame([[cat_idx, item_idx, cond_idx]], 
                                     columns=["category_encoded", "item_encoded", "condition_encoded"])
                    pred_days = self.model.predict(X)[0]
                    
                    result.update({
                        "expiry_days": int(round(pred_days)),
                        "prediction_source": "rf_model_fuzzy"
                    })
                    return result
                except Exception as inner_e:
                    print(f"[WARN] 유사 단어 예측 중 에러: {inner_e}")
            else:
                print(f"[WARN] 모델 매칭 및 유사 단어 검색 실패: {e}")

        # 3순위: 카테고리 평균 기반 추정
        if category in self.category_mean:
            result.update({
                "expiry_days": int(round(self.category_mean[category])),
                "prediction_source": "category_mean"
            })
            return result

        # 4순위: 최종 전역 기본값 반환
        result["prediction_source"] = "global_default"
        return result

# 싱글톤 패턴 활용을 위한 인스턴스 생성
expiry_predictor = ExpiryPredictor()