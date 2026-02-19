import api from '../lib/api';

export const fetchInventoryPage = async ({
  storeId = '',
  warehouseId = '',
  storeKeyword = '',
  warehouseKeyword = '',
  productKeyword = '',
  saleStatus = '',
  page = 0,
  size = 10,
} = {}) => {
  const params = { page, size };

  if (storeId) {
    params.storeId = Number(storeId);
  }

  if (warehouseId) {
    params.warehouseId = Number(warehouseId);
  }

  if (storeKeyword?.trim()) {
    params.storeKeyword = storeKeyword.trim();
  }

  if (warehouseKeyword?.trim()) {
    params.warehouseKeyword = warehouseKeyword.trim();
  }

  if (productKeyword?.trim()) {
    params.productKeyword = productKeyword.trim();
  }

  if (saleStatus) {
    params.saleStatus = saleStatus;
  }

  const response = await api.get('/api/inventory', { params });
  return response.data;
};

export const updateInventorySaleStatus = async (storeProductId, saleStatus) => {
  const response = await api.patch(`/api/inventory/${storeProductId}/sale-status`, {
    saleStatus,
  });

  return response.data;
};

export const fetchInventoryDetail = async storeProductId => {
  const response = await api.get(`/api/inventory/${storeProductId}`);
  return response.data;
};

export const updateInventoryDetail = async (storeProductId, payload) => {
  const response = await api.patch(`/api/inventory/${storeProductId}`, payload);
  return response.data;
};
