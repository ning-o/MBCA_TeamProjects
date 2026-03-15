import { Alert } from 'react-native'; 
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import BASE_URL, { API_ENDPOINTS } from './config';

const apiClient = axios.create({
  baseURL: BASE_URL, // 모든 요청 앞에 자동으로 붙을 기본 주소 - config.js 에서 수정, 추가
  timeout: 10000,    // 응답 대기 시간 제한, 현재 10초 설정
  headers: {         // 서버 통신 규격, json 주고 받겠다는 설정
    'Content-Type': 'application/json',
  },
});

apiClient.urls = API_ENDPOINTS;

/**
 * [Request 단계: 인증 정보 확인]
 * - 이 로직은 추후 'JWT 토큰' 방식의 정식 로그인을 도입할 때를 대비한 사전 설계임.
 * - 로그인 성공 후 저장소에 토큰이 생기면 자동으로 헤더에 부착하여 서버로 보냄.
 * - 현재와 같은 '비로그인'이나 '토큰 없는 약식 로그인' 상태에서도 에러 없이 정상 작동하도록 예외 처리 되어 있음.
 */
apiClient.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('userToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

/**
 * [Response 단계: 응답 구조 최적화 및 공통 에러 처리]
 */
apiClient.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error) => {
    // 통신 오류 발생 시 공통 팝업 처리
    let errorMessage = '서버와 통신 중 문제가 발생했습니다.';

    if (error.response) {
      // 서버가 응답은 줬지만 에러인 경우 (404, 500 등)
      const status = error.response.status;
      if (status === 401) errorMessage = '로그인이 만료되었습니다. 다시 로그인해주세요.';
      else if (status >= 500) errorMessage = '서버 점검 중입니다. 잠시 후 다시 시도해주세요.';
    } else if (error.request) {
      // 서버에서 응답이 아예 없는 경우 (와이파이 끊김 등)
      errorMessage = '네트워크 연결 상태를 확인해주세요.';
    }

    // 화면에 팝업 띄우기
    Alert.alert('통신 오류', errorMessage);

    return Promise.reject(error);
  }
);

export default apiClient;