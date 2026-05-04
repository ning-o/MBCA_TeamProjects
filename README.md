# 🐣 Mechuri (메추리) : 초개인화 점심 메뉴 추천 & 식당 안내 서비스



> **"오늘 뭐 먹지?"라는 직장인과 대학생의 매일 반복되는 피로감을 기술과 데이터로 해결합니다.**

> 

> 정규 커리큘럼 외에 자발적으로 기획된 팀 프로젝트로, 단순한 앱 출시를 넘어 **'스타트업 실무 프로세스 체화'**를 목표로 진행되었습니다.



<br>



## 📌 Project Overview

* **진행 기간**: 약 1개월

* **참여 인원**: 3명 (Frontend 1, Backend 1, Data 1)

* **담당 직무**: Frontend Engineer

* **핵심 가치**: 사용자 데이터 기반의 초개인화 메뉴 추천 및 One-Stop 식당 안내 (메뉴 선정 → 식당 확인)

* **타겟 고객**: 점심 메뉴 선정에 피로감을 느끼며, 실패 없는 한 끼를 위해 논리적 근거를 원하는 20~40대 직장인/대학생



<br>



## 🛠 Tech Stack

### Frontend

<img src="https://img.shields.io/badge/React Native-61DAFB?style=for-the-badge&logo=React&logoColor=black"> <img src="https://img.shields.io/badge/Expo-000020?style=for-the-badge&logo=Expo&logoColor=white">

### Backend & DB

<img src="https://img.shields.io/badge/FastAPI-009688?style=for-the-badge&logo=FastAPI&logoColor=white"> <img src="https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=Python&logoColor=white"> <img src="https://img.shields.io/badge/SQLite-003B57?style=for-the-badge&logo=SQLite&logoColor=white">

### Collaboration

<img src="https://img.shields.io/badge/Git-F05032?style=for-the-badge&logo=Git&logoColor=white"> <img src="https://img.shields.io/badge/Github-181717?style=for-the-badge&logo=Github&logoColor=white"> <img src="https://img.shields.io/badge/Figma-F24E1E?style=for-the-badge&logo=Figma&logoColor=white"> <img src="https://img.shields.io/badge/Notion-000000?style=for-the-badge&logo=Notion&logoColor=white">



<br>



## 💡 Background & Solution



### 😰 Pain Point

1. **결과 불신**: 기존 앱의 '광고성 랭킹'이나 단순 '랜덤 룰렛'은 사용자의 취향(맵기, 예산 등)을 무시함.

2. **단절된 경험**: 메뉴를 추천받은 후, "그래서 어디로 가야 하지?"라는 2차 고민과 검색의 번거로움 발생.



### 🎯 Solution

1. **초개인화 알고리즘 (Hyper-Personalization)**: 사용자의 예산, 취향 데이터를 벡터화하여 분석. 랜덤이 아닌 취향 적합도가 가장 높은 '뾰족한' 메뉴 3가지 제안.

2. **끊김 없는 경험 (Seamless Connection)**: 추천 결과에서 '좋아요' 클릭 시, 현재 위치 기반 근처 식당 지도(Map) 및 길찾기 딥링크까지 한 번에 연결.



<br>



## 📸 Screen (핵심 화면)

<!-- 아래 주소 부분에 깃허브에 올린 사진 URL을 넣으십시오 -->

| 메인 화면 | 메뉴 추천 알고리즘 | 식당 지도 연동 |

| :---: | :---: | :---: |

| <img src="메인화면사진URL을여기에넣으세요" width="250"> | <img src="추천화면사진URL을여기에넣으세요" width="250"> | <img src="지도화면사진URL을여기에넣으세요" width="250"> |



<br>



## 👩‍💻 My Role & Contributions (Frontend)



프론트엔드 전담 개발자로서 UI/UX 구현 및 데이터 바인딩을 주도했습니다.



* **UI/UX 구현 및 개선**: Figma 기반의 모바일 앱 UI 구현 및 유저 편의성을 고려한 화면 설계.

* **디바이스 GPS 연동**: 사용자 현재 위치(위경도 좌표) 수집 및 상태 관리 구현.

* **API 데이터 바인딩**: 백엔드 RESTful API와 연동하여 사용자 인증(JWT), 메뉴 추천 결과 수신 및 화면 렌더링.

* **지도 SDK 및 딥링크 연동**: 추천 메뉴 기반 주변 식당 마커 표시 및 외부 지도 앱(카카오내비/네이버맵) 길찾기 딥링크 이식 구현.



<br>



## 🤝 Team Culture & Ground Rules



우리는 "제약이 없는 토이 프로젝트"가 아닌, **"제약이 있는 실제 회사"의 스타트업**처럼 일하는 것을 팀의 최우선 목표로 삼았습니다.



1. **Design First, Code Later**: 기획 변경 시 즉흥적인 코딩을 지양하고, 피그마(UI)와 API 명세서(Data) 문서를 먼저 업데이트 후 코딩 진행.

2. **Data-Driven Decision**: "그냥 예뻐서"가 아닌, "유저 편의성"과 "데이터 흐름"에 근거한 의사결정.

3. **Strict Protocol Compliance**: "어떻게 만들었느냐"는 각자의 자율에 맡기되, "무엇을 전달하느냐(Deliverables)"는 합의된 API 명세서와 코드 컨벤션을 엄격히 준수.

4. **Git Flow & Code Review**: `main` - `develop` - `feature` 브랜치 전략을 통해 단순 병합이 아닌 코드 리뷰와 충돌 해결 중심의 협업 진행.



<br>



## 🚀 Milestones & R&R



<details>

<summary><b>Phase 1: 인증 시스템 및 데이터 파이프라인 연동</b></summary>

<div markdown="1">



- **[FE]** SignUp, SignIn 화면 완성 및 JWT 기반 인증 로직 연동

- **[BE]** 1차 유저 스키마 확정 및 Auth API 엔드포인트 구현

- **[DA]** 실제 메뉴 원천 데이터 크롤링 및 DB 적재



</div>

</details>



<details>

<summary><b>Phase 2: 컨텍스트 기반 추천 알고리즘 고도화</b></summary>

<div markdown="1">



- **[FE]** 기기 GPS 연동 및 실시간 날씨 기반 추천 UI 노출

- **[BE]** 날씨 가중치(Score) 로직 반영 및 추천 엔진 고도화

- **[DA]** 실시간 기상 정보 API 연동 및 데이터 라벨링 정교화



</div>

</details>



<details>

<summary><b>Phase 3: 인프라 구축 및 클라우드 배포</b></summary>

<div markdown="1">



- **[FE]** API Base URL 클라우드 서버 전환 및 통합 연동 테스트

- **[BE]** AWS 인프라 셋업, DB 마이그레이션 및 CI/CD 환경 구축

- **[DA]** 로컬 수집 스크립트 서버 환경 이관 및 자동화



</div>

</details>



<details>

<summary><b>Phase 4: 공간 정보 시스템(GIS) 및 라스트마일 연동</b></summary>

<div markdown="1">



- **[FE]** Map SDK 이식 및 카카오/네이버 지도 딥링크 길찾기 연동

- **[BE]** 위경도 좌표 기반 반경 내 식당 필터링 API 구현

- **[DA]** 주변 식당 데이터 수급 (Kakao/Google Place API)



</div>

</details>



<br>



## 📝 Retrospective (회고 및 성장 포인트)



이 프로젝트는 정규 커리큘럼 외에 자발적으로 기획하여 시작된 첫 협업이었습니다. 

초기에는 각자의 개발 언어와 방식이 달라 의견 충돌이 발생했고, Git 브랜치 병합 과정에서 잦은 충돌(Conflict)을 겪으며 개발 속도가 저하되는 문제에 직면했습니다.



이를 통해 **'코드 작성 이전에 합의된 문서의 존재'**가 얼마나 중요한지 뼈저리게 깨달았습니다. 이후 API 명세서를 최우선으로 작성하고, Git Flow 브랜치 전략을 엄격하게 도입하면서 불필요한 소통 비용을 획기적으로 줄일 수 있었습니다. 결과적으로 단순한 앱 개발 경험을 넘어, **'현업의 협업 워크플로우'**와 **'문서 기반의 엔지니어링 문화'**를 실무 수준으로 경험하고 역량을 키울 수 있었던 귀중한 시간이었습니다.
