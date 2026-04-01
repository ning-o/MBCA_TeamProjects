from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import SessionLocal
from app.models.subs import Subscription
from app.schema.subs.subs_dto import UserSubsInsert, UserSubsResponse, SubsResponse, SubsAmountInsert, SubsAmountResponse

router = APIRouter(prefix="/subs", tags=["subs"])


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.get("/subs/{user_id}", response_model=list[SubsResponse])
def get_user_subs(user_id: int):
    return service.get_user_subs(user_id)



@router.post("", response_model=SubscriptionResponse)
def create_subscription(
    payload: SubscriptionCreate,
    db: Session = Depends(get_db)
):
    new_sub = Subscription(
        service_name=payload.service_name,
        monthly_fee=payload.monthly_fee,
        billing_day=payload.billing_day,
        is_active=payload.is_active
    )

    db.add(new_sub)
    db.commit()
    db.refresh(new_sub)

    return new_sub


@router.get("", response_model=list[SubscriptionResponse])
def get_subscriptions(db: Session = Depends(get_db)):
    subs = db.query(Subscription).all()
    return subs


@router.get("/{sub_id}", response_model=SubscriptionResponse)
def get_subscription(sub_id: int, db: Session = Depends(get_db)):
    sub = db.query(Subscription).filter(Subscription.id == sub_id).first()

    if not sub:
        raise HTTPException(status_code=404, detail="Subscription not found")

    return sub