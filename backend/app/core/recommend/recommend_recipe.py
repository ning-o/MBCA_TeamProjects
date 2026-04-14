from __future__ import annotations

import os
import re
from pathlib import Path
from typing import Dict, Any, List

import joblib
import numpy as np
import pandas as pd
from sklearn.metrics.pairwise import cosine_similarity

DEFAULT_PANTRY_ITEMS = {
    "소금", "후춧가루", "간장", "설탕", "참기름", "식용유",
    "다진마늘", "마늘", "고춧가루", "식초", "된장", "고추장",
    "물", "깨", "통깨", "맛술", "올리고당"
}
def get_weight(days_left: int) -> float:
    if days_left <= 0:
        return 10.0
    if days_left <= 1:
        return 9.0
    return round(10 / (days_left + 1), 2)


class PKLRecipeRecommender:
    def __init__(self) -> None:
        current_file = Path(__file__).resolve()
        pkl_path = current_file.parents[2] / "ml" / "fridge" / "model" / "tikkle_engine.pkl"

        if not pkl_path.exists():
            raise FileNotFoundError(f"추천 pkl 파일을 찾지 못했습니다: {pkl_path}")

        data = joblib.load(pkl_path)

        print(f"[RECOMMEND] PKL loaded: {pkl_path}", flush=True)
        print(f"[RECOMMEND] engine type: {type(data)}", flush=True)

        if not isinstance(data, dict):
            raise TypeError(f"tikkle_engine.pkl이 dict가 아닙니다. type={type(data)}")

        print(f"[RECOMMEND] engine keys: {list(data.keys())}", flush=True)

        self.recipe_df: pd.DataFrame = data["recipe_df"]
        self.ingredient_to_idx: dict[str, int] = data["ingredient_to_idx"]
        self.all_ingredients: list[str] = data["all_ingredients"]

        print(f"[RECOMMEND] recipe_df columns: {list(self.recipe_df.columns)}", flush=True)
        print(f"[RECOMMEND] recipe_df size: {self.recipe_df.shape}", flush=True)

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
            "한컵", "반컵",
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

    def build_reason(
        self,
        matched: list[str],
        missing: list[str],
        days_left_min: int | None,
        usage_rate: float,
    ) -> str:
        matched_text = ", ".join(matched[:4]) if matched else "보유 재료"
        missing_text = ", ".join(missing[:3]) if missing else "추가 재료 없이"
        usage_percent = int(round(usage_rate * 100))

        if days_left_min is None:
            return f"{matched_text}를 활용할 수 있고, 현재 보유 재료 활용도가 약 {usage_percent}%인 레시피입니다."

        return (
            f"{matched_text}를 우선 활용할 수 있고, "
            f"유통기한이 임박한 재료를 반영한 추천입니다. "
            f"현재 보유 재료 활용도는 약 {usage_percent}%이며, "
            f"부족한 재료는 {missing_text}입니다."
        )

    def recommend(self, input_stock: Dict[str, int | float], top_k: int = 5) -> List[Dict[str, Any]]:
        input_stock = self.normalize_stock(input_stock)
        u_vector = self.make_user_vector(input_stock)

        if float(np.sum(u_vector)) == 0:
            return []

        final_results: List[Dict[str, Any]] = []
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

            matched_ingredients = [ing for ing in recipe_ingredients if ing in input_stock]
            missing_ingredients = [ing for ing in recipe_ingredients if ing not in input_stock]

            if not matched_ingredients:
                continue

            days_left_candidates = [input_stock[ing] for ing in matched_ingredients if ing in input_stock]
            min_days_left = min(days_left_candidates) if days_left_candidates else None

            urgency_score = get_weight(min_days_left) if min_days_left is not None else 0.0

            urgent_matched = [
                ing for ing in matched_ingredients
                if ing in input_stock and input_stock[ing] <= 5
            ]

            urgent_score = 0.0
            if urgent_matched:
                urgent_weights = [get_weight(input_stock[ing]) for ing in urgent_matched]
                urgent_score = sum(urgent_weights) / (10 * len(urgent_matched))

            main_raw = row.get("main_ingredients")
            main_ingredients = []

            if pd.notna(main_raw):
                if isinstance(main_raw, list):
                    main_items = main_raw
                else:
                    text = str(main_raw).strip()
                    parts = re.split(r"[,/\n|]", text)
                    main_items = [p.replace("'", "").replace('"', "").strip() for p in parts]

                for item in main_items:
                    norm_item = self.normalize_ingredient(item)
                    if norm_item:
                        main_ingredients.append(norm_item)

            main_urgent_bonus = 0.0
            for ing in urgent_matched:
                if ing in main_ingredients:
                    main_urgent_bonus += 0.15

            urgent_miss_penalty = 0.0
            if any(v <= 5 for v in input_stock.values()) and len(urgent_matched) == 0:
                urgent_miss_penalty = 0.25

            real_missing_ingredients = [
                ing for ing in missing_ingredients
                if ing not in DEFAULT_PANTRY_ITEMS
            ]

            missing_penalty = min(0.35, len(real_missing_ingredients) * 0.05)
            
            coverage_score = len(matched_ingredients) / len(recipe_ingredients)

            final_score = (
                float(sim) * 0.15
                + float(coverage_score) * 0.20
                + float(urgency_score) * 0.25
                + float(urgent_score) * 0.40
                + float(main_urgent_bonus)
                - float(missing_penalty)
                - float(urgent_miss_penalty)
            )

            final_score = round(max(final_score, 0.0), 4)
            
            display_match_score = (
                float(coverage_score) * 0.45
                + float(urgent_score) * 0.35
                + min(float(main_urgent_bonus), 0.20)
            )
            display_match_score = round(min(display_match_score, 0.95), 4)


            final_results.append({
                "recipe_id": recipe_id,
                "recipe_name": row.get("recipe_name"),
                "score": final_score,
                "match_score": display_match_score,
                "similarity": round(float(sim), 4),
                "urgency_score": round(float(urgency_score), 4),
                "urgent_score": round(float(urgent_score), 4),
                "cooking_time": row.get("cooking_time"),
                "difficulty": row.get("difficulty"),
                "days_left": min_days_left,
                "matched_ingredients": matched_ingredients,
                "available_ingredients": matched_ingredients,
                "missing_ingredients": missing_ingredients,
                "all_ingredients": recipe_ingredients,
                "main_ingredients": self.parse_recipe_ingredients({"main_ingredients": row.get("main_ingredients")}),
                "sub_ingredients": self.parse_recipe_ingredients({"sub_ingredients": row.get("sub_ingredients")}),
                "seasonings": self.parse_recipe_ingredients({"seasonings": row.get("Seasonings") if "Seasonings" in row else row.get("seasonings")}),
                "reason": self.build_reason(
                    matched=matched_ingredients,
                    missing=missing_ingredients,
                    days_left_min=min_days_left,
                    usage_rate=coverage_score,
                ),
                "category": row.get("category"),
            })

        final_results.sort(
            key=lambda x: (
                -x["score"],
                -x.get("urgent_score", 0),
                -x["urgency_score"],
                -x["match_score"],
                len(x["missing_ingredients"]),
                -(len(x["matched_ingredients"])),
                x["recipe_name"] or "",
            )
        )

        print("\n[DEBUG] sorted top results", flush=True)
        for r in final_results[:10]:
            print(
                r.get("recipe_name"),
                "score=", r.get("score"),
                "urgent_score=", r.get("urgent_score"),
                "urgency_score=", r.get("urgency_score"),
                "match_score=", r.get("match_score"),
                "days_left=", r.get("days_left"),
                "matched=", r.get("matched_ingredients"),
                flush=True,
            )

        return final_results[:top_k]


_recommender = PKLRecipeRecommender()


def recommend_recipes(input_stock: Dict[str, int | float], top_k: int = 5):
    result = _recommender.recommend(input_stock=input_stock, top_k=top_k)
    if result:
        print("[RECOMMEND FIRST RESULT KEYS]", list(result[0].keys()), flush=True)
    else:
        print("[RECOMMEND EMPTY RESULT]", flush=True)
    return result