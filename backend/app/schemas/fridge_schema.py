from pydantic import BaseModel
from datetime import date
from typing import Optional, Any


class InviteRoommateRequest(BaseModel):
    inven_id: int
    nick_name: str


# --- [냉장고 및 관리자 관련] ---
class RefrigeratorBase(BaseModel):
    inven_nickname: Optional[str] = None
    mounth_food_exp: int = 0


class RefrigeratorResponse(RefrigeratorBase):
    inven_id: int
    current_spent: int
    total_savings: int = 0

    class Config:
        from_attributes = True


# --- [식재료 및 냉장고 품목 관련] ---
class IngredientCreate(BaseModel):
    inven_id: int
    ingredient_id: int
    ingredient_name: str | None = None
    storage_type: str
    quantity: int
    phurchase_date: date
    after_price: int = 0


class IngredientResponse(BaseModel):
    ref_no: int
    ingredient_name: str
    category: str
    storage_type: str
    quantity: int
    phurchase_date: date
    d_days: date

    class Config:
        from_attributes = True


# --- [영수증 및 구매 이력 관련] ---
class PurchaseCreate(BaseModel):
    raw_item_name: Any
    matched_ingredient_id: Optional[int] = None
    quantity_bill: int
    after_price: int
    phurchase_date: date


class PurchaseResponse(PurchaseCreate):
    phurchase_id: int

    class Config:
        from_attributes = True


class CompleteCookingRequest(BaseModel):
    inven_id: int
    recipe_id: int
    servings: int = 1

    class Config:
        from_attributes = True