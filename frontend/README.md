# [Frontend]

이 파일은 **프론트엔드(React Native)** 개발 가이드입니다.

## 목차

1. [기술 스택] - 버전 확인 등
2. [API 통신 규약]
3. [모바일 실시간 테스트]
4. [환경 설정 (IP 주소)]
5. [개발 시작]

---


## 기술 스택

- **Framework**: Expo SDK 54 (React Native)
- **Language**: JavaScript (ES6+)
- **HTTP Client**: Axios (서버 통신용)
- **Environment**: dotenv-cli, cross-env (환경 변수 관리)
- **Storage**: @react-native-async-storage/async-storage (로컬 데이터 및 토큰 저장용)
- **Navigation**: React Navigation (화면 전환용)


## API 통신 규약
공통 엔진(`apiClient`)을 사용하여 통신함.

1. **위치**: `src/common/api/`
2. **주소 등록(관리)**: 새로운 기능이나 주소 변경은 오직 `config.js`에서만 하면 됨.
3. **기능 실행(호출)**: 화면에서 서버와 통신할 때는 무조건 `apiClient`만 불러서 쓰면 됨.
4. **규칙**: 개별적인 `axios` 생성 금지, 모든 통신은 `apiClient.urls` 참조

```javascript [호출 예시] -----------------------
import apiClient from '../../common/api/api_client';

// 1. 함수 이름은 [내가 정하는 이름]임.
const getMyFridgeList = async () => {
  try {
    /** * 2. 아래 주소 이름들은 [주소록(config.js)에 있는 이름]을 그대로 써야 함.
     * * apiClient.urls.FRIDGE.LIST 에서
     * - FRIDGE : config.js에 등록된 큰 카테고리 이름
     * - LIST   : 그 안에 등록된 세부 주소 이름
     */
    const data = await apiClient.get(apiClient.urls.FRIDGE.LIST);
    
    // 3. 변수 'data'는 서버가 준 결과를 담기 위해 [내가 정한 이름]임.
    console.log("결과 출력:", data);
    
  } catch (error) {
    console.error("통신 실패");
  }
};
----------------------------------------------------
```

## 환경 설정 (IP 주소)
장소(집, 학원 등)를 옮길 때마다 IP를 수정해야 함.

1. **위치**: 최상위 폴더(TIKKLE_APP)의 `.env` 파일
2. **수정 방법**: `EXPO_PACKAGER_HOSTNAME` 항목에 본인의 현재 IPv4 주소를 입력.
   - 예: `EXPO_PACKAGER_HOSTNAME=192.168.XXX.XXX`
3. **규칙**: 
   - `src/common/api/config.js` 파일은 수정 안해도 됨. (.env 값을 불러다 씀)
   - IP가 바뀌면 오직 `.env` 파일만 수정하면 됨.



## 모바일 실시간 테스트

**Expo Go** 앱을 통해 실제 스마트폰에서 즉시 구동 확인이 가능하게 설계함. 

1. **앱 설치**: 본인의 스마트폰(iOS/Android) 스토어에서 'Expo Go'를 검색하여 설치.
2. **접속 방법**: 
   - PC 터미널에서 `npm start` 실행
   - 화면에 뜨는 QR 코드를 스마트폰 카메라로 스캔
3. **주의사항**: 반드시 PC와 스마트폰이 반드시 같은 와이파이에 연결되어 있어야 함.


## 개발 시작
<!-- bash: "터미널에 입력하는 명령어" 라는 뜻 -->
<!-- 초기: 모바일 화면에 Open up App.js to start working on your app! 뜨면 정상 -->
```bash
cd frontend
npm install
npm start
```
