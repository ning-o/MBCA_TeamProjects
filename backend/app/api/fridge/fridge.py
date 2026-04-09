from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas.fridge_schema import CompleteCookingRequest
from app.models.fridge.fridge_models import RefIngredients, RecipeIngredients

router = APIRouter()


@router.post("/cook/complete")
def complete_cooking(data: CompleteCookingRequest, db: Session = Depends(get_db)):
    try:
        updated = []
        skipped = []

        recipe_ingredients = (
            db.query(RecipeIngredients)
            .filter(RecipeIngredients.recipe_id == data.recipe_id)
            .all()
        )

        if not recipe_ingredients:
            raise HTTPException(
                status_code=404,
                detail="레시피 재료 정보를 찾을 수 없습니다."
            )

        for recipe_item in recipe_ingredients:
            ingredient_id = recipe_item.ingredient_id
            required_qty = int(recipe_item.required_quantity or 0) * int(data.servings or 1)

            if required_qty <= 0:
                skipped.append({
                    "ingredient_id": ingredient_id,
                    "reason": "차감 수량이 0 이하"
                })
                continue

            ref_item = (
                db.query(RefIngredients)
                .filter(
                    RefIngredients.inven_id == data.inven_id,
                    RefIngredients.ingredient_id == ingredient_id
                )
                .first()
            )

            if not ref_item:
                skipped.append({
                    "ingredient_id": ingredient_id,
                    "reason": "냉장고에 없음"
                })
                continue

            current_qty = int(ref_item.quantity or 0)
            deducted_qty = min(current_qty, required_qty)
            remain_qty = current_qty - deducted_qty

            if deducted_qty <= 0:
                skipped.append({
                    "ingredient_id": ingredient_id,
                    "reason": "차감 가능한 수량 없음"
                })
                continue

            if remain_qty <= 0:
                db.delete(ref_item)
            else:
                ref_item.quantity = remain_qty

            updated.append({
                "ingredient_id": ingredient_id,
                "deducted": deducted_qty,
                "remain": max(remain_qty, 0)
            })

        db.commit()

        return {
            "message": "냉장고 업데이트 완료!",
            "updated": updated,
            "skipped": skipped
        }

    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"요리 완료 처리 실패: {str(e)}"
        )