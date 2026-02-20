import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getAttendanceStatus } from '../api/attendanceApi'
import { loginPos, logoutPos, setPosSessionFromLogin } from '../api/authApi'
import { getApiErrorMessage, maskCode } from '../utils/posUtils'
import '../pages/css/Login.css'

const STORE_CODE_LENGTH = 3
const EMPLOYEE_CODE_LENGTH = 4
const SUCCESS_MODAL_COUNTDOWN = 10

const STATUS_LABELS = {
  NONE: '미출근',
  WORK: '근무 중',
  OUT: '퇴근 완료',
  LEAVE: '휴가',
  ABSENT: '결근',
}

const DEFAULT_MODAL = {
  open: false,
  phase: 'confirm',
  title: '',
  message: '',
  processing: false,
  countdown: SUCCESS_MODAL_COUNTDOWN,
  oldUserName: '-',
  oldEmployeeCode: '',
  oldAttendanceStatus: 'NONE',
  oldClockIn: null,
  oldClockOut: null,
  newUserName: '-',
  newEmployeeCode: '',
  newAttendanceStatus: 'NONE',
  newClockIn: null,
  newClockOut: null,
}

function formatDateTime(value) {
  if (!value) {
    return '-'
  }

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return '-'
  }

  return date.toLocaleString('ko-KR', { hour12: false })
}

function statusLabel(status) {
  return STATUS_LABELS[status ?? 'NONE'] || status || '-'
}

export default function ChangePage() {
  const navigate = useNavigate()

  const sessionStoreCode = useMemo(() => sessionStorage.getItem('storeCode') || '', [])
  const sessionEmployeeCode = useMemo(() => sessionStorage.getItem('employeeCode') || '', [])
  const sessionUserName = useMemo(() => sessionStorage.getItem('userName') || '', [])

  const [storeCode, setStoreCode] = useState(sessionStoreCode)
  const [newEmployeeCode, setNewEmployeeCode] = useState('')
  const [activeField, setActiveField] = useState(
    sessionStoreCode.length >= STORE_CODE_LENGTH ? 'employee' : 'store',
  )
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [modal, setModal] = useState(DEFAULT_MODAL)

  useEffect(() => {
    if (!sessionStorage.getItem('accessToken')) {
      navigate('/login', { replace: true })
    }
  }, [navigate])

  const finishShift = () => {
    setModal(DEFAULT_MODAL)
    setNewEmployeeCode('')
    setErrorMsg('')
    setActiveField(storeCode.length >= STORE_CODE_LENGTH ? 'employee' : 'store')
    navigate('/home', { replace: true })
  }

  useEffect(() => {
    if (!modal.open || modal.phase !== 'success') {
      return
    }

    if (modal.countdown <= 0) {
      finishShift()
      return
    }

    const timer = setTimeout(() => {
      setModal((prev) => {
        if (!prev.open || prev.phase !== 'success') {
          return prev
        }

        return { ...prev, countdown: prev.countdown - 1 }
      })
    }, 1000)

    return () => clearTimeout(timer)
  }, [modal.open, modal.phase, modal.countdown])

  const openModal = (payload) => {
    setModal({ ...DEFAULT_MODAL, open: true, ...payload })
  }

  const closeModal = () => {
    if (modal.phase === 'success') {
      finishShift()
      return
    }

    setModal(DEFAULT_MODAL)
  }

  const handleNumberClick = (num) => {
    if (loading || modal.processing) {
      return
    }

    setErrorMsg('')

    if (activeField === 'store') {
      if (storeCode.length >= STORE_CODE_LENGTH) {
        return
      }

      const nextValue = `${storeCode}${num}`
      setStoreCode(nextValue)

      if (nextValue.length === STORE_CODE_LENGTH) {
        setActiveField('employee')
      }

      return
    }

    if (newEmployeeCode.length >= EMPLOYEE_CODE_LENGTH) {
      return
    }

    setNewEmployeeCode((prev) => `${prev}${num}`)
  }

  const handleDelete = () => {
    if (loading || modal.processing) {
      return
    }

    setErrorMsg('')

    if (activeField === 'store') {
      setStoreCode((prev) => prev.slice(0, -1))
      return
    }

    setNewEmployeeCode((prev) => prev.slice(0, -1))
  }

  const handleLookup = async () => {
    if (loading || modal.processing) {
      return
    }

    if (storeCode.length !== STORE_CODE_LENGTH || newEmployeeCode.length !== EMPLOYEE_CODE_LENGTH) {
      setErrorMsg('매장 코드는 3자리, 교대 관리자 코드는 4자리로 입력해 주세요.')
      return
    }

    if (sessionEmployeeCode.length !== EMPLOYEE_CODE_LENGTH) {
      setErrorMsg('현재 로그인된 관리자 정보를 찾을 수 없습니다. 다시 로그인해 주세요.')
      return
    }

    if (sessionEmployeeCode === newEmployeeCode) {
      setErrorMsg('현재 관리자와 동일한 코드는 교대할 수 없습니다.')
      return
    }

    try {
      setLoading(true)
      setErrorMsg('')

      const [oldStatus, nextStatus] = await Promise.all([
        getAttendanceStatus(storeCode, sessionEmployeeCode),
        getAttendanceStatus(storeCode, newEmployeeCode),
      ])

      const oldUserName = oldStatus?.userName || sessionUserName || '-'
      const nextUserName = nextStatus?.userName || '-'

      openModal({
        phase: 'confirm',
        title: '매니저 교대 확인',
        message: `${oldUserName}(${sessionEmployeeCode}) -> ${nextUserName}(${newEmployeeCode}) 교대하시겠습니까?`,
        oldUserName,
        oldEmployeeCode: sessionEmployeeCode,
        oldAttendanceStatus: oldStatus?.status ?? 'NONE',
        oldClockIn: oldStatus?.clockIn ?? null,
        oldClockOut: oldStatus?.clockOut ?? null,
        newUserName: nextUserName,
        newEmployeeCode,
        newAttendanceStatus: nextStatus?.status ?? 'NONE',
        newClockIn: nextStatus?.clockIn ?? null,
        newClockOut: nextStatus?.clockOut ?? null,
      })
    } catch (error) {
      setErrorMsg(getApiErrorMessage(error, '직원 코드를 확인해 주세요.'))
    } finally {
      setLoading(false)
    }
  }

  const handleShiftChange = async () => {
    if (modal.processing) {
      return
    }

    try {
      setModal((prev) => ({ ...prev, processing: true }))

      await logoutPos(storeCode, sessionEmployeeCode)

      const loginData = await loginPos(storeCode, newEmployeeCode)
      await setPosSessionFromLogin({
        token: loginData?.token,
        role: loginData?.role,
        userId: loginData?.userId,
        fallbackStoreCode: storeCode,
        fallbackEmployeeCode: newEmployeeCode,
      })

      setModal((prev) => ({
        ...prev,
        phase: 'success',
        title: '교대 완료',
        message: `${prev.oldUserName}(${prev.oldEmployeeCode}) -> ${prev.newUserName}(${prev.newEmployeeCode}) 교대가 완료되었습니다.`,
        processing: false,
        countdown: SUCCESS_MODAL_COUNTDOWN,
      }))
    } catch (error) {
      setModal((prev) => ({
        ...prev,
        phase: 'error',
        title: '교대 실패',
        message: getApiErrorMessage(error, '교대 처리 중 오류가 발생했습니다.'),
        processing: false,
      }))
    }
  }

  return (
    <>
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
            <span className='label'>교대 관리자 코드</span>
            <span className='value'>{maskCode(newEmployeeCode, EMPLOYEE_CODE_LENGTH)}</span>
          </button>

          <div className='input-row'>
            <span className='label'>기존 관리자</span>
            <span className='value value-compact'>
              {(sessionUserName || '-') + `(${sessionEmployeeCode || '-'})`}
            </span>
          </div>

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
                disabled={loading || modal.processing}
              >
                {num}
              </button>
            ))}

            <button
              type='button'
              className='key delete'
              onClick={handleDelete}
              disabled={loading || modal.processing}
            >
              삭제
            </button>

            <button
              type='button'
              className='key'
              onClick={() => handleNumberClick(0)}
              disabled={loading || modal.processing}
            >
              0
            </button>

            <button
              type='button'
              className='key enter'
              onClick={handleLookup}
              disabled={loading || modal.processing}
            >
              {loading ? '조회 중' : '입력'}
            </button>

            <button
              type='button'
              className='key back'
              onClick={() => navigate('/manager')}
              disabled={loading || modal.processing}
            >
              취소
            </button>
          </div>
        </div>
      </div>

      {modal.open && (
        <div className='pos-modal-backdrop'>
          <div className='pos-modal'>
            <h2 className='pos-modal-title'>{modal.title}</h2>
            <p className='pos-modal-message'>{modal.message}</p>

            <div className='pos-modal-info-grid'>
              <div className='pos-modal-info-row'>
                <span>기존 직원</span>
                <strong>
                  {modal.oldUserName}({modal.oldEmployeeCode})
                </strong>
              </div>
              <div className='pos-modal-info-row'>
                <span>기존 상태</span>
                <strong>{statusLabel(modal.oldAttendanceStatus)}</strong>
              </div>
              <div className='pos-modal-info-row'>
                <span>기존 출근 시각</span>
                <strong>{formatDateTime(modal.oldClockIn)}</strong>
              </div>
              <div className='pos-modal-info-row'>
                <span>기존 퇴근 시각</span>
                <strong>{formatDateTime(modal.oldClockOut)}</strong>
              </div>
              <div className='pos-modal-info-row'>
                <span>교대 직원</span>
                <strong>
                  {modal.newUserName}({modal.newEmployeeCode})
                </strong>
              </div>
              <div className='pos-modal-info-row'>
                <span>교대 직원 상태</span>
                <strong>{statusLabel(modal.newAttendanceStatus)}</strong>
              </div>
            </div>

            <div className='pos-modal-actions'>
              <div className='pos-modal-actions-left'>
                {modal.phase === 'success' && (
                  <span className='pos-modal-countdown'>닫기 {modal.countdown}초</span>
                )}
              </div>

              {modal.phase === 'confirm' && (
                <button
                  type='button'
                  className='pos-modal-primary'
                  onClick={handleShiftChange}
                  disabled={modal.processing}
                >
                  {modal.processing ? '처리 중' : '교대 확정'}
                </button>
              )}

              <button type='button' className='pos-modal-secondary' onClick={closeModal}>
                {modal.phase === 'confirm' ? '취소' : '닫기'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
