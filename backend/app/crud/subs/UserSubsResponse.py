from sqlalchemy import text, update
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from app.models.subs.subs_models import SubscriptionsUser, SubscriptionMaster
# from app.schemas.subs_dto import UserSubsInsert, UserSubsResponse, SubsResponse, SubsAmountInsert, SubsAmountResponse

# user_id 로 구독한 정보 추출
def read_subs(db: Session, user_id: int):
    result = (
        db.query(
            SubscriptionsUser.user_id,
            SubscriptionsUser.master_id,
            SubscriptionsUser.bundle_id,
            SubscriptionsUser.created_at,
            SubscriptionsUser.is_auto_pay,            
            SubscriptionMaster.id,
            SubscriptionMaster.name,
            SubscriptionMaster.logo_img,
            SubscriptionMaster.category,
            SubscriptionMaster.base_price,
        )
        .join(
            SubscriptionMaster,
            SubscriptionsUser.master_id == SubscriptionMaster.id
        )
        .filter(SubscriptionsUser.user_id == user_id)
        .all()
    )

    return result

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

def update_subscription(
    db: Session,
    user_id: int,
    change_subs_id: int,   # 수정할 row id
    master_id: int | None = None,  # 바뀌는 값
    bundle_id: int | None = None
):
    try:
        # 기존 구독 조회
        sub = db.query(SubscriptionsUser).filter(
            SubscriptionsUser.user_id == user_id,
            SubscriptionsUser.master_id == change_subs_id
        ).first()

        if not sub:
            return {
                "success": False,
                "message": "해당 구독이 존재하지 않습니다."
            }

        # 값 업데이트
        if master_id is not None:
            sub.master_id = master_id
            sub.bundle_id = None  # master 선택하면 bundle 제거

        if bundle_id is not None:
            sub.bundle_id = bundle_id
            sub.master_id = None  # bundle 선택하면 master 제거

        # 시간 업데이트
        sub.created_at = datetime.now(timezone.utc)

        db.commit()
        db.refresh(sub)

        return {
            "success": True,
            "data": {
                "id": sub.id,
                "user_id": sub.user_id,
                "master_id": sub.master_id,
                "bundle_id": sub.bundle_id,
                "created_at": sub.created_at,
            },
            "message": "구독이 수정되었습니다."
        }

    except Exception as e:
        db.rollback()
        print(f"[ERROR] 구독 update: {e}")
        raise e