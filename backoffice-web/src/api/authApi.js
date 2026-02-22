import axios from 'axios'
import api from '../lib/api'

export const login = async credentials => {
  try {
    const response = await axios.post(
      'http://localhost:8089/api/users/login',
      {
        identifier: credentials.identifier,
        password: credentials.password,
      },
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    )

    const { token, role, userId, name } = response.data
    sessionStorage.setItem('accessToken', token)
    sessionStorage.setItem('userRole', role)
    sessionStorage.setItem('userId', userId)
    sessionStorage.setItem('userName', name || '')

    try {
      const profileResponse = await api.get(`/api/users/${userId}`)
      const profile = profileResponse.data || {}
      if (profile.storeId) {
        sessionStorage.setItem('userStoreId', String(profile.storeId))
      } else {
        sessionStorage.removeItem('userStoreId')
      }
      sessionStorage.setItem('userStoreName', profile.storeName || '')
      sessionStorage.setItem('userStoreCode', profile.storeCode || '')
    } catch (profileError) {
      console.warn('failed to load user store profile on login:', profileError?.response?.status || profileError.message)
      sessionStorage.removeItem('userStoreId')
      sessionStorage.setItem('userStoreName', '')
      sessionStorage.setItem('userStoreCode', '')
    }

    return {
      token,
      role,
      userId,
      name,
    }
  } catch (error) {
    console.error('login error:', error.response?.status, error.response?.data)
    const status = Number(error?.response?.status || 0)
    const serverMessage = String(error?.response?.data?.message || '').trim()

    let mappedMessage = ''
    if (status === 403) {
      mappedMessage = '관리자만 로그인 가능합니다.'
    } else if (status === 400 || status === 401 || status === 404 || status === 500) {
      mappedMessage = '아이디 또는 비밀번호가 옳지 않습니다.'
    }

    const errorMessage = mappedMessage || serverMessage || '로그인에 실패했습니다.'
    throw new Error(errorMessage)
  }
}

const clearSession = () => {
  sessionStorage.removeItem('accessToken')
  sessionStorage.removeItem('userRole')
  sessionStorage.removeItem('userId')
  sessionStorage.removeItem('userName')
  sessionStorage.removeItem('userStoreId')
  sessionStorage.removeItem('userStoreName')
  sessionStorage.removeItem('userStoreCode')
}

export const logout = async () => {
  try {
    await api.post('/api/users/logout')
  } catch (error) {
    console.warn('logout API call failed:', error?.response?.status || error.message)
  } finally {
    clearSession()
  }
}

export const getCurrentUser = async () => {
  try {
    const response = await api.get('/api/users/me')
    return response.data
  } catch {
    throw new Error('사용자 정보를 가져올 수 없습니다.')
  }
}
