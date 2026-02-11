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
