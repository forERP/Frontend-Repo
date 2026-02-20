import api from '../lib/api';

export const fetchCategories = async () => {
  try {
    const response = await api.get('/api/product-categories');
    return response.data;
  } catch (error) {
    console.error('카테고리 목록 조회 실패:', error);
    throw error;
  }
};

export const fetchCategoryPage = async ({ page = 0, size = 10, keyword = '', name = '', code = '', status = '' } = {}) => {
  try {
    const params = { page, size };

    if (keyword?.trim()) params.keyword = keyword.trim();
    if (name?.trim()) params.name = name.trim();
    if (code?.trim()) params.code = code.trim();
    if (status) params.status = status;

    const response = await api.get('/api/product-categories/search', { params });
    return response.data;
  } catch (error) {
    console.error('카테고리 검색 조회 실패:', error);
    throw error;
  }
};

export const fetchCategoryDetail = async categoryId => {
  try {
    const response = await api.get(`/api/product-categories/${categoryId}`);
    return response.data;
  } catch (error) {
    console.error('카테고리 상세 조회 실패:', error);
    throw error;
  }
};

export const createCategory = async categoryData => {
  try {
    const response = await api.post('/api/product-categories', categoryData);
    return response.data;
  } catch (error) {
    console.error('카테고리 등록 실패:', error);
    throw error;
  }
};

export const updateCategory = async (categoryId, categoryData) => {
  try {
    const response = await api.put(`/api/product-categories/${categoryId}`, categoryData);
    return response.data;
  } catch (error) {
    console.error('카테고리 수정 실패:', error);
    throw error;
  }
};
