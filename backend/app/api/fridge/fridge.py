# app/api/endpoints/fridge.py
# 냉장고 식재료 관리 및 AI 유통기한 예측 API
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime, timedelta, date
from typing import List, Dict, Any

from app.core.database import get_db
from app.models.fridge import fridge_models  # DB 모델 (Pantry, RefIngredients 등)
from app.schemas import fridge_schema        # 스키마
from app.schemas.fridge_schema import IngredientCreate, IngredientResponse
from app.ml.fridge.expiry_logic import tikkle_oracle  # 유통기한 예측 오라클 모델

router = APIRouter()

# 보관 방식 매핑 (0: 실온, 1: 냉장, 2: 냉동 등 프론트 규격)
STORAGE_MAP = {"0": "실온", "1": "냉장", "2": "냉동"}

@router.get("/")
def get_fridge_root():
    """
    접속 테스트용 API
    """
    return {"message": "냉장고(Fridge) 도메인 API 연결 성공! 실전 로직 가동 중입니다."}

@router.post("/ingredient", response_model=IngredientResponse)
def add_ingredient_to_fridge(data: IngredientCreate, db: Session = Depends(get_db)):
    """
    사용자가 식재료를 단건으로 냉장고에 추가하면, AI가 유통기한(d_days)을 자동 계산하여 저장합니다.
    """
    # 1. Pantry 테이블에서 해당 식재료 정보(이름, 카테고리) 조회
    pantry_item = db.query(fridge_models.Pantry).filter(
        fridge_models.Pantry.ingredient_id == data.ingredient_id
    ).first()
    
    if not pantry_item:
        raise HTTPException(status_code=404, detail="존재하지 않는 식재료 정보입니다.")

    # 2. 보관 방식 매핑
    storage_name = STORAGE_MAP.get(str(data.storage_type), "냉장")
    
    # 3. AI 엔진 호출: 예측된 유통기한 일수(int) 확보
    predicted_days = tikkle_oracle.calculate_expiry(
        item_name=pantry_item.ingredient_name,
        db_category=pantry_item.category,
        storage_type=storage_name
    )

    # 4. 구매일(phurchase_date) 기준으로 최종 만료 날짜 계산
    calculated_expiry_date = data.phurchase_date + timedelta(days=predicted_days)

    # 5. DB(ref_ingredients 테이블)에 실제 데이터 저장
    new_ref_item = fridge_models.RefIngredients(
        inven_id=data.inven_id,
        ingredient_id=data.ingredient_id,
        storage_type=data.storage_type,
        quantity=data.quantity,
        phurchase_date=data.phurchase_date,  
        d_days=calculated_expiry_date        # AI가 예측한 결과 날짜
    )

    db.add(new_ref_item)
    db.commit()
    db.refresh(new_ref_item)

    return IngredientResponse(
        ref_no=new_ref_item.ref_no,
        ingredient_name=pantry_item.ingredient_name,
        storage_type=new_ref_item.storage_type,
        quantity=new_ref_item.quantity,
        phurchase_date=new_ref_item.phurchase_date,
        d_days=new_ref_item.d_days
    )

@router.post("/save-items")
def save_multiple_ingredients(
    items: List[fridge_schema.IngredientCreate], 
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """
    영수증 OCR 또는 수동 입력을 통해 전달받은 다수의 식재료를 냉장고(DB)에 저장합니다.
    저장 전 AI 모델을 호출하여 품목과 보관 상태에 따른 정확한 유통기한(d_days)을 계산합니다.
    """
    saved_count = 0
    errors = []

    for item in items:
        try:
            # 1. 마스터 테이블(Pantry)에서 실제 식재료 이름 조회
            pantry_item = db.query(fridge_models.Pantry).filter(
                fridge_models.Pantry.ingredient_id == item.ingredient_id
            ).first()

            if not pantry_item:
                errors.append({
                    "ingredient_id": item.ingredient_id, 
                    "error": "Pantry에서 식재료 마스터 정보를 찾을 수 없습니다."
                })
                continue

            # DB에 저장된 한글 식재료명 및 카테고리 추출
            real_item_name = pantry_item.ingredient_name 
            db_category = pantry_item.category

            # 2. 보관 방식 코드 변환
            # 프론트에서 온 "0", "1", "2"를 AI가 인식할 수 있는 "실온", "냉장", "냉동"으로 매핑
            mapped_condition = STORAGE_MAP.get(str(item.storage_type), "냉장")

            # 3. AI 유통기한 예측 모델 호출 (tikkle_oracle 사용)
            # 숫자 ID가 아닌 '진짜 이름'과 '카테고리', '진짜 보관 상태'를 전달하여 정확도 확보
            predicted_days = tikkle_oracle.calculate_expiry(
                item_name=real_item_name,
                db_category=db_category,
                storage_type=mapped_condition
            )
            
            # 4. 실제 유통기한(d_days) 계산 (구매일 + 예측 유통기한 일수)
            purchase_d = item.phurchase_date if item.phurchase_date else date.today()
            calculated_d_days = purchase_d + timedelta(days=predicted_days)

            # 5. DB Insert 객체 생성 (RefIngredients 테이블)
            new_ref_ingredient = fridge_models.RefIngredients(
                inven_id=item.inven_id,
                ingredient_id=item.ingredient_id,
                storage_type=str(item.storage_type),
                d_days=calculated_d_days,  # AI가 계산한 최종 날짜 삽입
                quantity=item.quantity,
                phurchase_date=purchase_d
            )
            
            db.add(new_ref_ingredient)
            saved_count += 1

        except Exception as e:
            errors.append({
                "ingredient_id": item.ingredient_id, 
                "error": str(e)
            })

    # 전체 트랜잭션 처리 (부분 실패 허용 구조)
    if saved_count > 0:
        try:
            db.commit()
        except Exception as e:
            db.rollback()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, 
                detail=f"DB 저장 중 치명적 오류가 발생했습니다: {str(e)}"
            )

    # 응답 결과 반환
    if errors and saved_count == 0:
        return {"status": "error", "message": "모든 항목 저장에 실패했습니다.", "errors": errors}
    elif errors:
        return {"status": "partial_success", "saved_count": saved_count, "errors": errors}
    else:
        return {"status": "success", "saved_count": saved_count}