import api from './api';

// ===== Store (매장) =====
export const getStore = async (storeId) => {
    const { data } = await api.get(`/api/stores/${storeId}`);
    return data;
};

export const getAllStores = async () => {
    const { data } = await api.get('/api/stores');
    return data;
};

// ===== User (사용자) =====
export const getUser = async (userId) => {
    const { data } = await api.get(`/api/users/${userId}`);
    return data;
};

export const getAllUsers = async () => {
    const { data } = await api.get('/api/users');
    return data;
};

// ===== Supplier (거래처) =====
export const getSupplier = async (supplierId) => {
    const { data } = await api.get(`/api/suppliers/${supplierId}`);
    return data;
};

export const getAllSuppliers = async () => {
    const { data } = await api.get('/api/suppliers');
    return data;
};

// ===== Warehouse (창고) =====
export const getWarehouse = async (warehouseId) => {
    const { data } = await api.get(`/api/warehouses/${warehouseId}`);
    return data;
};

export const getWarehouses = async (storeId = null) => {
    const params = storeId ? { storeId } : {};
    const { data } = await api.get('/api/warehouses', { params });
    return data;
};

// ===== Product (상품) =====
export const getProduct = async (productId) => {
    const { data } = await api.get(`/api/products/${productId}`);
    return data;
};

export const getAllProducts = async (page = 0, size = 100) => {
    const { data } = await api.get('/api/products', { params: { page, size } });
    return data;
};
// ===== PurchaseOrder (발주) =====
export const getPurchaseOrder = async (purchaseOrderId) => {
    const { data } = await api.get(`/api/purchase-orders/${purchaseOrderId}`);
    return data;
};

export const getPurchaseOrderList = async (filters = {}) => {
    const {
        storeId,
        storeName,
        storeCode,
        supplierId,
        supplierName,
        status,
        from,
        to,
        page = 0,
        size = 20
    } = filters;
    const params = { page, size };
    if (storeId) params.storeId = storeId;
    if (storeName) params.storeName = storeName;
    if (storeCode) params.storeCode = storeCode;
    if (supplierId) params.supplierId = supplierId;
    if (supplierName) params.supplierName = supplierName;
    if (status) params.status = status;
    if (from) params.from = from;
    if (to) params.to = to;
    const { data } = await api.get('/api/purchase-orders', { params });
    return data;
};

export const confirmPurchaseOrder = async (purchaseOrderId) => {
    const { data } = await api.post(`/api/purchase-orders/${purchaseOrderId}/order`);
    return data;
};

export const cancelPurchaseOrder = async (purchaseOrderId) => {
    const { data } = await api.post(`/api/purchase-orders/${purchaseOrderId}/cancel`);
    return data;
};

// ===== Inbound (입고) =====
export const getInbound = async (inboundId) => {
    const { data } = await api.get(`/api/inbounds/${inboundId}`);
    return data;
};

export const getInboundList = async (filters = {}) => {
    const { storeId, storeName, storeCode, status, from, to, page = 0, size = 20 } = filters;
    const params = { page, size };
    if (storeId) params.storeId = storeId;
    if (storeName) params.storeName = storeName;
    if (storeCode) params.storeCode = storeCode;
    if (status) params.status = status;
    if (from) params.from = from;
    if (to) params.to = to;
    const { data } = await api.get('/api/inbounds', { params });
    return data;
};

export const createInbound = async (purchaseOrderId) => {
    const { data } = await api.post('/api/inbounds', { purchaseOrderId });
    return data;
};

export const departShipment = async (inboundId, carrier, trackingNumber) => {
    const { data } = await api.post(`/api/inbounds/${inboundId}/shipment/depart`, {
        carrier,
        trackingNumber
    });
    return data;
};

export const confirmInbound = async (inboundId) => {
    const { data } = await api.post(`/api/inbounds/${inboundId}/confirm`);
    return data;
};

export const cancelInbound = async (inboundId) => {
    const { data } = await api.post(`/api/inbounds/${inboundId}/cancel`);
    return data;
};
