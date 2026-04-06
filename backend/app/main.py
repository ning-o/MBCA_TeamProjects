from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.database import engine, Base

# 모델 등록
import app.models
import app.models.common

# 도메인별 라우터
from app.api.auth import auth
from app.api.fridge import fridge
from app.api.fridge.ocr import router as fridge_ocr_router
from app.api.fridge.expiry_test import router as expiry_test_router
from app.api.subs import subs
from app.api.subs.recommend import router as subs_recommend
from app.api.fridge.recommend import router as fridge_recommend_router

# 부모/공통 테이블 먼저 생성
app.models.common.Base.metadata.create_all(
    bind=engine,
    tables=[
        app.models.common.User.__table__,
        app.models.common.TotalSaving.__table__,
        app.models.common.CommonCode.__table__,
    ]
)

# 전체 등록된 모델 기준 테이블 생성
Base.metadata.create_all(bind=engine)

# FastAPI 앱은 한 번만 생성
app = FastAPI(title="Tikkle Project API")

# 프론트 연결용 CORS
origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 루트 경로
@app.get("/", tags=["Root"])
def read_root():
    return {
        "status": "online",
        "message": "TIKKLE API Server is running"
    }

# 라우터 등록
app.include_router(fridge.router, prefix="/api/fridge", tags=["Fridge"])
app.include_router(fridge_ocr_router, prefix="/api/fridge", tags=["Fridge OCR"])
app.include_router(expiry_test_router, prefix="/api/fridge", tags=["Expiry Test"])
app.include_router(subs.router, prefix="/api/subs", tags=["Subs"])
app.include_router(subs_recommend, prefix="/api/subs", tags=["Subs Recommend"])
app.include_router(auth.router, prefix="/api/auth", tags=["Auth"])
app.include_router(fridge_recommend_router, prefix="/api/fridge", tags=["Fridge Recommend"])

