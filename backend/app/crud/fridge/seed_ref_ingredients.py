# [Seed] 영수증 인식 직후, 유통기한 계산 전의 상태를 만드는 시드 파일
import sys
import os
from sqlalchemy.orm import Session
from datetime import date

sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from app.core.database import SessionLocal
from app.models.fridge.fridge_models import RefIngredients

def seed_pending_ingredients():
    db: Session = SessionLocal()
    try:
        # 이미 데이터가 있으면 중복 방지
        if db.query(RefIngredients).count() > 0:
            print("[SKIP] 이미 데이터가 존재합니다.")
            return

        today = date.today()

        # 사용자가 영수증을 찍어서 '막 들어온' 목업 데이터
        pending_items = [
            RefIngredients(
                inven_id=1,
                ingredient_id=1,      # LA갈비
                storage_type="2",
                quantity=1,
                phurchase_date=today,
                d_days=None           
            ),
            RefIngredients(
                inven_id=1,
                ingredient_id=2,      # 양파
                storage_type="1",
                quantity=3,
                phurchase_date=today,
                d_days=None           
            )
        ]

        db.add_all(pending_items)
        db.commit()
        print("[SUCCESS] 유통기한 미설정 식재료 시딩 완료!")

    except Exception as e:
        db.rollback()
        print(f"[ERROR] 시딩 실패: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    seed_pending_ingredients()