import api from '../lib/api';

export const fetchWarehouses = async storeId => {
  try {
    const url = storeId ? `/api/warehouses?storeId=${storeId}` : '/api/warehouses';
    const response = await api.get(url);
    return response.data;
  } catch (error) {
    console.error('창고 목록 조회 실패:', error);
    throw error;
  }
};

export const fetchWarehousePage = async ({ page = 0, size = 10, keyword = '', name = '', code = '', status = '' } = {}) => {
  try {
    const params = { page, size };

    if (keyword?.trim()) params.keyword = keyword.trim();
    if (name?.trim()) params.name = name.trim();
    if (code?.trim()) params.code = code.trim();
    if (status) params.status = status;

    const response = await api.get('/api/warehouses/search', { params });
    return response.data;
  } catch (error) {
    console.error('창고 검색 조회 실패:', error);
    throw error;
  }
};

export const fetchWarehouse = async warehouseId => {
  try {
    const response = await api.get(`/api/warehouses/${warehouseId}`);
    return response.data;
  } catch (error) {
    console.error('창고 상세 조회 실패:', error);
    throw error;
  }
};

export const createWarehouse = async payload => {
  try {
    const response = await api.post('/api/warehouses', payload);
    return response.data;
  } catch (error) {
    console.error('창고 생성 실패:', error);
    throw error;
  }
};

export const updateWarehouse = async (warehouseId, payload) => {
  try {
    const response = await api.put(`/api/warehouses/${warehouseId}`, payload);
    return response.data;
  } catch (error) {
    console.error('창고 수정 실패:', error);
    throw error;
  }
};
