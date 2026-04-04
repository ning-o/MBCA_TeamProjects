from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional

from app.services.pantry_expiry_service import build_pantry_payload_from_purchase_info

router = APIRouter(prefix="/expiry", tags=["expiry"])


class ExpiryTestRequest(BaseModel):
    item_name: Optional[str] = ""
    ocr_text: Optional[str] = ""
    storage_hint: Optional[str] = ""
    purchase_date: Optional[str] = None
    quantity: Optional[int] = 1
    purchase_info_id: Optional[int] = None


@router.post("/test")
def test_expiry(request: ExpiryTestRequest):
    payload = build_pantry_payload_from_purchase_info(request.dict())
    return {
        "message": "expiry prediction success",
        "data": payload
    }