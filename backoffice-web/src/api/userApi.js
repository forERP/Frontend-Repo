import api from '../lib/api';

export const fetchUserPage = async ({
  page = 0,
  size = 10,
  storeKeyword = '',
  storeName = '',
  storeCode = '',
  name = '',
  status = '',
  role = '',
  createdFrom = '',
  createdTo = '',
} = {}) => {
  const params = { page, size };

  if (storeKeyword?.trim()) params.storeKeyword = storeKeyword.trim();
  if (storeName?.trim()) params.storeName = storeName.trim();
  if (storeCode?.trim()) params.storeCode = storeCode.trim();
  if (name?.trim()) params.name = name.trim();
  if (status) params.status = status;
  if (role) params.role = role;
  if (createdFrom) params.createdFrom = createdFrom;
  if (createdTo) params.createdTo = createdTo;

  const response = await api.get('/api/users/search', { params });
  return response.data;
};

export const fetchUserDetail = async userId => {
  const response = await api.get(`/api/users/${userId}`);
  return response.data;
};

export const fetchCurrentUserProfile = async () => {
  const response = await api.get('/api/users/me');
  return response.data;
};

export const checkEmployeeCodeAvailable = async employeeCode => {
  const response = await api.get('/api/users/check-employee-code', {
    params: { employeeCode },
  });
  return Boolean(response.data?.available);
};

export const createUser = async payload => {
  const response = await api.post('/api/users', payload);
  return response.data;
};

export const updateUser = async (userId, payload) => {
  const response = await api.put(`/api/users/${userId}`, payload);
  return response.data;
};
