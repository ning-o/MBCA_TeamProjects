# backend/app/api/auth/auth.py
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models import common

router = APIRouter()

@router.get("/login")
def login_test(db: Session = Depends(get_db)):
    """
    인증(Auth) 도메인 연결 테스트 API
    """
    return {"message": "인증 도메인 연결 성공. 로그인 로직을 구현하십시오."}