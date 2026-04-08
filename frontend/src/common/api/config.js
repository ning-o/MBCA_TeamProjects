/**
 * 프론트엔드 API 통신 설정 파일
 * * [IP 수정 가이드]
 * 1. .env에 정의된 EXPO_PACKAGER_HOSTNAME을 자동으로 가져 옴
 * 2. IP 수정이 필요할 경우 이 파일이 아닌 '.env' 파일의 값을 수정
 */

import Constants from 'expo-constants';

// .env에 설정된 IP를 엑스포 실행 시점에 자동으로 주입받음
const MY_CURRENT_IP = '54.116.121.237';

const BASE_URL = `http://${MY_CURRENT_IP}:8000`;

export const API_ENDPOINTS = {
  AUTH: {
    SIGNUP: '/api/auth/signup',
    LOGIN: '/api/auth/login',
},

//  [냉장고 관리 도메인]
  FRIDGE: { // [카테고리 이름]
    GET_INVENTORY: (invenId) => `/api/fridge/inventory/${invenId}`,
    GET_DETAILS: (invenId) => `/api/fridge/${invenId}`,
    UPDATE_REFRIGERATOR: (invenId) => `/api/fridge/refrigerator/${invenId}`,
    GET_SPENDING_SUMMARY: (invenId) => `/api/fridge/spending-summary/${invenId}`,
    OCR: '/api/fridge/ocr',
    SAVE_ITEMS: '/api/fridge/save-items',
    RECOMMEND_RECIPE: '/api/fridge/recommend',
    COMPLETE_COOKING: '/api/fridge/complete-cooking',
    CREATE_REFRIGERATOR: '/api/fridge/refrigerator'
  },
//  [구독 관리 도메인]
  SUBS: {
  GET_CATEGORIES: '/api/subs/categories',
  GET_BY_CATEGORY: (category) => `/api/subs/categories/${category}`,
  GET_DETAIL: (subsId) => `/api/subs/subs/${subsId}`,
  GET_USER_SUBS: (userId) => `/api/subs/${userId}/search`,
  CREATE_MASTER_SUB: (userId, masterId) => `/api/subs/${userId}/insertSubsMaster/${masterId}`,
  CREATE_BUNDLE_SUB: (userId, bundleId) => `/api/subs/${userId}/insertSubsBundle/${bundleId}`,
  UPDATE_USER_SUB: (userId, masterId, change_subs_id) => `/api/subs/${userId}/updateSubs/${masterId}/${change_subs_id}`,  
  },
};

export default BASE_URL;