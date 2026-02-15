import api from './axiosConfig';

export const loginPos = async (storeCode, employeeCode) => {
  const response = await api.post('/users/login/pos',{
    storeCode,
    employeeCode,
  })
  return response.data;
}

export const getUserInfo = async (userId) => {
  const response = await api.get(`/users/${userId}`);
  return response.data;
}