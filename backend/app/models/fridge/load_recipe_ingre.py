import os
from pathlib import Path

import pandas as pd
from sqlalchemy import create_engine, text

CSV_PATH = Path("/app/app/models/fridge/티끌최종레시피.csv")

DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "mysql+pymysql://tikkle_admin:tikkle_pass1234@db:3306/tikkle_db"
)


def clean_text(value):
    if pd.isna(value):
        return None
    value = str(value).strip()
    return value if value else None


def split_ingredients(text_value):
    text_value = clean_text(text_value)
    if not text_value:
        return []

    # 쉼표 기준 분리
    return [x.strip() for x in text_value.split(",") if x.strip()]


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
    for col in required_cols:
        if col not in df.columns:
            raise KeyError(f"CSV에 필요한 컬럼이 없습니다: {col}")

    if "sub_ingredients" not in df.columns:
        df["sub_ingredients"] = None

    if "Seasonings" not in df.columns:
        df["Seasonings"] = None

    # main_ingredients 정제
    # 1) 진짜 NaN 제거
    df = df[df["main_ingredients"].notna()]

    # 2) 문자열화 후 공백 제거
    df["main_ingredients"] = df["main_ingredients"].astype(str)

    # 3) "nan" 문자열 제거
    df = df[df["main_ingredients"].str.strip().str.lower() != "nan"]

    # 4) 빈 문자열 제거
    df = df[df["main_ingredients"].str.strip() != ""]

    df = df.reset_index(drop=True)

    print("main_ingredients 정제 후 row 수:", len(df))

    engine = create_engine(DATABASE_URL, future=True, pool_pre_ping=True)

    with engine.begin() as conn:
        # recipe_name -> recipe_id
        recipe_map = {
            recipe_name: recipe_id
            for recipe_id, recipe_name in conn.execute(text("""
                SELECT recipe_id, recipe_name
                FROM recipe
            """)).fetchall()
        }

        # Pantry 기준 ingredient_name -> ingredient_id
        # Pantry 테이블 컬럼명이 ingredient_name 기준이라고 가정
        pantry_rows = conn.execute(text("""
            SELECT ingredient_id, ingredient_name
            FROM Pantry
        """)).fetchall()

        ingredient_map = {
            ingredient_name.strip(): ingredient_id
            for ingredient_id, ingredient_name in pantry_rows
            if ingredient_name
        }

        # 중복 방지용 기존 pair 로드
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

        for _, row in df.iterrows():
            recipe_name = clean_text(row.get("recipe_name"))
            if not recipe_name:
                continue

            recipe_id = recipe_map.get(recipe_name)
            if not recipe_id:
                missing_recipe.add(recipe_name)
                continue

            main_ingredients = clean_text(row.get("main_ingredients"))
            sub_ingredients = clean_text(row.get("sub_ingredients"))
            seasonings = clean_text(row.get("Seasonings"))

            # main_ingredients는 NOT NULL 이므로 한번 더 방어
            if not main_ingredients:
                continue

            all_ingredients = []
            all_ingredients.extend(split_ingredients(main_ingredients))
            all_ingredients.extend(split_ingredients(sub_ingredients))
            all_ingredients.extend(split_ingredients(seasonings))

            # 같은 레시피 내 중복 재료 제거
            seen = set()
            unique_ingredients = []
            for ing in all_ingredients:
                if ing not in seen:
                    seen.add(ing)
                    unique_ingredients.append(ing)

            for ingredient_name in unique_ingredients:
                ingredient_id = ingredient_map.get(ingredient_name)

                if not ingredient_id:
                    missing_ingredient.add(ingredient_name)
                    continue

                # 이미 들어간 매핑은 skip
                if (recipe_id, ingredient_id) in existing_pairs:
                    continue

                rows.append({
                    "recipe_id": recipe_id,
                    "ingredient_id": ingredient_id,
                    "required_quantity": None,
                    "main_ingredients": main_ingredients,
                    "sub_ingredients": sub_ingredients,
                    "Seasonings": seasonings,
                })

        # 마지막 방어
        bad_rows = [r for r in rows if not r["main_ingredients"]]
        print("최종 적재 대상 row 수:", len(rows))
        print("main_ingredients 비어있는 row 수:", len(bad_rows))
        print("recipe 누락 수:", len(missing_recipe))
        print("ingredient 누락 수:", len(missing_ingredient))

        if missing_recipe:
            print("누락 recipe 예시 10개:", list(sorted(missing_recipe))[:10])

        if missing_ingredient:
            print("누락 ingredient 예시 20개:", list(sorted(missing_ingredient))[:20])

        rows = [r for r in rows if r["main_ingredients"]]

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



if __name__ == "__main__":
    main()