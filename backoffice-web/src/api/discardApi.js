import api from '../lib/api';

export const fetchDiscardPage = async ({
  page = 0,
  size = 10,
  storeId = '',
  storeKeyword = '',
  warehouseId = '',
  warehouseKeyword = '',
  productKeyword = '',
  status = '',
  from = '',
  to = '',
  discardedFrom = '',
  discardedTo = '',
} = {}) => {
  const params = { page, size };

  if (storeId) params.storeId = Number(storeId);
  if (storeKeyword?.trim()) params.storeKeyword = storeKeyword.trim();
  if (warehouseId) params.warehouseId = Number(warehouseId);
  if (warehouseKeyword?.trim()) params.warehouseKeyword = warehouseKeyword.trim();
  if (productKeyword?.trim()) params.productKeyword = productKeyword.trim();
  if (status) params.status = status;
  if (from) params.from = from;
  if (to) params.to = to;
  if (discardedFrom) params.discardedFrom = discardedFrom;
  if (discardedTo) params.discardedTo = discardedTo;

  const response = await api.get('/api/discards', { params });
  return response.data;
};

export const fetchDiscardDetail = async discardId => {
  const response = await api.get(`/api/discards/${discardId}`);
  return response.data;
};

export const createDiscard = async payload => {
  const response = await api.post('/api/discards', payload);
  return response.data;
};

export const confirmDiscard = async discardId => {
  const response = await api.post(`/api/discards/${discardId}/confirm`);
  return response.data;
};

export const cancelDiscard = async discardId => {
  const response = await api.post(`/api/discards/${discardId}/cancel`);
  return response.data;
};
