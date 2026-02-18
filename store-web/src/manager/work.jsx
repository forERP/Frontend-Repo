import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { clockIn, clockOut, getAttendanceStatus } from '../api/attendanceApi'
import { getApiErrorMessage, maskCode } from '../utils/posUtils'
import '../pages/css/Login.css'

const EMPLOYEE_CODE_LENGTH = 4
const SUCCESS_MODAL_COUNTDOWN = 10

const STATUS_LABELS = {
  NONE: '미출근',
  WORK: '근무 중',
  OUT: '퇴근 완료',
  LEAVE: '휴가',
  ABSENT: '결근',
}

const AUTO_ATTENDANCE_ROLES = ['STORE_ADMIN', 'HQ_ADMIN']

const DEFAULT_MODAL = {
  open: false,
  phase: 'info',
  title: '',
  message: '',
  userName: '',
  attendanceStatus: 'NONE',
  clockIn: null,
  clockOut: null,
  actionType: null,
  processing: false,
  countdown: SUCCESS_MODAL_COUNTDOWN,
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

export default function WorkPage() {
  const navigate = useNavigate()
  const storeCode = useMemo(() => localStorage.getItem('storeCode') || '', [])

  const [employeeCode, setEmployeeCode] = useState('')
  const [currentTime, setCurrentTime] = useState(() => new Date().toLocaleTimeString('ko-KR'))
  const [lookupLoading, setLookupLoading] = useState(false)
  const [modal, setModal] = useState(DEFAULT_MODAL)

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString('ko-KR'))
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    if (!modal.open || modal.phase !== 'success') {
      return
    }

    if (modal.countdown <= 0) {
      setModal(DEFAULT_MODAL)
      setEmployeeCode('')
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
    setModal(DEFAULT_MODAL)
    setEmployeeCode('')
  }

  const handleNumberClick = (num) => {
    if (lookupLoading || modal.processing) {
      return
    }

    if (employeeCode.length >= EMPLOYEE_CODE_LENGTH) {
      return
    }

    setEmployeeCode((prev) => `${prev}${num}`)
  }

  const handleDelete = () => {
    if (lookupLoading || modal.processing) {
      return
    }

    setEmployeeCode((prev) => prev.slice(0, -1))
  }

  const handleSubmit = async () => {
    if (lookupLoading || modal.processing) {
      return
    }

    if (!storeCode) {
      openModal({
        phase: 'error',
        title: '조회 실패',
        message: '매장 코드가 없습니다. 관리자 로그인 후 다시 시도해 주세요.',
      })
      return
    }

    if (employeeCode.length !== EMPLOYEE_CODE_LENGTH) {
      openModal({
        phase: 'error',
        title: '조회 실패',
        message: '직원 코드는 4자리로 입력해 주세요.',
      })
      return
    }

    try {
      setLookupLoading(true)

      const data = await getAttendanceStatus(storeCode, employeeCode)
      const attendanceStatus = data?.status ?? 'NONE'
      const role = data?.role ?? null
      const isAutoAttendanceRole = AUTO_ATTENDANCE_ROLES.includes(role)

      let actionType = null
      if (!isAutoAttendanceRole && attendanceStatus === 'WORK') {
        actionType = 'CLOCK_OUT'
      } else if (!isAutoAttendanceRole && attendanceStatus === 'NONE') {
        actionType = 'CLOCK_IN'
      }

      const message = isAutoAttendanceRole
        ? '관리자 출/퇴근은 POS 로그인/마감 시 자동 처리됩니다.'
        : actionType
        ? actionType === 'CLOCK_IN'
          ? '출근 처리를 진행할 수 있습니다.'
          : '퇴근 처리를 진행할 수 있습니다.'
        : '현재 상태에서는 추가 출퇴근 처리가 필요하지 않습니다.'

      openModal({
        phase: 'info',
        title: '직원 출퇴근 정보',
        message,
        userName: data?.userName || '-',
        attendanceStatus,
        clockIn: data?.clockIn ?? null,
        clockOut: data?.clockOut ?? null,
        actionType,
      })
    } catch (error) {
      openModal({
        phase: 'error',
        title: '조회 실패',
        message: '직원 코드를 확인해 주세요.',
      })
    } finally {
      setLookupLoading(false)
    }
  }

  const handleAttendanceProcess = async () => {
    if (!modal.actionType || modal.processing) {
      return
    }

    try {
      setModal((prev) => ({ ...prev, processing: true }))

      const response =
        modal.actionType === 'CLOCK_IN'
          ? await clockIn(storeCode, employeeCode)
          : await clockOut(storeCode, employeeCode)

      const isClockIn = modal.actionType === 'CLOCK_IN'

      setModal({
        ...DEFAULT_MODAL,
        open: true,
        phase: 'success',
        title: isClockIn ? '출근 처리 완료' : '퇴근 처리 완료',
        message: isClockIn ? '출근이 정상 처리되었습니다.' : '퇴근이 정상 처리되었습니다.',
        userName: response?.userName || modal.userName,
        attendanceStatus: response?.status || (isClockIn ? 'WORK' : 'OUT'),
        clockIn: response?.clockIn ?? modal.clockIn,
        clockOut: response?.clockOut ?? modal.clockOut,
        countdown: SUCCESS_MODAL_COUNTDOWN,
      })
    } catch (error) {
      setModal((prev) => ({
        ...prev,
        phase: 'error',
        title: '처리 실패',
        message: getApiErrorMessage(error, '출퇴근 처리 중 오류가 발생했습니다.'),
        processing: false,
      }))
    }
  }

  return (
    <>
      <div className='login-container'>
        <div className='login-left'>
          <div className='input-row time-row'>
            <span className='label'>현재 시간</span>
            <span className='value value-compact'>{currentTime}</span>
          </div>

          <div className='input-row'>
            <span className='label'>직원 코드</span>
            <span className='value'>{maskCode(employeeCode, EMPLOYEE_CODE_LENGTH)}</span>
          </div>
        </div>

        <div className='login-right'>
          <div className='keypad'>
            {[7, 8, 9, 4, 5, 6, 1, 2, 3].map((num) => (
              <button key={num} className='key' onClick={() => handleNumberClick(num)}>
                {num}
              </button>
            ))}

            <button className='key delete' onClick={handleDelete}>
              삭제
            </button>

            <button className='key' onClick={() => handleNumberClick(0)}>
              0
            </button>

            <button className='key enter' onClick={handleSubmit} disabled={lookupLoading}>
              {lookupLoading ? '조회 중' : '입력'}
            </button>

            <button className='key back' onClick={() => navigate(-1)}>
              이전 화면
            </button>
          </div>
        </div>
      </div>

      {modal.open && (
        <div className='pos-modal-backdrop'>
          <div className='pos-modal'>
            <h2 className='pos-modal-title'>{modal.title}</h2>
            <p className='pos-modal-message'>{modal.message}</p>

            {modal.phase !== 'error' && (
              <div className='pos-modal-info-grid'>
                <div className='pos-modal-info-row'>
                  <span>직원</span>
                  <strong>{modal.userName}</strong>
                </div>
                <div className='pos-modal-info-row'>
                  <span>상태</span>
                  <strong>{statusLabel(modal.attendanceStatus)}</strong>
                </div>
                <div className='pos-modal-info-row'>
                  <span>출근 시각</span>
                  <strong>{formatDateTime(modal.clockIn)}</strong>
                </div>
                <div className='pos-modal-info-row'>
                  <span>퇴근 시각</span>
                  <strong>{formatDateTime(modal.clockOut)}</strong>
                </div>
              </div>
            )}

            <div className='pos-modal-actions'>
              <div className='pos-modal-actions-left'>
                {modal.phase === 'success' && (
                  <span className='pos-modal-countdown'>닫기 {modal.countdown}초</span>
                )}
              </div>

              {modal.phase === 'info' && modal.actionType && (
                <button
                  type='button'
                  className='pos-modal-primary'
                  onClick={handleAttendanceProcess}
                  disabled={modal.processing}
                >
                  {modal.processing
                    ? '처리 중'
                    : modal.actionType === 'CLOCK_IN'
                    ? '출근 처리'
                    : '퇴근 처리'}
                </button>
              )}

              <button type='button' className='pos-modal-secondary' onClick={closeModal}>
                닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
