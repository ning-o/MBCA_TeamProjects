from pathlib import Path
import os
import shutil
import uuid
from typing import Any
from fastapi import APIRouter, File, HTTPException, UploadFile
from app.core.ocr.ocr import ocr_service
from app.core.ocr.parser import clean_text
from app.core.ocr.image_interpret import detect_type, parse_by_type
import traceback

router = APIRouter()

UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)


@router.post("/ocr")
async def run_ocr(file: UploadFile = File(...)) -> dict[str, Any]:
    temp_path: Path | None = None

    try:
        # 파일명 없을 때 대비
        original_filename = file.filename or "uploaded_image.jpg"
        extension = Path(original_filename).suffix or ".jpg"

        # 임시 저장 파일명 생성
        temp_filename = f"{uuid.uuid4()}{extension}"
        temp_path = UPLOAD_DIR / temp_filename

        # 업로드 파일 저장
        with open(temp_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        # 1. OCR 원문 추출
        raw_text = ocr_service.extract_text(str(temp_path))
        print("========== [DEBUG: RAW TEXT] ==========")
        print(raw_text)
        print("=======================================")

        if not raw_text or not raw_text.strip():
            raise HTTPException(status_code=400, detail="OCR 결과가 비어 있습니다.")

        # 2. 텍스트 정제
        cleaned_text = clean_text(raw_text)

        # 3. 문서 유형 판별
        doc_type = detect_type(cleaned_text)

        # detect_type이 혹시 dict를 반환하는 경우까지 방어
        if isinstance(doc_type, dict):
            detected_type = doc_type.get("type", "unknown")
            detect_meta = doc_type
        else:
            detected_type = doc_type
            detect_meta = {"type": detected_type}

        # 4. 문서 유형별 파싱
        parsed = parse_by_type(cleaned_text, detected_type)

        # 5. 결과 반환
        return {
        "filename": original_filename,
        "total_price": parsed.get("total_price"),
        "quantities": parsed.get("quantities", {}),
        "items": parsed.get("items", []),
        "status": "success"
        }

    except HTTPException:
        raise
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"OCR 처리 중 오류 발생: {str(e)}")
    finally:
        if temp_path and temp_path.exists():
            os.remove(temp_path)