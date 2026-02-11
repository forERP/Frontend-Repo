import api from '../lib/api';

// 카테고리 목록 조회
export const fetchCategories = async () => {
  try {
    const response = await api.get('/api/product-categories');
    return response.data;
  } catch (error) {
    console.error('카테고리 목록 조회 실패:', error);
    throw error;
  }
};

// 카테고리 상세 조회
export const fetchCategory = async (categoryId) => {
  try {
    const response = await api.get(`/api/product-categories/${categoryId}`);
    return response.data;
  } catch (error) {
    console.error('카테고리 상세 조회 실패:', error);
    throw error;
  }
};

// 카테고리 생성
export const createCategory = async (categoryData) => {
  try {
    const response = await api.post('/api/product-categories', categoryData);
    return response.data;
  } catch (error) {
    console.error('카테고리 생성 실패:', error);
    throw error;
  }
};
