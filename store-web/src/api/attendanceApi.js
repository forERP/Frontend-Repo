import api from './axiosConfig'

export const clockIn = async (storeCode, employeeCode) => {
  const response = await api.post('/attendance/clock-in', {
    storeCode,
    employeeCode
  });
  return response.data;
};

export const clockOut = async (storeCode, employeeCode) => {
  const response = await api.post('/attendance/clock-out', {
    storeCode,
    employeeCode
  });
  return response.data;
};

export const getAttendanceStatus = async (storeCode, employeeCode) => {
  const response = await api.get('/attendance/status', {
    params: { storeCode, employeeCode }
  });
  return response.data;
};