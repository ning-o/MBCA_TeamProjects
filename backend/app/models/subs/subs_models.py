# [구독 도메인] backend/app/models/subs/subs_models.py
# 노션 스키마 기반 초안이니 수정하시면 됩니다.
from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, JSON, DateTime
from sqlalchemy.sql import func
from app.models.common import Base

# 1. 구독 서비스 리스트 (마스터 정보)
class SubsMaster(Base):
    __tablename__ = "subscription_master"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(String(40), nullable=False)           # 구독 서비스 이름
    logo_img = Column(String(40), nullable=True)        # 구독 서비스 로고 닉네임
    base_price = Column(Integer, nullable=False)        # 요금제 가격
    category = Column(String(20), nullable=False)       # 카테고리 (예: OTT)
    detail = Column(JSON, nullable=False)               # 상세정보 (JSON형태)

# 2. 구독 서비스 결합 내역 (번들 정보)
class SubsBundle(Base):
    __tablename__ = "subscription_bundle"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(String(40), nullable=False)           # 구독 서비스 이름
    logo_img = Column(String(40), nullable=True)        # 로고 닉네임들 (예: Netflix,Naver)
    base_price = Column(Integer, nullable=False)        # 요금제 가격
    category = Column(String(20), nullable=False)       # 카테고리들 (예: OTT,delivery)
    detail = Column(JSON, nullable=False)               # 상세정보

# 3. 사용자 구독 서비스 내역 (매핑 테이블)
class SubsUser(Base):
    __tablename__ = "subscriptions_user"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)        # FK: Users.id
    master_id = Column(Integer, ForeignKey("subscription_master.id"), nullable=True) # FK: Master.id
    bundle_id = Column(Integer, ForeignKey("subscription_bundle.id"), nullable=True) # FK: Bundle.id
    payment_date = Column(Integer, nullable=False)                           # 매월 결제일 (1~31)
    is_auto_pay = Column(Boolean, nullable=False, default=True)              # 자동 결제 설정 여부

# 4. 구독 서비스 절약 내역
class SubsUserAmount(Base):
    __tablename__ = "user_amount"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)        # FK: Users.id
    category = Column(String(20), nullable=False)                            # 카테고리
    amount = Column(Integer, nullable=False)                                 # 금액
    save_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False) # 변경 날짜