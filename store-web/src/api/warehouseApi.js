import api from './axiosConfig'

const toOptionalNumber = (value) => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

const toText = (value) => String(value ?? '').trim()

const normalizeWarehouse = (item = {}) => ({
  warehouseId: toOptionalNumber(item.warehouseId),
  code: toText(item.code),
  name: toText(item.name),
  storeId: toOptionalNumber(item.storeId),
  active: Boolean(item.active),
})

export const fetchWarehousesByStore = async (storeId) => {
  const normalizedStoreId = toOptionalNumber(storeId)
  if (!normalizedStoreId) {
    throw new Error('storeId is required')
  }

  const response = await api.get('/warehouses', {
    params: { storeId: normalizedStoreId },
  })

  const list = Array.isArray(response.data) ? response.data : []
  return list.map(normalizeWarehouse)
}
