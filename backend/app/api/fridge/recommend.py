from fastapi import APIRouter, HTTPException
from app.ml.fridge.recommend_recipe import TikkleRecipeRecommender

router = APIRouter()
recommender = TikkleRecipeRecommender()


@router.post("/recommend/test")
def recommend_test(payload: dict):
    try:
        input_stock = payload.get("input_stock", {})
        top_k = payload.get("top_k", 5)

        recommendations = recommender.recommend(
            input_stock=input_stock,
            top_k=top_k,
        )

        return {
            "input_stock": input_stock,
            "recommendations": recommendations,
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))