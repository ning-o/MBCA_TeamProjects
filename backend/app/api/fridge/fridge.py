# 냉장고 식재료 관리 및 AI 유통기한 예측 API
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import timedelta

from app.core.database import get_db
from app.models.fridge import fridge_models  # DB 모델
from app.schemas.fridge_schema import IngredientCreate, IngredientResponse
from app.ml.fridge.expiry_logic import tikkle_oracle  # 유통기한 예측 모델

router = APIRouter()

@router.get("/")
def get_fridge_root():
    """
    접속 테스트용 API
    """
    return {"message": "냉장고(Fridge) 도메인 API 연결 성공! 실전 로직 가동 중입니다."}

@router.post("/ingredient", response_model=IngredientResponse)
def add_ingredient_to_fridge(data: IngredientCreate, db: Session = Depends(get_db)):
    """
    사용자가 식재료를 냉장고에 추가하면, AI가 유통기한(d_days)을 자동 계산하여 저장합니다.
    """
    
    # 1. Pantry 테이블에서 해당 식재료 정보(이름, 카테고리) 조회
    pantry_item = db.query(fridge_models.Pantry).filter(
        fridge_models.Pantry.ingredient_id == data.ingredient_id
    ).first()
    
    if not pantry_item:
        raise HTTPException(status_code=404, detail="존재하지 않는 식재료입니다.")

    # 2. AI 모델 학습 기준에 맞춰 저장 방식(storage_type) 매핑
    # (DTO의 '1','2','3' 값을 모델이 이해하는 '냉장','냉동','실온'으로 변환)
    storage_map = {"1": "냉장", "2": "냉동", "3": "실온"}
    storage_name = storage_map.get(data.storage_type, "냉장")
    
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
        phurchase_date=data.phurchase_date,  # 모델 오타 유지
        d_days=calculated_expiry_date        # AI가 예측한 결과 날짜
    )

    db.add(new_ref_item)
    db.commit()
    db.refresh(new_ref_item)

    # 6. 응답 규격(IngredientResponse)에 맞춰 결과 반환
    return IngredientResponse(
        ref_no=new_ref_item.ref_no,
        ingredient_name=pantry_item.ingredient_name,
        category=pantry_item.category,
        storage_type=storage_name,
        quantity=new_ref_item.quantity,
        phurchase_date=new_ref_item.phurchase_date,
        d_days=new_ref_item.d_days
    )

@router.get("/pantry")
def list_pantry(db: Session = Depends(get_db)):
    """
    DB에 적재된 전체 팬트리(식재료 마스터) 목록 조회
    """
    items = db.query(fridge_models.Pantry).all()
    return {"status": "success", "count": len(items), "data": items}