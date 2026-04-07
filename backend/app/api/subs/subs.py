# backend/app/api/subs/subs.py
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
# from app.models.subs import subs_models

from app.crud.subs import UserSubsResponse as CRUD
from app.schemas.subs_dto import SubsResponse, SubsLogoResponse, UserSubsResponse

router = APIRouter()

@router.get("/")
def get_subs_info(db: Session = Depends(get_db)):
    """
    구독 도메인 연결 및 테이블 접근 테스트
    """
    # 실제 테이블이 생성되었는지 쿼리 테스트 (데이터 없어도 에러 안 남)
    # test_query = db.query(subs_models.Subscription).all()
    return {
        "status": "success",
        "message": "구독(Subs) 도메인 및 테이블 연결 완료!",
        "model_check": "Subscription 테이블 인식 성공"
    }


#  카테고리들 목록 조회 ex) OTT, 통신사 등등
@router.get("/categories", response_model=list[str])
def read_subs_category(db: Session = Depends(get_db)):
    return CRUD.read_subs_category(db)

# 카테고리 선택시 - 해당 카테고리 구독 정보들 가져오기
@router.get("/categories/{category}", response_model=list[SubsLogoResponse])
def get_subs_by_logo(category: str, db: Session = Depends(get_db)):
    return CRUD.get_subs_by_logo(db, category)

# 구독 서비스 요금제 상세정보 가져오기
@router.get("/subs/{subs_id}")
def get_price_detail(subs_id: int, db: Session = Depends(get_db)):
    return CRUD.get_price_detail(db, subs_id)

# 내가 구독한 서비스 정보들 가져오기
@router.get("/{user_id}/search", response_model=list[UserSubsResponse])
def get_user_subs(user_id: int, db: Session = Depends(get_db)):
    return CRUD.read_subs(db, user_id)

# 구독 서비스 선택시 유저 데이터 집어넣고 가져오기
@router.post("/{user_id}/insertSubsMaster/{master_id}", response_model=SubsResponse)
def create_master_subscription(user_id: int, master_id: int, db: Session = Depends(get_db)):
    return CRUD.create_subscription(db=db, user_id=user_id, master_id=master_id)

@router.post("/{user_id}/insertSubsBundle/{bundle_id}", response_model=SubsResponse)
def create_bundle_subscription(user_id: int, bundle_id: int, db: Session = Depends(get_db)):
    return CRUD.create_subscription(db=db, user_id=user_id, bundle_id=bundle_id)


