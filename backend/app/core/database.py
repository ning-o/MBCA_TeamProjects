import os
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv

# 환경 변수 및 설정 로드
load_dotenv()

# .env에서 DB URL 가져오기
SQLALCHEMY_DATABASE_URL = os.getenv("DATABASE_URL")

# DB 엔진 생성 (Database 연결 지점)
engine = create_engine(SQLALCHEMY_DATABASE_URL)

# 개별 db 세션을 관리하는 SessionLocal 클래스 정의
# autocommit=False: commit() 호출 시에만 데이터 반영 / 반대로 True일시 한줄 실행할때마다 db에 바로 반영됨 >> 위험한 방법
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# 데이터베이스 모델 생성을 위한 선언적 기본 클래스
Base = declarative_base()

def get_db():
    """
    FastAPI에서 DB 세션을 안전하게 관리하기 위한 함수입니다.
    사용자가 요청을 보내면 세션을 열고(yield), 요청이 끝나면 자동으로 닫아줍니다(finally).

    """
    db = SessionLocal()  # DB 세션 인스턴스 생성
    try:
        yield db         # API 로직 실행을 위해 세션 객체 반환
    finally:
        db.close()       # 리소스 누수 방지를 위한 세션 종료 처리