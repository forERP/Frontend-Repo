import axios from 'axios'
import api from '../lib/api'

/**
 * 관리자페이지 로그인
 * @param {Object} credentials - { identifier, password }
 * @returns {Promise<Object>} - { token, role, userId }
 */
export const login = async (credentials) => {
  try {
    // api instance는 요청 인터셉터가 있어서 authorization 헤더를 자동으로 추가함
    // 로그인은 token이 없는 상태에서 호출되므로 직접 axios를 사용
    const response = await axios.post('http://localhost:8081/api/users/login', 
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

    const { token, role, userId } = response.data

    // 토큰 및 사용자 정보 localStorage에 저장
    localStorage.setItem('accessToken', token)
    localStorage.setItem('userRole', role)
    localStorage.setItem('userId', userId)

    return {
      token,
      role,
      userId,
    }
  } catch (error) {
    console.error('로그인 에러:', error.response?.status, error.response?.data)
    const errorMessage = error.response?.data?.message || error.message || '로그인에 실패했습니다.'
    throw new Error(errorMessage)
  }
}

/**
 * 로그아웃
 */
export const logout = () => {
  localStorage.removeItem('accessToken')
  localStorage.removeItem('userRole')
  localStorage.removeItem('userId')
}

/**
 * 현재 사용자 정보 조회
 */
export const getCurrentUser = async () => {
  try {
    const response = await api.get('/api/users/me')
    return response.data
  } catch (error) {
    throw new Error('사용자 정보를 가져올 수 없습니다.')
  }
}
