import api from '../lib/api';

// 상품 목록 조회 (페이지네이션)
export const fetchProducts = async (page = 0, size = 10) => {
  try {
    const response = await api.get(`/api/products?page=${page}&size=${size}`);
    return response.data;
  } catch (error) {
    console.error('상품 목록 조회 실패:', error);
    throw error;
  }
};

// 상품 상세 조회
export const fetchProductDetail = async (productId) => {
  try {
    const response = await api.get(`/api/products/${productId}`);
    return response.data;
  } catch (error) {
    console.error('상품 상세 조회 실패:', error);
    throw error;
  }
};

// 상품 생성
export const createProduct = async (productData) => {
  try {
    const response = await api.post('/api/products', productData);
    return response.data;
  } catch (error) {
    console.error('상품 생성 실패:', error);
    throw error;
  }
};

// 상품 수정
export const updateProduct = async (productId, productData) => {
  try {
    const response = await api.put(`/api/products/${productId}`, productData);
    return response.data;
  } catch (error) {
    console.error('상품 수정 실패:', error);
    throw error;
  }
};

// 상품 단종 처리
export const discontinueProduct = async (productId) => {
  try {
    const response = await api.patch(`/api/products/${productId}/discontinue`);
    return response.data;
  } catch (error) {
    console.error('상품 단종 처리 실패:', error);
    throw error;
  }
};

// 상품 재등록 (단종 취소)
export const reactivateProduct = async (productId) => {
  try {
    const response = await api.patch(`/api/products/${productId}/reactivate`);
    return response.data;
  } catch (error) {
    console.error('상품 재등록 실패:', error);
    throw error;
  }
};
