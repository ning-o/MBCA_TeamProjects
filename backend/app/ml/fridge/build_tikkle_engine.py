import joblib
import pandas as pd
from pathlib import Path


def build_tikkle_engine(
    pantry_csv_path: str,
    recipe_csv_path: str,
    save_path: str,
):
    pantry_df = pd.read_csv(pantry_csv_path)
    recipe_df = pd.read_csv(recipe_csv_path)
    

    all_ingredients = (
        pantry_df["ingredient_name"]
        .dropna()
        .astype(str)
        .str.strip()
        .unique()
        .tolist()
    )

    ingredient_to_idx = {name: i for i, name in enumerate(all_ingredients)}

    engine_metadata = {
        "all_ingredients": all_ingredients,
        "ingredient_to_idx": ingredient_to_idx,
        "recipe_df": recipe_df,
    }

    save_path = Path(save_path)
    save_path.parent.mkdir(parents=True, exist_ok=True)

    joblib.dump(engine_metadata, save_path)

    print("엔진 저장 완료")
    print("재료 수:", len(all_ingredients))
    print("레시피 수:", len(recipe_df))
    print("저장 위치:", save_path)



if __name__ == "__main__":
    current_file = Path(__file__).resolve()

    # 현재 파일: /app/app/ml/fridge/build_tikkle_engine.py
    fridge_dir = current_file.parent
    model_dir = fridge_dir / "model"

    pantry_csv_path = model_dir / "pantry.csv"
    recipe_csv_path = model_dir / "티끌최종레시피.csv"
    save_path = model_dir / "tikkle_recipe_engine.pkl"

    print("pantry_csv_path:", pantry_csv_path)
    print("recipe_csv_path:", recipe_csv_path)
    print("save_path:", save_path)

    build_tikkle_engine(
        pantry_csv_path=str(pantry_csv_path),
        recipe_csv_path=str(recipe_csv_path),
        save_path=str(save_path),
    )