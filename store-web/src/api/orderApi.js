import api from './axiosConfig'

export const fetchPosOrderList = async ({ status = '', page = 0, size = 20 } = {}) => {
  const params = { page, size }
  if (status) {
    params.status = status
  }

  const response = await api.get('/pos/orders', { params })
  return response.data
}

export const fetchPosOrderDetail = async (orderId) => {
  if (!orderId) {
    throw new Error('orderId is required')
  }
  const response = await api.get(`/pos/orders/${orderId}`)
  return response.data
}

export const preparePosOrder = async (orderId) => {
  if (!orderId) {
    throw new Error('orderId is required')
  }
  const response = await api.post(`/pos/orders/${orderId}/prepare`)
  return response.data
}

export const confirmPosOrder = async (orderId) => {
  if (!orderId) {
    throw new Error('orderId is required')
  }
  const response = await api.post(`/pos/orders/${orderId}/confirm`)
  return response.data
}
