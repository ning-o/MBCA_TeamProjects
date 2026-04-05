from app.core.database import SessionLocal
from app.models.fridge.fridge_models import PhurchaseInfo
from datetime import date

def seed_purchase():
    db = SessionLocal()
    try:
        # 1. 기존 데이터 초기화
        db.query(PhurchaseInfo).delete()
        
        # 2. 가짜 영수증 데이터 생성
        mock_receipts = [
            # 1. B마트 (신선식품)
            PhurchaseInfo(
                phurchase_id=1, matched_ingredient_id=1, quantity_bill=1,
                after_price=32800, phurchase_date=date.today(),
                raw_item_name="[B마트] 미국산 냉동 LA갈비 1kg"
            ),
            # 2. B마트 (채소)
            PhurchaseInfo(
                phurchase_id=2, matched_ingredient_id=2, quantity_bill=1,
                after_price=2490, phurchase_date=date.today(),
                raw_item_name="[B마트] 손질 대파 300g"
            ),
            # 3. 마켓컬리 (유제품)
            PhurchaseInfo(
                phurchase_id=3, matched_ingredient_id=3, quantity_bill=2,
                after_price=5600, phurchase_date=date.today(),
                raw_item_name="[컬리] 매일우유 저지방 900ml"
            ),
            # 4. 마켓컬리 (육류/가공)
            PhurchaseInfo(
                phurchase_id=4, matched_ingredient_id=4, quantity_bill=1,
                after_price=9800, phurchase_date=date.today(),
                raw_item_name="[컬리] 목살 베이컨 200g"
            ),
            # 5. 이마트 (해산물)
            PhurchaseInfo(
                phurchase_id=5, matched_ingredient_id=5, quantity_bill=1,
                after_price=15000, phurchase_date=date.today(),
                raw_item_name="[E-MART] 노르웨이 생연어회 300g"
            ),
            # 6. 이마트 (과일)
            PhurchaseInfo(
                phurchase_id=6, matched_ingredient_id=6, quantity_bill=1,
                after_price=12900, phurchase_date=date.today(),
                raw_item_name="[E-MART] 고당도 타이벡 귤 2kg"
            ),
            # 7. 동네 식자재마트 (채소 대량)
            PhurchaseInfo(
                phurchase_id=7, matched_ingredient_id=7, quantity_bill=3,
                after_price=3000, phurchase_date=date.today(),
                raw_item_name="양파(대망) 1망(국산)"
            ),
            # 8. 쿠팡 프레시 (계란)
            PhurchaseInfo(
                phurchase_id=8, matched_ingredient_id=8, quantity_bill=1,
                after_price=7900, phurchase_date=date.today(),
                raw_item_name="[Coupang] 무항생제 특란 30구"
            ),
            # 9. 편의점 (가공육)
            PhurchaseInfo(
                phurchase_id=9, matched_ingredient_id=9, quantity_bill=2,
                after_price=4000, phurchase_date=date.today(),
                raw_item_name="GS25) 의성마늘프랑크 120g"
            ),
            # 10. GS The Fresh (간편식/기타)
            PhurchaseInfo(
                phurchase_id=10, matched_ingredient_id=10, quantity_bill=1,
                after_price=8500, phurchase_date=date.today(),
                raw_item_name="[GS] 비비고 포기김치 500g"
            )
        ]
        
        db.add_all(mock_receipts)
        db.commit()
        print("[SUCCESS] 영수증(PhurchaseInfo) 시드 데이터 생성 완료!")
        
    except Exception as e:
        db.rollback()
        print(f"[ERROR] 시드 생성 실패: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    seed_purchase()