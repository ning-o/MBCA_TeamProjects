import os
from pathlib import Path

import pandas as pd
from sqlalchemy import create_engine, text


BASE_DIR = Path(__file__).resolve().parent
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


def normalize_int(value, default=0):
    if pd.isna(value):
        return default
    try:
        return int(float(value))
    except Exception:
        return default


def build_rows(df):
    rows = []

    for _, row in df.iterrows():
        recipe_name = clean_text(row.get("recipe_name"))
        if not recipe_name:
            continue

        difficulty = normalize_int(row.get("difficulty"), 1)
        cooking_time = normalize_int(row.get("cooking_time"), 0)
        category = clean_text(row.get("category"))

        rows.append({
            "recipe_name": recipe_name,
            "difficulty": difficulty,
            "cooking_time": cooking_time,
            "category": category,
        })

    return rows


def deduplicate_rows(rows):
    seen = set()
    unique_rows = []

    for row in rows:
        key = (
            row["recipe_name"],
            row["difficulty"],
            row["cooking_time"],
            row["category"],
        )
        if key in seen:
            continue
        seen.add(key)
        unique_rows.append(row)

    return unique_rows


def main():
    print("===== DEBUG INFO =====")
    print("BASE_DIR:", BASE_DIR)
    print("CSV_PATH:", CSV_PATH)
    print("CSV exists:", CSV_PATH.exists())
    print("DATABASE_URL:", DATABASE_URL)
    print("======================")

    if not CSV_PATH.exists():
        raise FileNotFoundError(f"CSV 파일이 없습니다: {CSV_PATH}")

    df = pd.read_csv(CSV_PATH, encoding="utf-8-sig")
    df.columns = [str(col).strip() for col in df.columns]

    print("컬럼 목록:", df.columns.tolist())
    print("원본 row 수:", len(df))

    required_cols = ["recipe_name", "difficulty", "cooking_time"]
    missing_cols = [col for col in required_cols if col not in df.columns]
    if missing_cols:
        raise KeyError(f"CSV에 필요한 컬럼이 없습니다: {missing_cols}")

    rows = build_rows(df)
    rows = deduplicate_rows(rows)

    print("적재 대상 row 수:", len(rows))

    if not rows:
        print("적재할 데이터가 없습니다.")
        return

    engine = create_engine(DATABASE_URL, future=True, pool_pre_ping=True)

    insert_sql = text("""
        INSERT INTO recipe (
            recipe_name,
            difficulty,
            cooking_time,
            category
        ) VALUES (
            :recipe_name,
            :difficulty,
            :cooking_time,
            :category
        )
    """)

    with engine.begin() as conn:
        table_exists = conn.execute(text("""
            SELECT COUNT(*)
            FROM information_schema.tables
            WHERE table_schema = DATABASE()
              AND table_name = 'recipe'
        """)).scalar_one()

        if table_exists == 0:
            raise RuntimeError("recipe 테이블이 없습니다.")

        conn.execute(insert_sql, rows)

    print("✅ recipe 테이블 적재 완료")


if __name__ == "__main__":
    main()