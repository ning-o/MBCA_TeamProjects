from sqlalchemy import text

from sqlalchemy.orm import Session
from models.subs.subs_models import SubscriptionsUser
from app.schema.subs_dto import UserSubsInsert, UserSubsResponse, SubsResponse, SubsAmountInsert, SubsAmountResponse


def read_subs(db: Session, user_id: int):
    sql = text("SELECT * FROM subs WHERE user_id = :user_id")
    result = db.execute(sql, {"user_id": user_id})
    return result.mappings().all()

def create_subscription(payload: UserSubsInsert, db: Session):
    try:
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

        return "succes"        

    except Exception as e:
        db.rollback()
        print(f"[ERROR] 구독: {e}")
    

def read_subs_category(db: Session):
    sql = text("SELECT DISTINCT category FROM subscription_master")
    result = db.execute(sql)
    return result.mappings().all()

def get_subs_by_logo(db: Session, category: str):
    sql = text("""
        SELECT             
            category,            
            logo_url,
            price
        FROM subscription_master
        WHERE category = :category        
    """)

    result = db.execute(sql, {        
        "category": category
    })
    return result.mappings().all()

    
def get_price_detail(db: Session, category: str, logo_url: str, price: int):
    sql = text("""
        SELECT id, name, detail
        FROM subscription_master
        WHERE category = :category
          AND logo_url = :logo_url   
          AND base_price = :base_price      
    """)

    result = db.execute(sql, {
        "category": category,
        "logo_url": logo_url,
        "base_price": price
    })

    return result.mappings().first()