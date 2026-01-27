import axios from 'axios'

// 로그인
export const login = (payload) =>
  axios.post('/api/login', payload)

// 로그아웃