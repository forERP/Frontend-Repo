import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import api from '../../lib/api'
import { getSessionUser, isStoreAdminUser } from '../../utils/auth'
import './AttendanceDetail.css'

export default function AttendanceDetail() {
  const { userId } = useParams()
  const navigate = useNavigate()
  const sessionUser = getSessionUser()
  const isStoreAdmin = isStoreAdminUser(sessionUser)
  const scopedStoreId = isStoreAdmin && sessionUser?.storeId ? Number(sessionUser.storeId) : null

  const [employee, setEmployee] = useState(null)
  const [history, setHistory] = useState([])
  const [error, setError] = useState('')
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7))

  useEffect(() => {
    let active = true

    const loadEmployee = async () => {
      try {
        const response = await api.get(`/api/users/${userId}`)
        if (!active) {
          return
        }

        if (scopedStoreId != null && Number(response.data?.storeId) !== scopedStoreId) {
          setError('본인 매장 직원만 조회할 수 있습니다.')
          setEmployee(null)
          return
        }

        setError('')
        setEmployee(response.data)
      } catch (err) {
        console.error(err)
        if (!active) {
          return
        }
        setError('직원 정보를 불러오지 못했습니다.')
        setEmployee(null)
      }
    }

    void loadEmployee()

    return () => {
      active = false
    }
  }, [scopedStoreId, userId])

  useEffect(() => {
    if (!employee?.storeId) {
      return
    }

    let active = true

    const loadHistory = async () => {
      try {
        const [year, monthValue] = month.split('-')
        const lastDay = new Date(year, monthValue, 0).getDate()

        const startDate = `${year}-${monthValue}-01`
        const endDate = `${year}-${monthValue}-${String(lastDay).padStart(2, '0')}`

        const response = await api.get('/api/attendance/history', {
          params: {
            storeId: employee.storeId,
            startDate,
            endDate,
          },
        })
        if (!active) {
          return
        }

        const filtered = Array.isArray(response.data)
          ? response.data.filter((item) => String(item.userId) === String(userId))
          : []
        setHistory(filtered)
      } catch (err) {
        console.error(err)
        if (!active) {
          return
        }
        setError('근태 기록을 불러오지 못했습니다.')
        setHistory([])
      }
    }

    void loadHistory()

    return () => {
      active = false
    }
  }, [employee?.storeId, month, userId])

  const formatTime = (time) => (time ? new Date(time).toLocaleTimeString('ko-KR') : '-')

  const getStatusLabel = (status) => {
    switch (status) {
      case 'WORK':
        return '근무중'
      case 'OUT':
        return '퇴근'
      case 'LEAVE':
        return '휴가'
      case 'ABSENT':
        return '결근'
      default:
        return '-'
    }
  }

  if (!employee) {
    return <div style={{ textAlign: 'center', padding: '50px' }}>{error || '로딩중...'}</div>
  }

  return (
    <div className='detail-page'>
      <div className='detail-container'>
        <h1>근태 상세</h1>
        {error && <div className='error-message'>{error}</div>}

        <div className='employee-card'>
          <p>
            <strong>직원 코드:</strong> {employee.employeeCode || '-'}
          </p>
          <p>
            <strong>이름:</strong> {employee.name || '-'}
          </p>
          <p>
            <strong>소속 매장:</strong> {employee.storeName || '-'}
          </p>
        </div>

        <div className='month-selector'>
          <label>조회 월</label>
          <input type='month' value={month} onChange={(event) => setMonth(event.target.value)} />
        </div>

        <div className='history-card'>
          <table className='history-table'>
            <thead>
              <tr>
                <th>근무 날짜</th>
                <th>출근</th>
                <th>퇴근</th>
                <th>상태</th>
              </tr>
            </thead>
            <tbody>
              {history.length === 0 ? (
                <tr>
                  <td colSpan='4' style={{ textAlign: 'center', padding: '20px', color: '#888' }}>
                    근태 기록이 없습니다.
                  </td>
                </tr>
              ) : (
                history.map((item) => (
                  <tr key={item.attendanceId}>
                    <td>{item.workDate}</td>
                    <td>{formatTime(item.clockIn)}</td>
                    <td>{formatTime(item.clockOut)}</td>
                    <td>
                      <span className={`status-badge status-${String(item.status || '').toLowerCase()}`}>
                        {getStatusLabel(item.status)}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <button className='leave-btn' onClick={() => navigate(`/attendance/${userId}/leave`)}>
          휴가 등록
        </button>
      </div>
    </div>
  )
}
