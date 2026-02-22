import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../lib/api'
import { getSessionUser, isStoreAdminUser } from '../../utils/auth'
import './Attendance.css'

const STAFF_ROLES = new Set(['STORE_HALL_STAFF', 'STORE_KITCHEN_STAFF'])
const ACTIVE_STATUS = 'ACTIVE'

const ATTENDANCE_STATUS_META = {
  WORK: { label: '근무중', color: '#16a34a' },
  OUT: { label: '퇴근', color: '#2563eb' },
  LEAVE: { label: '휴가', color: '#ca8a04' },
  ABSENT: { label: '결근', color: '#dc2626' },
}

const toText = (value) => String(value ?? '').trim()

const formatLocalDate = (date = new Date()) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const normalizeAttendanceStatus = (value) => {
  const key = toText(value).toUpperCase()
  if (!key) {
    return 'ABSENT'
  }
  return ATTENDANCE_STATUS_META[key] ? key : 'ABSENT'
}

export default function Attendance() {
  const sessionUser = getSessionUser()
  const isStoreAdmin = isStoreAdminUser(sessionUser)
  const scopedStoreId = isStoreAdmin && sessionUser?.storeId ? Number(sessionUser.storeId) : null

  const navigate = useNavigate()

  const [employees, setEmployees] = useState([])
  const [statusByUserId, setStatusByUserId] = useState({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const fetchTodayStatusByUsers = useCallback(async (users) => {
    const today = formatLocalDate()
    const storeIds = [
      ...new Set(
        users
          .map((employee) => Number(employee.storeId))
          .filter((storeId) => Number.isFinite(storeId) && storeId > 0),
      ),
    ]

    if (storeIds.length === 0) {
      return {}
    }

    const requests = await Promise.allSettled(
      storeIds.map((storeId) =>
        api.get('/api/attendance/history', {
          params: {
            storeId,
            startDate: today,
            endDate: today,
          },
        }),
      ),
    )

    const nextStatusByUserId = {}
    requests.forEach((result) => {
      if (result.status !== 'fulfilled') {
        return
      }

      const history = Array.isArray(result.value?.data) ? result.value.data : []
      history.forEach((item) => {
        const userId = Number(item?.userId)
        if (!Number.isFinite(userId)) {
          return
        }
        nextStatusByUserId[userId] = normalizeAttendanceStatus(item?.status)
      })
    })

    users.forEach((employee) => {
      const userId = Number(employee.id)
      if (!Number.isFinite(userId)) {
        return
      }

      if (!nextStatusByUserId[userId]) {
        nextStatusByUserId[userId] = 'ABSENT'
      }
    })

    return nextStatusByUserId
  }, [])

  const loadAttendanceSummary = useCallback(async () => {
    try {
      setLoading(true)
      setError('')

      const response = await api.get('/api/users')
      const users = Array.isArray(response.data) ? response.data : []

      const staffUsers = users
        .filter((user) => STAFF_ROLES.has(toText(user?.role)))
        .filter((user) => toText(user?.status) === ACTIVE_STATUS)
        .filter((user) => {
          if (scopedStoreId == null) {
            return true
          }
          return Number(user?.storeId) === scopedStoreId
        })
        .sort((a, b) => toText(a?.name).localeCompare(toText(b?.name), 'ko'))

      setEmployees(staffUsers)
      const nextStatusByUserId = await fetchTodayStatusByUsers(staffUsers)
      setStatusByUserId(nextStatusByUserId)
    } catch (err) {
      console.error(err)
      setError('근태 목록 조회에 실패했습니다.')
      setEmployees([])
      setStatusByUserId({})
    } finally {
      setLoading(false)
    }
  }, [fetchTodayStatusByUsers, scopedStoreId])

  useEffect(() => {
    loadAttendanceSummary()
  }, [loadAttendanceSummary])

  return (
    <div className='attendance-page'>
      <div className='attendance-page-content'>
        <div className='page-header'>
          <h1 className='page-title'>근태 관리</h1>
        </div>

        {error && <div className='error-message'>{error}</div>}

        <div className='card list-card'>
          <div className='table-toolbar'>
            <span className='total-count'>총 {employees.length.toLocaleString('ko-KR')}명</span>
          </div>

          <table className='erp-table list-table attendance-list-table'>
            <thead>
              <tr>
                <th>직원코드</th>
                <th>직원이름</th>
                <th>매장</th>
                <th>현재 상태</th>
                <th className='actions-col'>상세</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className='empty-cell'>
                    로딩 중...
                  </td>
                </tr>
              ) : employees.length === 0 ? (
                <tr>
                  <td colSpan={5} className='empty-cell'>
                    조회 결과가 없습니다.
                  </td>
                </tr>
              ) : (
                employees.map((employee) => {
                  const statusKey = normalizeAttendanceStatus(statusByUserId[employee.id])
                  const statusMeta = ATTENDANCE_STATUS_META[statusKey]

                  return (
                    <tr key={employee.id}>
                      <td title={employee.employeeCode || '-'}>{employee.employeeCode || '-'}</td>
                      <td title={employee.name || '-'}>{employee.name || '-'}</td>
                      <td title={`${employee.storeName || '-'}${employee.storeCode ? ` (${employee.storeCode})` : ''}`}>
                        {employee.storeName || '-'}
                        {employee.storeCode ? ` (${employee.storeCode})` : ''}
                      </td>
                      <td>
                        <span className='status-badge' style={{ backgroundColor: statusMeta.color, color: '#fff' }}>
                          {statusMeta.label}
                        </span>
                      </td>
                      <td className='actions-cell'>
                        <button type='button' className='detail-btn' onClick={() => navigate(`/attendance/${employee.id}`)}>
                          상세보기
                        </button>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
