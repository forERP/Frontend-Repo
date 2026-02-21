import api from './axiosConfig'

export const processOrderReturn = async ({ orderId, reason, discardStock = false }) => {
  const response = await api.post('/returns', {
    orderId,
    reason,
    discardStock,
  })
  return response.data
}

export const fetchReturnByOrderId = async (orderId) => {
  if (!orderId) {
    throw new Error('orderId is required')
  }
  const response = await api.get(`/returns/order/${orderId}`)
  return response.data
}

