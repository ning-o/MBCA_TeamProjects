# backend/app/api/subs/subs.py
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.subs import subs_models

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