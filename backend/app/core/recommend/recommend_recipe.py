from __future__ import annotations

from pathlib import Path
from typing import Dict, List, Any, Optional
import re
import ast
import joblib
import pandas as pd


STOPWORDS = {
    "", "약간", "조금", "적당량", "적당히", "기호에따라", "기호에 따라",
    "취향껏", "선택", "선택사항", "재료"
}

ALIASES = {
    "달걀": "계란",
    "계 란": "계란",
    "대 파": "대파",
    "간 장": "간장",
    "참 기름": "참기름",

    "닭": "닭고기",
    "계육": "닭고기",
    "닭가슴살": "닭고기",
    "닭다리살": "닭고기",
    "닭안심": "닭고기",
    "치킨": "닭고기",

    "쇠고기": "소고기",
    "우육": "소고기",

    "돼지": "돼지고기",
    "삼겹살": "돼지고기",
    "목살": "돼지고기",
}


def normalize_text(value: str) -> str:
    if value is None:
        return ""

    text = str(value).strip().lower()
    if not text:
        return ""

    text = re.sub(r"\([^)]*\)", " ", text)
    text = re.sub(r"\[[^\]]*\]", " ", text)
    text = re.sub(r"[^0-9a-zA-Z가-힣\s,/|·]", " ", text)
    text = re.sub(r"\s+", " ", text).strip()
    text = text.replace(" ", "")

    return ALIASES.get(text, text)


def split_ingredient_text(value: Any) -> List[str]:
    if value is None:
        return []

    if isinstance(value, list):
        raw_items = value
    elif isinstance(value, str):
        text = value.strip()
        if not text:
            return []
        if text.startswith("[") and text.endswith("]"):
            try:
                parsed = ast.literal_eval(text)
                raw_items = parsed if isinstance(parsed, list) else [text]
            except Exception:
                raw_items = re.split(r"[,/|·\n\r\t]+", text)
        else:
            raw_items = re.split(r"[,/|·\n\r\t]+", text)
    else:
        raw_items = [str(value)]

    cleaned = []
    for item in raw_items:
        token = normalize_text(str(item))
        if not token or token in STOPWORDS:
            continue
        cleaned.append(token)

    return list(dict.fromkeys(cleaned))


def expiry_weight(days_left: Optional[int]) -> float:
    if days_left is None:
        return 1.0
    if days_left <= 0:
        return 4.0
    if days_left == 1:
        return 3.5
    if days_left <= 3:
        return 2.5
    if days_left <= 7:
        return 1.5
    return 1.0


def role_weight(role: str) -> float:
    if role == "main":
        return 3.0
    if role == "sub":
        return 1.5
    if role == "season":
        return 0.3
    return 1.0


class PKLRecipeRecommender:
    def __init__(self) -> None:
        self.data = self._load_engine()
        self.recipe_df = self._extract_recipe_df()

    def _load_engine(self):
        current_file = Path(__file__).resolve()
        pkl_path = current_file.parents[2] / "ml" / "fridge" / "model" / "tikkle_engine.pkl"

        if not pkl_path.exists():
            raise FileNotFoundError(f"추천 pkl 파일을 찾지 못했습니다: {pkl_path}")

        data = joblib.load(pkl_path)
        if not isinstance(data, dict):
            raise TypeError(f"tikkle_engine.pkl이 dict가 아닙니다. type={type(data)}")
        return data

    def _extract_recipe_df(self) -> pd.DataFrame:
        recipe_df = self.data.get("recipe_df")
        if recipe_df is None:
            raise KeyError("tikkle_engine.pkl 안에 recipe_df가 없습니다.")
        if not isinstance(recipe_df, pd.DataFrame):
            raise TypeError(f"recipe_df가 DataFrame이 아닙니다. type={type(recipe_df)}")
        return recipe_df

    def _find_column(self, candidates: List[str]) -> str | None:
        cols = list(self.recipe_df.columns)
        lowered = {str(c).lower(): c for c in cols}
        for cand in candidates:
            if cand in cols:
                return cand
            if cand.lower() in lowered:
                return lowered[cand.lower()]
        return None

    def recommend(
        self,
        input_stock: Dict[str, int | float],
        top_k: int = 5,
        expiry_info: Optional[Dict[str, int]] = None,
    ) -> List[Dict[str, Any]]:
        expiry_info = expiry_info or {}

        # 원본 재료명 -> 정규화명
        normalized_stock: Dict[str, float] = {}
        normalized_expiry: Dict[str, int] = {}

        for raw_name, qty in input_stock.items():
            norm_name = normalize_text(raw_name)
            if not norm_name or norm_name in STOPWORDS:
                continue
            normalized_stock[norm_name] = float(qty)

            if raw_name in expiry_info:
                normalized_expiry[norm_name] = expiry_info[raw_name]
            elif norm_name in expiry_info:
                normalized_expiry[norm_name] = expiry_info[norm_name]

        user_set = set(normalized_stock.keys())
        if not user_set:
            return []

        df = self.recipe_df.copy()

        recipe_id_col = self._find_column(["recipe_id", "id"])
        recipe_name_col = self._find_column(["recipe_name", "name", "title"])
        main_col = self._find_column(["main_ingredients", "main"])
        sub_col = self._find_column(["sub_ingredients", "sub"])
        season_col = self._find_column(["seasonings", "Seasonings", "seasoning"])
        cooking_time_col = self._find_column(["cooking_time", "cook_time"])
        difficulty_col = self._find_column(["difficulty"])
        category_col = self._find_column(["category"])

        if recipe_name_col is None:
            raise KeyError(f"recipe_df에서 recipe_name 계열 컬럼을 찾지 못했습니다. columns={list(df.columns)}")

        results = []

        for _, row in df.iterrows():
            main_ingredients = split_ingredient_text(row[main_col]) if main_col else []
            sub_ingredients = split_ingredient_text(row[sub_col]) if sub_col else []
            seasonings = split_ingredient_text(row[season_col]) if season_col else []

            all_ingredients = []
            for item in main_ingredients + sub_ingredients + seasonings:
                if item not in all_ingredients:
                    all_ingredients.append(item)

            available = [x for x in all_ingredients if x in user_set]
            if not available:
                continue

            matched_main = user_set & set(main_ingredients)
            matched_sub = user_set & set(sub_ingredients)
            matched_season = user_set & set(seasonings)

            # 기존 비율 점수
            earned = (
                len(matched_main) * 3.0 +
                len(matched_sub) * 1.5 +
                len(matched_season) * 0.5
            )
            possible = (
                len(set(main_ingredients)) * 3.0 +
                len(set(sub_ingredients)) * 1.5 +
                len(set(seasonings)) * 0.5
            )
            match_score = round(earned / possible, 4) if possible > 0 else 0.0

            # 사장님 기준 핵심 점수: 유통기한 + 주/부재료
            expiry_score = 0.0
            role_score = 0.0

            for item in matched_main:
                role_score += role_weight("main")
                expiry_score += expiry_weight(normalized_expiry.get(item))

            for item in matched_sub:
                role_score += role_weight("sub")
                expiry_score += expiry_weight(normalized_expiry.get(item))

            for item in matched_season:
                role_score += role_weight("season")
                expiry_score += expiry_weight(normalized_expiry.get(item))

            final_score = round((expiry_score * 0.7) + (role_score * 0.3), 4)

            results.append({
                "recipe_id": row[recipe_id_col] if recipe_id_col else None,
                "recipe_name": row[recipe_name_col],
                "match_score": match_score,
                "expiry_score": round(expiry_score, 4),
                "role_score": round(role_score, 4),
                "final_score": final_score,
                "available_ingredients": available,
                "missing_ingredients": [x for x in all_ingredients if x not in user_set],
                "main_ingredients": main_ingredients,
                "sub_ingredients": sub_ingredients,
                "seasonings": seasonings,
                "cooking_time": row[cooking_time_col] if cooking_time_col else None,
                "difficulty": row[difficulty_col] if difficulty_col else None,
                "category": row[category_col] if category_col else None,
            })

        results.sort(
            key=lambda x: (
                x["final_score"],
                x["match_score"],
                len(x["available_ingredients"]),
            ),
            reverse=True,
        )

        return results[:top_k]


_recommender = PKLRecipeRecommender()


def recommend_recipes(
    input_stock: Dict[str, int | float],
    top_k: int = 5,
    expiry_info: Optional[Dict[str, int]] = None,
):
    return _recommender.recommend(
        input_stock=input_stock,
        top_k=top_k,
        expiry_info=expiry_info,
    )