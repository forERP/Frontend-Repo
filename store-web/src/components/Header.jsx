import { useEffect, useState } from 'react'
import { POS_SESSION_UPDATED_EVENT } from '../api/authApi'
import './Header.css'

function readHeaderLabels() {
  const storeName = sessionStorage.getItem('storeName')
  const storeCode = sessionStorage.getItem('storeCode')
  const userName = sessionStorage.getItem('userName')
  const employeeCode = sessionStorage.getItem('employeeCode')

  const storeLabel =
    storeName && storeCode
      ? `${storeName}(${storeCode})`
      : storeCode
      ? `매장(${storeCode})`
      : 'POS'

  const userLabel =
    userName && employeeCode
      ? `${userName}(${employeeCode})`
      : userName
      ? userName
      : '직원'

  return { storeLabel, userLabel }
}

export default function Header() {
  const [time, setTime] = useState(new Date().toLocaleTimeString('ko-KR'))
  const [labels, setLabels] = useState(readHeaderLabels)

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date().toLocaleTimeString('ko-KR'))
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    const syncLabels = () => {
      setLabels(readHeaderLabels())
    }

    window.addEventListener(POS_SESSION_UPDATED_EVENT, syncLabels)
    window.addEventListener('storage', syncLabels)

    return () => {
      window.removeEventListener(POS_SESSION_UPDATED_EVENT, syncLabels)
      window.removeEventListener('storage', syncLabels)
    }
  }, [])

  return (
    <div className='header-container'>
      <div className='header-left'>{labels.storeLabel}</div>
      <div className='header-center'>{labels.userLabel}</div>
      <div className='header-right'>{time}</div>
    </div>
  )
}
