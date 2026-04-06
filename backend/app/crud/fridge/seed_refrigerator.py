# [Seed] seed_users.py로 생성된 테스트 유저의 냉장고 목업 데이터 로드 파일
import sys
import os
from sqlalchemy.orm import Session

# 프로젝트 루트 경로 추가
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from app.core.database import SessionLocal
# 클래스 경로 정확히 지정
from app.models.fridge.fridge_models import Refrigerator 

def seed_initial_refrigerators():
    db: Session = SessionLocal()
    try:
        # 1. 기존 데이터 확인
        if db.query(Refrigerator).count() > 0:
            print("💡 [SKIP] 이미 냉장고 데이터가 존재합니다.")
            return

        # 2. 모델 정의(inven_nickname, mounth_food_exp 등)에 맞게 데이터 생성
        fridges = [
            Refrigerator(
                inven_id=1, 
                user_id=1, 
                inven_nickname="티끌맨의 메인 냉장고", 
                mounth_food_exp=300000, # 예시 값
                current_spent=0
            ),
            Refrigerator(
                inven_id=2, 
                user_id=2, 
                inven_nickname="냉장고맨의 자취방", 
                mounth_food_exp=150000, 
                current_spent=0
            ),
            Refrigerator(
                inven_id=3, 
                user_id=3, 
                inven_nickname="구독맨의 대형 냉장고", 
                mounth_food_exp=500000, 
                current_spent=0
            )
        ]

        db.add_all(fridges)
        db.commit()
        print("[SUCCESS] 기초 냉장고 데이터 시딩 완료!")

    except Exception as e:
        db.rollback()
        print(f"[ERROR] 냉장고 시딩 실패: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    seed_initial_refrigerators()