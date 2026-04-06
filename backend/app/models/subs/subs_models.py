# [구독 도메인] backend/app/models/subs/subs_models.py
# [공통 도메인] app/models/common.py

from sqlalchemy import Column, Integer, String, Boolean, JSON, DateTime, ForeignKey, CheckConstraint
from sqlalchemy.sql import func
from app.models.common import Base
from sqlalchemy.orm import relationship

# 1. Subscriptions_user 테이블 정의 - 사용자 구독 서비스 내역
class SubscriptionsUser(Base):
    __tablename__ = "subscriptions_user"

    __table_args__ = (
        CheckConstraint(
            "(master_id IS NOT NULL AND bundle_id IS NULL) OR "
            "(master_id IS NULL AND bundle_id IS NOT NULL)",
            name="ck_subscription_exactly_one_of_master_bundle"
        ),
    )

    id = Column(Integer, primary_key=True, autoincrement=True) # 사용자 고유 번호 (PK)
    user_id = Column(Integer, ForeignKey("users.id"), index=True, nullable=False)                       # 사용자 코드 id
    master_id = Column(Integer, ForeignKey("subscription_master.id"), nullable=True)                    # 구독 서비스 코드 id
    bundle_id = Column(Integer, ForeignKey("subscription_bundle.id"), nullable=True)                    # 구독 결합 서비스 코드 id
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True, nullable=False) # 구독 설정 날짜 (구독 설정일)
    is_auto_pay = Column(Boolean, default=False, nullable=False)                                        # 자동 결제 활성화 상태 (True: 활성, False: 비활성화)    

    # user = relationship("users", back_populates="Subscriptions_user") # common.py  users 연결
    master = relationship("SubscriptionMaster", back_populates="subscriptions")
    bundle = relationship("SubscriptionBundle", back_populates="subscriptions")

# 2. Subscription_master 테이블 정의 - 단일 구독 서비스 정보 모음
class SubscriptionMaster(Base):
    __tablename__ = "subscription_master"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)  # 구독 서비스 고유 번호 (PK)
    name = Column(String(40), nullable=False)                               # 구독 서비스 이름    
    logo_img = Column(String(40), nullable=True)                            # 구독 서비스 로고 코드
    base_price = Column(Integer, nullable=False)                            # 구독 금액 / 1,000 이하는 달러로 변환
    category = Column(String(20), nullable=False)                           # 구독 카테고리
    detail = Column(JSON, nullable=True)                                    # 구독 상세정보

    # 관계 설정
    subscriptions = relationship("SubscriptionsUser", back_populates="master")

class SubscriptionBundle(Base):
    __tablename__ = "subscription_bundle"

    id = Column(Integer, primary_key=True, autoincrement=True)     # PK
    name = Column(String(40), nullable=False)                      # 번들 이름
    logo_img = Column(JSON, nullable=True)                         # 로고 목록 (예: ['Netflix','Naver','KT'])
    base_price = Column(Integer, nullable=False)                   # 번들 가격 / 1,000 이하는 달러로 변환
    category = Column(JSON, nullable=False)                        # 카테고리 목록 (예: ['OTT','delivery','telecom'])
    detail = Column(JSON, nullable=False)                          # 상세 정보 (예: {"quality": "HD"})

    # 관계 설정
    subscriptions = relationship("SubscriptionsUser", back_populates="bundle")


class UserAmount(Base):
    __tablename__ = "user_amount"

    id = Column(Integer, primary_key=True, autoincrement=True)                            # PK
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)         # 사용자 ID (FK)
    category = Column(String(20), nullable=False)                                         # 카테고리 (예: 'OTT')
    amount = Column(Integer, nullable=False)                                              # 금액
    save_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)  # 변경 날짜

    # 관계 설정
    # user = relationship("Users", back_populates="amounts")