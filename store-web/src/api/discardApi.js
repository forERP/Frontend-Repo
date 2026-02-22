import api from './axiosConfig'

export const createDiscard = async ({ storeId, warehouseId, reason, items }) => {
  const response = await api.post('/discards', {
    storeId,
    warehouseId,
    reason,
    items,
  })
  return response.data
}
