from sqlalchemy import text

from sqlalchemy.orm import Session
from app.models.subs.subs_models import SubscriptionsUser
# from app.schemas.subs_dto import UserSubsInsert, UserSubsResponse, SubsResponse, SubsAmountInsert, SubsAmountResponse

# user_id 로 구독한 정보 추출
def read_subs(db: Session, user_id: int):
    sql = text("SELECT * FROM subscriptions_user WHERE user_id = :user_id")
    result = db.execute(sql, {"user_id": user_id})
    return result.mappings().all()

# 구독 선택시 db[SubscriptionsUser]에 저장
def create_subscription(
    db: Session,
    user_id: int,
    master_id: int | None = None,
    bundle_id: int | None = None
):
    try:
        new_sub = SubscriptionsUser(
            user_id=user_id,
            master_id=master_id,
            bundle_id=bundle_id
        )

        db.add(new_sub)
        db.commit()
        db.refresh(new_sub)

        return {
            "success": True,
            "data": { "항목": "데이터" },
            "message": "저장 및 요청이 완료되었습니다."
        }

    except Exception as e:
        db.rollback()
        print(f"[ERROR] 구독: {e}")
        raise e

# 구독 카테고리 종류 추출
def read_subs_category(db: Session):
    sql = text("SELECT DISTINCT category FROM subscription_master")
    result = db.execute(sql)
    return [row[0] for row in result.fetchall()]

# 특정 카테고리에 해당하는 서비스 정보들 추출
def get_subs_by_logo(db: Session, category: str):
    sql = text("""
        SELECT
            id,
            category,            
            logo_img,
            base_price
        FROM subscription_master
        WHERE category = :category
    """)

    result = db.execute(sql, {        
        "category": category
    })
    return result.mappings().all()

# 특정 서비스 상세정보 추출  - id값으로
def get_price_detail(db: Session, subs_id:int):
    sql = text("""
        SELECT *
        FROM subscription_master
        WHERE id = :id
    """)

    result = db.execute(sql, {
        "id": subs_id,
    })

    return result.mappings().first()