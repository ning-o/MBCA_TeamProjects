from fastapi import FastAPI
from app.core.database import engine, Base
from app.models import common 

# 서버가 시작될 때 SQLAlchemy 모델을 기반으로 테이블을 자동 생성
Base.metadata.create_all(bind=engine)

app = FastAPI()

@app.get("/")
def read_root():
    return {"message": "도커 서버 정상 작동 중이며, DB 테이블 생성이 완료되었습니다."}