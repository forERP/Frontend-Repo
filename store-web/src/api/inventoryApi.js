import api from './axiosConfig'

const DEFAULT_PAGE_SIZE = 200

const toOptionalNumber = (value) => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

const toNumber = (value, fallback = 0) => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

const toText = (value) => String(value ?? '').trim()

const normalizeInventoryItem = (item = {}) => ({
  storeProductId: toOptionalNumber(item.storeProductId),
  storeId: toOptionalNumber(item.storeId),
  warehouseId: toOptionalNumber(item.warehouseId),
  warehouseCode: toText(item.warehouseCode),
  warehouseName: toText(item.warehouseName),
  productId: toOptionalNumber(item.productId),
  sku: toText(item.sku),
  productName: toText(item.productName),
  onHand: toNumber(item.onHand),
})

export const fetchStoreInventoryPage = async (
  storeId,
  { warehouseId = null, keyword = '', page = 0, size = DEFAULT_PAGE_SIZE } = {},
) => {
  const normalizedStoreId = toOptionalNumber(storeId)
  if (!normalizedStoreId) {
    throw new Error('storeId is required')
  }

  const params = { page, size }
  const normalizedWarehouseId = toOptionalNumber(warehouseId)
  if (normalizedWarehouseId) {
    params.warehouseId = normalizedWarehouseId
  }

  const normalizedKeyword = toText(keyword)
  if (normalizedKeyword) {
    params.keyword = normalizedKeyword
  }

  const response = await api.get(`/stores/${normalizedStoreId}/inventory`, { params })
  return response.data
}

export const fetchStoreInventory = async (
  storeId,
  { warehouseId = null, keyword = '', size = DEFAULT_PAGE_SIZE } = {},
) => {
  const items = []
  let page = 0
  let hasMore = true

  while (hasMore) {
    const data = await fetchStoreInventoryPage(storeId, {
      warehouseId,
      keyword,
      page,
      size,
    })

    const content = Array.isArray(data?.content) ? data.content : []
    items.push(...content.map(normalizeInventoryItem))

    const totalPages = toOptionalNumber(data?.totalPages)
    const isLastPage = page >= Math.max(0, (totalPages ?? 1) - 1)
    if (isLastPage) {
      hasMore = false
    } else {
      page += 1
    }
  }

  return items
}
