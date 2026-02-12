import { useEffect, useState } from 'react'
import './Header.css'

export default function Header() {
  const [time, setTime] = useState(new Date().toLocaleTimeString('ko-KR'));

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date().toLocaleTimeString('ko-KR'));
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  return (
    <div className="header-container">
      <div className="header-left">지점이름</div>
      <div className="header-center">관리자</div>
      <div className="header-right">{time}</div>
    </div>
  );
}