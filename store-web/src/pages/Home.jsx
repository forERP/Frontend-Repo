import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { buildMenuCategoryPath, fetchPosCatalog } from '../api/productApi'
import { getApiErrorMessage } from '../utils/posUtils'
import './css/MenuButtons.css'

const CATALOG_REFRESH_INTERVAL_MS = 5000

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
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    let mounted = true

    const loadCatalog = async ({ background = false } = {}) => {
      const storeId = Number(sessionStorage.getItem('storeId'))

      if (!Number.isInteger(storeId) || storeId <= 0) {
        if (mounted) {
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

        if (!mounted) {
          return
        }

        setCategories(loadedCategories)
      } catch (error) {
        if (!mounted) {
          return
        }

        setCategories([])
        setErrorMsg(getApiErrorMessage(error, '카테고리 목록을 불러오지 못했습니다.'))
      } finally {
        if (mounted && !background) {
          setLoading(false)
        }
      }
    }

    loadCatalog()

    const intervalId = window.setInterval(() => {
      loadCatalog({ background: true })
    }, CATALOG_REFRESH_INTERVAL_MS)

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
      mounted = false
      window.clearInterval(intervalId)
      window.removeEventListener('focus', handleFocus)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [])

  return (
    <div className='menu-container'>
      <div className='menu-top'>
        {loading && <div className='menu-top-message'>카테고리를 불러오는 중입니다...</div>}

        {!loading && errorMsg && <div className='menu-top-message error'>{errorMsg}</div>}

        {!loading && !errorMsg && categories.length === 0 && (
          <div className='menu-top-message'>판매 가능한 카테고리가 없습니다.</div>
        )}

        {!loading &&
          !errorMsg &&
          categories.map((category) => (
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
