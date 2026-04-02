from sqlalchemy import text

from sqlalchemy.orm import Session
from models.subs.models import SubscriptionsUser
from app.schema.subs.subs_dto import UserSubsInsert, UserSubsResponse, SubsResponse, SubsAmountInsert, SubsAmountResponse


def read_subs(db: Session, user_id: int):
    sql = text("SELECT * FROM subs WHERE user_id = :user_id")
    result = db.execute(sql, {"user_id": user_id})
    return result.mappings().all()

def create_subscription(payload: UserSubsInsert, db: Session):
    new_sub = SubscriptionsUser(
        user_id=payload.user_id,
        master_id=payload.master_id,
        bundle_id=payload.bundle_id,
        payment_date=payload.payment_date,
        is_auto_pay=payload.is_auto_pay
    )

    db.add(new_sub)
    db.commit()
    db.refresh(new_sub)

    return {
        "master_id": new_sub.master_id,
        "bundle_id": new_sub.bundle_id
    }

def read_subs_category(db: Session):
    sql = text("SELECT DISTINCT category, logo_url FROM subscription_master")
    result = db.execute(sql)
    return result.mappings().all()