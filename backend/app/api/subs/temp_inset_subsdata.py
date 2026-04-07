##################################
# 구독 테이블 데이터 집어넣기용 파일 #
###################################

# app/routers/subscription_master_csv.py
from fastapi import APIRouter, UploadFile, File, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.subs.subs_models import SubscriptionMaster
import csv
import io
import json

router = APIRouter()

@router.post("/csv")
async def upload_subscription_master_csv(
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    if not file.filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="CSV 파일만 업로드 가능")

    content = await file.read()

    try:
        decoded = content.decode("utf-8-sig")
        reader = csv.DictReader(io.StringIO(decoded))

        inserted_count = 0

        for idx, row in enumerate(reader, start=2):  # 헤더 다음 줄부터라 2
            try:
                detail_data = None
                if row.get("detail") and row["detail"].strip():
                    detail_data = json.loads(row["detail"])

                new_item = SubscriptionMaster(
                    name=row["name"].strip(),
                    logo_img=row.get("logo_img", "").strip() or None,
                    base_price = int(row["base_price"].replace(",", "").strip()),
                    category=row["category"].strip(),
                    detail=detail_data
                )

                db.add(new_item)
                inserted_count += 1

            except Exception as row_error:
                db.rollback()
                raise HTTPException(
                    status_code=400,
                    detail=f"{idx}번째 줄 에러: {str(row_error)} / row={row}"
                )

        db.commit()

        return {
            "message": "CSV 업로드 완료",
            "inserted_count": inserted_count
        }

    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=f"CSV 처리 실패: {str(e)}")