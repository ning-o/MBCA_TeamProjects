# [공통 도메인] db

from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey
from sqlalchemy.sql import func
from app.core.database import Base

# 1. users 테이블 정의 - 테스트용 user 초안 테이블
class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    password = Column(String(255), nullable=True)  # 소셜 가입자는 Null 가능
    provider = Column(String(50), nullable=False, default="local")
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

# 2. total_savings 테이블 정의 -  테스트용 total_savings 초안 테이블
class TotalSaving(Base):
    __tablename__ = "total_savings"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    category = Column(String(50), nullable=False) # fridge, subscription
    amount = Column(Integer, nullable=False)
    description = Column(String(255))
    saved_at = Column(DateTime(timezone=True), server_default=func.now())