# Tikkle (티끌) : AI 기반 맞춤형 지출 및 식재료 관리 서비스

> **"새어나가는 작은 지출을 막고, 버려지는 식재료를 구합니다."**
> 단순히 기록하는 가계부를 넘어, 나도 모르게 낭비되는 구독료와 냉장고 속 식재료를 AI 데이터 기반으로 스마트하게 관리하는 통합 플랫폼입니다.

## 프로젝트 개요

* **진행 기간**: 1개월
* **참여 인원**: 4명
* **담당 직무**: 팀장 (Architecture, AI Algorithm, Backend, frontend)
* **핵심 가치**: OCR을 통한 데이터 입력 자동화, AI 최적화 알고리즘 기반의 레시피 추천 및 구독 포트폴리오 제안
* **작업 방식**: 팀원 모두가 기획·설계부터 기능 구현까지 전체 사이클을 경험할 수 있도록 **도메인별 분할 작업 방식**을 지향하며 개발 진행

## 기술 스택

### 프론트엔드
<img src="https://img.shields.io/badge/React Native-61DAFB?style=for-the-badge&logo=React&logoColor=black"> <img src="https://img.shields.io/badge/Expo-000020?style=for-the-badge&logo=Expo&logoColor=white">

- 빠른 모바일 앱 크로스 플랫폼(Android/iOS) 구현과 기기 테스트 환경 구축을 위해 **React Native**와 **Expo** 선택

### 백엔드 & DB & AI
<img src="https://img.shields.io/badge/FastAPI-009688?style=for-the-badge&logo=FastAPI&logoColor=white"> <img src="https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=Python&logoColor=white"> <img src="https://img.shields.io/badge/MySQL-4479A1?style=for-the-badge&logo=MySQL&logoColor=white"> <img src="https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=Docker&logoColor=white">

- 비동기 처리 기반의 고성능 API 서버를 구축하고 식재료/구독 관리 로직을 빠르게 처리하기 위해 **FastAPI** 사용
- 사용자, 식재료, 구독 지출 데이터의 안정적인 저장을 위해 **MySQL**을 채택하였으며, 개발자 간 로컬 환경 일치화 및 배포를 위해 **Docker** 컨테이너 환경 구축
- **Google Vision API**를 활용하여 영수증 OCR 텍스트 추출 및 정제 파이프라인을 구성

### 협업 및 생산성 툴
<img src="https://img.shields.io/badge/Git-F05032?style=for-the-badge&logo=Git&logoColor=white"> <img src="https://img.shields.io/badge/Github-181717?style=for-the-badge&logo=Github&logoColor=white"> <img src="https://img.shields.io/badge/Notion-000000?style=for-the-badge&logo=Notion&logoColor=white"> <img src="https://img.shields.io/badge/Figma-F24E1E?style=for-the-badge&logo=Figma&logoColor=white"> <img src="https://img.shields.io/badge/Slack-4A154B?style=for-the-badge&logo=Slack&logoColor=white">

- **GitHub & Git-flow**: 코드 버전 관리 및 `main` - `develop` - `feature` 중심의 브랜치 전략 운영.
- **Notion & Slack**: API 명세서, 칸반 보드 진척도 관리 및 실시간 소통, GitHub 알림 연동.
- **Figma**: 유저 플로우 및 와이어프레임 설계, 개발 착수 전 UI/UX 컴포넌트 사전 합의.

<br>

## 기획 배경 및 핵심 AI 알고리즘

### 1. 냉장고 도메인 : "무엇을 먹을까?" 보다는 "어떻게하면 버리지 않을까?"에 초점

- **핵심 알고리즘: [잔반 제로 - Loss 최소화 모델]**
  - **Type**: 최적화(Optimization) 알고리즘 - 조합 최적화 및 콘텐츠 기반 필터링
  - **Goal**: 유통기한 임박 재료들의 Loss를 합산하여, 이를 최소화할 수 있는 레시피 산출
  - **Logic**: 유통기한이 임박한 ‘한 종류’의 재료가 아닌, ‘여러 종류’의 임박한 재료를 한 번에 해결할 수 있는 최적의 메뉴를 찾는 방식입니다. (ex. 내일 버려야 할 양파, 유통기한 3일 남은 두부, 너무 많은 양의 감자 ➔ 모두 소모할 수 있는 요리 산출)

- **보조 알고리즘: [식재료별 유통기한 예측 모델]**
  - **Type**: 머신러닝(ML) 알고리즘 - 지도 학습 - 분류/회귀 [랜덤 포레스트: Random Forest]
  - **Goal**: 머신러닝을 통해 해당 식재료의 평균 유통기한을 기본값으로 자동 설정하고, 사용자의 소비 패턴에 따라 동적으로 조정
  - **Logic**: 사용자가 일일이 입력하기 힘든 유통기한을 AI가 보조합니다. *"이 사람은 사과를 빨리 먹네? 다음엔 유통기한 경고를 늦게 띄워도 되겠다"*와 같이 개인화된 동적 예측을 수행합니다.


### 2. 구독 도메인 : "나와 비슷한 사람들은 얼마를 쓰고 있는가?"
> 지불 중인 비용은 낮추고, 누릴 수 있는 혜택은 극대화하여 불필요한 고정 지출 관리 및 최적의 조합을 추천합니다.

- **핵심 알고리즘: [구독 MBTI - '유사 취향' 추천 모델]**
  - **Type**: 머신러닝(ML) 알고리즘 - 비지도 학습 [군집화: K-Means Clustering]
  - **Goal**: 사용자의 구독 상태가 군집 내에서 '정상'인지 '과다 지출'인지 인지시키고 최적의 포트폴리오 제안
  - **Logic**: K-Means Clustering을 통해 유저를 특정 페르소나(예: OTT 헤비 유저, 알뜰 쇼퍼 등)로 분류하고, 해당 그룹 내 만족도가 가장 높은 '표준 조합'을 추출합니다.
  - **서비스 예시**: *"OO님과 같은 [30대 직장인]은 보통 쇼핑 멤버십을 1개만 유지합니다. 현재 [쿠팡 와우]와 [네이버 플러스]를 동시 이용 중이신데, [30대 직장인]의 85%는 쿠팡 하나로 통합하여 월 4,900원을 아끼고 있습니다!"*

- **보조 알고리즘: [가성비 필터 - '지출 최적화' 모델]**
  - **Type**: 최적화(Optimization) 알고리즘 - 조합 최적화 [최단 경로: Shortest Path]
  - **Goal**: 동일한 서비스 수준을 유지하면서 결합 할인 및 중복 제거를 통해 실질 지출액 최소화
  - **Logic**: 구독 상품 간의 기능적 포함 관계(Knowledge Base)를 분석하고, 모든 결합 상품의 경우의 수를 계산하여 최단/최저가 경로(Shortest Path)를 산출합니다.
  - **서비스 예시**:
    - **중복 관리**: *"유튜브 프리미엄에는 유튜브 뮤직이 포함되어 있습니다. 별도 결제 중인 [멜론]을 해지하고 월 8,000원을 즉시 절약하세요!"*
    - **결합 상품 추천**: *"넷플릭스와 유튜브를 각각 따로 결제하는 것보다 [유독/T우주 번들]을 이용하는 것이 동일한 혜택에 월 5,200원 더 저렴합니다!"*
   
<br>

## 나의 역할 (팀장 & 냉장고 도메인 기능 구현)

프로젝트 총괄 리더로서 전체 시스템 아키텍처와 공통 인터페이스 설계 및 핵심 기능 아이디어링을 주도했으며, 실제 기능 구현에서는 병렬 개발 효율을 위해 '냉장고 도메인'의 풀스택(프론트엔드/백엔드/AI) 개발을 전담했습니다.

* **[프로젝트 총괄 및 아키텍처 설계]**: 팀원 간 작업 충돌을 방지하기 위해 공통 DB(유저 등) 모델링과 API 통신 규칙을 선행 구축했습니다. 두 도메인(냉장고, 구독)의 핵심 AI 기능 아이디어링을 주도하고 전체적인 워크플로우 및 일정을 관리했습니다.
* **[냉장고 도메인 풀스택 구현]**: 냉장고 파트의 구체적인 DB 설계부터 React Native 기반 프론트엔드 UI/UX, FastAPI 백엔드 연동까지 End-to-End로 직접 개발했습니다. *(※ 구독 도메인의 상세 화면 및 로직 구현은 해당 파트 담당자에게 위임하여 독립성을 보장했습니다.)*
* **[냉장고 파트 AI 및 데이터 파이프라인 구축]**: OCR 텍스트 추출 연동 및 `bs4`를 활용한 레시피 데이터 수집·정규화를 수행했습니다. 또한, 잔반 제로 모델을 보조하기 위해 필요한 유통기한 자동 예측 모델(Random Forest)을 직접 설계하고 적용했습니다.

## 핵심 구현 내용

1. **OCR + ML 연동 기반의 유통기한 자동 예측 파이프라인**: 영수증에는 '품목'만 존재하고 '유통기한'이 없다는 현실적인 한계를 돌파하기 위해, 추출된 텍스트 데이터를 머신러닝 유통기한 예측 모델과 결합했습니다. 영수증 사진 촬영 시 품목이 식별되면, 해당 카테고리의 부패 주기와 유저의 과거 소비 패턴을 기반으로 예상 유통기한을 자동 계산하여 DB에 삽입하는 비즈니스 로직을 완성했습니다.
2. **데이터 정규화**: OCR API를 통해 비정형으로 추출된 텍스트 데이터를 정제 및 매핑하여, 구독/소액 지출 통계 시스템과 냉장고 식재료 관리 데이터베이스에 규격화된 형태로 자동 저장되도록 구현했습니다.
3. **API 아키텍처 및 배포 환경 최적화**: 4인의 팀원이 각각 다른 도메인을 병렬로 개발할 때 발생할 수 있는 충돌을 방지하기 위해 확장성 있는 라우터 패턴을 설계하고, Docker를 통해 로컬과 동일한 일관된 배포 환경을 구축했습니다.
