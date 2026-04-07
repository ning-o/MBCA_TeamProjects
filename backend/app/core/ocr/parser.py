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
    "우유": ["우유", "저지방우유", "멸균우유", "흰우유","두유"],
    "계란": ["계란", "달걀", "유정란", "특란", "계란액", "깐계란"],
    "양파": ["양파"],
    "대파": ["대파"],
    "쪽파": ["쪽파"],
    "마늘": ["마늘", "깐마늘","통마늘","다진마늘"],
    "생강": ["생강","다진생강","깐생강"],
    "감자": ["감자"],
    "고구마": ["고구마"],
    "배추": ["배추", "알배추"],
    "무": ["무 ", " 무", "통무", "무우"],
    "콩나물": ["콩나물","세척콩나물"],
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
    "소고기": ["소고기","쇠고기", "국거리", "불고기", "등심", "안심", "양지", "채끝"],
    "닭고기": ["닭고기", "닭가슴살", "닭다리살", "닭봉", "닭안심"],
    "양념고기": ["소불고기", "고추장 돼지불고기"],
    "오징어": ["오징어","마른오징어"],
    "고등어": ["고등어"],
    "연어": ["연어"],
    "새우": ["새우"],
    "참치": ["참치"],
    "김": ["김","조미김","김밥김"],
    "미역": ["미역","건미역"],
    "다시마": ["다시마"],
    "쌀": ["쌀"],
    "잡곡": ["잡곡"],
    "밀가루": ["밀가루"],
    "식빵": ["식빵", "빵", "땅콩버터빵", "딸기잼빵"],
    "치즈": ["치즈","모짜렐라","슬라이스치즈","모짜렐라치즈","크림치즈"],
    "버터": ["버터","발효버터","무염버터","저염버터"],
    "요거트": ["요거트", "요구르트"],
    "라면": ["라면"],
    "만두": ["만두","고기만두","김치만두"],
    "어묵": ["어묵","오뎅"],
    "햄": ["햄", "프레스햄", "닭가슴살햄", "스팸"],
    "훈제": ["훈제 닭가슴살", "훈제 프레스햄"],
    "소시지": ["소시지", "닭고기 소시지", "돼지고기 소시지", "바비큐 소시지"],
    "떡": ["떡", "가래떡", "떡국떡"],
    "김치": ["김치","볶음김치"],
    "된장": ["된장"],
    "고추장": ["고추장"],
    "간장": ["간장"],
    "식용유": ["식용유", "올리브유", "참기름", "들기름"],
    "설탕": ["설탕"],
    "소금": ["소금"],
    "장아찌":["깻잎장아찌","마늘장아찌","마늘쫑장아찌"],

    # === [과일류] ===
    "포도": ["포도", "캠벨"],
    "복숭아": ["복숭아"],
    "감": ["감", "단감", "홍시", "연시"],
    "멜론": ["멜론"],
    "키위": ["키위", "참다래"],
    "망고": ["망고"],
    "아보카도": ["아보카도"],
    "블루베리": ["블루베리", "냉동블루베리"],
    "체리": ["체리"],
    "자두": ["자두"],
    "살구": ["살구"],
    "석류": ["석류"],
    "라임": ["라임"],
    "자몽": ["자몽"],
    "파인애플": ["파인애플","통파인애플","커팅파인애플"],

    # === [채소/나물/허브류] ===
    "가지": ["가지"],
    "미나리": ["미나리"],
    "쑥갓": ["쑥갓"],
    "치커리": ["치커리"],
    "청경채": ["청경채"],
    "아스파라거스": ["아스파라거스"],
    "셀러리": ["셀러리", "샐러리"],
    "콜라비": ["콜라비"],
    "연근": ["연근"],
    "우엉": ["우엉"],
    "비트": ["비트"],
    "풋콩": ["풋콩"],
    "새싹채소": ["새싹채소", "베이비리프"],
    "샐러드": ["샐러드", "샐러드믹스"],
    "죽순": ["죽순"],
    "고사리": ["고사리"],
    "취나물": ["취나물"],
    "달래": ["달래"],
    "냉이": ["냉이"],
    "허브": ["고수", "바질", "로즈마리"],

    # === [가공육/수산물] ===
    "맛살": ["맛살", "크래미"],
    "베이컨": ["베이컨"],
    "육포": ["육포", "양념포"],
    "생선": ["생선", "필렛"],
    "조개": ["조개", "굴", "패류"],
    "다진고기": ["다진고기", "다짐육"],
    "패티":["햄버거패티","패티"],
    "핫바":["핫바","어묵바"],
    "기타가공품": ["기타가공품","참치캔","스팸","캔"],

    # === [면/묵류] ===
    "묵": ["묵", "도토리묵", "동부묵", "올방개묵"],
    "면류": ["생면", "우동", "우동면", "냉면","칼국수면","소면","당면"],

    # === [간편식/반찬] ===
    "도시락": ["도시락", "편의점도시락"],
    "샌드위치": ["샌드위치"],
    "이유식": ["이유식"],
    "돈까스": ["돈까스","냉동돈까스"],
    "너겟": ["너겟", "치킨너겟"],
    "볶음밥": ["볶음밥", "냉동밥","냉동볶음밥"],
    "국": ["국", "찌개"],
    "반찬": ["멸치볶음", "육류볶음","단무지","쌈무"],
    "김밥": ["김밥", "삼각김밥", "줄김밥", "주먹밥"],
    "햄버거": ["햄버거"],
    "밀키트": ["밀키트"],
    "즉석밥": ["즉석밥","햇반","오뚜기밥"],

    # === [소스/조미료/유제품 추가] ===
    "액젓": ["액젓", "멸치액젓", "까나리액젓"],
    "마요네즈": ["마요네즈"],
    "케첩": ["케첩", "케찹","토마토케첩","토마토케찹"],
    "굴소스": ["굴소스"],
    "조미료": ["조미료", "다시다", "미원"],
    "생크림": ["생크림","동물성 생크림","식물성 생크림"],

    # === [간식/음료/커피] ===
    "쿠키": ["쿠키", "초코칩쿠키"],
    "파이": ["파이", "호두파이"],
    "카스텔라": ["카스텔라", "카스테라"],
    "초콜릿": ["초콜릿", "초코", "밀크초콜릿"],
    "캔디": ["캔디", "캐러멜", "젤리","캐러멜캔디"],
    "커피": ["커피", "액상커피", "커피믹스"],
    "차": ["차", "녹차", "홍차", "침출차"],
    "음료": ["음료", "발효유", "오렌지주스","탄산음료","생수"],
    "유제품": ["유제품","유산균음료", "비피더스","요거트","딸기요거트",]
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

PURE_NUMBER_RE = re.compile(r"^[\d\W]+$")
NUMBER_LIKE_RE = re.compile(r"^[\d\s,./xX×()+-]+(?:원|g|kg|ml|L|개|입|봉|팩|캔|병|박스)?$")
SINGLE_CHAR_FOOD_BLOCKLIST = {"김"}  # 필요시 확장
SUSPICIOUS_TOKENS = {
    "김", "미", "쌀",  # 너무 짧아서 오인식되기 쉬운 것들은 문맥 없으면 보수적으로 처리
}


# =========================
# 기본 유틸
# =========================
def is_suspicious_food_name(name: str) -> bool:
    if not name:
        return True

    n = re.sub(r"\s+", "", name)

    # 한 글자 품목은 매우 보수적으로
    if len(n) == 1:
        return True

    # 숫자 포함이 많으면 품목 아님
    digit_count = sum(ch.isdigit() for ch in n)
    if digit_count > 0:
        return True

    # 자꾸 튀는 오인식 품목 차단
    if n in SINGLE_CHAR_FOOD_BLOCKLIST:
        return True

    return False

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
