import { useNavigate } from 'react-router-dom'
import {
  MdArrowBack,
  MdDeleteOutline,
  MdOutlineReceiptLong,
  MdOutlineRestaurant,
  MdOutlineWorkHistory,
  MdSwapHoriz,
} from 'react-icons/md'
import './MenuButtons.css'

const MENU_ITEMS = [
  {
    path: '/receipt',
    label: '주문',
    description: '주문 관리',
    icon: MdOutlineReceiptLong,
  },
  {
    path: '/work',
    label: '근태',
    description: '출퇴근',
    icon: MdOutlineWorkHistory,
  },
  {
    path: '/change',
    label: '교대',
    description: '매니저 변경',
    icon: MdSwapHoriz,
  },
  {
    path: '/meal',
    label: '식사',
    description: '급식',
    icon: MdOutlineRestaurant,
  },
  {
    path: '/dispose',
    label: '폐기',
    description: '폐기',
    icon: MdDeleteOutline,
    className: 'manager-danger',
  },
  {
    path: '/home',
    label: '이전',
    description: '돌아가기',
    icon: MdArrowBack,
    className: 'manager-back',
  },
]

export default function ManagerMenu() {
  const navigate = useNavigate()

  return (
    <div className='manager-menu-container'>
      {MENU_ITEMS.map((item) => {
        const Icon = item.icon

        return (
          <button
            key={item.path}
            type='button'
            className={`manager-menu-btn ${item.className ?? ''}`.trim()}
            onClick={() => navigate(item.path)}
          >
            <Icon className='manager-menu-icon' aria-hidden='true' />
            <strong className='manager-menu-label'>{item.label}</strong>
            <span>{item.description}</span>
          </button>
        )
      })}
    </div>
  )
}
