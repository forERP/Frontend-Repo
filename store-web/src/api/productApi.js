import api from './axiosConfig'

const STORE_PRODUCT_PAGE_SIZE = 200
const DEFAULT_PRODUCT_CATEGORY = 'Uncategorized'

const toText = (value) => String(value ?? '').trim()
const firstNonEmptyText = (...values) => values.map(toText).find(Boolean) || ''

const toOptionalNumber = (value) => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

const toNumber = (value, fallback = 0) => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

const normalizeToken = (value) => toText(value).toLowerCase().replace(/\s+/g, '-')

const safeDecode = (value) => {
  const text = String(value ?? '')
  try {
    return decodeURIComponent(text)
  } catch {
    return text
  }
}

const readRegistered = (item = {}) => {
  if (typeof item.isRegistered === 'boolean') {
    return item.isRegistered
  }

  if (typeof item.registered === 'boolean') {
    return item.registered
  }

  return false
}

const makeCategoryKey = (categoryName) => normalizeToken(categoryName)

export const normalizeStoreProduct = (item = {}) => {
  const categoryName = toText(item.categoryName) || DEFAULT_PRODUCT_CATEGORY
  const categoryImageUrl = firstNonEmptyText(
    item.categoryImageUrl,
    item.categoryImage,
    item.category_image_url,
  )
  const imageUrl = firstNonEmptyText(item.imageUrl, item.productImageUrl, item.product_image_url)
  const msrpPrice = toNumber(item.msrpPrice)
  const salePrice = toNumber(item.salePrice)

  return {
    productId: toOptionalNumber(item.productId),
    sku: toText(item.sku),
    name: toText(item.name),
    categoryName,
    categoryKey: makeCategoryKey(categoryName),
    categoryImageUrl,
    imageUrl,
    quantity: toNumber(item.quantity),
    saleStatus: toText(item.saleStatus || 'OFF').toUpperCase(),
    registered: readRegistered(item),
    msrpPrice,
    salePrice,
    price: salePrice > 0 ? salePrice : msrpPrice,
  }
}

export const normalizeProductCategory = (item = {}) => {
  const name = toText(item.name)
  const code = toText(item.code)
  const id = toOptionalNumber(item.id)

  return {
    id,
    code,
    name,
    description: toText(item.description),
    imageUrl: toText(item.imageUrl),
    key: makeCategoryKey(name || code || id),
    slug: normalizeToken(name || code || id),
  }
}

const makeProductGroupKey = (product = {}) => {
  const productId = toOptionalNumber(product.productId)
  if (productId !== null) {
    return `id:${productId}`
  }

  const sku = toText(product.sku)
  if (sku) {
    return `sku:${sku}`
  }

  return `name:${toText(product.name)}|category:${toText(product.categoryKey)}`
}

export const mergeStoreProducts = (products = []) => {
  const grouped = new Map()

  products.forEach((product, index) => {
    const key = makeProductGroupKey(product)

    if (!grouped.has(key)) {
      grouped.set(key, { ...product, _order: index })
      return
    }

    const current = grouped.get(key)
    const currentSaleStatus = toText(current.saleStatus).toUpperCase()
    const nextSaleStatus = toText(product.saleStatus).toUpperCase()

    current.quantity = toNumber(current.quantity) + toNumber(product.quantity)
    current.registered = Boolean(current.registered || product.registered)
    current.saleStatus = currentSaleStatus === 'ON' || nextSaleStatus === 'ON' ? 'ON' : 'OFF'

    if (!current.productId && product.productId) {
      current.productId = product.productId
    }
    if (!current.sku && product.sku) {
      current.sku = product.sku
    }
    if (!current.name && product.name) {
      current.name = product.name
    }
    if (!current.categoryName && product.categoryName) {
      current.categoryName = product.categoryName
    }
    if (!current.categoryKey && product.categoryKey) {
      current.categoryKey = product.categoryKey
    }
    if (!current.categoryImageUrl && product.categoryImageUrl) {
      current.categoryImageUrl = product.categoryImageUrl
    }
    if (!current.imageUrl && product.imageUrl) {
      current.imageUrl = product.imageUrl
    }

    if (toNumber(current.salePrice) <= 0 && toNumber(product.salePrice) > 0) {
      current.salePrice = toNumber(product.salePrice)
    }
    if (toNumber(current.msrpPrice) <= 0 && toNumber(product.msrpPrice) > 0) {
      current.msrpPrice = toNumber(product.msrpPrice)
    }
    current.price = toNumber(current.salePrice) > 0 ? toNumber(current.salePrice) : toNumber(current.msrpPrice)
  })

  return Array.from(grouped.values())
    .sort((a, b) => a._order - b._order)
    .map((entry) => {
      const product = { ...entry }
      delete product._order

      return {
        ...product,
        price: toNumber(product.salePrice) > 0 ? toNumber(product.salePrice) : toNumber(product.msrpPrice),
      }
    })
}

export const buildMenuCategoryPath = (category) => {
  const token = toText(category?.slug || category?.id)
  return `/menu/${encodeURIComponent(token)}`
}

export const isPosSellableStoreProduct = (product = {}) => {
  if (!product.registered) {
    return false
  }

  return product.saleStatus !== 'OFF'
}

export const fetchStoreProductsPage = async (storeId, page = 0, size = STORE_PRODUCT_PAGE_SIZE) => {
  const normalizedStoreId = toOptionalNumber(storeId)

  if (!normalizedStoreId) {
    throw new Error('storeId is required')
  }

  const response = await api.get('/store_products/list', {
    params: {
      storeId: normalizedStoreId,
      page,
      size,
    },
  })

  return response.data
}

export const fetchStoreProducts = async (storeId, { size = STORE_PRODUCT_PAGE_SIZE } = {}) => {
  const products = []
  let page = 0
  let hasMore = true

  while (hasMore) {
    const data = await fetchStoreProductsPage(storeId, page, size)
    const content = Array.isArray(data?.content) ? data.content : []
    products.push(...content.map(normalizeStoreProduct))

    const totalPages = toOptionalNumber(data?.totalPages)
    const isLastPage = Boolean(data?.last)

    if (isLastPage || totalPages === null || page >= totalPages - 1) {
      hasMore = false
    } else {
      page += 1
    }
  }

  return products
}

export const fetchProductCategories = async () => {
  const response = await api.get('/product-categories')
  const categories = Array.isArray(response.data) ? response.data : []
  return categories.map(normalizeProductCategory)
}

export const mergePosCategories = (categories, products) => {
  const productCounts = new Map()
  const productCategoryNames = new Map()
  const productCategoryImages = new Map()

  products.forEach((product) => {
    if (!product.categoryKey) {
      return
    }

    productCounts.set(product.categoryKey, (productCounts.get(product.categoryKey) ?? 0) + 1)
    if (!productCategoryNames.has(product.categoryKey)) {
      productCategoryNames.set(product.categoryKey, product.categoryName)
    }
    if (!productCategoryImages.has(product.categoryKey) && product.categoryImageUrl) {
      productCategoryImages.set(product.categoryKey, product.categoryImageUrl)
    }
  })

  const result = []
  const usedCategoryKeys = new Set()

  categories.forEach((category) => {
    if (!category.key) {
      return
    }

    const productCount = productCounts.get(category.key) ?? 0
    if (productCount <= 0) {
      return
    }

    usedCategoryKeys.add(category.key)
    result.push({
      ...category,
      productCount,
    })
  })

  productCounts.forEach((productCount, categoryKey) => {
    if (usedCategoryKeys.has(categoryKey)) {
      return
    }

    const fallbackName = productCategoryNames.get(categoryKey) || DEFAULT_PRODUCT_CATEGORY
    result.push({
      id: null,
      code: '',
      name: fallbackName,
      description: '',
      imageUrl: productCategoryImages.get(categoryKey) || '',
      key: categoryKey,
      slug: normalizeToken(fallbackName),
      productCount,
    })
  })

  return result
}

export const resolveMenuCategory = (categories = [], rawCategory = '') => {
  if (!Array.isArray(categories) || categories.length === 0) {
    return null
  }

  const categoryText = toText(safeDecode(rawCategory))

  if (!categoryText) {
    return null
  }

  const categoryToken = normalizeToken(categoryText)
  const parsedCategoryId = toOptionalNumber(categoryText)

  return (
    categories.find((category) => {
      if (parsedCategoryId !== null && category.id === parsedCategoryId) {
        return true
      }

      if (normalizeToken(category.slug) === categoryToken) {
        return true
      }

      if (normalizeToken(category.name) === categoryToken) {
        return true
      }

      if (normalizeToken(category.code) === categoryToken) {
        return true
      }

      return false
    }) || null
  )
}

export const filterProductsByCategory = (products = [], category = null) => {
  if (!category?.key) {
    return []
  }

  return products.filter((product) => product.categoryKey === category.key)
}

export const fetchPosCatalog = async (storeId) => {
  const [productsResult, categoriesResult] = await Promise.allSettled([
    fetchStoreProducts(storeId),
    fetchProductCategories(),
  ])

  if (productsResult.status === 'rejected') {
    throw productsResult.reason
  }

  const mergedProducts = mergeStoreProducts(productsResult.value)
  const sellableProducts = mergedProducts.filter(isPosSellableStoreProduct)
  const categories = categoriesResult.status === 'fulfilled' ? categoriesResult.value : []

  return {
    products: sellableProducts,
    categories: mergePosCategories(categories, sellableProducts),
  }
}
