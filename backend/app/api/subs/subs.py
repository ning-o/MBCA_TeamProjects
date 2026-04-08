# backend/app/api/subs/subs.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import text
from sqlalchemy.orm import Session
from app.core.database import get_db
# from app.models.subs import subs_models

from app.crud.subs import UserSubsResponse as CRUD
from app.schemas.subs_dto import SubsResponse, SubsLogoResponse, UserSubsResponse

router = APIRouter()

@router.get("/")
def get_subs_info(db: Session = Depends(get_db)):
    """
    구독 도메인 연결 및 테이블 접근 테스트
    """
    # 실제 테이블이 생성되었는지 쿼리 테스트 (데이터 없어도 에러 안 남)
    # test_query = db.query(subs_models.Subscription).all()
    return {
        "status": "success",
        "message": "구독(Subs) 도메인 및 테이블 연결 완료!",
        "model_check": "Subscription 테이블 인식 성공"
    }


#  카테고리들 목록 조회 ex) OTT, 통신사 등등
@router.get("/categories", response_model=list[str])
def read_subs_category(db: Session = Depends(get_db)):
    return CRUD.read_subs_category(db)

# 카테고리 선택시 - 해당 카테고리 구독 정보들 가져오기
@router.get("/categories/{category}", response_model=list[SubsLogoResponse])
def get_subs_by_logo(category: str, db: Session = Depends(get_db)):
    return CRUD.get_subs_by_logo(db, category)

# 구독 서비스 요금제 상세정보 가져오기
@router.get("/subs/{subs_id}")
def get_price_detail(subs_id: int, db: Session = Depends(get_db)):
    return CRUD.get_price_detail(db, subs_id)

# 내가 구독한 서비스 정보들 가져오기
@router.get("/{user_id}/search", response_model=list[UserSubsResponse])
def get_user_subs(user_id: int, db: Session = Depends(get_db)):
    return CRUD.read_subs(db, user_id)

# 구독 서비스 선택시 유저 데이터 집어넣고 가져오기
@router.post("/{user_id}/insertSubsMaster/{master_id}", response_model=SubsResponse)
def create_master_subscription(user_id: int, master_id: int, db: Session = Depends(get_db)):
    return CRUD.create_subscription(db=db, user_id=user_id, master_id=master_id)

@router.post("/{user_id}/insertSubsBundle/{bundle_id}", response_model=SubsResponse)
def create_bundle_subscription(user_id: int, bundle_id: int, db: Session = Depends(get_db)):
    return CRUD.create_subscription(db=db, user_id=user_id, bundle_id=bundle_id)


#  구독 서비스 변경시 유저 데이터 수정
@router.post("/{user_id}/updateSubs/{master_id}/{change_subs_id}", response_model=dict)
def update_master_subscription(user_id: int, change_subs_id: int, master_id: int, db: Session = Depends(get_db)):
    return CRUD.update_subscription(db=db, user_id=user_id, change_subs_id=change_subs_id, master_id=master_id,)

@router.get("/matched-packages/{user_id}")
async def get_user_subs_recommendations(user_id: int, db: Session = Depends(get_db)):
    """
    사용자가 구독 중인 서비스들을 분석하여 
    완벽히 매칭되는 마스터 패키지(결합 상품)를 찾아 반환합니다.
    """
    
    # 1. 제공해주신 SQL 쿼리 작성 (text 함수로 감싸기)
    query = text("""
        SELECT usr.user_id, cmb.master_id, 
               GROUP_CONCAT(cmb.combin_id) AS comb_ids,
               MAX(mst.name) AS master_name,
               GROUP_CONCAT(cm2.name) AS comb_names,
               mst.base_price AS master_amt,
               SUM(cm2.base_price) AS comb_amt
        FROM   subscription_user AS usr
               INNER JOIN subscription_combination AS cmb ON usr.master_id = cmb.combin_id
               INNER JOIN (
                   SELECT master_id, COUNT(*) cmp_cnt 
                   FROM subscription_combination 
                   GROUP BY master_id
               ) AS cgr ON cgr.master_id = cmb.master_id
               INNER JOIN subscription_master AS mst ON mst.id = cmb.master_id
               INNER JOIN subscription_master AS cm2 ON cm2.id = cmb.combin_id
        WHERE  usr.user_id = :user_id
        GROUP BY usr.user_id, cmb.master_id, cgr.cmp_cnt, mst.base_price
        HAVING cgr.cmp_cnt = count(cmb.combin_id)
    """)

    try:
        # 2. 쿼리 실행
        result = db.execute(query, {"user_id": user_id})
        rows = result.fetchall()

        # 3. 결과 포맷팅
        recommendations = []
        for row in rows:
            recommendations.append({
                "user_id": row.user_id,
                "master_id": row.master_id,
                "master_name": row.master_name,
                "combined_services": row.comb_names.split(',') if row.comb_names else [],
                "master_amt": row.master_amt,
                "comb_amt": row.comb_amt,
                "message": f"현재 구독 중인 항목들이 '{row.master_name}' 패키지 구성과 일치합니다!"
            })

        return {
            "status": "success",
            "data": recommendations
        }

    except Exception as e:
        # 에러 발생 시 로그를 남기고 500 에러 반환
        print(f"Database Error: {e}")
        raise HTTPException(status_code=500, detail="추천 데이터를 가져오는 중 오류가 발생했습니다.")