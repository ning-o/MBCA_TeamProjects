# 냉장고 식재료 관리, 인벤토리 권한 및 영수증 구매 정보 통합 스키마
from pydantic import BaseModel
from datetime import date
from typing import Optional, List, Any

# --- [냉장고 및 관리자 관련] ---
class RefrigeratorBase(BaseModel):
    inven_nickname: Optional[str] = None  # 냉장고 별칭
    mounth_food_exp: int = 0             # 월별 목표 식비

class RefrigeratorResponse(RefrigeratorBase):
    inven_id: int                        # 냉장고 고유 ID
    current_spent: int                   # 현재 지출액
    total_savings: int = 0
    class Config:
        from_attributes = True           # ORM 모델 객체를 바로 DTO로 변환 허용

# --- [식재료 및 냉장고 품목 관련] ---
class IngredientCreate(BaseModel):
    inven_id: int                        # 소속 냉장고 ID
    ingredient_id: int                   # 식재료 마스터 ID
    ingredient_name: str | None = None
    storage_type: str                    # 저장 방식 (1:냉장, 2:냉동, 3:실온)
    quantity: int                        # 수량
    phurchase_date: date                 # 구매일 (모델 오타 유지: phurchase)

class IngredientResponse(BaseModel):
    ref_no: int                          # 냉장고 내 품목 고유번호
    ingredient_name: str                 # 식재료명
    category: str                        # 카테고리
    storage_type: str                    # 저장 방식
    quantity: int                        # 수량
    phurchase_date: date                 # 구매일
    d_days: date                         # AI가 계산한 유통기한 (예측값)
    class Config:
        from_attributes = True

# --- [영수증 및 구매 이력 관련] ---
class PurchaseCreate(BaseModel):
    raw_item_name: Any                   # 영수증 인식 원본 데이터 (JSON)
    matched_ingredient_id: Optional[int] = None # 매칭된 식재료 ID
    quantity_bill: int                   # 구매 수량
    after_price: int                     # 할인 후 가격
    phurchase_date: date                 # 구매일
    
class PurchaseResponse(PurchaseCreate):
    phurchase_id: int                    # 구매 기록 고유 ID
    class Config:
        from_attributes = True

class CompleteCookingRequest(BaseModel):
    inven_id: int             # 냉장고 고유 ID
    recipe_id: int            # 완료한 레시피 ID
    servings: int = 1         # 인분 수 (기본값 1인분)
    
    class Config:
        from_attributes = True