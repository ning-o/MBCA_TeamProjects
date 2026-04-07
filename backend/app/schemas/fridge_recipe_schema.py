# 레시피 마스터 정보 및 레시피별 상세 식재료 매핑 통합 스키마
from pydantic import BaseModel
from typing import Optional, List

# --- [레시피별 상세 재료 정보] ---
class RecipeIngredientDetail(BaseModel):
    ingredient_id: int                   # 식재료 ID
    ingredient_name: str                 # 식재료명
    required_quantity: Optional[int] = None # 필요 수량
    main_ingredients: str                # 주재료 여부 및 설명
    sub_ingredients: Optional[str] = None # 부재료 설명
    Seasonings: Optional[str] = None      # 양념 설명
    class Config:
        from_attributes = True

# --- [레시피 마스터 정보] ---
class RecipeResponse(BaseModel):
    recipe_id: int                       # 레시피 고유 ID
    recipe_name: str                     # 레시피명
    difficulty: int                      # 난이도
    cooking_time: int                    # 조리 시간
    category: Optional[str] = None       # 요리 카테고리
    expected_saving: int = 0
    ingredients: List[RecipeIngredientDetail] = [] # 포함된 재료 리스트
    class Config:
        from_attributes = True