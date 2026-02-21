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

    return {
      token,
      role,
      userId,
      name,
    }
  } catch (error) {
    console.error('login error:', error.response?.status, error.response?.data)
    const errorMessage = error.response?.data?.message || error.message || '로그인에 실패했습니다.'
    throw new Error(errorMessage)
  }
}

const clearSession = () => {
  sessionStorage.removeItem('accessToken')
  sessionStorage.removeItem('userRole')
  sessionStorage.removeItem('userId')
  sessionStorage.removeItem('userName')
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
  } catch (error) {
    throw new Error('사용자 정보를 가져올 수 없습니다.')
  }
}
