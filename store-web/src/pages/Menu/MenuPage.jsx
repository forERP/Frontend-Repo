import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  buildMenuCategoryPath,
  fetchPosCatalog,
  filterProductsByCategory,
  resolveMenuCategory,
} from '../../api/productApi'
import { getApiErrorMessage } from '../../utils/posUtils'
import './Menu.css'

const MAX_MENU_COUNT = 16
const ITEMS_PER_PAGE = 4

export default function MenuPage() {
  const { category = '' } = useParams()
  const navigate = useNavigate()

  const [selectedMenus, setSelectedMenus] = useState([])
  const [page, setPage] = useState(0)
  const [categories, setCategories] = useState([])
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    let mounted = true

    const loadCatalog = async () => {
      const storeId = Number(sessionStorage.getItem('storeId'))

      if (!Number.isInteger(storeId) || storeId <= 0) {
        if (mounted) {
          setCategories([])
          setProducts([])
          setErrorMsg('매장 정보를 찾지 못했습니다. 다시 로그인해 주세요.')
          setLoading(false)
        }
        return
      }

      try {
        setLoading(true)
        setErrorMsg('')

        const catalogData = await fetchPosCatalog(storeId)

        if (!mounted) {
          return
        }

        setCategories(catalogData.categories)
        setProducts(catalogData.products)
      } catch (error) {
        if (!mounted) {
          return
        }

        setCategories([])
        setProducts([])
        setErrorMsg(getApiErrorMessage(error, '상품 목록을 불러오지 못했습니다.'))
      } finally {
        if (mounted) {
          setLoading(false)
        }
      }
    }

    loadCatalog()

    return () => {
      mounted = false
    }
  }, [])

  const currentCategory = useMemo(
    () => resolveMenuCategory(categories, category),
    [categories, category],
  )

  const menus = useMemo(
    () => filterProductsByCategory(products, currentCategory),
    [products, currentCategory],
  )

  const filledMenus = useMemo(
    () => [...menus, ...Array(Math.max(0, MAX_MENU_COUNT - menus.length)).fill(null)],
    [menus],
  )

  useEffect(() => {
    if (loading || errorMsg || categories.length === 0 || currentCategory) {
      return
    }

    navigate(buildMenuCategoryPath(categories[0]), { replace: true })
  }, [loading, errorMsg, categories, currentCategory, navigate])

  useEffect(() => {
    setPage(0)
  }, [currentCategory?.key])

  useEffect(() => {
    const maxPage = Math.max(0, Math.ceil(selectedMenus.length / ITEMS_PER_PAGE) - 1)

    if (page > maxPage) {
      setPage(maxPage)
    }
  }, [page, selectedMenus.length])

  const selectMenu = (menu) => {
    if (!menu || !currentCategory) {
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

      const next = [...prev]
      next[index] = { ...next[index], count: next[index].count + 1 }
      return next
    })
  }

  const increaseCount = (productId, categoryKey) => {
    setSelectedMenus((prev) =>
      prev.map((item) =>
        item.productId === productId && item.categoryKey === categoryKey
          ? { ...item, count: item.count + 1 }
          : item,
      ),
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

            {!loading && errorMsg && <div className='menu-grid-message error'>{errorMsg}</div>}

            {!loading && !errorMsg && categories.length === 0 && (
              <div className='menu-grid-message'>판매 가능한 카테고리가 없습니다.</div>
            )}

            {!loading && !errorMsg && categories.length > 0 && !currentCategory && (
              <div className='menu-grid-message'>카테고리를 찾는 중입니다...</div>
            )}

            {!loading && !errorMsg && currentCategory && menus.length === 0 && (
              <div className='menu-grid-message'>선택한 카테고리에 상품이 없습니다.</div>
            )}

            {!loading &&
              !errorMsg &&
              currentCategory &&
              menus.length > 0 &&
              filledMenus.map((menu, index) => (
                <button
                  key={`${menu?.productId ?? 'empty'}-${index}`}
                  type='button'
                  className='menu-button'
                  disabled={!menu}
                  onClick={() => selectMenu(menu)}
                >
                  {menu ? (
                    <>
                      <span>{menu.name}</span>
                      <span className='menu-button-price'>{menu.price.toLocaleString()}원</span>
                    </>
                  ) : (
                    ''
                  )}
                </button>
              ))}
          </div>
        </div>
      </div>

      <div className='menu-footer'>
        <button type='button' className='back-btn' onClick={() => navigate('/home')}>
          이전 화면
        </button>

        <button type='button' className='pay-btn' disabled={selectedMenus.length === 0}>
          결제
        </button>
      </div>
    </div>
  )
}
