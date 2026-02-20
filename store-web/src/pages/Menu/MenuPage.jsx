import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { preparePayment } from '../../api/paymentApi'
import { subscribePosRealtime } from '../../api/realtimeApi'
import {
  buildMenuCategoryPath,
  fetchPosCatalog,
  filterProductsByCategory,
  resolveMenuCategory,
} from '../../api/productApi'
import { getApiErrorMessage } from '../../utils/posUtils'
import { requestTossCardPayment } from '../../utils/tossPayments'
import './Menu.css'

const ITEMS_PER_PAGE = 4

const SERVICE_MODES = [
  { value: 'DINE_IN', label: '매장식사' },
  { value: 'TAKE_OUT', label: '포장' },
  { value: 'DELIVERY', label: '배달' },
]

const ProductCardImage = ({ imageUrl = '', name = '' }) => (
  <div className='menu-button-media'>
    {imageUrl ? (
      <img src={imageUrl} alt={`${name} 상품 이미지`} className='menu-button-image' loading='lazy' />
    ) : (
      <div className='menu-button-image-fallback'>NO IMAGE</div>
    )}
  </div>
)

const makeStockKey = (productId, categoryKey) => `${categoryKey}:${productId}`

const normalizeAmount = (value) => {
  const numeric = Number(value)
  return Number.isFinite(numeric) ? numeric : 0
}

export default function MenuPage() {
  const { category = '' } = useParams()
  const navigate = useNavigate()
  const mountedRef = useRef(true)

  const [selectedMenus, setSelectedMenus] = useState([])
  const [page, setPage] = useState(0)
  const [categories, setCategories] = useState([])
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [catalogErrorMsg, setCatalogErrorMsg] = useState('')
  const [paymentErrorMsg, setPaymentErrorMsg] = useState('')
  const [serviceMode, setServiceMode] = useState('DINE_IN')
  const [paymentLoading, setPaymentLoading] = useState(false)

  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
    }
  }, [])

  const loadCatalog = useCallback(async ({ background = false } = {}) => {
    const storeId = Number(sessionStorage.getItem('storeId'))

    if (!Number.isInteger(storeId) || storeId <= 0) {
      if (mountedRef.current) {
        setCategories([])
        setProducts([])
        setCatalogErrorMsg('매장 정보를 찾지 못했습니다. 다시 로그인해 주세요.')
        setLoading(false)
      }
      return
    }

    try {
      if (!background) {
        setLoading(true)
      }

      setCatalogErrorMsg('')
      const catalogData = await fetchPosCatalog(storeId)
      if (!mountedRef.current) {
        return
      }

      setCategories(catalogData.categories)
      setProducts(catalogData.products)
    } catch (error) {
      if (!mountedRef.current) {
        return
      }

      setCategories([])
      setProducts([])
      setCatalogErrorMsg(getApiErrorMessage(error, '상품 목록을 불러오지 못했습니다.'))
    } finally {
      if (mountedRef.current && !background) {
        setLoading(false)
      }
    }
  }, [])

  useEffect(() => {
    loadCatalog()
  }, [loadCatalog])

  useEffect(() => {
    const handleFocus = () => {
      loadCatalog({ background: true })
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        loadCatalog({ background: true })
      }
    }

    window.addEventListener('focus', handleFocus)
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      window.removeEventListener('focus', handleFocus)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [loadCatalog])

  useEffect(() => {
    const unsubscribe = subscribePosRealtime({
      onEvent: ({ type }) => {
        if (type === 'inventory.changed' || type === 'payment.changed' || type === 'connected') {
          loadCatalog({ background: true })
        }
      },
    })

    return unsubscribe
  }, [loadCatalog])

  const currentCategory = useMemo(
    () => resolveMenuCategory(categories, category),
    [categories, category],
  )

  const menus = useMemo(
    () => filterProductsByCategory(products, currentCategory),
    [products, currentCategory],
  )

  const stockByProduct = useMemo(() => {
    const map = new Map()

    products.forEach((product) => {
      map.set(makeStockKey(product.productId, product.categoryKey), Number(product.quantity) || 0)
    })

    return map
  }, [products])

  const getAvailableStock = (productId, categoryKey) =>
    stockByProduct.get(makeStockKey(productId, categoryKey)) ?? 0

  useEffect(() => {
    if (loading || catalogErrorMsg || categories.length === 0 || currentCategory) {
      return
    }

    navigate(buildMenuCategoryPath(categories[0]), { replace: true })
  }, [loading, catalogErrorMsg, categories, currentCategory, navigate])

  useEffect(() => {
    setPage(0)
  }, [currentCategory?.key])

  useEffect(() => {
    const maxPage = Math.max(0, Math.ceil(selectedMenus.length / ITEMS_PER_PAGE) - 1)
    if (page > maxPage) {
      setPage(maxPage)
    }
  }, [page, selectedMenus.length])

  useEffect(() => {
    setSelectedMenus((prev) =>
      prev
        .map((item) => {
          const available = stockByProduct.get(makeStockKey(item.productId, item.categoryKey)) ?? 0
          if (available <= 0) {
            return null
          }
          return {
            ...item,
            count: Math.min(item.count, available),
          }
        })
        .filter(Boolean),
    )
  }, [stockByProduct])

  const selectMenu = (menu) => {
    if (!menu || !currentCategory) {
      return
    }

    const available = getAvailableStock(menu.productId, currentCategory.key)
    if (available <= 0) {
      return
    }

    setSelectedMenus((prev) => {
      const index = prev.findIndex(
        (item) => item.productId === menu.productId && item.categoryKey === currentCategory.key,
      )

      if (index < 0) {
        return [
          ...prev,
          {
            productId: menu.productId,
            name: menu.name,
            categoryKey: currentCategory.key,
            categoryName: currentCategory.name,
            price: menu.price,
            count: 1,
          },
        ]
      }

      if (prev[index].count >= available) {
        return prev
      }

      const next = [...prev]
      next[index] = { ...next[index], count: next[index].count + 1 }
      return next
    })
  }

  const increaseCount = (productId, categoryKey) => {
    setSelectedMenus((prev) =>
      prev.map((item) => {
        if (item.productId !== productId || item.categoryKey !== categoryKey) {
          return item
        }

        const available = getAvailableStock(productId, categoryKey)
        if (item.count >= available) {
          return item
        }

        return { ...item, count: item.count + 1 }
      }),
    )
  }

  const decreaseCount = (productId, categoryKey) => {
    setSelectedMenus((prev) =>
      prev
        .map((item) =>
          item.productId === productId && item.categoryKey === categoryKey
            ? { ...item, count: item.count - 1 }
            : item,
        )
        .filter((item) => item.count > 0),
    )
  }

  const handleRequestPayment = async () => {
    if (selectedMenus.length === 0 || paymentLoading) {
      return
    }

    try {
      setPaymentLoading(true)
      setPaymentErrorMsg('')

      const qtyByProductId = new Map()
      selectedMenus.forEach((menu) => {
        const currentQty = qtyByProductId.get(menu.productId) ?? 0
        qtyByProductId.set(menu.productId, currentQty + menu.count)
      })

      const items = Array.from(qtyByProductId.entries()).map(([productId, qty]) => ({
        productId,
        qty,
      }))

      const prepared = await preparePayment({
        serviceMode,
        items,
      })

      await requestTossCardPayment({
        clientKey: prepared.clientKey,
        amount: normalizeAmount(prepared.amount),
        orderId: prepared.merchantOrderId,
        orderName: prepared.orderName,
        customerKey: prepared.customerKey,
        customerName: sessionStorage.getItem('userName') || 'POS Customer',
        successUrl: `${window.location.origin}/payment/success`,
        failUrl: `${window.location.origin}/payment/fail`,
      })
    } catch (error) {
      setPaymentErrorMsg(getApiErrorMessage(error, '결제 준비에 실패했습니다.'))
      setPaymentLoading(false)
    }
  }

  const start = page * ITEMS_PER_PAGE
  const visibleMenus = selectedMenus.slice(start, start + ITEMS_PER_PAGE)
  const hasPrev = page > 0
  const hasNext = (page + 1) * ITEMS_PER_PAGE < selectedMenus.length
  const totalPrice = selectedMenus.reduce((sum, item) => sum + item.price * item.count, 0)

  return (
    <div className='menu-layout'>
      <div className='menu-main'>
        <div className='menu-display'>
          {visibleMenus.map((menu) => (
            <div key={`${menu.categoryKey}-${menu.productId}`} className='selected-menu'>
              <div>
                <span className='menu-name'>{menu.name}</span>
                <div style={{ fontSize: '16px', marginTop: '4px' }}>
                  {menu.categoryName} | {(menu.price * menu.count).toLocaleString()}원
                </div>
              </div>

              <div className='menu-count'>
                <button type='button' onClick={() => decreaseCount(menu.productId, menu.categoryKey)}>
                  -
                </button>
                <span>{menu.count}</span>
                <button type='button' onClick={() => increaseCount(menu.productId, menu.categoryKey)}>
                  +
                </button>
              </div>
            </div>
          ))}

          <div className='total-price'>총금액: {totalPrice.toLocaleString()}원</div>

          {selectedMenus.length > ITEMS_PER_PAGE && (
            <div className='page-controls'>
              <button type='button' disabled={!hasPrev} onClick={() => setPage((prev) => prev - 1)}>
                이전
              </button>
              <button type='button' disabled={!hasNext} onClick={() => setPage((prev) => prev + 1)}>
                다음
              </button>
            </div>
          )}
        </div>

        <div className='menu-category'>
          <div className='category-buttons'>
            {categories.map((item) => (
              <button
                key={`${item.key}-${item.id ?? 'fallback'}`}
                type='button'
                className={item.key === currentCategory?.key ? 'active' : ''}
                onClick={() => navigate(buildMenuCategoryPath(item))}
              >
                {item.name}
              </button>
            ))}
          </div>

          <div className='menu-grid'>
            {loading && <div className='menu-grid-message'>상품을 불러오는 중입니다...</div>}

            {!loading && catalogErrorMsg && <div className='menu-grid-message error'>{catalogErrorMsg}</div>}

            {!loading && !catalogErrorMsg && categories.length === 0 && (
              <div className='menu-grid-message'>판매 가능한 카테고리가 없습니다.</div>
            )}

            {!loading && !catalogErrorMsg && categories.length > 0 && !currentCategory && (
              <div className='menu-grid-message'>카테고리를 찾는 중입니다...</div>
            )}

            {!loading && !catalogErrorMsg && currentCategory && menus.length === 0 && (
              <div className='menu-grid-message'>선택한 카테고리에 상품이 없습니다.</div>
            )}

            {!loading &&
              !catalogErrorMsg &&
              currentCategory &&
              menus.length > 0 &&
              menus.map((menu) => {
                const isSoldOut = Boolean(menu) && Number(menu.quantity) <= 0

                return (
                  <button
                    key={`${menu.categoryKey}-${menu.productId}`}
                    type='button'
                    className={`menu-button${isSoldOut ? ' soldout' : ''}`}
                    disabled={isSoldOut}
                    onClick={() => selectMenu(menu)}
                  >
                    <ProductCardImage imageUrl={menu.imageUrl} name={menu.name} />
                    <span className='menu-button-name'>{menu.name}</span>
                    <span className='menu-button-price'>{menu.price.toLocaleString()}원</span>
                    <span className={`menu-button-stock${isSoldOut ? ' soldout' : ''}`}>
                      {isSoldOut ? '품절' : `재고 ${menu.quantity}개`}
                    </span>
                  </button>
                )
              })}
          </div>
        </div>
      </div>

      <div className='menu-footer'>
        <div className='service-mode-panel'>
          <div className='service-mode-selector'>
            {SERVICE_MODES.map((option) => (
              <button
                key={option.value}
                type='button'
                className={serviceMode === option.value ? 'active' : ''}
                onClick={() => setServiceMode(option.value)}
                disabled={paymentLoading}
              >
                {option.label}
              </button>
            ))}
          </div>
          {paymentErrorMsg && <div className='pay-error-message'>{paymentErrorMsg}</div>}
        </div>

        <button
          type='button'
          className='pay-btn'
          disabled={selectedMenus.length === 0 || paymentLoading}
          onClick={handleRequestPayment}
        >
          {paymentLoading ? '결제창 여는 중...' : '결제'}
        </button>
        <button type='button' className='back-btn' onClick={() => navigate('/home')} disabled={paymentLoading}>
          이전 화면
        </button>
      </div>
    </div>
  )
}
