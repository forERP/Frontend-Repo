import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { subscribePosRealtime } from '../api/realtimeApi'
import { buildMenuCategoryPath, fetchPosCatalog } from '../api/productApi'
import { getApiErrorMessage } from '../utils/posUtils'
import './css/MenuButtons.css'

const CATEGORIES_PER_PAGE = 4

const CategoryCardImage = ({ imageUrl = '', name = '' }) => (
  <div className='menu-btn-image-wrap'>
    {imageUrl ? (
      <img src={imageUrl} alt={`${name} 카테고리 이미지`} className='menu-btn-image' loading='lazy' />
    ) : (
      <div className='menu-btn-image-fallback'>NO IMAGE</div>
    )}
  </div>
)

export default function Home() {
  const navigate = useNavigate()
  const mountedRef = useRef(true)

  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState('')
  const [categoryPage, setCategoryPage] = useState(0)

  const totalCategoryPages = Math.max(1, Math.ceil(categories.length / CATEGORIES_PER_PAGE))
  const pageStartIndex = categoryPage * CATEGORIES_PER_PAGE
  const pagedCategories = categories.slice(pageStartIndex, pageStartIndex + CATEGORIES_PER_PAGE)
  const hasPrevCategoryPage = categoryPage > 0
  const hasNextCategoryPage = categoryPage < totalCategoryPages - 1

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
        setErrorMsg('매장 정보를 찾지 못했습니다. 다시 로그인해 주세요.')
        setLoading(false)
      }
      return
    }

    try {
      if (!background) {
        setLoading(true)
      }

      setErrorMsg('')
      const { categories: loadedCategories } = await fetchPosCatalog(storeId)
      if (!mountedRef.current) {
        return
      }

      setCategories(loadedCategories)
    } catch (error) {
      if (!mountedRef.current) {
        return
      }
      setCategories([])
      setErrorMsg(getApiErrorMessage(error, '카테고리 목록을 불러오지 못했습니다.'))
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
        if (type === 'inventory.changed' || type === 'connected') {
          loadCatalog({ background: true })
        }
      },
    })

    return unsubscribe
  }, [loadCatalog])

  useEffect(() => {
    setCategoryPage((prevPage) => {
      const maxPage = Math.max(0, totalCategoryPages - 1)
      return prevPage > maxPage ? maxPage : prevPage
    })
  }, [totalCategoryPages])

  return (
    <div className='menu-container'>
      <div className='menu-top'>
        {loading && <div className='menu-top-message'>카테고리를 불러오는 중입니다...</div>}

        {!loading && errorMsg && <div className='menu-top-message error'>{errorMsg}</div>}

        {!loading && !errorMsg && categories.length === 0 && (
          <div className='menu-top-message'>판매 가능한 카테고리가 없습니다.</div>
        )}

        {!loading && !errorMsg && categories.length > 0 && (
          <>
            <div className='menu-top-grid'>
              {pagedCategories.map((category) => (
                <button
                  key={`${category.key}-${category.id ?? 'fallback'}`}
                  className='menu-btn category-btn'
                  onClick={() => navigate(buildMenuCategoryPath(category))}
                >
                  <CategoryCardImage imageUrl={category.imageUrl} name={category.name} />
                  <strong className='menu-btn-title'>{category.name}</strong>
                  <span className='menu-btn-description'>
                    {category.description
                      ? `${category.description} (${category.productCount}개)`
                      : `${category.productCount}개 상품`}
                  </span>
                </button>
              ))}
            </div>

            {totalCategoryPages > 1 && (
              <div className='menu-top-pagination'>
                <button
                  type='button'
                  disabled={!hasPrevCategoryPage}
                  onClick={() => setCategoryPage((prevPage) => Math.max(0, prevPage - 1))}
                >
                  이전
                </button>
                <span>
                  {categoryPage + 1} / {totalCategoryPages}
                </span>
                <button
                  type='button'
                  disabled={!hasNextCategoryPage}
                  onClick={() =>
                    setCategoryPage((prevPage) => Math.min(totalCategoryPages - 1, prevPage + 1))
                  }
                >
                  다음
                </button>
              </div>
            )}
          </>
        )}
      </div>

      <div className='menu-bottom'>
        <button className='menu-btn admin' onClick={() => navigate('/manager')}>
          관리자
        </button>
        <button className='menu-btn close' onClick={() => navigate('/closed')}>
          마감
        </button>
      </div>
    </div>
  )
}
