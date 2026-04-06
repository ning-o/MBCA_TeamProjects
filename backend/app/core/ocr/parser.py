# 텍스트 정리, 문서타입 판별, 파싱

import re
from typing import Any


# =========================
# 사전 정의
# =========================

EVENT_WORDS = {
    "행사", "특가", "세일", "할인", "증정", "무료", "기획", "한정", "추천",
    "균일가", "초특가", "행사가", "1+1", "2+1", "3+1"
}

REGION_WORDS = {
    "철원", "제주", "해남", "완도", "성주", "나주", "남해", "횡성",
    "청양", "밀양", "의성", "무안", "부여", "고창", "영광", "장흥"
}

ORIGIN_WORDS = {
    "국산", "국내산", "수입산", "미국산", "호주산", "칠레산", "노르웨이산",
    "페루산", "베트남산", "중국산", "러시아산"
}

BRAND_WORDS = {
    "CJ", "비비고", "오뚜기", "청정원", "농심", "풀무원", "동원", "하림",
    "서울우유", "매일", "남양", "빙그레", "롯데", "대상", "곰곰", "피코크",
    "노브랜드", "백설", "샘표", "종가", "해찬들", "다향", "목우촌",
    "삼양", "팔도", "오리온", "크라운", "해태", "빙그레", "남양유업"
}

ATTRIBUTE_WORDS = {
    "유기농", "무농약", "무항생제", "프리미엄", "신선", "신선한", "국산콩",
    "저지방", "멸균", "1등급", "특등급", "대용량", "친환경", "손질", "깐",
    "냉장", "냉동", "생", "국거리용", "불고기용", "찜용", "볶음용", "절단",
    "간편", "무가당", "가염", "무염", "슬라이스", "훈제"
}

# 영수증에서 식품이 아닌 줄로 볼 가능성이 높은 키워드
NON_FOOD_KEYWORDS = {
    "합계", "총액", "소계", "과세", "면세", "부가세", "결제", "카드", "현금",
    "영수증", "매장", "승인", "거스름돈", "포인트", "적립", "쿠폰", "거래",
    "정상가", "행사가", "단가", "수량", "금액", "판매", "전화", "사업자",
    "대표", "주소", "고객", "VAT", "현금영수증", "카드번호", "승인번호",
    "잔액", "합산", "교환", "환불", "계산", "시각", "날짜", "시리얼"
}

# 대표 식품명 사전
FOOD_MAP = {
    "두부": ["두부", "연두부", "순두부"],
    "우유": ["우유", "저지방우유", "멸균우유", "흰우유"],
    "계란": ["계란", "달걀", "유정란", "특란"],
    "양파": ["양파"],
    "대파": ["대파"],
    "쪽파": ["쪽파"],
    "마늘": ["마늘", "깐마늘"],
    "감자": ["감자"],
    "고구마": ["고구마"],
    "배추": ["배추", "알배추"],
    "무": ["무"],
    "콩나물": ["콩나물"],
    "숙주": ["숙주", "숙주나물"],
    "버섯": ["버섯", "느타리버섯", "새송이버섯", "팽이버섯", "표고버섯"],
    "오이": ["오이"],
    "애호박": ["애호박"],
    "호박": ["호박"],
    "당근": ["당근"],
    "상추": ["상추"],
    "깻잎": ["깻잎"],
    "시금치": ["시금치"],
    "브로콜리": ["브로콜리"],
    "양배추": ["양배추"],
    "부추": ["부추"],
    "고추": ["고추", "청양고추", "풋고추", "홍고추"],
    "파프리카": ["파프리카"],
    "토마토": ["토마토", "방울토마토"],
    "사과": ["사과"],
    "배": ["배"],
    "바나나": ["바나나"],
    "딸기": ["딸기"],
    "귤": ["귤", "감귤"],
    "레몬": ["레몬"],
    "오렌지": ["오렌지"],
    "수박": ["수박"],
    "참외": ["참외"],
    "돼지고기": ["돼지고기", "삼겹살", "목살", "앞다리살", "뒷다리살", "갈비"],
    "소고기": ["소고기", "국거리", "불고기", "등심", "안심", "양지", "채끝"],
    "닭고기": ["닭고기", "닭가슴살", "닭다리살", "닭봉", "닭안심"],
    "오징어": ["오징어"],
    "고등어": ["고등어"],
    "연어": ["연어"],
    "새우": ["새우"],
    "참치": ["참치"],
    "김": ["김"],
    "미역": ["미역"],
    "다시마": ["다시마"],
    "쌀": ["쌀"],
    "잡곡": ["잡곡"],
    "밀가루": ["밀가루"],
    "식빵": ["식빵", "빵"],
    "치즈": ["치즈"],
    "버터": ["버터"],
    "요거트": ["요거트", "요구르트"],
    "라면": ["라면"],
    "만두": ["만두"],
    "어묵": ["어묵"],
    "햄": ["햄"],
    "소시지": ["소시지"],
    "떡": ["떡"],
    "김치": ["김치"],
    "된장": ["된장"],
    "고추장": ["고추장"],
    "간장": ["간장"],
    "식용유": ["식용유", "올리브유", "참기름", "들기름"],
    "설탕": ["설탕"],
    "소금": ["소금"],
}


# =========================
# 정규식
# =========================

WEIGHT_VOLUME_PATTERN = re.compile(
    r"^\d+(?:\.\d+)?\s?(g|kg|ml|l|L)$",
    re.IGNORECASE,
)

COUNT_UNIT_PATTERN = re.compile(
    r"^\d+\s?(개|입|봉|팩|캔|병|박스|망|단|통|컵|트레이)$",
    re.IGNORECASE,
)

PRICE_TOKEN_PATTERN = re.compile(
    r"^\d{1,3}(?:,\d{3})*(?:원)?$"
)

LINE_PRICE_PATTERN = re.compile(
    r"(?<!\d)(\d{1,3}(?:,\d{3})+|\d{2,6})(?:원)?(?!\d)"
)

NUMBER_ONLY_PATTERN = re.compile(
    r"^\d+(?:[.,]\d+)?$"
)


# =========================
# 기본 유틸
# =========================

def normalize_spaces(text: str) -> str:
    return re.sub(r"\s+", " ", text).strip()


def clean_text(text: str) -> str:
    if not text:
        return ""

    text = text.replace("\u200b", " ")
    text = text.replace("•", " ")
    text = text.replace("▪", " ")
    text = text.replace("|", " ")
    text = text.replace("\t", " ")

    # 괄호나 기호 일부 정리
    text = re.sub(r"[^\S\r\n]+", " ", text)
    text = re.sub(r"\n{2,}", "\n", text)

    lines = []
    for raw_line in text.splitlines():
        line = normalize_spaces(raw_line)
        if line:
            lines.append(line)

    return "\n".join(lines)


def split_compound_token(token: str) -> list[str]:
    """
    예:
    국산콩두부 -> 국산콩 / 두부
    제주감귤 -> 제주 / 감귤
    """
    if not token:
        return []

    dictionary = (
        list(EVENT_WORDS)
        + list(REGION_WORDS)
        + list(ORIGIN_WORDS)
        + list(BRAND_WORDS)
        + list(ATTRIBUTE_WORDS)
        + [v for values in FOOD_MAP.values() for v in values]
    )

    result = token
    for word in sorted(dictionary, key=len, reverse=True):
        if word and word in result and result != word:
            result = result.replace(word, f" {word} ")

    result = normalize_spaces(result)
    return result.split() if result else []


def tokenize_line(line: str) -> list[str]:
    line = re.sub(r"[()\[\]/,_\-]+", " ", line)
    line = normalize_spaces(line)
    if not line:
        return []

    raw_tokens = line.split()
    tokens = []

    for token in raw_tokens:
        # 먼저 복합 토큰 분리 시도
        splitted = split_compound_token(token)
        if splitted:
            tokens.extend(splitted)
        else:
            tokens.append(token)

    return [t for t in tokens if t]


# =========================
# 숫자 / 가격 / 수량 / 규격 처리
# =========================

def classify_number_token(token: str) -> str:
    token = token.strip()

    # 1. 중량/용량
    if WEIGHT_VOLUME_PATTERN.match(token):
        return "size"

    # 2. 개수/포장 단위
    if COUNT_UNIT_PATTERN.match(token):
        return "quantity"

    # 3. 원 붙으면 가격
    if token.endswith("원"):
        return "price"

    # 4. 순수 숫자는 100 기준
    pure = token.replace(",", "")
    if pure.isdigit():
        value = int(pure)
        if value >= 100:
            return "price"
        return "quantity"

    return "unknown"


def find_price_candidates(line: str) -> list[int]:
    matches = LINE_PRICE_PATTERN.findall(line)
    prices = []

    for m in matches:
        value = int(m.replace(",", ""))
        if value >= 100:
            prices.append(value)

    return prices


# =========================
# 식품 탐지
# =========================

def detect_food(token: str) -> str | None:
    for canonical, variants in FOOD_MAP.items():
        for variant in variants:
            if token == variant or variant in token:
                return canonical
    return None


# =========================
# 비식품 라인 제거
# =========================

def is_non_food_line(line: str) -> bool:
    if not line:
        return True

    tokens = tokenize_line(line)
    has_food = any(detect_food(tok) for tok in tokens)

    # 비식품 키워드가 있고, 식품 키워드가 없으면 제거
    if any(word in line for word in NON_FOOD_KEYWORDS) and not has_food:
        return True

    # 식품 없이 숫자만 많은 줄 제거
    numeric_count = sum(1 for tok in tokens if any(ch.isdigit() for ch in tok))
    if not has_food and numeric_count >= 1:
        return True

    return False


# =========================
# 라인 파싱
# =========================

def parse_product_line(line: str) -> dict[str, Any]:
    tokens = tokenize_line(line)

    result: dict[str, Any] = {
        "original": line,
        "tokens": tokens,
        "event_words": [],
        "region_words": [],
        "brand_words": [],
        "origin_words": [],
        "attribute_words": [],
        "food_words": [],
        "unknown_words": [],
        "price_candidates": [],
        "quantity_candidates": [],
        "size_candidates": [],
        "unknown_number_tokens": [],
        "canonical_food": None,
    }

    canonical_food_candidates: list[str] = []

    for token in tokens:
        # 숫자 토큰 먼저 분리
        if any(ch.isdigit() for ch in token):
            kind = classify_number_token(token)

            if kind == "price":
                value = token.replace(",", "").replace("원", "")
                if value.isdigit():
                    result["price_candidates"].append(int(value))
                continue

            if kind == "quantity":
                result["quantity_candidates"].append(token)
                continue

            if kind == "size":
                result["size_candidates"].append(token)
                continue

            result["unknown_number_tokens"].append(token)
            continue

        # 숫자 아닌 토큰 분류
        if token in EVENT_WORDS:
            result["event_words"].append(token)
            continue

        if token in REGION_WORDS:
            result["region_words"].append(token)
            continue

        if token in BRAND_WORDS:
            result["brand_words"].append(token)
            continue

        if token in ORIGIN_WORDS:
            result["origin_words"].append(token)
            continue

        if token in ATTRIBUTE_WORDS:
            result["attribute_words"].append(token)
            continue

        food = detect_food(token)
        if food:
            result["food_words"].append(token)
            canonical_food_candidates.append(food)
            continue

        result["unknown_words"].append(token)

    # 라인 전체에서 가격도 한 번 더 보강
    line_prices = find_price_candidates(line)
    for price in line_prices:
        if price not in result["price_candidates"]:
            result["price_candidates"].append(price)

    if canonical_food_candidates:
        result["canonical_food"] = canonical_food_candidates[0]

    return result


# =========================
# 최종 영수증 파싱
# =========================

def parse_market_items(text: str) -> list[dict[str, Any]]:
    cleaned = clean_text(text)
    lines = cleaned.splitlines()

    items: list[dict[str, Any]] = []

    for line in lines:
        if is_non_food_line(line):
            continue

        parsed = parse_product_line(line)

        # 식품이 확실히 잡힌 줄만 아이템으로 사용
        if parsed["canonical_food"]:
            items.append(parsed)

    return items

def extract_quantity_value(token: str) -> int | None:
    token = token.strip()

    match = re.match(r"^(\d+)\s?(개|입|봉|팩|캔|병|박스|망|단|통|컵|트레이)$", token)
    if match:
        return int(match.group(1))

    pure = token.replace(",", "")
    if pure.isdigit():
        value = int(pure)
        if value < 100:
            return value

    return None

def extract_total_price(text: str, items: list[dict[str, Any]]) -> int | None:
    lines = clean_text(text).splitlines()

    total_keywords = ["합계", "총액", "결제", "결제금액", "총구매액"]

    # 1순위: 합계/총액 줄에서 찾기
    for line in lines:
        if any(keyword in line for keyword in total_keywords):
            prices = find_price_candidates(line)
            if prices:
                return max(prices)

    # 2순위: 파싱된 품목 가격 후보 중 가장 큰 값
    all_prices = []
    for item in items:
        all_prices.extend(item.get("price_candidates", []))

    if all_prices:
        return max(all_prices)

    return None

def parse_receipt_summary(text: str) -> dict[str, Any]:
    items = parse_market_items(text)

    quantities: dict[str, int] = {}

    for item in items:
        food_name = item.get("canonical_food")
        if not food_name:
            continue

        quantity_candidates = item.get("quantity_candidates", [])

        if quantity_candidates:
            quantity = extract_quantity_value(quantity_candidates[0])
            if quantity is None:
                quantity = 1
        else:
            quantity = 1

        quantities[food_name] = quantities.get(food_name, 0) + quantity

    total_price = extract_total_price(text, items)

    return {
        "total_price": total_price,
        "quantities": quantities,
        "items": items,
    }