from fastapi import APIRouter, HTTPException
from app.ml.subs.recommend_subs import SubsRecommend, RecommendRequest

router = APIRouter()


@router.post("/recommend")
def get_add_recommend(payload: RecommendRequest):
    try:
        return SubsRecommend(payload)

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))