import os
import re
import joblib
import numpy as np
import pandas as pd
from pathlib import Path
from sklearn.metrics.pairwise import cosine_similarity


def get_weight(days_left: int) -> float:
    if days_left <= 0:
        return 10.0
    return round(10 / (days_left + 1), 2)


class TikkleRecipeRecommender:
    def __init__(self, engine_path: str | None = None):
        if engine_path is None:
            engine_path = Path(__file__).resolve().parent / "model" / "tikkle_engine.pkl"

        self.engine_path = str(engine_path)

        if not os.path.exists(self.engine_path):
            raise FileNotFoundError(f"추천 엔진 파일이 없습니다: {self.engine_path}")

        data = joblib.load(self.engine_path)

        self.recipe_df: pd.DataFrame = data["recipe_df"]
        self.ingredient_to_idx: dict[str, int] = data["ingredient_to_idx"]
        self.all_ingredients: list[str] = data["all_ingredients"]

        self.alias_map = {
            "파": "대파",
            "쪽파": "대파",
            "달걀": "계란",
            "계란": "계란",
            "진간장": "간장",
            "국간장": "간장",
            "간장": "간장",
            "올리브유": "식용유",
            "식용유": "식용유",
            "다진 마늘": "다진마늘",
            "마늘": "다진마늘",
            "설 탕": "설탕",
            " 참기름": "참기름",
            " 간장": "간장",
            "진간장": "간장",
            "두부": "두부",
            "찌개용두부": "두부",
            "부침용두부": "두부",
            "돼지고기": "돼지고기",
            "삼겹살": "돼지고기",
            "목살": "돼지고기",
            "돼지": "돼지고기",
        }

    def normalize_ingredient(self, value: str | None) -> str | None:
        if value is None:
            return None

        value = str(value).strip()
        if not value:
            return None

        if "(" in value:
            value = value.split("(")[0].strip()

        remove_tokens = [
            "약간", "적당량", "조금", "약간의",
            "1개", "2개", "3개", "4개", "5개",
            "1큰술", "2큰술", "3큰술",
            "1작은술", "2작은술",
            "한컵", "반컵"
        ]
        for token in remove_tokens:
            value = value.replace(token, "").strip()

        value = re.sub(r"\s+", " ", value).strip()
        return self.alias_map.get(value, value)

    def normalize_stock(self, input_stock: dict) -> dict[str, int]:
        normalized = {}

        for name, days in input_stock.items():
            norm_name = self.normalize_ingredient(name)
            if not norm_name:
                continue

            try:
                days_left = int(days)
            except Exception:
                continue

            normalized[norm_name] = days_left

        return normalized

    def make_user_vector(self, input_stock: dict[str, int]) -> np.ndarray:
        u_vector = np.zeros(len(self.all_ingredients), dtype=float)

        for name, days_left in input_stock.items():
            if name in self.ingredient_to_idx:
                idx = self.ingredient_to_idx[name]
                u_vector[idx] = get_weight(days_left)

        return u_vector

    def parse_recipe_ingredients(self, row) -> list[str]:
        result = []

        candidate_columns = [
            "all_ingredients",
            "main_ingredients",
            "sub_ingredients",
            "Seasonings",
            "seasonings",
        ]

        for col in candidate_columns:
            if col not in row or pd.isna(row[col]):
                continue

            value = row[col]

            if isinstance(value, list):
                items = value
            else:
                text = str(value).strip()
                text = text.strip("[]")
                parts = re.split(r"[,/\n|]", text)
                items = [p.replace("'", "").replace('"', "").strip() for p in parts]

            for item in items:
                norm_item = self.normalize_ingredient(item)
                if norm_item and norm_item not in result:
                    result.append(norm_item)

        return result

    def make_recipe_vector(self, recipe_ingredients: list[str]) -> np.ndarray:
        v = np.zeros(len(self.all_ingredients), dtype=float)

        for ing in recipe_ingredients:
            if ing in self.ingredient_to_idx:
                v[self.ingredient_to_idx[ing]] = 1.0

        return v

    def build_reason(self, matched: list[str], days_left_min: int | None) -> str:
        matched_text = ", ".join(matched[:4]) if matched else "현재 재료"
        if days_left_min is None:
            return f"{matched_text}를 활용할 수 있는 레시피입니다."
        return f"{matched_text}를 활용할 수 있고, 남은 유통기한이 짧은 재료를 우선 반영한 추천입니다."

    def recommend(self, input_stock: dict[str, int], top_k: int = 5) -> list[dict]:
        input_stock = self.normalize_stock(input_stock)
        u_vector = self.make_user_vector(input_stock)

        if float(np.sum(u_vector)) == 0:
            return []

        final_results = []
        seen_recipe_ids = set()

        for _, row in self.recipe_df.iterrows():
            recipe_id = row.get("recipe_id")

            if recipe_id in seen_recipe_ids:
                continue
            seen_recipe_ids.add(recipe_id)

            recipe_ingredients = self.parse_recipe_ingredients(row)
            if not recipe_ingredients:
                continue

            v = self.make_recipe_vector(recipe_ingredients)
            if float(np.sum(v)) == 0:
                continue

            sim = cosine_similarity(
                u_vector.reshape(1, -1),
                v.reshape(1, -1)
            )[0][0]

            if sim <= 0:
                continue

            matched_ingredients = [ing for ing in recipe_ingredients if ing in input_stock]
            missing_ingredients = [ing for ing in recipe_ingredients if ing not in input_stock]

            days_left_candidates = [input_stock[ing] for ing in matched_ingredients if ing in input_stock]
            min_days_left = min(days_left_candidates) if days_left_candidates else None

            urgency_score = get_weight(min_days_left) if min_days_left is not None else 0.0
            final_score = round(float(sim) * 0.8 + float(urgency_score / 10) * 0.2, 4)

            final_results.append({
                "recipe_id": recipe_id,
                "recipe_name": row.get("recipe_name"),
                "score": final_score,
                "similarity": round(float(sim), 4),
                "urgency_score": round(float(urgency_score), 4),
                "cooking_time": row.get("cooking_time"),
                "difficulty": row.get("difficulty"),
                "days_left": min_days_left,
                "matched_ingredients": matched_ingredients,
                "missing_ingredients": missing_ingredients,
                "all_ingredients": recipe_ingredients,
                "reason": self.build_reason(
                    matched=matched_ingredients,
                    days_left_min=min_days_left,
                ),
            })

        final_results.sort(
            key=lambda x: (
                -x["score"],
                -x["similarity"],
                -len(x["matched_ingredients"]),
                len(x["missing_ingredients"]),
                x["recipe_name"] or "",
            )
        )

        return final_results[:top_k]