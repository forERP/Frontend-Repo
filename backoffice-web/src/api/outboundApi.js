import api from '../lib/api';

export const fetchOutboundPage = async ({
  page = 0,
  size = 10,
  storeName = '',
  storeCode = '',
  status = '',
  shipmentStatus = '',
  from = '',
  to = '',
} = {}) => {
  const params = { page, size };

  if (storeName?.trim()) params.storeName = storeName.trim();
  if (storeCode?.trim()) params.storeCode = storeCode.trim();
  if (status) params.status = status;
  if (shipmentStatus) params.shipmentStatus = shipmentStatus;
  if (from) params.from = from;
  if (to) params.to = to;

  const response = await api.get('/api/outbounds', { params });
  return response.data;
};

export const fetchOutboundDetail = async outboundId => {
  const response = await api.get(`/api/outbounds/${outboundId}`);
  return response.data;
};
