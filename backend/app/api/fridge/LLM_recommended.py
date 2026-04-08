import json
import os
from datetime import datetime
from zoneinfo import ZoneInfo

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from openai import OpenAI

router = APIRouter()

api_key = os.getenv("OPENAI_API_KEY")
if not api_key:
    raise ValueError("OPENAI_API_KEY가 설정되지 않았습니다.")

client = OpenAI(api_key=api_key)


class RecommendRequest(BaseModel):
    ingredients: list[str] = []
    top_k: int = 3


def get_season(month: int) -> str:
    if month in [3, 4, 5]:
        return "봄"
    if month in [6, 7, 8]:
        return "여름"
    if month in [9, 10, 11]:
        return "가을"
    return "겨울"


def get_seasonal_hint(month: int) -> list[str]:
    seasonal_map = {
        1: [
            "무", "배추", "대파", "시금치", "우엉", "연근",
            "굴", "꼬막", "명태", "방어", "유자", "한라봉"
        ],
        2: [
            "시금치", "냉이", "달래", "우엉", "연근", "봄동",
            "굴", "꼬막", "도다리", "한라봉", "딸기"
        ],
        3: [
            "냉이", "달래", "쑥", "미나리", "봄동", "쪽파",
            "주꾸미", "도다리", "바지락", "딸기", "한라봉"
        ],
        4: [
            "냉이", "달래", "미나리", "두릅", "취나물", "쑥", "아스파라거스",
            "주꾸미", "바지락", "꽃게", "참나물", "열무"
        ],
        5: [
            "오이", "애호박", "상추", "부추", "열무", "취나물",
            "아스파라거스", "매실", "체리", "전복", "멍게", "참다랑어"
        ],
        6: [
            "감자", "오이", "애호박", "가지", "토마토", "옥수수",
            "참외", "복분자", "장어", "전복", "오징어", "복숭아"
        ],
        7: [
            "옥수수", "토마토", "가지", "오이", "애호박", "부추",
            "복숭아", "수박", "자두", "민어", "장어", "전복"
        ],
        8: [
            "옥수수", "토마토", "가지", "고구마순", "깻잎", "오이",
            "포도", "복숭아", "자두", "전복", "갈치", "고등어"
        ],
        9: [
            "버섯", "고구마", "무", "배", "사과", "단호박",
            "꽁치", "전어", "갈치", "꽃게", "대하", "송이버섯"
        ],
        10: [
            "무", "배추", "버섯", "단호박", "연근", "고구마",
            "사과", "배", "전어", "꽃게", "대하", "고등어"
        ],
        11: [
            "무", "배추", "시금치", "대파", "봄동", "연근",
            "굴", "과메기", "꼬막", "고등어", "유자", "귤"
        ],
        12: [
            "무", "배추", "대파", "시금치", "우엉", "연근",
            "굴", "방어", "꼬막", "명태", "유자", "귤"
        ],
    }
    return seasonal_map.get(month, [])


SYSTEM_PROMPT = """
넌 제철식품으로 한끼에 먹을만한 음식을 추천해주는 제철요리 전문가야.
항상 현재 날짜와 계절감을 반영해서 추천하고,
한국에서 구하기 어렵지 않은 재료 기준으로 현실적으로 만들 수 있는 메뉴만 제안해.

응답은 반드시 top3 추천만 반환하고,
각 추천에는 메뉴명, 추천이유, 제철포인트, 필요한 핵심재료, 3줄 이하의 간단 조리설명만 포함해.
너무 장황하게 쓰지 마.

중요 규칙:
- 제철 식재료를 적극 반영해라.
- 사용자가 구하기 어려울 수 있는 흔치않은 식재료가 들어가면,
  반드시 "OOO(없으면 XXX로 대체 가능)" 형태처럼 대체재를 함께 제시해라.
- 너무 전문 식재료나 고급 식재료만 쓰지 말고,
  대형마트나 동네 마트에서 구하기 쉬운 재료를 우선 추천해라.
- 한 끼 식사로 현실적으로 만들 수 있는 메뉴를 우선 추천해라.
- 모든 문자열 값에는 큰따옴표(")를 직접 넣지 말고, 줄바꿈 없이 한 줄로만 작성해라.
"""


@router.post("/recommend/seasonal")
def recommend_seasonal_food(req: RecommendRequest):
    try:
        now = datetime.now(ZoneInfo("Asia/Seoul"))
        season = get_season(now.month)
        seasonal_hint = get_seasonal_hint(now.month)
        ingredients_text = ", ".join(req.ingredients) if req.ingredients else "없음"

        user_input = f"""
현재 한국 시각: {now.isoformat()}
현재 계절: {season}
이번 달 제철 후보: {", ".join(seasonal_hint)}
사용자가 가진 재료: {ingredients_text}

조건:
- top {req.top_k}만 추천
- 한 끼 식사로 적당한 메뉴
- 너무 복잡한 요리 제외
- 결과는 한국어로 반환
"""

        response = client.responses.create(
            model="gpt-4.1-mini",
            instructions=SYSTEM_PROMPT,
            input=user_input,
            temperature=0.5,
            max_output_tokens=700,
            text={
            "format": {
                "type": "json_schema",
                "name": "seasonal_recipe_top3",
                "schema": {
                    "type": "object",
                    "properties": {
                        "recommended_at": {"type": "string"},
                        "season_context": {"type": "string"},
                        "top3": {
                            "type": "array",
                            "items": {
                                "type": "object",
                                "properties": {
                                    "rank": {"type": "integer"},
                                    "menu_name": {"type": "string"},
                                    "reason": {"type": "string"},
                                    "seasonal_point": {"type": "string"},
                                    "main_ingredients": {
                                        "type": "array",
                                        "items": {"type": "string"}
                                    },
                                    "substitute_note": {"type": "string"},
                                    "quick_recipe": {"type": "string"}
                                },
                                "required": [
                                    "rank",
                                    "menu_name",
                                    "reason",
                                    "seasonal_point",
                                    "main_ingredients",
                                    "substitute_note",
                                    "quick_recipe"
                                ],
                                "additionalProperties": False
                            }
                        }
                    },
                    "required": ["recommended_at", "season_context", "top3"],
                    "additionalProperties": False
                },
                "strict": True
            }
        }
        )

        try:
            raw_text = response.output_text
            print("[LLM RAW OUTPUT]", raw_text)
            return json.loads(raw_text)
        except Exception as parse_error:
            print("[LLM JSON PARSE ERROR]", str(parse_error))
            print("[LLM RAW OUTPUT FAILED]", response.output_text)
            raise HTTPException(
                status_code=500,
                detail=f"모델 응답 JSON 파싱 실패: {str(parse_error)}"
            )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"추천 생성 실패: {str(e)}")