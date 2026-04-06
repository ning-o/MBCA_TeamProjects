from datetime import datetime, timedelta
from typing import Any, Dict, Optional

from app.core.expiry.predictor import expiry_predictor


def _parse_purchase_date(value: Any) -> datetime:
    if isinstance(value, datetime):
        return value

    if not value:
        return datetime.now()

    if isinstance(value, str):
        try:
            return datetime.fromisoformat(value)
        except ValueError:
            pass

    return datetime.now()


def build_pantry_payload_from_purchase_info(purchase_info: Dict[str, Any]) -> Dict[str, Any]:
    """
    purchase_info 예시:
    {
        "item_name": "서울우유 1L",
        "ocr_text": "서울우유 1L 냉장보관",
        "storage_hint": "냉장보관",
        "purchase_date": "2026-04-03T18:30:00",
        "quantity": 1,
        "purchase_info_id": 123
    }
    """

    raw_item_text = purchase_info.get("item_name", "") or ""
    raw_ocr_text = purchase_info.get("ocr_text", "") or ""
    raw_condition_text = purchase_info.get("storage_hint", "") or ""

    prediction = expiry_predictor.predict_expiry_days(
        raw_item_text=raw_item_text,
        raw_condition_text=raw_condition_text,
        raw_ocr_text=raw_ocr_text,
    )

    purchase_date = _parse_purchase_date(purchase_info.get("purchase_date"))
    expiry_days = int(prediction["expiry_days"])
    predicted_expiry_date = purchase_date + timedelta(days=expiry_days)

    pantry_payload = {
        "purchase_info_id": purchase_info.get("purchase_info_id"),
        "item_name": prediction["item_name"],
        "food_category": prediction["food_category"],
        "storage_condition": prediction["storage_condition"],
        "expiry_days": expiry_days,
        "predicted_expiry_date": predicted_expiry_date,
        "purchase_date": purchase_date,
        "quantity": purchase_info.get("quantity", 1),

        # 디버깅/추적용
        "prediction_source": prediction["prediction_source"],
        "item_source": prediction["item_source"],
        "category_source": prediction["category_source"],
        "condition_source": prediction["condition_source"],

        # 원본 로그
        "raw_item_text": raw_item_text,
        "raw_ocr_text": raw_ocr_text,
        "raw_condition_text": raw_condition_text,
    }

    return pantry_payload