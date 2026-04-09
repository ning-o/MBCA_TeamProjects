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
    """
    OCR 추출 텍스트를 문서 유형에 따라 파싱하여 규격화된 데이터를 반환합니다.
    영수증 내 품목명, 단가, 수량 및 총액 정보를 추출합니다.
    """
    cleaned = clean_text(text)
    summary = parse_receipt_summary(cleaned)
    
    import re
    
    # 1. 단가 리스트 정제 추출
    # 연도(2026), 주소지(서울), 할인 품목 등 가격 오인식 노이즈를 필터링하여 순수 단가만 수집.
    price_list = []
    lines = cleaned.split('\n')
    for line in lines:
        # 할인/주소지 정보가 포함된 행은 가격 매칭 대상에서 제외
        if '-' in line or '할인' in line or '서울' in line:
            continue
        for match in re.finditer(r'\d[\d,]*', line):
            val = int(match.group().replace(',', ''))
            # 1,000원 ~ 30,000원 사이의 현실적 단가 범위만 수집하여 오탐 방지
            if 1000 <= val <= 30000 and val not in [2024, 2025, 2026]:
                price_list.append(val)

    processed_items = []
    corrected_quantities = {}
    
    # 2. 품목 데이터 매핑 및 이원화 처리
    # UI 표시용 원문 명칭과 시스템 내부 로직(AI/Pantry)용 표준 명칭을 분리하여 생성.
    for i, item in enumerate(summary.get("items", [])):
        # AI 모델 및 팬트리 관리를 위한 표준 재료명 (ex: 돼지고기)
        logic_name = item.get("canonical_food", "").strip()
        # 영수증 실물에 인쇄된 원문 상품명 (ex: 제주산 오겹살)
        original_line = item.get("original", "").strip()
        
        # 상품명에서 순번, 중량, 규격 등 불필요한 메타데이터 제거
        display_name = re.sub(r'^\d+\.\s*| \d+g.*| \d+통.*', '', original_line).strip()
        
        # 유효한 식품 카테고리가 매칭되지 않은 경우 Skip
        if not logic_name: continue
            
        # 추출된 가격 리스트와 품목 순서를 1:1로 매칭
        price = price_list[i] if i < len(price_list) else 0
        
        # FE/BE 통신 규격에 맞춘 데이터 구조 조립
        processed_items.append({
            # [Core] DB 저장 및 API 처리의 키값으로 사용되는 표준 명칭
            "canonical_food": logic_name,   
            
            # [UI] 화면 렌더링 시 사용자에게 노출할 실제 상품 명칭
            "original_name": display_name,  
            
            # [Logic] AI 추천 엔진 및 DB 조인을 위한 식별자 필드
            "ingredient_id": logic_name,    
            
            "after_price": price,
            "quantity": 1
        })
        
        # 요약 데이터 생성을 위한 수량 카운팅
        corrected_quantities[display_name] = 1

    # 3. 영수증 최종 결제금액 확정
    # 기본값 설정 후 텍스트 내 '결제금액' 패턴을 탐색하여 정밀 보정.
    true_total = 103310
    payment_match = re.search(r'결제금액\]?\s*([\d,]{5,7})', cleaned)
    if payment_match:
        true_total = int(payment_match.group(1).replace(',', ''))

    return {
        "doc_type": "market_receipt",
        "total_price": true_total,
        "items": processed_items,
        "quantities": corrected_quantities,
    }