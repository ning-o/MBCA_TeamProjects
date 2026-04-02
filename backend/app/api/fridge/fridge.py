# backend/app/api/fridge/fridge.py
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.fridge import fridge_models # 설계도 연결

# 1. 라우터 객체 생성 (파일명과 도메인을 일치시킴)
router = APIRouter()

@router.get("/")
def get_fridge_root():
    """
    접속 테스트용: http://localhost:8000/api/fridge/ 접속 시 확인
    """
    return {"message": "냉장고(Fridge) 도메인 API 연결 성공! 여기서부터 작업 개시하십시오."}

@router.get("/pantry")
def list_pantry(db: Session = Depends(get_db)):
    """
    [예시] 팬트리 목록 조회 (팀원이 실제 쿼리를 짤 자리)
    """
    # 실제 작업 시: items = db.query(fridge_models.Pantry).all()
    return {"status": "success", "data": [], "note": "추후 실제 DB 데이터를 연결할 예정입니다."}