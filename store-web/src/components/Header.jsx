import { useEffect, useState } from 'react'
import './Header.css'

export default function Header() {
  const [time, setTime] = useState(getCurrentTime())

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(getCurrentTime())
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  return (
    <div className="header-container">
      <div className="header-left">지점이름</div>
      <div className="header-center">관리자</div>
      <div className="header-right">{time}</div>
    </div>
  )
}

/* 시간 포맷 함수 */
function getCurrentTime() {
  const now = new Date()
  const hh = String(now.getHours()).padStart(2, '0')
  const mm = String(now.getMinutes()).padStart(2, '0')
  const ss = String(now.getSeconds()).padStart(2, '0')
  return `${hh}:${mm}:${ss}`
}