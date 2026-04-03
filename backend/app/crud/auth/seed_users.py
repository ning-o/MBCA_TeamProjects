# backend/app/crud/auth/seed_users.py
# 개발용 테스트 유저 생성 파일
import sys
import os
from sqlalchemy.orm import Session
from datetime import datetime

# 프로젝트 루트 경로
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from app.core.database import SessionLocal
from app.models.common import User

def seed_initial_users():
    db: Session = SessionLocal()
    try:
        # 데이터 존재 여부 체크
        if db.query(User).count() > 0:
            print("[SKIP] 이미 사용자 데이터가 존재하여 시딩을 건너뜁니다.")
            return

        # 기초 사용자 데이터 (PK 강제 지정으로 관계 형성 용이하게 설정)
        users = [
            User(id=1, email="test1@tikkle.io", password="test_pw_1", nick_name="티끌맨", provider="local"),
            User(id=2, email="test2@tikkle.io", password="test_pw_2", nick_name="냉장고맨", provider="google"),
            User(id=3, email="test3@tikkle.io", password="test_pw_3", nick_name="구독맨", provider="kakao")
        ]

        db.add_all(users)
        db.commit()
        print("[SUCCESS] 기초 사용자 데이터(3명) 시딩 완료")

    except Exception as e:
        db.rollback()
        print(f"[ERROR] 시딩 작업 중 오류 발생: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    seed_initial_users()