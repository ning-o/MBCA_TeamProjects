from datetime import datetime, timedelta, timezone
import os

from fastapi import APIRouter, Depends, HTTPException, status
from jose import jwt
from passlib.context import CryptContext
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.common import User
from app.schemas.auth_schema import (
    UserCreateDTO,
    UserLoginDTO,
    UserResponseDTO,
    TokenDTO,
)
from app.models.fridge import fridge_models

from pydantic import BaseModel
from sqlalchemy import text


print("[AUTH FILE LOADED]")

router = APIRouter()

SECRET_KEY = os.getenv("SECRET_KEY", "tikkle-secret-key")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


def create_access_token(data: dict, expires_delta: timedelta | None = None) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (
        expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


@router.post(
    "/signup",
    response_model=UserResponseDTO,
    status_code=status.HTTP_201_CREATED,
)
def signup(user_in: UserCreateDTO, db: Session = Depends(get_db)):
    email = user_in.email.strip().lower()
    nick_name = user_in.nick_name.strip()

    existing_user = db.query(User).filter(User.email == email).first()
    if existing_user:
        raise HTTPException(
            status_code=400,
            detail="이미 사용 중인 이메일입니다."
        )

    existing_nick = db.query(User).filter(User.nick_name == nick_name).first()
    if existing_nick:
        raise HTTPException(
            status_code=400,
            detail="이미 사용 중인 닉네임입니다."
        )

    new_user = User(
        email=email,
        password=hash_password(user_in.password),
        nick_name=nick_name,
        provider=user_in.provider,
        is_active=True,
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    print("[SIGNUP RESULT] id:", new_user.id)
    print("[SIGNUP RESULT] email:", new_user.email)
    print("[SIGNUP RESULT] nick_name:", new_user.nick_name)

    return new_user


@router.post("/login", response_model=TokenDTO)
def login(user_in: UserLoginDTO, db: Session = Depends(get_db)):
    # 1. 입력 값 전처리
    email = user_in.email.strip().lower()

    # 2. 사용자 존재 여부 및 비밀번호 검증 (기존 로직 유지)
    user = db.query(User).filter(User.email == email).first()

    if not user:
        raise HTTPException(
            status_code=401,
            detail="이메일 또는 비밀번호가 올바르지 않습니다."
        )

    if not user.password:
        raise HTTPException(
            status_code=401,
            detail="비밀번호 로그인 계정이 아닙니다."
        )

    if not verify_password(user_in.password, user.password):
        raise HTTPException(
            status_code=401,
            detail="이메일 또는 비밀번호가 올바르지 않습니다."
        )

    if not user.is_active:
        raise HTTPException(
            status_code=403,
            detail="비활성화된 계정입니다."
        )

    # 3. 로그인 시각 업데이트 및 DB 반영
    user.login_dt = datetime.now(timezone.utc)
    db.commit()
    db.refresh(user)

    # ---------------------------------------------------------
    # 유저와 연동된 냉장고(Inventory) ID 조회
    # Refrigerator 테이블에서 현재 로그인한 user.id를 소유자로 가진 첫 번째 데이터를 가져옴
    fridge = db.query(fridge_models.Refrigerator).filter(
        fridge_models.Refrigerator.user_id == user.id
    ).first()
    # ---------------------------------------------------------

    # 4. JWT 토큰 생성
    access_token = create_access_token(
        data={
            "sub": str(user.id),
            "email": user.email,
        }
    )

    # 5. 최종 응답 반환
    # user 객체 정보와 함께 조회된 inven_id를 user_info에 실어서 보냄
    # RefrigeratorResponseDTO 등에 inven_id 필드가 추가되어 있어야 함
    user_response = UserResponseDTO(
        id=user.id,
        email=user.email,
        nick_name=user.nick_name,
        provider=user.provider,
        created_at=user.created_at,
        login_dt=user.login_dt,
        inven_id=fridge.inven_id if fridge else None  # 냉장고가 있으면 ID, 없으면 null
    )

    return TokenDTO(
        access_token=access_token,
        token_type="bearer",
        user_info=user_response,
    )


class UserDeleteRequest(BaseModel):
    user_id: int

@router.post("/delete_user/")
async def delete_user(request_data: UserDeleteRequest, db: Session = Depends(get_db)):
    """
    유저 삭제 (Post Body 방식)
    """ 
    
    # 2. 전달받은 객체에서 user_id 추출
    user_id = request_data.user_id
    
    query = text("""
        DELETE FROM users
        WHERE id = :user_id
    """)

    try:
        # 3. 쿼리 실행 및 커밋
        result = db.execute(query, {"user_id": user_id})
        db.commit()

        if result.rowcount == 0:
            return {"status": "fail", "message": "해당 유저가 존재하지 않습니다."}

        return {
            "status": "success",
            "message": f"User {user_id} deleted successfully."
        }

    except Exception as e:
        db.rollback()
        print(f"Database Error: {e}")
        raise HTTPException(status_code=500, detail="유저 삭제중 오류가 발생했습니다.")