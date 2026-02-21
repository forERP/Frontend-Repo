import api from './api';

// ===== Store =====
export const getStore = async storeId => {
  const { data } = await api.get(`/api/stores/${storeId}`);
  return data;
};

export const getAllStores = async () => {
  const { data } = await api.get('/api/stores');
  return data;
};

// ===== User =====
export const getUser = async userId => {
  const { data } = await api.get(`/api/users/${userId}`);
  return data;
};

export const getAllUsers = async () => {
  const { data } = await api.get('/api/users');
  return data;
};

// ===== Supplier =====
export const getSupplier = async supplierId => {
  const { data } = await api.get(`/api/suppliers/${supplierId}`);
  return data;
};

export const getAllSuppliers = async () => {
  const { data } = await api.get('/api/suppliers');
  return data;
};

// ===== Warehouse =====
export const getWarehouse = async warehouseId => {
  const { data } = await api.get(`/api/warehouses/${warehouseId}`);
  return data;
};

export const getWarehouses = async (storeId = null) => {
  const params = storeId ? { storeId } : {};
  const { data } = await api.get('/api/warehouses', { params });
  return data;
};

// ===== Product =====
export const getProduct = async productId => {
  const { data } = await api.get(`/api/products/${productId}`);
  return data;
};

export const getAllProducts = async (page = 0, size = 100) => {
  const { data } = await api.get('/api/products', { params: { page, size } });
  return data;
};

// ===== PurchaseRequest =====
export const getPurchaseOrderDraft = async purchaseRequestId => {
  const { data } = await api.get(`/api/purchase-requests/${purchaseRequestId}/draft-order`);
  return data;
};

export const createPurchaseOrderDraft = async (purchaseRequestId, payload) => {
  const { data } = await api.post(`/api/purchase-requests/${purchaseRequestId}/draft-order`, payload);
  return data;
};

export const approvePurchaseRequest = async purchaseRequestId => {
  const { data } = await api.post(`/api/purchase-requests/${purchaseRequestId}/approve`);
  return data;
};

// ===== PurchaseOrder =====
export const getPurchaseOrder = async purchaseOrderId => {
  const { data } = await api.get(`/api/purchase-orders/${purchaseOrderId}`);
  return data;
};

export const getPurchaseOrderList = async (filters = {}) => {
  const {
    storeId,
    storeKeyword,
    storeName,
    storeCode,
    supplierId,
    supplierName,
    status,
    createdFrom,
    createdTo,
    orderedFrom,
    orderedTo,
    from,
    to,
    page = 0,
    size = 20,
  } = filters;

  const params = { page, size };
  if (storeId) params.storeId = storeId;
  if (storeKeyword) params.storeKeyword = storeKeyword;
  if (storeName) params.storeName = storeName;
  if (storeCode) params.storeCode = storeCode;
  if (supplierId) params.supplierId = supplierId;
  if (supplierName) params.supplierName = supplierName;
  if (status) params.status = status;
  if (createdFrom) params.createdFrom = createdFrom;
  if (createdTo) params.createdTo = createdTo;
  if (orderedFrom) params.orderedFrom = orderedFrom;
  if (orderedTo) params.orderedTo = orderedTo;
  if (from) params.from = from;
  if (to) params.to = to;

  const { data } = await api.get('/api/purchase-orders', { params });
  return data;
};

export const confirmPurchaseOrder = async purchaseOrderId => {
  const { data } = await api.post(`/api/purchase-orders/${purchaseOrderId}/order`);
  return data;
};

export const cancelPurchaseOrder = async purchaseOrderId => {
  const { data } = await api.post(`/api/purchase-orders/${purchaseOrderId}/cancel`);
  return data;
};

export const updatePurchaseOrderDraft = async (purchaseOrderId, payload) => {
  const { data } = await api.put(`/api/purchase-orders/${purchaseOrderId}/draft`, payload);
  return data;
};

export const deletePurchaseOrderDraft = async purchaseOrderId => {
  await api.delete(`/api/purchase-orders/${purchaseOrderId}/draft`);
};

export const downloadPurchaseOrderDocument = async purchaseOrderId => {
  const response = await api.get(`/api/purchase-orders/${purchaseOrderId}/document`, {
    responseType: 'blob',
  });
  return response;
};

// ===== Inbound =====
export const getInbound = async inboundId => {
  const { data } = await api.get(`/api/inbounds/${inboundId}`);
  return data;
};

export const getInboundList = async (filters = {}) => {
  const { storeId, storeKeyword, storeName, storeCode, status, shipmentStatus, from, to, page = 0, size = 20 } = filters;
  const params = { page, size };
  if (storeId) params.storeId = storeId;
  if (storeKeyword) params.storeKeyword = storeKeyword;
  if (storeName) params.storeName = storeName;
  if (storeCode) params.storeCode = storeCode;
  if (status) params.status = status;
  if (shipmentStatus) params.shipmentStatus = shipmentStatus;
  if (from) params.from = from;
  if (to) params.to = to;
  const { data } = await api.get('/api/inbounds', { params });
  return data;
};

export const createInbound = async purchaseOrderId => {
  const { data } = await api.post('/api/inbounds', { purchaseOrderId });
  return data;
};

export const getShipmentCarriers = async ({ searchText = '', size = 100 } = {}) => {
  const params = {};
  if (searchText?.trim()) params.searchText = searchText.trim();
  if (size) params.size = size;
  const { data } = await api.get('/api/shipments/carriers', { params });
  return data;
};

export const departShipment = async (inboundId, carrierOrPayload, trackingNumber) => {
  const payload = typeof carrierOrPayload === 'object' && carrierOrPayload !== null
    ? carrierOrPayload
    : { carrier: carrierOrPayload, trackingNumber };

  const { data } = await api.post(`/api/inbounds/${inboundId}/shipment/depart`, payload);
  return data;
};

export const confirmInbound = async inboundId => {
  const { data } = await api.post(`/api/inbounds/${inboundId}/confirm`);
  return data;
};

export const cancelInbound = async inboundId => {
  const { data } = await api.post(`/api/inbounds/${inboundId}/cancel`);
  return data;
};
