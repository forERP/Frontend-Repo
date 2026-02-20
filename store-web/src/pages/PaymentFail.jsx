import { useMemo } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import './css/PaymentResult.css'

export default function PaymentFail() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const failure = useMemo(
    () => ({
      code: searchParams.get('code') || '',
      message: searchParams.get('message') || '결제가 취소되었거나 실패했습니다.',
      orderId: searchParams.get('orderId') || '',
    }),
    [searchParams],
  )

  return (
    <div className='payment-result-page'>
      <div className='payment-result-card'>
        <h2>결제를 완료하지 못했습니다.</h2>
        <p className='payment-result-error'>{failure.message}</p>
        <div className='payment-result-summary'>
          <p>에러코드: {failure.code || '-'}</p>
          <p>주문식별자: {failure.orderId || '-'}</p>
        </div>

        <div className='payment-result-actions'>
          <button type='button' onClick={() => navigate(-1)}>
            이전 화면
          </button>
          <button type='button' onClick={() => navigate('/home', { replace: true })}>
            홈으로
          </button>
        </div>
      </div>
    </div>
  )
}
