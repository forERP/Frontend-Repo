import api from './axiosConfig'

export const preparePayment = async ({ serviceMode, items }) => {
  const response = await api.post('/payments/prepare', {
    serviceMode,
    items,
  })
  return response.data
}

export const confirmPayment = async ({ paymentKey, merchantOrderId, amount }) => {
  const response = await api.post('/payments/confirm', {
    paymentKey,
    merchantOrderId,
    amount,
  })
  return response.data
}

export const cancelPayment = async ({ paymentId, reason, discardStock = false, items = [] }) => {
  if (!paymentId) {
    throw new Error('paymentId is required')
  }

  const payload = {
    reason,
    discardStock,
  }

  if (Array.isArray(items) && items.length > 0) {
    payload.items = items
  }

  const response = await api.post(`/payments/${paymentId}/cancel`, payload)
  return response.data
}

export const fetchPaymentByOrderId = async (orderId) => {
  if (!orderId) {
    throw new Error('orderId is required')
  }
  const response = await api.get(`/payments/order/${orderId}`)
  return response.data
}
