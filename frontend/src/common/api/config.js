/**
 * 프론트엔드 API 통신 설정 파일
 * * [IP 수정 가이드]
 * 1. .env에 정의된 EXPO_PACKAGER_HOSTNAME을 자동으로 가져 옴
 * 2. IP 수정이 필요할 경우 이 파일이 아닌 '.env' 파일의 값을 수정
 */

import Constants from 'expo-constants';

// .env에 설정된 IP를 엑스포 실행 시점에 자동으로 주입받음
const MY_CURRENT_IP = Constants.expoConfig?.hostUri?.split(':')[0] || 'localhost';

const BASE_URL = `http://${MY_CURRENT_IP}:8000`;

export const API_ENDPOINTS = {
// [공통 도메인]
  AUTH: { // [카테고리 이름]
    // LOGIN: '/api/auth/login',    // [세부 주소], 엔드포인트 추가 예시
  },
//  [냉장고 관리 도메인]
  FRIDGE: { // [카테고리 이름]
    OCR: '/api/fridge/ocr',
    SAVE_ITEMS: '/api/fridge/save-items', 
  },
//  [구독 관리 도메인]
  SUBS: { // [카테고리 이름]
    // LIST: '/api/subs/list',      // [세부 주소], 엔드포인트 추가 예시
  },
};

export default BASE_URL;