import api from './axiosConfig'

export const POS_SESSION_UPDATED_EVENT = 'pos-session-updated'

const POS_STORAGE_KEYS = [
  'accessToken',
  'role',
  'userRole',
  'userId',
  'storeId',
  'storeName',
  'storeCode',
  'userName',
  'employeeCode',
]

export const notifyPosSessionUpdated = () => {
  window.dispatchEvent(new Event(POS_SESSION_UPDATED_EVENT))
}

export const loginPos = async (storeCode, employeeCode) => {
  const response = await api.post('/users/login/pos', {
    storeCode,
    employeeCode,
  })
  return response.data
}

export const getUserInfo = async (userId) => {
  const response = await api.get(`/users/${userId}`)
  return response.data
}

export const setPosSessionFromLogin = async ({
  token,
  role,
  userId,
  fallbackStoreCode = '',
  fallbackEmployeeCode = '',
}) => {
  if (!token || !userId) {
    throw new Error('로그인 응답이 올바르지 않습니다.')
  }

  clearPosSession()
  sessionStorage.setItem('accessToken', String(token))
  sessionStorage.setItem('role', String(role ?? ''))
  sessionStorage.setItem('userRole', String(role ?? ''))
  sessionStorage.setItem('userId', String(userId))

  const userData = await getUserInfo(userId)
  sessionStorage.setItem('storeId', String(userData?.storeId ?? ''))
  sessionStorage.setItem('storeName', String(userData?.storeName ?? ''))
  sessionStorage.setItem('storeCode', String(userData?.storeCode ?? fallbackStoreCode))
  sessionStorage.setItem('userName', String(userData?.name ?? ''))
  sessionStorage.setItem('employeeCode', String(userData?.employeeCode ?? fallbackEmployeeCode))
  notifyPosSessionUpdated()

  return userData
}

export const logoutPos = async (storeCode, employeeCode) => {
  const response = await api.post('/users/logout/pos', {
    storeCode,
    employeeCode,
  })
  return response.data
}

export const clearPosSession = () => {
  POS_STORAGE_KEYS.forEach((key) => sessionStorage.removeItem(key))
  notifyPosSessionUpdated()
}
