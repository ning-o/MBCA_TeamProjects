import os
from pathlib import Path

import pandas as pd
from sqlalchemy import create_engine, text

CSV_PATH = Path("/app/app/crud/fridge/티끌최종레시피.csv")

DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "mysql+pymysql://tikkle_admin:tikkle_pass1234@db:3306/tikkle_db"
)


def clean_text(value):
    if pd.isna(value):
        return None
    value = str(value).strip()
    return value if value else None


def normalize_name(value):
    value = clean_text(value)
    if not value:
        return None
    return " ".join(value.split())


def split_ingredients(text_value):
    text_value = clean_text(text_value)
    if not text_value:
        return []

    items = [x.strip() for x in text_value.split(",") if x.strip()]
    return items


def main():
    print("===== DEBUG INFO =====")
    print("CSV_PATH:", CSV_PATH)
    print("CSV exists:", CSV_PATH.exists())
    print("DATABASE_URL:", DATABASE_URL)
    print("======================")

    if not CSV_PATH.exists():
        raise FileNotFoundError(f"CSV 파일이 없습니다: {CSV_PATH}")

    df = pd.read_csv(CSV_PATH, encoding="utf-8-sig")
    df.columns = [str(col).strip() for col in df.columns]

    print("원본 컬럼:", df.columns.tolist())
    print("원본 row 수:", len(df))

    required_cols = ["recipe_name", "main_ingredients"]
    missing_cols = [col for col in required_cols if col not in df.columns]
    if missing_cols:
        raise KeyError(f"CSV에 필요한 컬럼이 없습니다: {missing_cols}")

    if "sub_ingredients" not in df.columns:
        df["sub_ingredients"] = None

    if "Seasonings" not in df.columns:
        df["Seasonings"] = None

    # main_ingredients 정제
    df = df[df["main_ingredients"].notna()].copy()
    df["main_ingredients"] = df["main_ingredients"].astype(str)
    df = df[df["main_ingredients"].str.strip().str.lower() != "nan"]
    df = df[df["main_ingredients"].str.strip() != ""]
    df = df.reset_index(drop=True)

    print("main_ingredients 정제 후 row 수:", len(df))

    engine = create_engine(DATABASE_URL, future=True, pool_pre_ping=True)

    with engine.begin() as conn:
        recipe_exists = conn.execute(text("""
            SELECT COUNT(*)
            FROM information_schema.tables
            WHERE table_schema = DATABASE()
              AND table_name = 'recipe'
        """)).scalar_one()

        pantry_exists = conn.execute(text("""
            SELECT COUNT(*)
            FROM information_schema.tables
            WHERE table_schema = DATABASE()
              AND table_name = 'pantry'
        """)).scalar_one()

        recipe_ing_exists = conn.execute(text("""
            SELECT COUNT(*)
            FROM information_schema.tables
            WHERE table_schema = DATABASE()
              AND table_name = 'recipe_ingredients'
        """)).scalar_one()

        if recipe_exists == 0:
            raise RuntimeError("recipe 테이블이 없습니다.")
        if pantry_exists == 0:
            raise RuntimeError("pantry 테이블이 없습니다.")
        if recipe_ing_exists == 0:
            raise RuntimeError("recipe_ingredients 테이블이 없습니다.")

        recipe_rows = conn.execute(text("""
            SELECT recipe_id, recipe_name
            FROM recipe
        """)).fetchall()

        recipe_map = {}
        for recipe_id, recipe_name in recipe_rows:
            name = normalize_name(recipe_name)
            if name and name not in recipe_map:
                recipe_map[name] = recipe_id

        pantry_rows = conn.execute(text("""
            SELECT ingredient_id, ingredient_name
            FROM pantry
        """)).fetchall()

        ingredient_map = {}
        for ingredient_id, ingredient_name in pantry_rows:
            name = normalize_name(ingredient_name)
            if name and name not in ingredient_map:
                ingredient_map[name] = ingredient_id

        existing_pairs = {
            (recipe_id, ingredient_id)
            for recipe_id, ingredient_id in conn.execute(text("""
                SELECT recipe_id, ingredient_id
                FROM recipe_ingredients
            """)).fetchall()
        }

        rows = []
        missing_recipe = set()
        missing_ingredient = set()
        pending_pairs = set()

        for _, row in df.iterrows():
            recipe_name = normalize_name(row.get("recipe_name"))
            if not recipe_name:
                continue

            recipe_id = recipe_map.get(recipe_name)
            if not recipe_id:
                missing_recipe.add(recipe_name)
                continue

            main_ingredients = clean_text(row.get("main_ingredients"))
            sub_ingredients = clean_text(row.get("sub_ingredients"))
            seasonings = clean_text(row.get("Seasonings"))

            if not main_ingredients:
                continue

            all_ingredients = []
            all_ingredients.extend(split_ingredients(main_ingredients))
            all_ingredients.extend(split_ingredients(sub_ingredients))
            all_ingredients.extend(split_ingredients(seasonings))

            seen_names = set()
            unique_ingredients = []
            for ing in all_ingredients:
                normalized_ing = normalize_name(ing)
                if not normalized_ing:
                    continue
                if normalized_ing in seen_names:
                    continue
                seen_names.add(normalized_ing)
                unique_ingredients.append(normalized_ing)

            for ingredient_name in unique_ingredients:
                ingredient_id = ingredient_map.get(ingredient_name)

                if not ingredient_id:
                    missing_ingredient.add(ingredient_name)
                    continue

                pair = (recipe_id, ingredient_id)
                if pair in existing_pairs or pair in pending_pairs:
                    continue

                rows.append({
                    "recipe_id": recipe_id,
                    "ingredient_id": ingredient_id,
                    "required_quantity": None,
                    "main_ingredients": main_ingredients,
                    "sub_ingredients": sub_ingredients,
                    "Seasonings": seasonings,
                })
                pending_pairs.add(pair)

        print("최종 적재 대상 row 수:", len(rows))
        print("recipe 누락 수:", len(missing_recipe))
        print("ingredient 누락 수:", len(missing_ingredient))

        if missing_recipe:
            print("누락 recipe 예시 10개:", sorted(missing_recipe)[:10])

        if missing_ingredient:
            print("누락 ingredient 예시 20개:", sorted(missing_ingredient)[:20])

        if not rows:
            print("적재할 데이터가 없습니다.")
            return

        insert_sql = text("""
            INSERT INTO recipe_ingredients (
                recipe_id,
                ingredient_id,
                required_quantity,
                main_ingredients,
                sub_ingredients,
                Seasonings
            ) VALUES (
                :recipe_id,
                :ingredient_id,
                :required_quantity,
                :main_ingredients,
                :sub_ingredients,
                :Seasonings
            )
        """)

        conn.execute(insert_sql, rows)

    print("✅ recipe_ingredients 테이블 적재 완료")


if __name__ == "__main__":
    main()