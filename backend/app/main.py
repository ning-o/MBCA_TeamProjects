from fastapi import FastAPI
from app.core.database import engine, Base

# 1. __init__에 등록된 모델 불러오기
import app.models

# 2. 도메인별 라우터 불러오기
from app.api.auth import auth
from app.api.fridge import fridge # fridge.py 파일 내에 router 객체가 있어야 함
from app.api.subs import subs

# 부모 테이블을 포함한 common 모델들을 먼저 생성 시도
app.models.common.Base.metadata.create_all(bind=engine, tables=[
    app.models.common.User.__table__,
    app.models.common.TotalSaving.__table__,
    app.models.common.CommonCode.__table__
])

# 서버 시작 시 DB 테이블 생성
# Base가 위에서 import된 모든 모델을 훑으며 MySQL에 테이블을 생성.
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Tikkle Project API")

# [루트 경로] 서버 정상 작동 확인용
@app.get("/")
def read_root():
    return {
        "status": "online",
        "message": "도커 서버 정상 작동 중이며, 모든 도메인 테이블 생성이 완료되었습니다."
    }

# [도메인 연결] prefix와 tags를 설정하여 Swagger 문서에서 그룹화
# 이제 도메인 관련 API는 /api/도메인명 으로 시작함.
app.include_router(fridge.router, prefix="/api/fridge", tags=["Fridge"])
app.include_router(subs.router, prefix="/api/subs", tags=["Subs"])
app.include_router(auth.router, prefix="/api/auth", tags=["Auth"])
