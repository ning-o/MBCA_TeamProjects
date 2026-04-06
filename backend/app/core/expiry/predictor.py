import re
from pathlib import Path
from typing import Any, Dict, Optional, Tuple

import joblib
import pandas as pd
from rapidfuzz import fuzz, process


BASE_DIR = Path("/app/app/ml/fridge/model")

MODEL_PATH = BASE_DIR / "tikkle_expiry_model.pkl"
LE_CATEGORY_PATH = BASE_DIR / "expiry_le_category.pkl"
LE_CONDITION_PATH = BASE_DIR / "expiry_le_condition.pkl"
LE_ITEM_PATH = BASE_DIR / "expiry_le_item.pkl"
TRAIN_DATA_PATH = BASE_DIR / "final_train_data.csv"


GLOBAL_DEFAULT_EXPIRY = 7
DEFAULT_CONDITION = "냉장"
DEFAULT_CATEGORY = "채소류"
DEFAULT_ITEM = "양배추"


class ExpiryPredictor:
    def __init__(self):
        self.model = None
        self.le_category = None
        self.le_condition = None
        self.le_item = None
        self.df = None

        self.known_categories = []
        self.known_conditions = []
        self.known_items = []

        self.item_to_category = {}
        self.item_to_condition = {}
        self.item_mean = {}
        self.category_mean = {}
        self.condition_mean = {}

        self.brand_keywords = [
            "서울우유", "매일", "남양", "빙그레", "동원", "CJ", "씨제이", "오뚜기",
            "풀무원", "농심", "삼양", "롯데", "해태", "청정원", "비비고",
            "피코크", "이마트", "노브랜드", "코카콜라", "칠성", "파스퇴르",
            "목우촌", "하림", "오양", "사조", "백설", "샘표", "종가", "동서",
        ]

        # 정제 후 alias -> 가능한 한 known_items에 가까운 값
        self.item_alias_map = {
            # 우유 / 유제품
            "흰우유": "우유",
            "멸균우유": "우유",
            "저지방우유": "우유",
            "고칼슘우유": "우유",
            "딸기우유": "우유",
            "초코우유": "우유",
            "바나나우유": "우유",
            "서울우유": "우유",
            "매일우유": "우유",
            "남양우유": "우유",
            "우유": "우유",

            "플레인요구르트": "플레인 요거트",
            "플레인요거트": "플레인 요거트",
            "요구르트": "플레인 요거트",
            "요거트": "플레인 요거트",
            "그릭요거트": "플레인 요거트",
            "떠먹는요거트": "플레인 요거트",
            "마시는요거트": "플레인 요거트",

            "치즈스틱": "치즈",
            "슬라이스치즈": "치즈",
            "모짜렐라치즈": "치즈",
            "체다치즈": "치즈",
            "크림치즈": "치즈",
            "치즈": "치즈",

            # 소시지 / 햄 / 가공육
            "비엔나소세지": "비엔나 소시지",
            "비엔나소시지": "비엔나 소시지",
            "비엔나 소세지": "비엔나 소시지",
            "비엔나 소시지": "비엔나 소시지",
            "소세지": "소시지",
            "소시지": "소시지",
            "후랑크": "소시지",
            "후랑크소시지": "소시지",
            "후랑크소세지": "소시지",
            "프랑크": "소시지",
            "프랑크소시지": "소시지",
            "프랑크소세지": "소시지",

            "햄": "햄",
            "스팸": "햄",
            "캔햄": "햄",
            "런천미트": "햄",
            "슬라이스햄": "햄",
            "샌드위치햄": "햄",
            "베이컨": "햄",

            # 냉동식품
            "교자만두": "냉동만두(고기)",
            "왕교자": "냉동만두(고기)",
            "고기만두": "냉동만두(고기)",
            "물만두": "냉동만두(고기)",
            "군만두": "냉동만두(고기)",
            "김치만두": "냉동만두(고기)",
            "냉동만두": "냉동만두(고기)",

            # 빵류
            "식빵": "식빵",
            "샌드위치": "샌드위치",
            "베이글": "베이글",
            "모닝빵": "식빵",
            "바게트": "식빵",

            # 육류
            "돼지고기": "돼지고기(생고기)",
            "삼겹살": "돼지고기(생고기)",
            "목살": "돼지고기(생고기)",
            "앞다리살": "돼지고기(생고기)",
            "뒷다리살": "돼지고기(생고기)",

            "소고기": "소고기(생고기)",
            "쇠고기": "소고기(생고기)",
            "한우": "소고기(생고기)",
            "국거리": "소고기(생고기)",
            "불고기용소고기": "소고기(생고기)",

            "닭고기": "닭고기(생고기)",
            "닭": "닭고기(생고기)",
            "닭가슴살": "닭고기(생고기)",
            "닭다리살": "닭고기(생고기)",
            "닭안심": "닭고기(생고기)",

            # 두부 / 계란
            "두부": "두부",
            "연두부": "연두부",
            "순두부": "순두부",
            "부침두부": "두부",
            "찌개두부": "두부",
            "콩두부": "두부",
            "국산콩두부": "두부",

            "달걀": "계란",
            "계란": "계란",
            "특란": "계란",
            "대란": "계란",
            "왕란": "계란",
            "유정란": "계란",

            # 과일
            "사과": "사과",
            "바나나": "바나나",
            "포도": "포도",
            "귤": "귤",
            "감귤": "귤",
            "딸기": "딸기",
            "배": "배",
            "오렌지": "귤",

            # 채소
            "양파": "양파",
            "대파": "대파",
            "쪽파": "대파",
            "실파": "대파",
            "배추": "배추",
            "상추": "상추",
            "양배추": "양배추",
            "오이": "오이",
            "감자": "감자",
            "고구마": "감자",
            "당근": "당근",
            "토마토": "토마토",
            "방울토마토": "토마토",
            "브로콜리": "브로콜리",
            "시금치": "상추",
            "깻잎": "상추",

            # 면류
            "라면": "라면",
            "국수": "국수",
            "소면": "국수",
            "중면": "국수",
            "우동면": "국수",
            "파스타": "파스타면",
            "스파게티": "파스타면",
            "파스타면": "파스타면",
        }

        self.category_rules = {
            "유제품": ["우유", "치즈", "버터", "요거트", "요구르트", "크림"],
            "발효유": ["발효유"],
            "과일류": ["사과", "바나나", "포도", "귤", "감귤", "딸기", "복숭아", "배", "오렌지"],
            "채소류": ["양파", "대파", "배추", "상추", "양배추", "오이", "감자", "당근", "토마토", "브로콜리"],
            "냉동식품": ["냉동", "만두", "볶음밥", "피자", "돈까스", "치킨너겟", "너겟"],
            "햄류": ["햄", "베이컨"],
            "소시지": ["소시지", "비엔나"],
            "축산물": ["돼지고기", "소고기", "쇠고기", "닭고기", "계란", "달걀", "고기"],
            "빵류": ["식빵", "빵", "샌드위치", "베이글", "카스테라", "케이크"],
            "면류": ["라면", "국수", "면", "파스타", "스파게티", "우동"],
            "두부류": ["두부", "연두부", "순두부"],
        }

        self.condition_rules = {
            "냉동": ["냉동", "냉동보관"],
            "냉장": ["냉장", "냉장보관", "개봉후냉장", "개봉 후 냉장"],
            "실온": ["실온", "실온보관"],
            "상온": ["상온", "상온보관"],
        }

        self._load_all()

    def _load_all(self):
        self.model = joblib.load(MODEL_PATH)
        self.le_category = joblib.load(LE_CATEGORY_PATH)
        self.le_condition = joblib.load(LE_CONDITION_PATH)
        self.le_item = joblib.load(LE_ITEM_PATH)
        self.df = pd.read_csv(TRAIN_DATA_PATH)

        self.known_categories = list(self.le_category.classes_)
        self.known_conditions = list(self.le_condition.classes_)
        self.known_items = list(self.le_item.classes_)

        self.df["식품분류"] = self.df["식품분류"].astype(str).str.strip()
        self.df["품목명"] = self.df["품목명"].astype(str).str.strip()
        self.df["보관조건"] = self.df["보관조건"].astype(str).str.strip()
        self.df["expiry_days"] = pd.to_numeric(self.df["expiry_days"], errors="coerce")

        self.item_mean = (
            self.df.groupby("품목명")["expiry_days"]
            .mean()
            .round()
            .astype("Int64")
            .dropna()
            .to_dict()
        )
        self.category_mean = (
            self.df.groupby("식품분류")["expiry_days"]
            .mean()
            .round()
            .astype("Int64")
            .dropna()
            .to_dict()
        )
        self.condition_mean = (
            self.df.groupby("보관조건")["expiry_days"]
            .mean()
            .round()
            .astype("Int64")
            .dropna()
            .to_dict()
        )

        self.item_to_category = (
            self.df.groupby("품목명")["식품분류"]
            .agg(lambda x: x.mode().iloc[0] if not x.mode().empty else x.iloc[0])
            .to_dict()
        )
        self.item_to_condition = (
            self.df.groupby("품목명")["보관조건"]
            .agg(lambda x: x.mode().iloc[0] if not x.mode().empty else x.iloc[0])
            .to_dict()
        )

        if not self.known_categories:
            raise ValueError("known_categories가 비어 있습니다.")
        if not self.known_conditions:
            raise ValueError("known_conditions가 비어 있습니다.")
        if not self.known_items:
            raise ValueError("known_items가 비어 있습니다.")

        print("[DEBUG] '비엔나 소시지' in known_items:", "비엔나 소시지" in self.known_items)
        print("[DEBUG] '소시지' in known_items:", "소시지" in self.known_items)
        print("[DEBUG] '햄' in known_items:", "햄" in self.known_items)
        print("[DEBUG] '우유' in known_items:", "우유" in self.known_items)
        print("[DEBUG] known_items sample:", self.known_items[:20])

    @staticmethod
    def _safe_str(value: Any) -> str:
        if value is None:
            return ""
        return str(value).strip()

    def normalize_text(self, text: str) -> str:
        text = self._safe_str(text)
        if not text:
            return ""

        # 괄호/대괄호 제거
        text = re.sub(r"\([^)]*\)", " ", text)
        text = re.sub(r"\[[^\]]*\]", " ", text)

        # 용량/수량 제거
        text = re.sub(
            r"\d+(\.\d+)?\s?(ml|mL|l|L|g|kg|KG|개입|개|팩|봉|EA|ea|입|캔|병|알|장|줄)",
            " ",
            text,
        )

        # 숫자 제거
        text = re.sub(r"\d+(\.\d+)?", " ", text)

        # 특수문자 정리
        text = re.sub(r"[^\w\s가-힣/]", " ", text)

        # 자주 나오는 불필요 단어 제거
        remove_words = [
            "행사상품", "행사", "증정", "할인", "묶음", "대용량", "정품",
            "개봉후", "개봉", "보관", "추천", "국산", "수입산", "국내산",
            "신상품", "기획", "특가", "용기", "파우치", "리필", "냉장용", "냉동용",
        ]
        for word in remove_words:
            text = text.replace(word, " ")

        # 브랜드 제거
        for brand in self.brand_keywords:
            text = text.replace(brand, " ")
            text = text.replace(brand.lower(), " ")
            text = text.replace(brand.upper(), " ")

        # OCR 오타/붙여쓰기/대표 표기 정도만 보정
        replacements = {
            "비엔나소세지": "비엔나 소시지",
            "비엔나소시지": "비엔나 소시지",
            "후랑크소세지": "후랑크 소시지",
            "후랑크소시지": "후랑크 소시지",
            "프랑크소세지": "프랑크 소시지",
            "프랑크소시지": "프랑크 소시지",
            "소세지": "소시지",

            "플레인요거트": "플레인 요거트",
            "플레인요구르트": "플레인 요거트",
            "그릭요거트": "플레인 요거트",
            "떠먹는요거트": "플레인 요거트",
            "마시는요거트": "플레인 요거트",

            "서울우유": "우유",
            "매일우유": "우유",
            "남양우유": "우유",
            "멸균우유": "우유",
            "흰우유": "우유",

            "국산콩두부": "두부",
            "콩두부": "두부",
            "부침두부": "두부",
            "찌개두부": "두부",

            "달걀": "계란",
            "특란": "계란",
            "대란": "계란",
            "왕란": "계란",
            "유정란": "계란",

            "방울토마토": "토마토",
            "쪽파": "대파",
            "실파": "대파",
            "깻잎": "상추",
            "시금치": "상추",
            "감귤": "귤",
            "오렌지": "귤",
        }
        for src, dst in replacements.items():
            text = text.replace(src, dst)

        text = re.sub(r"\s+", " ", text).strip()
        return text

    def fuzzy_match(self, value: str, candidates: list[str], cutoff: int = 65) -> Optional[str]:
        value = self._safe_str(value)
        if not value or not candidates:
            return None

        matched = process.extractOne(value, candidates, scorer=fuzz.WRatio)
        if not matched:
            return None

        candidate, score, _ = matched
        if score >= cutoff:
            return candidate
        return None

    def _normalized_contains(self, source: str, target: str) -> bool:
        source_n = re.sub(r"\s+", "", self.normalize_text(source))
        target_n = re.sub(r"\s+", "", self.normalize_text(target))
        return bool(source_n and target_n and target_n in source_n)

    def _choose_known_item(self, candidates: list[str]) -> Optional[str]:
        for candidate in candidates:
            if candidate in self.known_items:
                return candidate
        return None

    def map_item_name(self, raw_item_text: str, raw_ocr_text: str = "") -> Tuple[str, str]:
        raw_item_text = self._safe_str(raw_item_text)
        raw_ocr_text = self._safe_str(raw_ocr_text)
        raw_combined = " ".join([x for x in [raw_item_text, raw_ocr_text] if x]).strip()

        # 원문 alias: OCR 원문에서 바로 잡히는 것들
        raw_alias_map = {
            # 우유 / 유제품
            "서울우유": ["우유"],
            "서울 우유": ["우유"],
            "매일우유": ["우유"],
            "매일 우유": ["우유"],
            "남양우유": ["우유"],
            "남양 우유": ["우유"],
            "멸균우유": ["우유"],
            "저지방우유": ["우유"],
            "고칼슘우유": ["우유"],
            "딸기우유": ["우유"],
            "초코우유": ["우유"],
            "바나나우유": ["우유"],
            "흰우유": ["우유"],
            "우유1l": ["우유"],
            "우유 1l": ["우유"],
            "우유500ml": ["우유"],
            "우유 500ml": ["우유"],

            "플레인요거트": ["플레인 요거트", "요거트"],
            "플레인 요거트": ["플레인 요거트", "요거트"],
            "플레인요구르트": ["플레인 요거트", "요거트"],
            "요구르트": ["플레인 요거트", "요거트"],
            "요거트": ["플레인 요거트", "요거트"],
            "그릭요거트": ["플레인 요거트", "요거트"],

            "슬라이스치즈": ["치즈"],
            "모짜렐라치즈": ["치즈"],
            "체다치즈": ["치즈"],
            "치즈스틱": ["치즈"],

            # 두부 / 계란
            "국산콩두부": ["두부"],
            "국산 콩 두부": ["두부"],
            "콩두부": ["두부"],
            "연두부": ["연두부", "두부"],
            "순두부": ["순두부", "두부"],
            "부침두부": ["두부"],
            "찌개두부": ["두부"],

            "계란": ["계란"],
            "달걀": ["계란"],
            "특란": ["계란"],
            "대란": ["계란"],
            "왕란": ["계란"],
            "유정란": ["계란"],

            # 소시지 / 햄
            "비엔나소시지": ["비엔나 소시지", "소시지", "햄"],
            "비엔나 소시지": ["비엔나 소시지", "소시지", "햄"],
            "비엔나소세지": ["비엔나 소시지", "소시지", "햄"],
            "비엔나 소세지": ["비엔나 소시지", "소시지", "햄"],
            "후랑크소시지": ["소시지", "비엔나 소시지", "햄"],
            "후랑크 소시지": ["소시지", "비엔나 소시지", "햄"],
            "후랑크소세지": ["소시지", "비엔나 소시지", "햄"],
            "후랑크 소세지": ["소시지", "비엔나 소시지", "햄"],
            "프랑크소시지": ["소시지", "비엔나 소시지", "햄"],
            "프랑크 소시지": ["소시지", "비엔나 소시지", "햄"],
            "프랑크소세지": ["소시지", "비엔나 소시지", "햄"],
            "프랑크 소세지": ["소시지", "비엔나 소시지", "햄"],
            "소세지": ["소시지", "비엔나 소시지", "햄"],
            "소시지": ["소시지", "비엔나 소시지", "햄"],
            "비엔나": ["비엔나 소시지", "소시지", "햄"],
            "후랑크": ["소시지", "햄"],
            "프랑크": ["소시지", "햄"],

            "스팸": ["햄"],
            "캔햄": ["햄"],
            "런천미트": ["햄"],
            "베이컨": ["햄"],
            "슬라이스햄": ["햄"],
            "샌드위치햄": ["햄"],
            "햄": ["햄"],

            # 육류
            "돼지고기": ["돼지고기(생고기)"],
            "삼겹살": ["돼지고기(생고기)"],
            "목살": ["돼지고기(생고기)"],
            "앞다리살": ["돼지고기(생고기)"],
            "뒷다리살": ["돼지고기(생고기)"],

            "소고기": ["소고기(생고기)"],
            "쇠고기": ["소고기(생고기)"],
            "한우": ["소고기(생고기)"],
            "국거리": ["소고기(생고기)"],

            "닭고기": ["닭고기(생고기)"],
            "닭": ["닭고기(생고기)"],
            "닭가슴살": ["닭고기(생고기)"],
            "닭다리살": ["닭고기(생고기)"],
            "닭안심": ["닭고기(생고기)"],

            # 냉동식품
            "교자만두": ["냉동만두(고기)"],
            "왕교자": ["냉동만두(고기)"],
            "고기만두": ["냉동만두(고기)"],
            "물만두": ["냉동만두(고기)"],
            "군만두": ["냉동만두(고기)"],
            "김치만두": ["냉동만두(고기)"],
            "냉동만두": ["냉동만두(고기)"],

            # 빵 / 면
            "식빵": ["식빵"],
            "샌드위치": ["샌드위치"],
            "베이글": ["베이글"],
            "모닝빵": ["식빵"],
            "바게트": ["식빵"],

            "라면": ["라면"],
            "국수": ["국수"],
            "소면": ["국수"],
            "중면": ["국수"],
            "우동면": ["국수"],
            "파스타": ["파스타면"],
            "스파게티": ["파스타면"],

            # 과일 / 채소
            "사과": ["사과"],
            "바나나": ["바나나"],
            "포도": ["포도"],
            "귤": ["귤"],
            "감귤": ["귤"],
            "딸기": ["딸기"],
            "배": ["배"],
            "오렌지": ["귤"],

            "양파": ["양파"],
            "대파": ["대파"],
            "쪽파": ["대파"],
            "실파": ["대파"],
            "배추": ["배추"],
            "상추": ["상추"],
            "양배추": ["양배추"],
            "오이": ["오이"],
            "감자": ["감자"],
            "당근": ["당근"],
            "토마토": ["토마토"],
            "방울토마토": ["토마토"],
            "브로콜리": ["브로콜리"],
        }

        # 1) 원문 alias 최우선
        if raw_combined:
            for alias, candidates in sorted(raw_alias_map.items(), key=lambda x: len(x[0]), reverse=True):
                if alias in raw_combined:
                    picked = self._choose_known_item(candidates)
                    if picked:
                        return picked, "raw_alias_item"

        # 2) 정제
        clean_item_text = self.normalize_text(raw_item_text)
        clean_ocr_text = self.normalize_text(raw_ocr_text)
        combined = " ".join([x for x in [clean_item_text, clean_ocr_text] if x]).strip()

        if not combined:
            default_item = DEFAULT_ITEM if DEFAULT_ITEM in self.known_items else self.known_items[0]
            return default_item, "default_item"

        # 3) 정제 후 alias
        for alias, canonical in sorted(self.item_alias_map.items(), key=lambda x: len(x[0]), reverse=True):
            if self._normalized_contains(combined, alias):
                if canonical in self.known_items:
                    return canonical, "alias_item_clean"

        # 4) known item 직접 포함
        combined_nospace = re.sub(r"\s+", "", combined)
        for known_item in sorted(self.known_items, key=len, reverse=True):
            known_item_norm = re.sub(r"\s+", "", self.normalize_text(known_item))
            if known_item_norm and known_item_norm in combined_nospace:
                return known_item, "exact_item_contains"

        # 5) raw_item_text 단독 fuzzy
        exact_item = self.fuzzy_match(clean_item_text, self.known_items, cutoff=88)
        if exact_item:
            return exact_item, "fuzzy_item_text"

        # 6) 전체 문장 fuzzy
        exact_item = self.fuzzy_match(combined, self.known_items, cutoff=90)
        if exact_item:
            return exact_item, "fuzzy_item"

        # 7) keyword fallback
        keyword_fallbacks = [
            (["우유", "멸균우유", "흰우유"], ["우유"]),
            (["요거트", "요구르트", "플레인요거트", "플레인 요거트"], ["플레인 요거트", "요거트"]),
            (["치즈", "치즈스틱", "슬라이스치즈"], ["치즈"]),

            (["비엔나", "소시지", "소세지", "후랑크", "프랑크"], ["비엔나 소시지", "소시지", "햄"]),
            (["햄", "스팸", "런천미트", "캔햄", "베이컨"], ["햄"]),

            (["만두", "교자"], ["냉동만두(고기)"]),
            (["돼지고기", "목살", "삼겹살"], ["돼지고기(생고기)"]),
            (["소고기", "쇠고기", "한우"], ["소고기(생고기)"]),
            (["닭고기", "닭가슴살", "닭"], ["닭고기(생고기)"]),

            (["식빵", "빵", "모닝빵", "바게트"], ["식빵"]),
            (["샌드위치"], ["샌드위치"]),
            (["베이글"], ["베이글"]),

            (["두부", "연두부", "순두부"], ["두부", "연두부", "순두부"]),
            (["계란", "달걀", "특란", "대란"], ["계란"]),

            (["사과"], ["사과"]),
            (["바나나"], ["바나나"]),
            (["포도"], ["포도"]),
            (["귤", "감귤", "오렌지"], ["귤"]),

            (["양파"], ["양파"]),
            (["양배추"], ["양배추"]),
            (["배추"], ["배추"]),
            (["대파", "쪽파", "실파"], ["대파"]),
            (["오이"], ["오이"]),
            (["감자"], ["감자"]),
            (["토마토", "방울토마토"], ["토마토"]),

            (["라면"], ["라면"]),
            (["국수", "소면", "중면", "우동"], ["국수"]),
            (["파스타", "스파게티"], ["파스타면"]),
        ]
        for keywords, fallback_candidates in keyword_fallbacks:
            if any(k in raw_combined for k in keywords) or any(k in combined for k in keywords):
                picked = self._choose_known_item(fallback_candidates)
                if picked:
                    return picked, "keyword_fallback_item"

        default_item = DEFAULT_ITEM if DEFAULT_ITEM in self.known_items else self.known_items[0]
        return default_item, "default_item"

    def infer_category(self, item_name: str, raw_text: str = "") -> Tuple[str, str]:
        item_name = self.normalize_text(item_name)
        raw_text = self.normalize_text(raw_text)
        combined = f"{item_name} {raw_text}".strip()

        if item_name in self.item_to_category:
            category = self.item_to_category[item_name]
            if category in self.known_categories:
                return category, "item_to_category"

        for category, keywords in self.category_rules.items():
            if any(k in combined for k in keywords):
                if category in self.known_categories:
                    return category, "rule_category"

        fuzzy_category = self.fuzzy_match(combined, self.known_categories, cutoff=75)
        if fuzzy_category:
            return fuzzy_category, "fuzzy_category"

        default_category = DEFAULT_CATEGORY if DEFAULT_CATEGORY in self.known_categories else self.known_categories[0]
        return default_category, "default_category"

    def normalize_condition(self, condition_text: str) -> str:
        text = self.normalize_text(condition_text)
        if not text:
            return ""

        if "냉동" in text:
            return "냉동"
        if "냉장" in text:
            return "냉장"
        if "실온" in text:
            return "실온"
        if "상온" in text:
            return "상온"

        return text

    def infer_condition(
        self,
        raw_condition: str,
        item_name: str = "",
        category: str = "",
        raw_text: str = "",
    ) -> Tuple[str, str]:
        raw_condition = self.normalize_condition(raw_condition)
        raw_text = self.normalize_condition(raw_text)

        if raw_condition in self.known_conditions:
            return raw_condition, "exact_condition"

        if raw_text in self.known_conditions:
            return raw_text, "ocr_condition"

        combined = f"{raw_condition} {raw_text}".strip()
        for cond, keywords in self.condition_rules.items():
            if any(k in combined for k in keywords):
                if cond in self.known_conditions:
                    return cond, "rule_condition"

        if item_name in self.item_to_condition:
            cond = self.item_to_condition[item_name]
            if cond in self.known_conditions:
                return cond, "item_to_condition"

        category_defaults = {
            "유제품": "냉장",
            "발효유": "냉장",
            "축산물": "냉장",
            "햄류": "냉장",
            "소시지": "냉장",
            "두부류": "냉장",
            "냉동식품": "냉동",
            "빵류": "실온",
            "면류": "실온",
            "과일류": "실온",
            "채소류": "냉장",
        }
        if category in category_defaults:
            cond = category_defaults[category]
            if cond in self.known_conditions:
                return cond, "category_default_condition"

        fuzzy_condition = self.fuzzy_match(combined, self.known_conditions, cutoff=70)
        if fuzzy_condition:
            return fuzzy_condition, "fuzzy_condition"

        default_condition = DEFAULT_CONDITION if DEFAULT_CONDITION in self.known_conditions else self.known_conditions[0]
        return default_condition, "default_condition"

    def _predict_with_model(self, category: str, item_name: str, condition: str) -> Optional[int]:
        try:
            category_encoded = int(self.le_category.transform([category])[0])
            item_encoded = int(self.le_item.transform([item_name])[0])
            condition_encoded = int(self.le_condition.transform([condition])[0])

            X = [[category_encoded, item_encoded, condition_encoded]]
            pred = self.model.predict(X)[0]
            pred = max(1, int(round(float(pred))))
            return pred
        except Exception as e:
            print("[DEBUG] _predict_with_model error:", e)
            return None

    def predict_expiry_days(
        self,
        raw_item_text: str = "",
        raw_condition_text: str = "",
        raw_ocr_text: str = "",
    ) -> Dict[str, Any]:
        item_name, item_source = self.map_item_name(raw_item_text, raw_ocr_text)
        category, category_source = self.infer_category(item_name, raw_ocr_text)
        condition, condition_source = self.infer_condition(
            raw_condition=raw_condition_text,
            item_name=item_name,
            category=category,
            raw_text=raw_ocr_text,
        )

        print("[DEBUG] raw_item_text:", raw_item_text)
        print("[DEBUG] raw_condition_text:", raw_condition_text)
        print("[DEBUG] raw_ocr_text:", raw_ocr_text)
        print("[DEBUG] mapped item_name:", item_name, "| source:", item_source)
        print("[DEBUG] inferred category:", category, "| source:", category_source)
        print("[DEBUG] inferred condition:", condition, "| source:", condition_source)

        # 1차: 모델 정확 예측
        if (
            item_name in self.known_items
            and category in self.known_categories
            and condition in self.known_conditions
        ):
            pred = self._predict_with_model(category, item_name, condition)
            if pred is not None:
                return {
                    "item_name": item_name,
                    "food_category": category,
                    "storage_condition": condition,
                    "expiry_days": pred,
                    "prediction_source": "model",
                    "item_source": item_source,
                    "category_source": category_source,
                    "condition_source": condition_source,
                    "raw_item_text": raw_item_text,
                    "raw_ocr_text": raw_ocr_text,
                    "raw_condition_text": raw_condition_text,
                }

        # 2차: 품목 평균
        if item_name in self.item_mean and pd.notna(self.item_mean[item_name]):
            return {
                "item_name": item_name,
                "food_category": category,
                "storage_condition": condition,
                "expiry_days": int(self.item_mean[item_name]),
                "prediction_source": "item_mean",
                "item_source": item_source,
                "category_source": category_source,
                "condition_source": condition_source,
                "raw_item_text": raw_item_text,
                "raw_ocr_text": raw_ocr_text,
                "raw_condition_text": raw_condition_text,
            }

        # 3차: 카테고리 평균
        if category in self.category_mean and pd.notna(self.category_mean[category]):
            return {
                "item_name": item_name,
                "food_category": category,
                "storage_condition": condition,
                "expiry_days": int(self.category_mean[category]),
                "prediction_source": "category_mean",
                "item_source": item_source,
                "category_source": category_source,
                "condition_source": condition_source,
                "raw_item_text": raw_item_text,
                "raw_ocr_text": raw_ocr_text,
                "raw_condition_text": raw_condition_text,
            }

        # 4차: 보관조건 평균
        if condition in self.condition_mean and pd.notna(self.condition_mean[condition]):
            return {
                "item_name": item_name,
                "food_category": category,
                "storage_condition": condition,
                "expiry_days": int(self.condition_mean[condition]),
                "prediction_source": "condition_mean",
                "item_source": item_source,
                "category_source": category_source,
                "condition_source": condition_source,
                "raw_item_text": raw_item_text,
                "raw_ocr_text": raw_ocr_text,
                "raw_condition_text": raw_condition_text,
            }

        # 5차: 전역 기본값
        return {
            "item_name": item_name or (DEFAULT_ITEM if DEFAULT_ITEM in self.known_items else self.known_items[0]),
            "food_category": category or (DEFAULT_CATEGORY if DEFAULT_CATEGORY in self.known_categories else self.known_categories[0]),
            "storage_condition": condition or (DEFAULT_CONDITION if DEFAULT_CONDITION in self.known_conditions else self.known_conditions[0]),
            "expiry_days": GLOBAL_DEFAULT_EXPIRY,
            "prediction_source": "global_default",
            "item_source": item_source,
            "category_source": category_source,
            "condition_source": condition_source,
            "raw_item_text": raw_item_text,
            "raw_ocr_text": raw_ocr_text,
            "raw_condition_text": raw_condition_text,
        }


expiry_predictor = ExpiryPredictor()