from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Dict
import traceback

from app.core.recommend.recommend_recipe import recommend_recipes

router = APIRouter()

class RecommendRequest(BaseModel):
    input_stock: Dict[str, int | float]
    top_k: int = 5

@router.post("/recommend")
def recommend_recipe_api(data: RecommendRequest):
    try:
        recipes = recommend_recipes(
            input_stock=data.input_stock,
            top_k=data.top_k,
        )

        return {
            "input_stock": data.input_stock,
            "count": len(recipes),
            "recipes": recipes,
        }

    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"{type(e).__name__}: {str(e)}")