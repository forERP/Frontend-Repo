import api from '../lib/api';

// 매장 목록 조회
export const fetchStores = async () => {
  try {
    const response = await api.get('/api/stores');
    return response.data;
  } catch (error) {
    console.error('매장 목록 조회 실패:', error);
    throw error;
  }
};

// 매장 상세 조회
export const fetchStoreDetail = async (storeId) => {
  try {
    const response = await api.get(`/api/stores/${storeId}`);
    return response.data;
  } catch (error) {
    console.error('매장 상세 조회 실패:', error);
    throw error;
  }
};

// 매장 생성
export const createStore = async (storeData) => {
  try {
    const response = await api.post('/api/stores', storeData);
    return response.data;
  } catch (error) {
    console.error('매장 생성 실패:', error);
    throw error;
  }
};

// 매장 정보 수정
export const updateStore = async (storeId, storeData) => {
  try {
    const response = await api.put(`/api/stores/${storeId}`, storeData);
    return response.data;
  } catch (error) {
    console.error('매장 정보 수정 실패:', error);
    throw error;
  }
};

// 매장 상태 변경
export const updateStoreStatus = async (storeId, status) => {
  try {
    const response = await api.patch(`/api/stores/${storeId}/status`, { status });
    return response.data;
  } catch (error) {
    console.error('매장 상태 변경 실패:', error);
    throw error;
  }
};
