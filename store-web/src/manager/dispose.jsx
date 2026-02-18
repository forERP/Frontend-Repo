import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import '../pages/Menu/Menu.css'

const disposeItems = [
  { id: 1, name: '유통기한 임박 버거', price: 4500 },
  { id: 2, name: '재고 과다 음료', price: 1800 },
  { id: 3, name: '반품 예정 사이드', price: 2000 },
  { id: 4, name: '미판매 세트', price: 7000 },
]

const SLOTS = 16

export default function DisposePage() {
  const navigate = useNavigate()
  const [selectedMenus, setSelectedMenus] = useState([])

  const fillItems = useMemo(
    () => [...disposeItems, ...Array(Math.max(0, SLOTS - disposeItems.length)).fill(null)],
    [],
  )

  const onSelect = (menu) => {
    setSelectedMenus((prev) => {
      const index = prev.findIndex((item) => item.id === menu.id)
      if (index < 0) {
        return [...prev, { ...menu, count: 1 }]
      }

      const next = [...prev]
      next[index] = { ...next[index], count: next[index].count + 1 }
      return next
    })
  }

  const onChangeCount = (id, delta) => {
    setSelectedMenus((prev) =>
      prev
        .map((item) => (item.id === id ? { ...item, count: item.count + delta } : item))
        .filter((item) => item.count > 0),
    )
  }

  const total = selectedMenus.reduce((sum, item) => sum + item.price * item.count, 0)

  return (
    <div className='menu-layout'>
      <div className='menu-main'>
        <div className='menu-display'>
          {selectedMenus.map((menu) => (
            <div key={menu.id} className='selected-menu'>
              <div>
                <span className='menu-name'>{menu.name}</span>
                <div style={{ fontSize: '16px', marginTop: '4px' }}>
                  금액: {(menu.price * menu.count).toLocaleString()}원
                </div>
              </div>

              <div className='menu-count'>
                <button type='button' onClick={() => onChangeCount(menu.id, -1)}>
                  -
                </button>
                <span>{menu.count}</span>
                <button type='button' onClick={() => onChangeCount(menu.id, 1)}>
                  +
                </button>
              </div>
            </div>
          ))}

          <div className='total-price'>총금액: {total.toLocaleString()}원</div>
        </div>

        <div className='menu-category'>
          <div className='category-buttons'>
            <button type='button'>폐기 대상</button>
            <button type='button'>세트</button>
            <button type='button'>단품</button>
            <button type='button'>기타</button>
          </div>

          <div className='menu-grid'>
            {fillItems.map((menu, idx) => (
              <button
                key={`${menu?.id ?? 'empty'}-${idx}`}
                type='button'
                className='menu-button'
                disabled={!menu}
                onClick={() => menu && onSelect(menu)}
              >
                {menu?.name ?? ''}
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
          폐기 처리
        </button>
      </div>
    </div>
  )
}

