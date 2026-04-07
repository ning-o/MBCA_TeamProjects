
from pydantic import BaseModel
from typing import Any, Optional
from datetime import datetime

# 사용자 구독 - 사용자가 구독 선택했을경우
class UserSubsInsert(BaseModel):    
    user_id: int
    master_id: Optional[int] = None
    bundle_id: Optional[int] = None
    payment_date: int

# 사용자 구독 - 사용자의 구독 정보 가져오기
class UserSubsResponse(BaseModel):
    user_id: int
    master_id: Optional[int] = None
    bundle_id: Optional[int] = None
    created_at: datetime
    is_auto_pay: bool

    # master 테이블 join 결과
    name: Optional[str] = None
    logo_img: Optional[str] = None
    category: Optional[str] = None
    base_price: Optional[int] = None

    class Config:
        orm_mode = True


# 구독 서비스 정보 넣기 (직접 입력)
class SubsCreate(BaseModel):
    name: str
    logo_img: Optional[str] = None
    base_price: int
    category: str
    detail: Optional[list[dict[str, Any]]] = None

# 구독 서비스 정보 가져오기
class SubsResponse(BaseModel):
    name: str
    logo_img: Optional[str] = None
    base_price: int
    category: str
    detail: Optional[list[dict[str, Any]]] = None

    class Config:
        orm_mode = True
 
# 구독 서비스 로고 정보 가져오기
class SubsLogoResponse(BaseModel):    
    id: int
    category: str
    logo_img: str
    base_price: int
    
    class Config:
        orm_mode = True

# 구독 금액 데이터 - 변경시
class SubsAmountInsert(BaseModel):
    user_id: int
    category: str
    amount: int
    save_at: datetime

    class Config:
        orm_mode = True

# 구독 금액 데이터 - 조회
class SubsAmountResponse(BaseModel):
    user_id: int
    category: str
    amount: int
    save_at: datetime

# 사용할때
# from app.schemas.subs_dto import SubsCreate, SubsResponse
# @router.post("/subs", response_model=SubsResponse)
# def create_sub(data: SubsCreate):
#     return service.create_sub(data)


# 예제
# @router.get("/subs/{user_id}", response_model=list[SubsResponse])
# def get_user_subs(user_id: int):
#     return service.get_user_subs(user_id)

# api 파일
# def get_user_subs(user_id: int):
#     user_subs = db.query(UserSubs).filter(
#         UserSubs.user_id == user_id
#     ).all()

#     master_ids = [u.master_id for u in user_subs]

#     subs = db.query(Subs).filter(
#         Subs.id.in_(master_ids)
#     ).all()

#     return subs