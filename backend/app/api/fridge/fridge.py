# app/api/endpoints/fridge.py
# 냉장고 식재료 관리 및 AI 유통기한 예측 API
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime, timedelta, date
from typing import List, Dict, Any
from sqlalchemy import func

from app.core.database import get_db
from app.models.fridge import fridge_models  # DB 모델
from app.schemas import fridge_schema        # 스키마
from app.schemas.fridge_schema import IngredientCreate, IngredientResponse
from app.ml.fridge.expiry_logic import tikkle_oracle  # 유통기한 예측 모델
from app.models.common import TotalSaving # common.py에 정의된 집계 모델
from app.core.auth import get_current_user_id
from app.schemas.fridge_schema import RefrigeratorResponse, RefrigeratorBase
from app.models.common import User

router = APIRouter()

# 보관 방식 매핑 (0: 실온, 1: 냉장, 2: 냉동 등 프론트 규격)
STORAGE_MAP = {"0": "실온", "1": "냉장", "2": "냉동"}

def check_admin_permission(db: Session, user_id: int, inven_id: int):
    admin_link = db.query(fridge_models.RefAdmin).filter(
        fridge_models.RefAdmin.user_id == user_id,
        fridge_models.RefAdmin.inven_id == inven_id,
        fridge_models.RefAdmin.is_admin == 1,
    ).first()

    if not admin_link:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="해당 작업은 방장만 할 수 있습니다."
        )


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

@router.post("/invite-roommate")
def invite_roommate(
    data: fridge_schema.InviteRoommateRequest,
    db: Session = Depends(get_db),
    current_user_id: int = Depends(get_current_user_id),
):
    """
    동거인을 닉네임으로 초대합니다.
    방장만 초대할 수 있습니다.
    """
    try:
        check_admin_permission(db, current_user_id, data.inven_id)

        print("[INVITE] 요청 nick_name =", repr(data.nick_name), flush=True)

        target_nick = data.nick_name.strip()

        target_user = db.query(User).filter(
            User.nick_name == target_nick
        ).first()

        print("[INVITE] target_nick =", repr(target_nick), flush=True)
        print("[INVITE] target_user =", target_user, flush=True)

        if not target_user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="해당 닉네임의 사용자를 찾을 수 없습니다."
            )

        print("[INVITE] target_user.id =", getattr(target_user, "id", None), flush=True)
        print("[INVITE] current_user_id =", current_user_id, flush=True)

        if target_user.id == current_user_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="자기 자신은 초대할 수 없습니다."
            )

        existing_link = db.query(fridge_models.RefAdmin).filter(
            fridge_models.RefAdmin.user_id == target_user.id,
            fridge_models.RefAdmin.inven_id == data.inven_id
        ).first()

        print("[INVITE] existing_link =", existing_link, flush=True)

        if existing_link:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="이미 해당 냉장고에 참여 중인 사용자입니다."
            )

        new_member = fridge_models.RefAdmin(
            user_id=target_user.id,
            inven_id=data.inven_id,
            is_admin=0
        )

        print("[INVITE] new_member user/inven/admin =",
              target_user.id, data.inven_id, 0, flush=True)

        db.add(new_member)
        db.commit()

        return {
            "status": "success",
            "message": f"{target_nick}님을 동거인으로 초대했습니다.",
            "inven_id": data.inven_id,
            "invited_user_id": target_user.id
        }

    except HTTPException:
        raise
    except Exception as e:
        import traceback
        db.rollback()
        traceback.print_exc()
        print("[INVITE ERROR]", str(e), flush=True)
        raise HTTPException(
            status_code=500,
            detail=f"동거인 초대 중 서버 오류: {str(e)}"
        )
@router.get("/inventory/{inven_id}")    
def get_fridge_inventory(inven_id: int, db: Session = Depends(get_db)):
    """
    특정 냉장고(inven_id)에 담긴 모든 식재료 목록을 조회합니다.
    Pantry 테이블과 Join하여 식재료 이름과 카테고리를 함께 가져옵니다.
    """
    results = db.query(
        fridge_models.RefIngredients,
        fridge_models.Pantry.ingredient_name,
        fridge_models.Pantry.category
    ).join(
        fridge_models.Pantry, 
        fridge_models.RefIngredients.ingredient_id == fridge_models.Pantry.ingredient_id
    ).filter(
        fridge_models.RefIngredients.inven_id == inven_id
    ).all()

    # 프론트 탭 필터링을 위한 대분류 카테고리 매핑
    BROAD_CAT_MAP = {
        '축산물': '육류', '포장육': '육류', '양념육': '육류', '햄류': '육류', '소시지': '육류', '베이컨': '육류',
        '채소류': '신선식품', '과일류': '신선식품', '허브류': '신선식품', '신선편이': '신선식품',
        '수산물': '해산물', '수산가공품': '해산물', '어묵': '해산물',
        '유제품': '유제품', '유가공품': '유제품', '발효유': '유제품', '계란류': '유제품'
    }

    # 프론트엔드 형식에 맞게 데이터 가공
    inventory = []
    for ref, name, cat in results:
        # 오늘 날짜와 유통기한(d_days) 차이 계산하여 D-Day 산출
        if ref.d_days:
            # 데이터가 있을 때만 날짜 계산
            d_day_val = (ref.d_days - date.today()).days
        else:
            # 데이터가 없으면(None) 에러 대신 안전하게 999(기한 없음 의미) 부여
            d_day_val = 999
        
        # DB의 상세 카테고리를 프론트의 탭 분류 기준에 맞게 변환
        broad_cat = BROAD_CAT_MAP.get(cat, "기타")
        
        inventory.append({
            "id": str(ref.ref_no),
            "name": name,
            "count": str(ref.quantity),
            "dday": d_day_val,
            "storage": "냉장" if ref.storage_type == "1" else "냉동" if ref.storage_type == "2" else "실온",
            "category": broad_cat  # 변환된 카테고리로 전송
        })
    
    return inventory


@router.post("/complete-cooking")
def complete_cooking(data: fridge_schema.CompleteCookingRequest, db: Session = Depends(get_db)):
    """
    요리 완료 시 호출되는 API:
    1. 레시피 재료와 내 냉장고 재고를 매칭
    2. 실제 보유한 재료만 수량 차감
    3. 0개가 되면 삭제
    4. 절약 금액 및 TotalSaving 누적
    """

    current_ym = datetime.now().strftime("%Y%m")

    # 1. 냉장고 조회
    fridge = db.query(fridge_models.Refrigerator).filter(
        fridge_models.Refrigerator.inven_id == data.inven_id
    ).first()

    if not fridge:
        raise HTTPException(status_code=404, detail="냉장고 정보를 찾을 수 없습니다.")

    # 2. 레시피 재료 조회
    recipe_ings = db.query(fridge_models.RecipeIngredients).filter(
        fridge_models.RecipeIngredients.recipe_id == data.recipe_id
    ).all()

    if not recipe_ings:
        raise HTTPException(status_code=404, detail="레시피 재료 정보를 찾을 수 없습니다.")

    total_base_price = 0
    used_ingredients = []
    skipped_ingredients = []

    try:
        for r_ing in recipe_ings:
            required_qty = r_ing.required_quantity if r_ing.required_quantity else 1

            # 내 냉장고에서 해당 재료 전부 조회
            my_ings = db.query(fridge_models.RefIngredients).filter(
                fridge_models.RefIngredients.inven_id == data.inven_id,
                fridge_models.RefIngredients.ingredient_id == r_ing.ingredient_id
            ).order_by(fridge_models.RefIngredients.ref_no.asc()).all()

            if not my_ings:
                skipped_ingredients.append({
                    "ingredient_id": r_ing.ingredient_id,
                    "reason": "not_in_inventory"
                })
                continue

            pantry_item = db.query(fridge_models.Pantry).filter(
                fridge_models.Pantry.ingredient_id == r_ing.ingredient_id
            ).first()

            ingredient_name = pantry_item.ingredient_name if pantry_item else f"ingredient_{r_ing.ingredient_id}"

            # 절약금 계산용 base_price는 재료가 실제 하나라도 사용될 때만 1회 더함
            if pantry_item:
                total_base_price += pantry_item.base_price

            remain_to_use = required_qty
            used_qty = 0

            for my_ing in my_ings:
                if remain_to_use <= 0:
                    break

                current_qty = my_ing.quantity or 0
                if current_qty <= 0:
                    continue

                deduct_qty = min(current_qty, remain_to_use)
                my_ing.quantity = current_qty - deduct_qty

                used_qty += deduct_qty
                remain_to_use -= deduct_qty

                if my_ing.quantity <= 0:
                    db.delete(my_ing)

            if used_qty > 0:
                used_ingredients.append({
                    "ingredient_id": r_ing.ingredient_id,
                    "ingredient_name": ingredient_name,
                    "used_quantity": used_qty,
                    "required_quantity": required_qty
                })
            else:
                skipped_ingredients.append({
                    "ingredient_id": r_ing.ingredient_id,
                    "ingredient_name": ingredient_name,
                    "reason": "no_available_quantity"
                })

        # 3. 절약 금액 계산
        unit_saving = 12000 - int(total_base_price * 0.2)
        if unit_saving < 5000:
            unit_saving = 8000

        calculated_total_saving = unit_saving * data.servings

        # 4. Refrigerator 및 TotalSaving 누적
        fridge.total_savings = (fridge.total_savings or 0) + calculated_total_saving

        new_log = TotalSaving(
            ym=current_ym,
            user_id=fridge.user_id,
            category="fridge",
            amount=int(calculated_total_saving),
            description=f"레시피 ID {data.recipe_id} ({data.servings}인분) 요리 완료"
        )
        db.add(new_log)

        db.commit()

        return {
            "status": "success",
            "servings": data.servings,
            "added_saving": calculated_total_saving,
            "used_ingredients": used_ingredients,
            "skipped_ingredients": skipped_ingredients
        }

    except Exception as e:
        db.rollback()
        print(f"DB 저장 실패: {str(e)}")
        raise HTTPException(status_code=500, detail=f"데이터 저장 실패: {str(e)}")
    
    
@router.post("/refrigerator", response_model=fridge_schema.RefrigeratorResponse)
def create_refrigerator(
    data: fridge_schema.RefrigeratorBase, 
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user_id) # 토큰에서 ID 추출
):
    """
    [냉장고 생성 API]
    """
    # 중복 체크 로직
    existing = db.query(fridge_models.Refrigerator).filter(
        fridge_models.Refrigerator.user_id == user_id
    ).first()
    
    if existing:
        raise HTTPException(status_code=400, detail="이미 냉장고가 존재합니다.")

    # 실제 데이터 저장
    new_fridge = fridge_models.Refrigerator(
        inven_nickname=data.inven_nickname,
        mounth_food_exp=data.mounth_food_exp,
        user_id=user_id, # 추출된 ID
        current_spent=0,
        total_savings=0
    )

    db.add(new_fridge)
    db.commit()
    db.refresh(new_fridge)

    owner_link = fridge_models.RefAdmin(
    user_id=user_id,
    inven_id=new_fridge.inven_id,
    is_admin=1
    )
    db.add(owner_link)
    db.commit()
    db.refresh(new_fridge)

    return new_fridge

@router.patch("/refrigerator/{inven_id}", response_model=RefrigeratorResponse)
def update_refrigerator(
    inven_id: int,
    fridge_in: RefrigeratorBase,
    db: Session = Depends(get_db),
    current_user_id: int = Depends(get_current_user_id),
):
    """
    [냉장고 정보 수정 API]
    - 기존 냉장고의 이름이나 예산 설정을 변경합니다.
    - 방장만 수정 가능합니다.
    """
    check_admin_permission(db, current_user_id, inven_id)

    db_fridge = db.query(fridge_models.Refrigerator).filter(
        fridge_models.Refrigerator.inven_id == inven_id
    ).first()

    if not db_fridge:
        raise HTTPException(status_code=404, detail="냉장고를 찾을 수 없습니다.")

    if fridge_in.inven_nickname is not None:
        db_fridge.inven_nickname = fridge_in.inven_nickname

    if fridge_in.mounth_food_exp is not None:
        db_fridge.mounth_food_exp = fridge_in.mounth_food_exp

    db.commit()
    db.refresh(db_fridge)
    return db_fridge


@router.get("/details/{inven_id}", response_model=RefrigeratorResponse)
def get_refrigerator_details(inven_id: int, db: Session = Depends(get_db)):
    """
    [냉장고 상세 정보 조회]
    - 특정 냉장고의 이름과 설정된 예산 정보를 반환합니다.
    - 메인 화면 진입 시 최신 설정값을 동기화하기 위해 사용됩니다.
    """
    fridge = db.query(fridge_models.Refrigerator).filter(
        fridge_models.Refrigerator.inven_id == inven_id
    ).first()
    
    if not fridge:
        raise HTTPException(status_code=404, detail="냉장고 정보가 존재하지 않습니다.")
        
    return fridge
        


@router.get("/spending-summary/{inven_id}")
def get_spending_summary(inven_id: int, db: Session = Depends(get_db)):
    """
    [JOIN 방식] 매달 1일 자동으로 0원부터 시작되는 월간 지출 합계 API
    """
    today = date.today()
    first_day_of_month = date(today.year, today.month, 1)

    # 내 냉장고(inven_id)로 찍힌 이번 달 영수증 합계만 계산
    total_spent = db.query(func.sum(fridge_models.PhurchaseInfo.after_price))\
        .filter(
            fridge_models.PhurchaseInfo.inven_id == inven_id,
            fridge_models.PhurchaseInfo.phurchase_date >= first_day_of_month
        ).scalar() or 0

    return {
        "total_spent": int(total_spent),
        "current_month": today.month
    }

@router.post("/save-items")
def save_multiple_ingredients(
    items: List[fridge_schema.IngredientCreate],
    db: Session = Depends(get_db),
    current_user_id: int = Depends(get_current_user_id),
) -> Dict[str, Any]:
    """
    영수증 OCR 또는 수동 입력을 통해 전달받은 다수의 식재료를 냉장고(DB)에 저장합니다.
    단, 해당 냉장고의 방장(is_admin=1)만 저장할 수 있습니다.
    """
    if not items:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="저장할 항목이 없습니다."
        )

    # 모든 아이템이 같은 냉장고(inven_id)로 들어온다고 가정
    target_inven_id = items[0].inven_id

    # 혹시 다른 inven_id가 섞여 들어오면 차단
    if any(item.inven_id != target_inven_id for item in items):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="한 번의 요청에는 하나의 냉장고(inven_id)만 사용할 수 있습니다."
        )

    check_admin_permission(db, current_user_id, target_inven_id)

    saved_count = 0
    errors = []

    for item in items:
        try:
            pantry_item = db.query(fridge_models.Pantry).filter(
                fridge_models.Pantry.ingredient_name == item.ingredient_name
            ).first()

            if not pantry_item:
                errors.append({
                    "ingredient_id": item.ingredient_name,
                    "error": f"'{item.ingredient_name}'을(를) Pantry에서 찾을 수 없습니다."
                })
                continue

            real_item_name = pantry_item.ingredient_name
            db_category = pantry_item.category
            mapped_condition = STORAGE_MAP.get(str(item.storage_type), "냉장")

            predicted_days = tikkle_oracle.calculate_expiry(
                item_name=real_item_name,
                db_category=db_category,
                storage_type=mapped_condition
            )

            purchase_d = item.phurchase_date if item.phurchase_date else date.today()
            calculated_d_days = purchase_d + timedelta(days=predicted_days)

            with db.begin_nested():
                new_ref_ingredient = fridge_models.RefIngredients(
                    inven_id=item.inven_id,
                    ingredient_id=pantry_item.ingredient_id,
                    storage_type=str(item.storage_type),
                    d_days=calculated_d_days,
                    quantity=item.quantity,
                    phurchase_date=purchase_d
                )
                db.add(new_ref_ingredient)

                new_purchase_record = fridge_models.PhurchaseInfo(
                    inven_id=item.inven_id,
                    raw_item_name={"display_name": item.ingredient_name},
                    matched_ingredient_id=pantry_item.ingredient_id,
                    quantity_bill=item.quantity,
                    after_price=item.after_price,
                    phurchase_date=purchase_d
                )
                db.add(new_purchase_record)

                db.flush()

            saved_count += 1

        except Exception as e:
            errors.append({
                "ingredient_id": item.ingredient_id,
                "error": f"DB 저장 실패(inven_id 등 확인 필요): {str(e)}"
            })

    if saved_count > 0:
        try:
            db.commit()
        except Exception as e:
            db.rollback()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"DB 저장 중 치명적 오류가 발생했습니다: {str(e)}"
            )

    if errors and saved_count == 0:
        return {"status": "error", "message": "모든 항목 저장에 실패했습니다.", "errors": errors}
    elif errors:
        return {"status": "partial_success", "saved_count": saved_count, "errors": errors}
    else:
        return {"status": "success", "saved_count": saved_count}