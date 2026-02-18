import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import './Menu.css'

const menuData = {
  set: [
    { id: 1, name: '불고기 세트', price: 8500 },
    { id: 2, name: '치즈버거 세트', price: 9000 },
    { id: 3, name: '치킨버거 세트', price: 8800 },
    { id: 4, name: '더블버거 세트', price: 9500 },
  ],
  burger: [
    { id: 1, name: '불고기 버거', price: 4500 },
    { id: 2, name: '치즈 버거', price: 4800 },
    { id: 3, name: '치킨 버거', price: 5000 },
    { id: 4, name: '더블 버거', price: 5500 },
  ],
  side: [
    { id: 1, name: '감자튀김', price: 2500 },
    { id: 2, name: '치즈스틱', price: 3000 },
    { id: 3, name: '너겟', price: 3200 },
    { id: 4, name: '어니언링', price: 3000 },
  ],
  drink: [
    { id: 1, name: '콜라', price: 2000 },
    { id: 2, name: '사이다', price: 2000 },
    { id: 3, name: '아메리카노', price: 2500 },
    { id: 4, name: '오렌지주스', price: 2800 },
  ],
}

const categoryLabels = {
  set: '세트',
  burger: '버거',
  side: '사이드',
  drink: '음료',
}

const MAX_MENU_COUNT = 16
const ITEMS_PER_PAGE = 4

export default function MenuPage() {
  const { category = 'set' } = useParams()
  const navigate = useNavigate()

  const [selectedMenus, setSelectedMenus] = useState([])
  const [page, setPage] = useState(0)

  const menus = menuData[category] ?? []
  const filledMenus = [...menus, ...Array(Math.max(0, MAX_MENU_COUNT - menus.length)).fill(null)]

  const selectMenu = (menu) => {
    setSelectedMenus((prev) => {
      const index = prev.findIndex((item) => item.id === menu.id && item.category === category)

      if (index < 0) {
        return [...prev, { ...menu, category, count: 1 }]
      }

      const next = [...prev]
      next[index] = { ...next[index], count: next[index].count + 1 }
      return next
    })
  }

  const increaseCount = (id, currentCategory) => {
    setSelectedMenus((prev) =>
      prev.map((item) =>
        item.id === id && item.category === currentCategory
          ? { ...item, count: item.count + 1 }
          : item,
      ),
    )
  }

  const decreaseCount = (id, currentCategory) => {
    setSelectedMenus((prev) =>
      prev
        .map((item) =>
          item.id === id && item.category === currentCategory
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
            <div key={`${menu.category}-${menu.id}`} className='selected-menu'>
              <div>
                <span className='menu-name'>{menu.name}</span>
                <div style={{ fontSize: '16px', marginTop: '4px' }}>
                  금액: {(menu.price * menu.count).toLocaleString()}원
                </div>
              </div>

              <div className='menu-count'>
                <button type='button' onClick={() => decreaseCount(menu.id, menu.category)}>
                  -
                </button>
                <span>{menu.count}</span>
                <button type='button' onClick={() => increaseCount(menu.id, menu.category)}>
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
            {Object.entries(categoryLabels).map(([key, label]) => (
              <button key={key} type='button' onClick={() => navigate(`/menu/${key}`)}>
                {label}
              </button>
            ))}
          </div>

          <div className='menu-grid'>
            {filledMenus.map((menu, index) => (
              <button
                key={`${menu?.id ?? 'empty'}-${index}`}
                type='button'
                className='menu-button'
                disabled={!menu}
                onClick={() => menu && selectMenu(menu)}
              >
                {menu ? menu.name : ''}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className='menu-footer'>
        <button type='button' className='back-btn' onClick={() => navigate('/home')}>
          이전 화면
        </button>

        <button type='button' className='pay-btn'>
          결제
        </button>
      </div>
    </div>
  )
}
