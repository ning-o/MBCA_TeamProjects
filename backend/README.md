# [Backend]

이 파일은 **백엔드(FastAPI)** 개발 가이드입니다.

## 🚀 기술 스택
- **Language**: Python 3.11-slim
- **Framework**: FastAPI (Uvicorn 기반)
- **Database**: MySQL 8.0
- **Container**: Docker & Docker Compose
- **Environment**: `.env` 파일을 통해 보안 및 DB 접속 정보 관리

## 개발 환경 실행
터미널에서 아래 명령어를 입력하여 서버와 DB를 동시에 실행 시킴 (도커 실행).
```bash
docker-compose up --build
```