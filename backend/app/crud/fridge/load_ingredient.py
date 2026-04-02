import os
import pandas as pd
from pathlib import Path
from dotenv import load_dotenv
from sqlalchemy import create_engine, text

env_path = Path(__file__).resolve().parents[4] / ".env"
load_dotenv(env_path)

DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    raise ValueError("DATABASE_URL 환경변수를 찾을 수 없습니다.")

print("DATABASE_URL:", DATABASE_URL)

engine = create_engine(DATABASE_URL, future=True)

BASE_DIR = Path(__file__).resolve().parent
csv_path = BASE_DIR / "pantry_end.csv"

if not csv_path.exists():
    raise FileNotFoundError(f"CSV 파일을 찾을 수 없습니다: {csv_path}")

print("CSV PATH:", csv_path)

df = pd.read_csv(csv_path)

storage_map = {
    "냉장": 1,
    "냉동": 2,
    "실온": 3
}

df["storage_code"] = df["storage_type"].map(storage_map)

invalid_storage = df[df["storage_code"].isna()]
if not invalid_storage.empty:
    print("storage_type 변환 실패 데이터:")
    print(invalid_storage[["ingredient_name", "storage_type"]].head(20))
    raise ValueError("storage_type 값 중 storage_map에 없는 값이 있습니다.")

df["storage_code"] = df["storage_code"].astype(int)

df["expiry_date"] = 0

required_columns = [
    "ingredient_id",
    "category",
    "ingredient_name",
    "storage_code",
    "expiry_date"
]

missing_cols = [col for col in required_columns if col not in df.columns]
if missing_cols:
    raise ValueError(f"CSV에 필요한 컬럼이 없습니다: {missing_cols}")

df = df[required_columns].copy()

df["ingredient_id"] = df["ingredient_id"].astype(int)
df["category"] = df["category"].astype(str).str.strip()
df["ingredient_name"] = df["ingredient_name"].astype(str).str.strip()

df["ingredient_name"] = df["ingredient_name"].str.replace(r"\s+", " ", regex=True)
df["category"] = df["category"].str.replace(r"\s+", "", regex=True)

# 빈값 체크
if (df["ingredient_name"] == "").any():
    bad_rows = df[df["ingredient_name"] == ""]
    print("ingredient_name 빈값 발견:")
    print(bad_rows.head())
    raise ValueError("ingredient_name 빈값이 있습니다.")

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

insert_sql = text("""
    INSERT IGNORE INTO pantry (
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
    conn.execute(insert_sql, rows)
