// frontend/src/domains/fridge/FridgeComponents/FridgeRefrigerator.js
import apiClient from '../../../common/api/api_client';

/**
 * 냉장고 정보 저장 (생성/수정 통합)
 * @param {string} fridgeName - 냉장고 별칭
 * @param {string|number} monthlyBudget - 월 목표 식비
 * @param {number|null} invenId - 냉장고 ID (있으면 수정, 없으면 신규 생성)
 */
export const saveRefrigeratorData = async (fridgeName, monthlyBudget, invenId = null) => {
  try {
    const payload = {
      inven_nickname: fridgeName,
      mounth_food_exp: parseInt(monthlyBudget, 10) || 0, // 데이터 타입 정수형 강제
    };

    // 인벤토리 ID 존재 여부에 따라 API 엔드포인트 및 메서드 분기
    if (invenId) {
      // 기존 냉장고 정보 업데이트 (PATCH)
      console.log(`[DEBUG] 냉장고 수정 요청 - ID: ${invenId}`);
      const url = apiClient.urls.FRIDGE.UPDATE_REFRIGERATOR(invenId); 
      return await apiClient.patch(url, payload);
    } else {
      // 신규 냉장고 생성 (POST)
      console.log('[DEBUG] 신규 냉장고 생성 요청');
      const url = apiClient.urls.FRIDGE.CREATE_REFRIGERATOR; 
      return await apiClient.post(url, payload);
    }
  } catch (error) {
    // API 에러 핸들링: 서버 응답 메시지가 있을 경우 우선 출력
    console.error('[API Error] 냉장고 저장 실패:', error.response?.data || error);
    throw error;
  }
};