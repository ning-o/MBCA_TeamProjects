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
    email = user_in.email.strip().lower()

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

    user.login_dt = datetime.now(timezone.utc)
    db.commit()
    db.refresh(user)

    access_token = create_access_token(
        data={
            "sub": str(user.id),
            "email": user.email,
        }
    )

    return TokenDTO(
        access_token=access_token,
        token_type="bearer",
        user_info=user,
    )