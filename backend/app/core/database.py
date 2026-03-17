import os
import time
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from sqlalchemy.exc import OperationalError  # DB 연결 실패 예외 처리를 위한 라이브러리
from dotenv import load_dotenv

# 환경 변수 및 설정 로드
load_dotenv()

# .env에서 DB URL 가져오기
SQLALCHEMY_DATABASE_URL = os.getenv("DATABASE_URL")

def create_engine_with_retry(url):
    """
    DB가 연결되기 전에 API가 먼저 연결을 시도하다가 에러가 나는 것을 방지합니다.
    도커 환경에서 MySQL 컨테이너가 완전히 가동될 때까지 최대 5번 재시도합니다.
    """
    max_retries = 5  # 최대 5번까지 시도
    delay = 5        # 시도 간격 5초
    
    for i in range(max_retries):
        try:
            # DB 엔진 생성 시도
            engine = create_engine(url)
            # 실제로 연결이 가능한지 테스트
            engine.connect()
            print(f"✅ [INFO] DB 연결 성공! (시도 횟수: {i+1})")
            return engine
        except OperationalError:
            if i < max_retries - 1:
                print(f"⚠️ [WAIT] DB가 아직 준비되지 않았습니다. {delay}초 후 다시 시도합니다... ({i+1}/{max_retries})")
                time.sleep(delay)
            else:
                print("❌ [ERROR] DB 연결에 실패했습니다. 설정을 확인하십시오.")
                raise

# DB 엔진 생성 (재시도 로직 적용)
engine = create_engine_with_retry(SQLALCHEMY_DATABASE_URL)

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