import { useNavigate } from 'react-router-dom'
import './css/MenuButtons.css'

export default function Home() {
  const navigate = useNavigate()

  return (
    <div className='menu-container'>
      <div className='menu-top'>
        <button className='menu-btn' onClick={() => navigate('/menu/set')}>
          세트 메뉴 <span>햄버거 + 사이드 + 음료</span>
        </button>

        <button className='menu-btn' onClick={() => navigate('/menu/burger')}>
          버거 <span>단품 버거</span>
        </button>

        <button className='menu-btn' onClick={() => navigate('/menu/side')}>
          사이드 <span>튀김/스낵</span>
        </button>

        <button className='menu-btn' onClick={() => navigate('/menu/drink')}>
          음료 <span>탄산/커피/주스</span>
        </button>
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
