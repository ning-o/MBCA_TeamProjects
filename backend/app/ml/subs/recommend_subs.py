import joblib
from pathlib import Path
from sklearn.cluster import KMeans
from sklearn.preprocessing import StandardScaler
from pydantic import BaseModel
import pandas as pd

BASE_DIR = Path(__file__).resolve().parent

kmeans = joblib.load(BASE_DIR / "model" / "kmeans.pkl")
scaler = joblib.load(BASE_DIR / "model" / "scaler.pkl")
cluster_mean = joblib.load(BASE_DIR / "model" / "cluster_mean.pkl")

class RecommendRequest(BaseModel):
    나이: int
    OTT_count: int
    OTT_price: int
    통신사_price: int
    배달_count: int
    배달_price: int
    쇼핑_count: int
    쇼핑_price: int
    음악_count: int
    음악_price: int
    자기계발_count: int
    자기계발_price: int

def SubsRecommend(payload: RecommendRequest):
    columns = [
        "나이",
        "OTT_count", "OTT_price",
        "통신사_price",
        "배달_count", "배달_price",
        "쇼핑_count", "쇼핑_price",
        "음악_count", "음악_price",
        "자기계발_count", "자기계발_price"
    ]

    new_data = payload.model_dump()
    df_new = pd.DataFrame([new_data])[columns]

    # 스케일링 + 클러스터 예측
    X_scaled = scaler.transform(df_new)
    cluster = int(kmeans.predict(X_scaled)[0])

    # 해당 클러스터 평균
    target_mean = cluster_mean.loc[cluster]

    count_cols = [
        "OTT_count",
        "배달_count",
        "쇼핑_count",
        "음악_count",
        "자기계발_count"
    ]

    result = {}

    for col in count_cols:
        category = col.replace("_count", "")
        price_col = f"{category}_price"

        if new_data[col] > target_mean[col] :
            meanprice = target_mean[price_col]
            categoryprice = new_data[price_col]

            if (categoryprice - meanprice) > 10000:
                result[category] = {
                    "price_diff": round(categoryprice - meanprice, 2),
                    "count_diff": round(new_data[col] - target_mean[col] , 1),
                }    

    return {        
        "recommendations": result
    }