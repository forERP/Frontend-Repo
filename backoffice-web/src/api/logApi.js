import api from '../lib/api'

export const fetchAdminLogPage = async ({
  page = 0,
  size = 10,
  actorKeyword = '',
  action = '',
  targetType = '',
  from = '',
  to = '',
} = {}) => {
  const params = { page, size }

  if (actorKeyword?.trim()) params.actorKeyword = actorKeyword.trim()
  if (action) params.action = action
  if (targetType) params.targetType = targetType
  if (from) params.from = from
  if (to) params.to = to

  const response = await api.get('/api/logs/admin', { params })
  return response.data
}

export const fetchInventoryLogPage = async ({
  page = 0,
  size = 10,
  eventType = '',
  storeKeyword = '',
  warehouseKeyword = '',
  productKeyword = '',
  actorKeyword = '',
  from = '',
  to = '',
} = {}) => {
  const params = { page, size }

  if (eventType) params.eventType = eventType
  if (storeKeyword?.trim()) params.storeKeyword = storeKeyword.trim()
  if (warehouseKeyword?.trim()) params.warehouseKeyword = warehouseKeyword.trim()
  if (productKeyword?.trim()) params.productKeyword = productKeyword.trim()
  if (actorKeyword?.trim()) params.actorKeyword = actorKeyword.trim()
  if (from) params.from = from
  if (to) params.to = to

  const response = await api.get('/api/logs/inventory', { params })
  return response.data
}
