// frontend/src/domains/fridge/FridgeComponents/FridgeRefrigerator.js
import apiClient from '../../../common/api/api_client';

/**
 * - 냉장고 생성 및 예산 설정 담당.
 */
export const saveRefrigeratorData = async (fridgeName, monthlyBudget) => {
  try {
    const payload = {
      inven_nickname: fridgeName,
      mounth_food_exp: parseInt(monthlyBudget),
    };

    // api_client가 헤더에 토큰을 자동으로 붙여서 사용자를 식별하게 함.
    const response = await apiClient.post(
      apiClient.urls.FRIDGE.CREATE_REFRIGERATOR, 
      payload
    );

    return response;
  } catch (error) {
    console.error('[FridgeRefrigerator] 저장 중 오류 발생:', error);
    throw error;
  }
};