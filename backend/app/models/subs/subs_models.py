# [구독 도메인] backend/app/models/subs/subs_models.py
# [공통 도메인] app/models/common.py

from sqlalchemy import Column, Integer, String, Boolean, JSON, DateTime, ForeignKey, CheckConstraint
from sqlalchemy.sql import func
from app.models.common import Base
from sqlalchemy.orm import relationship
from sqlalchemy import UniqueConstraint

# 1. Subscription_master 테이블 정의 - 구독 서비스 정보 모음
class SubscriptionMaster(Base):
    __tablename__ = "subscription_master"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(40), nullable=False)                         # 구독 서비스 이름
    bundle_yn = Column(Boolean, nullable=False)                       # 번들 여부
    logo_img = Column(String(40), nullable=True)                      # 구독 서비스 로고 닉네임
    base_price = Column(Integer, nullable=False)                      # 요금제 가격
    category_cd = Column(String(10), nullable=False)                    # 구독 서비스 카테고리 코드
    company_cd = Column(String(10), nullable=False)                     # 서비스 회사 코드
    detail = Column(JSON, nullable=False)                             # 구독 서비스 상세 정보 (JSON)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    # 관계 설정
    combinations = relationship("SubscriptionCombination", back_populates="master", cascade="all, delete-orphan")
    subscriptions = relationship("SubscriptionsUser", back_populates="master")

# 2. SubscriptionCombination 테이블 정의 - 결합 구독 서비스 정보 모음
class SubscriptionCombination(Base):
    __tablename__ = "subscription_combination"

    __table_args__ = (
        UniqueConstraint('master_id', 'combin_id', name='uidx_master_combin'),
    )

    id = Column(Integer, primary_key=True, autoincrement=True)
    master_id = Column(Integer, ForeignKey("subscription_master.id", ondelete="CASCADE"), nullable=False) # 부모 구독 ID
    combin_id = Column(Integer, nullable=False) # 결합된 구독 서비스 ID

    # 관계 설정
    master = relationship("SubscriptionMaster", back_populates="combinations")

# 3. Subscriptions_user 테이블 정의 - 사용자 구독 서비스 내역
class SubscriptionsUser(Base):
    __tablename__ = "subscription_user"

    __table_args__ = (
        UniqueConstraint('user_id', 'master_id', name='uidx_user_master'),
    )

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, nullable=False, index=True)              # 사용자 ID
    master_id = Column(Integer, ForeignKey("subscription_master.id", ondelete="CASCADE"), nullable=False)
    is_auto_pay = Column(Boolean, nullable=False, default=False)       # 자동 결제 여부
    detail = Column(JSON, nullable=False)                              # 사용자별 맞춤 설정 정보
    created_by = Column(String(40), nullable=False)                   # 최초 등록자 ID
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    # 관계 설정
    master = relationship("SubscriptionMaster", back_populates="subscriptions")


class UserAmount(Base):
    __tablename__ = "user_amount"

    id = Column(Integer, primary_key=True, autoincrement=True)                            # PK
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)         # 사용자 ID (FK)
    category = Column(String(20), nullable=False)                                         # 카테고리 (예: 'OTT')
    amount = Column(Integer, nullable=False)                                              # 금액
    save_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)  # 변경 날짜

    # 관계 설정
    # user = relationship("Users", back_populates="amounts")