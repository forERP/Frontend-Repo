import { useCallback, useEffect, useMemo, useState } from 'react'
import api from '../../lib/api'
import { getSessionUser, isStoreAdminUser } from '../../utils/auth'
import './Salary.css'

const EMPLOYMENT_OPTIONS = [
  { value: 'HOURLY', label: '시급직' },
  { value: 'MONTHLY', label: '월급직' },
]

const getCurrentYearMonth = () => {
  const now = new Date()
  return {
    year: String(now.getFullYear()),
    month: String(now.getMonth() + 1).padStart(2, '0'),
  }
}

const getDateAfterOneMonth = () => {
  const nextMonth = new Date()
  nextMonth.setMonth(nextMonth.getMonth() + 1)
  return nextMonth.toISOString().slice(0, 10)
}

const formatNumber = (value) => {
  if (value === null || value === undefined || Number.isNaN(Number(value))) {
    return '-'
  }
  return new Intl.NumberFormat('ko-KR').format(Number(value))
}

const toText = (value) => String(value ?? '').trim()

const normalizeUsers = (list, scopedStoreId) => {
  const users = Array.isArray(list) ? list : []

  return users
    .filter((user) => {
      if (scopedStoreId == null) {
        return true
      }
      return Number(user?.storeId) === scopedStoreId
    })
    .filter((user) => toText(user?.employeeCode) || toText(user?.name))
    .sort((a, b) => {
      const byName = toText(a?.name).localeCompare(toText(b?.name), 'ko')
      if (byName !== 0) {
        return byName
      }
      return toText(a?.employeeCode).localeCompare(toText(b?.employeeCode), 'ko')
    })
}

const findUsersByKeyword = (users, keyword) => {
  const query = toText(keyword)
  const loweredQuery = query.toLowerCase()

  if (!query) {
    return []
  }

  return users.filter((user) => {
    const employeeCode = toText(user?.employeeCode)
    const userName = toText(user?.name)

    return employeeCode.toLowerCase().includes(loweredQuery) || userName.toLowerCase().includes(loweredQuery)
  })
}

export default function Salary() {
  const sessionUser = getSessionUser()
  const isStoreAdmin = isStoreAdminUser(sessionUser)
  const scopedStoreId = isStoreAdmin && sessionUser?.storeId ? Number(sessionUser.storeId) : null

  const { year: currentYear, month: currentMonth } = useMemo(getCurrentYearMonth, [])
  const minPaymentDate = useMemo(getDateAfterOneMonth, [])

  const [registerForm, setRegisterForm] = useState({
    employeeKeyword: '',
    employmentType: 'HOURLY',
    amount: '',
    paymentDate: '',
  })

  const [payrollForm, setPayrollForm] = useState({
    employeeKeyword: '',
    year: currentYear,
    month: currentMonth,
  })

  const [users, setUsers] = useState([])
  const [payroll, setPayroll] = useState(null)
  const [usersLoading, setUsersLoading] = useState(false)
  const [registerLoading, setRegisterLoading] = useState(false)
  const [payrollLoading, setPayrollLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  const loadUsers = useCallback(async () => {
    try {
      setUsersLoading(true)
      const response = await api.get('/api/users')
      const normalized = normalizeUsers(response.data, scopedStoreId)
      setUsers(normalized)
      return normalized
    } catch (error) {
      console.error(error)
      throw new Error('직원 목록을 불러오지 못했습니다.')
    } finally {
      setUsersLoading(false)
    }
  }, [scopedStoreId])

  useEffect(() => {
    loadUsers().catch((error) => {
      setErrorMessage(error.message || '직원 목록을 불러오지 못했습니다.')
    })
  }, [loadUsers])

  const resolveUserFromKeyword = useCallback(
    async (keyword) => {
      const query = toText(keyword)
      if (!query) {
        throw new Error('직원 코드 또는 직원명을 입력해 주세요.')
      }

      const source = users.length > 0 ? users : await loadUsers()
      if (source.length === 0) {
        throw new Error('검색 가능한 직원이 없습니다.')
      }

      const loweredQuery = query.toLowerCase()

      const exactCodeMatch = source.find(
        (user) => toText(user?.employeeCode).toLowerCase() === loweredQuery,
      )
      if (exactCodeMatch) {
        return exactCodeMatch
      }

      const exactNameMatches = source.filter((user) => toText(user?.name) === query)
      if (exactNameMatches.length === 1) {
        return exactNameMatches[0]
      }

      const partialMatches = findUsersByKeyword(source, query)
      if (partialMatches.length === 1) {
        return partialMatches[0]
      }
      if (partialMatches.length === 0) {
        throw new Error('일치하는 직원이 없습니다. 직원 코드 또는 직원명을 확인해 주세요.')
      }

      throw new Error('동일한 이름/조건의 직원이 여러 명입니다. 직원 코드를 입력해 주세요.')
    },
    [loadUsers, users],
  )

  const handleRegisterChange = (event) => {
    const { name, value } = event.target
    setRegisterForm((prev) => ({ ...prev, [name]: value }))
  }

  const handlePayrollChange = (event) => {
    const { name, value } = event.target
    setPayrollForm((prev) => ({ ...prev, [name]: value }))
  }

  const validateRegisterForm = () => {
    if (!toText(registerForm.employeeKeyword)) return '직원 코드 또는 직원명을 입력해주세요.'
    if (!toText(registerForm.amount)) return '급여 금액을 입력해주세요.'
    if (Number(registerForm.amount) <= 0) return '급여 금액은 0보다 커야 합니다.'
    if (!toText(registerForm.paymentDate)) return '지급일을 입력해주세요.'
    if (registerForm.paymentDate < minPaymentDate) {
      return `지급일은 최소 ${minPaymentDate} 이후로 입력해주세요.`
    }
    return ''
  }

  const validatePayrollForm = () => {
    if (!toText(payrollForm.employeeKeyword)) return '직원 코드 또는 직원명을 입력해주세요.'
    if (!toText(payrollForm.year) || !toText(payrollForm.month)) return '연도와 월을 입력해주세요.'
    return ''
  }

  const handleRegisterSubmit = async (event) => {
    event.preventDefault()
    setErrorMessage('')
    setSuccessMessage('')

    const validationMessage = validateRegisterForm()
    if (validationMessage) {
      setErrorMessage(validationMessage)
      return
    }

    try {
      setRegisterLoading(true)

      const targetUser = await resolveUserFromKeyword(registerForm.employeeKeyword)
      await api.post('/api/salary', {
        userId: Number(targetUser.id),
        employmentType: registerForm.employmentType,
        amount: Number(registerForm.amount),
        paymentDate: registerForm.paymentDate,
      })

      setSuccessMessage(`급여 기준이 저장되었습니다. (${targetUser.name} / ${targetUser.employeeCode || '-'})`)
    } catch (error) {
      setErrorMessage(error?.response?.data?.message || error?.message || '급여 저장 중 오류가 발생했습니다.')
    } finally {
      setRegisterLoading(false)
    }
  }

  const handlePayrollSubmit = async (event) => {
    event.preventDefault()
    setErrorMessage('')
    setSuccessMessage('')

    const validationMessage = validatePayrollForm()
    if (validationMessage) {
      setErrorMessage(validationMessage)
      return
    }

    try {
      setPayrollLoading(true)

      const targetUser = await resolveUserFromKeyword(payrollForm.employeeKeyword)
      const response = await api.get('/api/salary/calculate', {
        params: {
          userId: Number(targetUser.id),
          year: Number(payrollForm.year),
          month: Number(payrollForm.month),
        },
      })

      setPayroll({
        ...response.data,
        employeeCode: targetUser.employeeCode || '-',
        employeeName: targetUser.name || response.data?.userName || '-',
      })
      setSuccessMessage('급여 계산 결과를 불러왔습니다.')
    } catch (error) {
      setPayroll(null)
      setErrorMessage(error?.response?.data?.message || error?.message || '급여 조회 중 오류가 발생했습니다.')
    } finally {
      setPayrollLoading(false)
    }
  }

  return (
    <div className='salary-page'>
      <header className='salary-page__header'>
        <h1>급여 관리</h1>
      </header>

      {(errorMessage || successMessage) && (
        <div className='salary-page__message-wrap'>
          {errorMessage && <p className='salary-page__message salary-page__message--error'>{errorMessage}</p>}
          {successMessage && <p className='salary-page__message salary-page__message--success'>{successMessage}</p>}
        </div>
      )}

      <section className='salary-card-grid'>
        <article className='salary-card'>
          <h2>급여 기준 등록/수정</h2>
          <form className='salary-form' onSubmit={handleRegisterSubmit}>
            <label>
              직원 코드/이름
              <input
                name='employeeKeyword'
                type='text'
                placeholder='예: A001 또는 홍길동'
                value={registerForm.employeeKeyword}
                onChange={handleRegisterChange}
                disabled={usersLoading}
              />
            </label>

            <label>
              고용 형태
              <select name='employmentType' value={registerForm.employmentType} onChange={handleRegisterChange}>
                {EMPLOYMENT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label>
              {registerForm.employmentType === 'HOURLY' ? '시급(원)' : '월급(원)'}
              <input
                name='amount'
                type='number'
                min='0'
                step='1'
                placeholder='예: 12000'
                value={registerForm.amount}
                onChange={handleRegisterChange}
              />
            </label>

            <label>
              지급일
              <input
                name='paymentDate'
                type='date'
                min={minPaymentDate}
                value={registerForm.paymentDate}
                onChange={handleRegisterChange}
              />
            </label>

            <button type='submit' disabled={registerLoading || usersLoading}>
              {registerLoading ? '저장 중...' : '급여 기준 저장'}
            </button>
          </form>
        </article>

        <article className='salary-card'>
          <h2>월 급여 조회</h2>
          <form className='salary-form' onSubmit={handlePayrollSubmit}>
            <label>
              직원 코드/이름
              <input
                name='employeeKeyword'
                type='text'
                placeholder='예: A001 또는 홍길동'
                value={payrollForm.employeeKeyword}
                onChange={handlePayrollChange}
                disabled={usersLoading}
              />
            </label>

            <div className='salary-form__row'>
              <label>
                연도
                <input
                  name='year'
                  type='number'
                  placeholder='2026'
                  value={payrollForm.year}
                  onChange={handlePayrollChange}
                />
              </label>

              <label>
                월
                <input
                  name='month'
                  type='number'
                  min='1'
                  max='12'
                  placeholder='03'
                  value={payrollForm.month}
                  onChange={handlePayrollChange}
                />
              </label>
            </div>

            <button type='submit' disabled={payrollLoading || usersLoading}>
              {payrollLoading ? '조회 중...' : '급여 조회'}
            </button>
          </form>
        </article>
      </section>

      <section className='salary-result-card'>
        <h2>급여 계산 결과</h2>

        {!payroll && <p className='salary-result-card__empty'>조회 결과가 없습니다.</p>}

        {payroll && (
          <dl className='salary-result-list'>
            <div>
              <dt>직원 코드</dt>
              <dd>{payroll.employeeCode || '-'}</dd>
            </div>
            <div>
              <dt>직원명</dt>
              <dd>{payroll.employeeName || payroll.userName || '-'}</dd>
            </div>
            <div>
              <dt>고용 형태</dt>
              <dd>{payroll.type === 'HOURLY' ? '시급직' : '월급직'}</dd>
            </div>
            <div>
              <dt>기준 급여</dt>
              <dd>{formatNumber(payroll.baseWage)}원</dd>
            </div>
            <div>
              <dt>기본 근무 시간</dt>
              <dd>{formatNumber(payroll.normalWorkHours)}시간</dd>
            </div>
            <div>
              <dt>연장 근무 시간</dt>
              <dd>{formatNumber(payroll.overtimeHours)}시간</dd>
            </div>
            <div>
              <dt>기본 급여</dt>
              <dd>{formatNumber(payroll.normalPay)}원</dd>
            </div>
            <div>
              <dt>연장 수당</dt>
              <dd>{formatNumber(payroll.overtimePay)}원</dd>
            </div>
            <div className='salary-result-list__total'>
              <dt>총 급여</dt>
              <dd>{formatNumber(payroll.totalPay)}원</dd>
            </div>
            <div>
              <dt>지급일</dt>
              <dd>{payroll.paymentDate || '-'}</dd>
            </div>
          </dl>
        )}
      </section>
    </div>
  )
}