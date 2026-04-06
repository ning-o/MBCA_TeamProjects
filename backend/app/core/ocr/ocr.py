# 이미지에서 텍스트 추출

from pathlib import Path
from typing import Optional
from google.cloud import vision


class OCRService:
    def __init__(self):
        self._client: Optional[vision.ImageAnnotatorClient] = None

    def _get_client(self) -> vision.ImageAnnotatorClient:
        if self._client is None:
            self._client = vision.ImageAnnotatorClient()
        return self._client

    def extract_text(self, image_path: str) -> str:
        path = Path(image_path)
        if not path.exists():
            raise FileNotFoundError(f"이미지 파일이 존재하지 않습니다: {image_path}")

        with open(path, "rb") as image_file:
            content = image_file.read()

        image = vision.Image(content=content)
        client = self._get_client()
        response = client.text_detection(image=image)

        if response.error.message:
            raise RuntimeError(f"Google Vision OCR 오류: {response.error.message}")

        texts = response.text_annotations
        if not texts:
            return ""

        # 첫 번째 요소가 전체 OCR 텍스트
        return texts[0].description.strip()


ocr_service = OCRService()