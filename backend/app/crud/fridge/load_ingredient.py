import os
from pathlib import Path

import pandas as pd
from dotenv import load_dotenv
from sqlalchemy import create_engine, text

env_path = Path(__file__).resolve().parents[4] / ".env"
load_dotenv(env_path)

DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    raise ValueError("DATABASE_URL 환경변수를 찾을 수 없습니다.")

BASE_DIR = Path(__file__).resolve().parent
CSV_PATH = BASE_DIR / "pantry_end.csv"

STORAGE_MAP = {
    "냉장": 1,
    "냉동": 2,
    "실온": 3,
}


def clean_text(value):
    if pd.isna(value):
        return None
    value = str(value).strip()
    return value if value else None


def main():
    print("===== DEBUG INFO =====")
    print("CSV_PATH:", CSV_PATH)
    print("CSV exists:", CSV_PATH.exists())
    print("DATABASE_URL:", DATABASE_URL)
    print("======================")

    if not CSV_PATH.exists():
        raise FileNotFoundError(f"CSV 파일을 찾을 수 없습니다: {CSV_PATH}")

    df = pd.read_csv(CSV_PATH, encoding="utf-8-sig")
    df.columns = [str(col).strip() for col in df.columns]

    required_columns = [
        "ingredient_id",
        "category",
        "ingredient_name",
        "storage_type",
    ]
    missing_cols = [col for col in required_columns if col not in df.columns]
    if missing_cols:
        raise ValueError(f"CSV에 필요한 컬럼이 없습니다: {missing_cols}")

    df = df.copy()

    df["ingredient_id"] = pd.to_numeric(df["ingredient_id"], errors="coerce")
    df["category"] = df["category"].apply(clean_text)
    df["ingredient_name"] = df["ingredient_name"].apply(clean_text)
    df["storage_type"] = df["storage_type"].apply(clean_text)

    df["ingredient_name"] = df["ingredient_name"].str.replace(r"\s+", " ", regex=True)
    df["category"] = df["category"].str.replace(r"\s+", "", regex=True)

    # 필수값 검증
    if df["ingredient_id"].isna().any():
        bad_rows = df[df["ingredient_id"].isna()]
        print("ingredient_id 변환 실패 예시:")
        print(bad_rows.head(20))
        raise ValueError("ingredient_id에 숫자가 아닌 값이 있습니다.")

    if df["ingredient_name"].isna().any() or (df["ingredient_name"] == "").any():
        bad_rows = df[df["ingredient_name"].isna() | (df["ingredient_name"] == "")]
        print("ingredient_name 빈값 예시:")
        print(bad_rows.head(20))
        raise ValueError("ingredient_name 빈값이 있습니다.")

    if df["category"].isna().any() or (df["category"] == "").any():
        bad_rows = df[df["category"].isna() | (df["category"] == "")]
        print("category 빈값 예시:")
        print(bad_rows.head(20))
        raise ValueError("category 빈값이 있습니다.")

    df["storage_code"] = df["storage_type"].map(STORAGE_MAP)

    invalid_storage = df[df["storage_code"].isna()]
    if not invalid_storage.empty:
        print("storage_type 변환 실패 데이터:")
        print(invalid_storage[["ingredient_name", "storage_type"]].head(20))
        raise ValueError("storage_type 값 중 STORAGE_MAP에 없는 값이 있습니다.")

    df["ingredient_id"] = df["ingredient_id"].astype(int)
    df["storage_code"] = df["storage_code"].astype(int)
    df["expiry_date"] = 0

    final_columns = [
        "ingredient_id",
        "category",
        "ingredient_name",
        "storage_code",
        "expiry_date",
    ]
    df = df[final_columns].copy()

    dup_id = df["ingredient_id"].duplicated().sum()
    print(f"ingredient_id 중복 개수: {dup_id}")
    if dup_id > 0:
        print("중복 ingredient_id 예시:")
        print(df[df["ingredient_id"].duplicated(keep=False)].sort_values("ingredient_id").head(20))
        raise ValueError("ingredient_id 중복이 있습니다.")

    dup_name = df["ingredient_name"].duplicated().sum()
    print(f"ingredient_name 중복 개수: {dup_name}")
    if dup_name > 0:
        print("중복 ingredient_name 예시:")
        print(df[df["ingredient_name"].duplicated(keep=False)].sort_values("ingredient_name").head(20))
        raise ValueError("ingredient_name 중복이 있습니다.")

    print("데이터 샘플:")
    print(df.head())
    print("총 개수:", len(df))

    rows = df.to_dict(orient="records")

    engine = create_engine(DATABASE_URL, future=True, pool_pre_ping=True)

    insert_sql = text("""
        INSERT INTO pantry (
            ingredient_id,
            category,
            ingredient_name,
            storage_code,
            expiry_date
        ) VALUES (
            :ingredient_id,
            :category,
            :ingredient_name,
            :storage_code,
            :expiry_date
        )
    """)

    with engine.begin() as conn:
        table_exists = conn.execute(text("""
            SELECT COUNT(*)
            FROM information_schema.tables
            WHERE table_schema = DATABASE()
              AND table_name = 'pantry'
        """)).scalar_one()

        if table_exists == 0:
            raise RuntimeError("pantry 테이블이 없습니다.")

        conn.execute(insert_sql, rows)

    print("✅ pantry 테이블 적재 완료")


if __name__ == "__main__":
    main()