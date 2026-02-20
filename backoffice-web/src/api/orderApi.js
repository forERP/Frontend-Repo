import api from '../lib/api';

export const fetchOrderPage = async ({
  page = 0,
  size = 10,
  storeKeyword = '',
  storeName = '',
  storeCode = '',
  status = '',
  from = '',
  to = '',
} = {}) => {
  const params = { page, size };

  if (storeKeyword?.trim()) params.storeKeyword = storeKeyword.trim();
  if (storeName?.trim()) params.storeName = storeName.trim();
  if (storeCode?.trim()) params.storeCode = storeCode.trim();
  if (status) params.status = status;
  if (from) params.from = from;
  if (to) params.to = to;

  const response = await api.get('/api/orders', { params });
  return response.data;
};

export const fetchOrderDetail = async orderId => {
  const response = await api.get(`/api/orders/${orderId}`);
  return response.data;
};
