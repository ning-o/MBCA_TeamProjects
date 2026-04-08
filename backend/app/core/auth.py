# app/core/auth.py
import os
from dotenv import load_dotenv
from jose import jwt, JWTError
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer

# .env 파일의 환경 변수 활성화
load_dotenv()

# OAuth2 설정 (로그인 주소와 일치)
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/auth/login")

# .env에서 키 가져오기
SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = os.getenv("ALGORITHM", "HS256")

def get_current_user_id(token: str = Depends(oauth2_scheme)) -> int:
    """
    환경 변수의 키를 사용하여 토큰을 해독하고 유저 ID를 반환합니다.
    """
    try:
        # SECRET_KEY로 토큰 해독
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")

        
        
        if user_id is None:
            raise HTTPException(status_code=401, detail="인증 정보가 없습니다.")
            
        return int(user_id)
    except JWTError:
        raise HTTPException(status_code=401, detail="유효하지 않은 토큰입니다.")