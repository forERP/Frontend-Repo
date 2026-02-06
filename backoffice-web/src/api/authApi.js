import axios from 'axios'

export const login = (payload) =>
  axios.post('/api/login', payload)
