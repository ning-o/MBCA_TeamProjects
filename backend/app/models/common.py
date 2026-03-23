# [공통 도메인] app/models/common.py

from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey
from sqlalchemy.sql import func
from app.core.database import Base

# 1. users 테이블 정의 - 사용자 통합 정보
class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True) # 사용자 고유 번호 (PK)
    email = Column(String(50), unique=True, index=True, nullable=False)    # 로그인용 이메일 아이디
    password = Column(String(255), nullable=True)                          # 로그인 비밀번호 (암호화 해시 저장)
    provider = Column(String(20), nullable=False, default="local")         # 가입 경로 (local, kakao 등)
    is_active = Column(Boolean, default=True, nullable=False)              # 계정 활성화 상태 (True: 활성, False: 차단/탈퇴)
    login_dt = Column(DateTime(timezone=True), nullable=True)              # 최근 접속 일시
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False) # 계정 생성 일시 (가입일)
    nick_name = Column(String(20), unique=True, nullable=False)             # 회원 닉네임 (중복 불가)

# 2. total_savings 테이블 정의 - 통합 절약 내역 로그
class TotalSaving(Base):
    __tablename__ = "total_savings"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True) # 기록 고유 번호 (PK)
    ym = Column(String(6), nullable=False, index=True)                     # 발생 년월 (통계용, 예: '202603')                    
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)      # 사용자 고유 번호 (FK)
    category = Column(String(20), nullable=False)                          # 도메인 구분 (fridge, subscription)
    amount = Column(Integer, nullable=False)                               # 절약 금액 (단위: 원)
    description = Column(String(500), nullable=False)                      # 사용자 확인용 - 절약 상세 내역 (ex: '유통기한 임박 식재료 소진', '넷플릭스 구독 해지' 등)
    saved_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False) # 절약 발생 일시

# 3. common_codes 테이블 정의 - 공통 코드 관리
class CommonCode(Base):
    __tablename__ = "common_codes"

    code_id = Column(String(20), primary_key=True, index=True)             # 코드 ID (PK)
    parent_id = Column(String(20), nullable=True)                          # 부모 코드 ID (그룹 코드일 경우 NULL)
    code_name = Column(String(200), nullable=False)                        # 코드명 (예: '사용자상태 활성')
    sort_order = Column(Integer, default=1)                                # 정렬 순서
    is_used = Column(String(1), default='Y')                               # 사용 여부 (Y/N)
    description = Column(String(500), nullable=True)                       # 코드 상세 설명
    created_at = Column(DateTime(timezone=True), server_default=func.now()) # 생성 일시
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now()) # 수정 일시

