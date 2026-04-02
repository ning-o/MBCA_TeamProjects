from fastapi import APIRouter, Depends, HTTPException
from app.core.database import get_db
from sqlalchemy.orm import Session

from crud.subs import UserSubsResponse as CRUD
from app.schema.subs.subs_dto import SubsResponse, SubsLogoResponse

router = APIRouter(prefix="/api/v1", tags=["subs"])

# 화면 출력시 - 구독한 서비스 정보들 가져오기
@router.get("subs/{user_id}", response_model=list[SubsResponse])
def get_user_subs(user_id: int, db: Session = Depends(get_db)):
    return CRUD.read_subs(db, user_id)

# 구독 선택시 - 유저 데이터 집어넣고 가져오기
@router.post("subs/{user_id}/SubsSelet", response_model=SubsResponse)
def create_subscription(user_id: int, db: Session = Depends(get_db)):
    return CRUD.create_subscription(db, user_id)

# 구독 선택 페이지 접속시 - 카테고리 목록 조회

# read_subs_category
@router.get("/category/{category}", response_model=list[SubsLogoResponse])
def get_subs_by_category(category: str, db: Session = Depends(get_db)):
    return CRUD.read_subs_by_category(db, category)

# 카테고리 선택시 - 해당 카테고리 구독 로고들 조회
@router.get("/category/{category}", response_model=list[SubsLogoResponse])
def get_subs_by_category(category: str, db: Session = Depends(get_db)):
    return CRUD.read_subs_by_category(db, category)
