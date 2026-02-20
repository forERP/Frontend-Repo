import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { clearPosSession, logoutPos } from '../api/authApi'
import { getApiErrorMessage, maskCode } from '../utils/posUtils'
import './css/Login.css'

const STORE_CODE_LENGTH = 3
const EMPLOYEE_CODE_LENGTH = 4

export default function Closed() {
  const navigate = useNavigate()
  const [storeCode, setStoreCode] = useState(sessionStorage.getItem('storeCode') || '')
  const [employeeCode, setEmployeeCode] = useState('')
  const [activeField, setActiveField] = useState(
    (sessionStorage.getItem('storeCode') || '').length >= STORE_CODE_LENGTH ? 'employee' : 'store',
  )
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    if (!sessionStorage.getItem('accessToken')) {
      navigate('/login', { replace: true })
    }
  }, [navigate])

  const handleNumberClick = (num) => {
    if (loading) {
      return
    }

    setErrorMsg('')

    if (activeField === 'store') {
      if (storeCode.length >= STORE_CODE_LENGTH) {
        return
      }

      const next = `${storeCode}${num}`
      setStoreCode(next)
      if (next.length === STORE_CODE_LENGTH) {
        setActiveField('employee')
      }
      return
    }

    if (employeeCode.length >= EMPLOYEE_CODE_LENGTH) {
      return
    }

    setEmployeeCode((prev) => `${prev}${num}`)
  }

  const handleDelete = () => {
    if (loading) {
      return
    }

    setErrorMsg('')

    if (activeField === 'store') {
      setStoreCode((prev) => prev.slice(0, -1))
      return
    }

    setEmployeeCode((prev) => prev.slice(0, -1))
  }

  const handleClose = async () => {
    if (loading) {
      return
    }

    if (storeCode.length !== STORE_CODE_LENGTH || employeeCode.length !== EMPLOYEE_CODE_LENGTH) {
      setErrorMsg('매장 코드는 3자리, 관리자 코드는 4자리로 입력해 주세요.')
      return
    }

    try {
      setLoading(true)
      setErrorMsg('')

      await logoutPos(storeCode, employeeCode)

      clearPosSession()
      navigate('/', { replace: true })
    } catch (error) {
      setErrorMsg(getApiErrorMessage(error, '마감 처리에 실패했습니다. 코드를 확인해 주세요.'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className='login-container'>
      <div className='login-left'>
        <button
          type='button'
          className={`input-row ${activeField === 'store' ? 'active' : ''}`}
          onClick={() => setActiveField('store')}
        >
          <span className='label'>매장 코드</span>
          <span className='value'>{maskCode(storeCode, STORE_CODE_LENGTH)}</span>
        </button>

        <button
          type='button'
          className={`input-row ${activeField === 'employee' ? 'active' : ''}`}
          onClick={() => setActiveField('employee')}
        >
          <span className='label'>관리자 코드</span>
          <span className='value'>{maskCode(employeeCode, EMPLOYEE_CODE_LENGTH)}</span>
        </button>

        {errorMsg && <p className='error-message'>{errorMsg}</p>}
      </div>

      <div className='login-right'>
        <div className='keypad'>
          {[7, 8, 9, 4, 5, 6, 1, 2, 3].map((num) => (
            <button
              key={num}
              type='button'
              className='key'
              onClick={() => handleNumberClick(num)}
              disabled={loading}
            >
              {num}
            </button>
          ))}

          <button type='button' className='key delete' onClick={handleDelete} disabled={loading}>
            삭제
          </button>

          <button type='button' className='key' onClick={() => handleNumberClick(0)} disabled={loading}>
            0
          </button>

          <button type='button' className='key enter' onClick={handleClose} disabled={loading}>
            {loading ? '처리 중' : '마감'}
          </button>

          <button type='button' className='key back' onClick={() => navigate('/home')} disabled={loading}>
            취소
          </button>
        </div>
      </div>
    </div>
  )
}
