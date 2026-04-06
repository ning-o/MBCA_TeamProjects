# 전체 흐름 조합

from typing import Any

from app.core.ocr.parser import clean_text, parse_receipt_summary


MARKET_HINTS = {
    "영수증", "할인", "행사", "특가", "국산", "국내산",
    "카드", "합계", "과세", "면세", "봉", "팩", "개", "입"
}


def detect_type(text: str) -> str:
    cleaned = clean_text(text)

    market_score = sum(1 for word in MARKET_HINTS if word in cleaned)

    if market_score >= 1:
        return "market_receipt"

    return "market_receipt"


def parse_by_type(text: str, doc_type: str) -> dict[str, Any]:
    cleaned = clean_text(text)
    summary = parse_receipt_summary(cleaned)

    return {
        "doc_type": "market_receipt",
        "raw_text": cleaned,
        "total_price": summary["total_price"],
        "quantities": summary["quantities"],
        "items": summary["items"],
    }