# 사용자 회원가입, 로그인 인증 및 토큰 발급 관련 통합 계정 스키마
from pydantic import BaseModel, EmailStr, Field
from datetime import datetime
from typing import Optional

# 1. 회원가입 요청 데이터 구조
class UserCreateDTO(BaseModel):
    email: EmailStr = Field(..., description="사용자 식별용 이메일 계정", example="user@tikkle.io")
    password: str = Field(..., min_length=8, description="계정 비밀번호 (최소 8자 정책 적용)", example="password1234!")
    nick_name: str = Field(..., min_length=2, max_length=20, description="서비스 내 노출될 사용자 별칭", example="TikkleUser01")
    provider: str = Field(default="local", description="인증 제공 플랫폼 구분 (local/kakao/google 등)", example="local")

# 2. 로그인 인증 요청 데이터 구조
class UserLoginDTO(BaseModel):
    email: EmailStr = Field(..., description="로그인 계정 이메일 주소")
    password: str = Field(..., description="로그인 비밀번호")

# 3. 사용자 정보 반환 데이터 구조
# 비즈니스 로직 및 보안 정책에 따라 해시화된 비밀번호 등 민감 정보는 제외
class UserResponseDTO(BaseModel):
    id: int = Field(..., description="데이터베이스 고유 식별자 (PK)")
    email: EmailStr = Field(..., description="등록된 사용자 이메일")
    nick_name: str = Field(..., description="등록된 사용자 닉네임")
    provider: str = Field(..., description="최초 가입 경로")
    created_at: datetime = Field(..., description="시스템 등록 일시")
    login_dt: Optional[datetime] = Field(None, description="최근 인증 성공 일시")

    class Config:
        # SQLAlchemy ORM 객체와의 호환성을 위한 속성 매핑 활성화
        from_attributes = True

# 4. 인증 토큰 발급 응답 데이터 구조
class TokenDTO(BaseModel):
    access_token: str = Field(..., description="RFC 6750 표준 기반 JWT 엑세스 토큰")
    token_type: str = Field("bearer", description="토큰 인증 스키마 타입")
    user_info: UserResponseDTO = Field(..., description="인증 완료된 사용자의 프로필 정보")