import api from '../lib/api';

export const fetchSuppliers = async () => {
  try {
    const response = await api.get('/api/suppliers');
    return response.data;
  } catch (error) {
    console.error('거래처 목록 조회 실패:', error);
    throw error;
  }
};

export const fetchSupplierPage = async ({ page = 0, size = 10, name = '', contactName = '', status = '' } = {}) => {
  try {
    const params = { page, size };

    if (name?.trim()) params.name = name.trim();
    if (contactName?.trim()) params.contactName = contactName.trim();
    if (status) params.status = status;

    const response = await api.get('/api/suppliers/search', { params });
    return response.data;
  } catch (error) {
    console.error('거래처 검색 조회 실패:', error);
    throw error;
  }
};

export const fetchSupplierDetail = async supplierId => {
  try {
    const response = await api.get(`/api/suppliers/${supplierId}`);
    return response.data;
  } catch (error) {
    console.error('거래처 상세 조회 실패:', error);
    throw error;
  }
};

export const createSupplier = async payload => {
  try {
    const response = await api.post('/api/suppliers', payload);
    return response.data;
  } catch (error) {
    console.error('거래처 생성 실패:', error);
    throw error;
  }
};

export const updateSupplier = async (supplierId, payload) => {
  try {
    const response = await api.put(`/api/suppliers/${supplierId}`, payload);
    return response.data;
  } catch (error) {
    console.error('거래처 수정 실패:', error);
    throw error;
  }
};
