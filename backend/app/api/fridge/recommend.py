from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Dict, Optional
import traceback

from app.core.recommend.recommend_recipe import recommend_recipes

router = APIRouter()


class RecommendRequest(BaseModel):
    input_stock: Dict[str, int | float]
    expiry_info: Optional[Dict[str, int]] = None
    top_k: int = 5


@router.post("/recommend")
def recommend_recipe_api(data: RecommendRequest):
    try:
        print("[DEBUG] input_stock =", data.input_stock)
        print("[DEBUG] expiry_info =", data.expiry_info)
        print("[DEBUG] top_k =", data.top_k)

        recipes = recommend_recipes(
            input_stock=data.input_stock,
            top_k=data.top_k,
            expiry_info=data.expiry_info,
        )

        return {
            "input_stock": data.input_stock,
            "expiry_info": data.expiry_info,
            "count": len(recipes),
            "recipes": recipes,
        }

    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"{type(e).__name__}: {str(e)}")