import api from './axiosConfig'

const DEFAULT_PAGE_SIZE = 200

const toText = (value) => String(value ?? '').trim()
const toNumber = (value, fallback = 0) => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

const normalizePosUser = (item = {}) => ({
  id: toNumber(item.id, 0),
  employeeCode: toText(item.employeeCode),
  name: toText(item.name),
  storeId: toNumber(item.storeId, 0),
  storeCode: toText(item.storeCode),
  storeName: toText(item.storeName),
  role: toText(item.role),
  status: toText(item.status),
})

export const fetchUsersByStoreCode = async (
  storeCode,
  { status = 'ACTIVE', size = DEFAULT_PAGE_SIZE } = {},
) => {
  const normalizedStoreCode = toText(storeCode)
  if (!normalizedStoreCode) {
    throw new Error('storeCode is required')
  }

  const users = []
  let page = 0
  let hasMore = true

  while (hasMore) {
    const params = {
      storeCode: normalizedStoreCode,
      page,
      size,
    }

    const normalizedStatus = toText(status)
    if (normalizedStatus) {
      params.status = normalizedStatus
    }

    const response = await api.get('/users/search', { params })
    const data = response.data
    const content = Array.isArray(data?.content) ? data.content : []
    users.push(...content.map(normalizePosUser))

    const totalPages = toNumber(data?.totalPages, 0)
    if (page >= Math.max(0, totalPages - 1)) {
      hasMore = false
    } else {
      page += 1
    }
  }

  return users
}
