import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { confirmPayment } from '../api/paymentApi'
import { getApiErrorMessage } from '../utils/posUtils'
import './css/PaymentResult.css'

export default function PaymentSuccess() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [loading, setLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState('')
  const [result, setResult] = useState(null)

  useEffect(() => {
    let cancelled = false

    const paymentKey = searchParams.get('paymentKey') || ''
    const merchantOrderId = searchParams.get('orderId') || ''
    const amount = searchParams.get('amount') || ''

    if (!paymentKey || !merchantOrderId || !amount) {
      setErrorMsg('결제 확인 파라미터가 누락되었습니다.')
      setLoading(false)
      return
    }

    const run = async () => {
      try {
        const confirmed = await confirmPayment({
          paymentKey,
          merchantOrderId,
          amount,
        })

        if (cancelled) {
          return
        }

        setResult(confirmed)
      } catch (error) {
        if (cancelled) {
          return
        }
        setErrorMsg(getApiErrorMessage(error, '결제 승인 확인에 실패했습니다.'))
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    run()

    return () => {
      cancelled = true
    }
  }, [searchParams])

  const orderId = result?.order?.orderId
  const paidAmount = result?.payment?.approvedAmount ?? result?.payment?.amount

  return (
    <div className='payment-result-page'>
      <div className='payment-result-card'>
        {loading && <h2>결제 승인 처리 중...</h2>}

        {!loading && errorMsg && (
          <>
            <h2>결제 승인 실패</h2>
            <p className='payment-result-error'>{errorMsg}</p>
            <div className='payment-result-actions'>
              <button type='button' onClick={() => navigate('/home', { replace: true })}>
                홈으로
              </button>
              <button type='button' onClick={() => navigate('/receipt')}>
                주문 목록
              </button>
            </div>
          </>
        )}

        {!loading && !errorMsg && (
          <>
            <h2>결제가 완료되었습니다.</h2>
            <div className='payment-result-summary'>
              <p>주문번호: {orderId ?? '-'}</p>
              <p>결제금액: {Number(paidAmount || 0).toLocaleString()}원</p>
              <p>결제수단: {result?.payment?.method || 'CARD'}</p>
            </div>
            <div className='payment-result-actions'>
              <button type='button' onClick={() => navigate('/home', { replace: true })}>
                새 주문
              </button>
              <button type='button' onClick={() => navigate('/receipt')}>
                주문 관리
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
