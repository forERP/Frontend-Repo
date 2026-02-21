import api from '../lib/api';

export const fetchShipmentPage = async ({
  page = 0,
  size = 20,
  flowType = '',
  storeId = null,
  warehouseId = null,
  shipmentStatus = '',
  from = '',
  to = '',
} = {}) => {
  const params = { page, size };

  if (flowType) params.flowType = flowType;
  if (storeId) params.storeId = storeId;
  if (warehouseId) params.warehouseId = warehouseId;
  if (shipmentStatus) params.shipmentStatus = shipmentStatus;
  if (from) params.from = from;
  if (to) params.to = to;

  const response = await api.get('/api/shipments', { params });
  return response.data;
};

export const fetchShipmentTracking = async (shipmentId, { sync = true } = {}) => {
  const response = await api.get(`/api/shipments/${shipmentId}/tracking`, {
    params: { sync },
  });
  return response.data;
};

export const fetchShipmentCarriers = async ({ searchText = '', size = 100 } = {}) => {
  const params = {};
  if (searchText?.trim()) params.searchText = searchText.trim();
  if (size) params.size = size;

  const response = await api.get('/api/shipments/carriers', { params });
  return response.data;
};
