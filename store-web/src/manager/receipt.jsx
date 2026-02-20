import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { cancelPayment } from '../api/paymentApi'
import { confirmPosOrder, fetchPosOrderDetail, fetchPosOrderList, preparePosOrder } from '../api/orderApi'
import { subscribePosRealtime } from '../api/realtimeApi'
import { getApiErrorMessage } from '../utils/posUtils'
import '../pages/css/recepit.css'

const ORDER_STATUS_LABEL = {
  PLACED: '주문접수',
  PREPARED: '준비완료',
  SHIPPED: '출고확정',
  ARRIVED: '출고완료',
  CANCELED: '취소',
}

const PAYMENT_STATUS_LABEL = {
  READY: '결제준비',
  DONE: '결제완료',
  PARTIAL_CANCELED: '부분취소',
  CANCELED: '전체취소',
  FAILED: '실패',
}

const SERVICE_MODE_LABEL = {
  DINE_IN: '매장식사',
  TAKE_OUT: '포장',
  DELIVERY: '배달',
}

const ORDER_STATUS_FILTERS = [
  { value: '', label: '전체' },
  { value: 'PLACED', label: ORDER_STATUS_LABEL.PLACED },
  { value: 'PREPARED', label: ORDER_STATUS_LABEL.PREPARED },
  { value: 'SHIPPED', label: ORDER_STATUS_LABEL.SHIPPED },
  { value: 'ARRIVED', label: ORDER_STATUS_LABEL.ARRIVED },
  { value: 'CANCELED', label: ORDER_STATUS_LABEL.CANCELED },
]

const formatDateTime = (value) => {
  if (!value) {
    return '-'
  }
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) {
    return '-'
  }
  return parsed.toLocaleString('ko-KR')
}

const formatMoney = (value) => `${Number(value || 0).toLocaleString()}원`

const escapeHtml = (value) =>
  String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')

export default function ReceiptPage() {
  const navigate = useNavigate()
  const [statusFilter, setStatusFilter] = useState('')
  const [orders, setOrders] = useState([])
  const [selectedOrderId, setSelectedOrderId] = useState(null)
  const [detail, setDetail] = useState(null)
  const [loadingList, setLoadingList] = useState(false)
  const [loadingDetail, setLoadingDetail] = useState(false)
  const [actionLoading, setActionLoading] = useState('')
  const [errorMsg, setErrorMsg] = useState('')
  const [cancelReason, setCancelReason] = useState('')
  const [discardStock, setDiscardStock] = useState(false)
  const [cancelQtyByItemId, setCancelQtyByItemId] = useState({})

  const loadOrders = useCallback(
    async ({ background = false } = {}) => {
      try {
        if (!background) {
          setLoadingList(true)
        }
        setErrorMsg('')

        const list = await fetchPosOrderList({
          status: statusFilter,
          page: 0,
          size: 100,
        })

        const content = Array.isArray(list?.content) ? list.content : []
        setOrders(content)

        if (content.length === 0) {
          setSelectedOrderId(null)
          setDetail(null)
          return
        }

        if (!selectedOrderId || !content.some((item) => item.orderId === selectedOrderId)) {
          setSelectedOrderId(content[0].orderId)
        }
      } catch (error) {
        setOrders([])
        setDetail(null)
        setSelectedOrderId(null)
        setErrorMsg(getApiErrorMessage(error, '주문 목록을 불러오지 못했습니다.'))
      } finally {
        if (!background) {
          setLoadingList(false)
        }
      }
    },
    [selectedOrderId, statusFilter],
  )

  const loadOrderDetail = useCallback(async (orderId, { background = false } = {}) => {
    if (!orderId) {
      setDetail(null)
      return
    }

    try {
      if (!background) {
        setLoadingDetail(true)
      }
      const data = await fetchPosOrderDetail(orderId)
      setDetail(data)
    } catch (error) {
      setDetail(null)
      setErrorMsg(getApiErrorMessage(error, '주문 상세를 불러오지 못했습니다.'))
    } finally {
      if (!background) {
        setLoadingDetail(false)
      }
    }
  }, [])

  useEffect(() => {
    loadOrders()
  }, [loadOrders])

  useEffect(() => {
    loadOrderDetail(selectedOrderId)
  }, [selectedOrderId, loadOrderDetail])

  useEffect(() => {
    const unsubscribe = subscribePosRealtime({
      onEvent: ({ type }) => {
        if (type === 'order.changed' || type === 'payment.changed' || type === 'inventory.changed') {
          loadOrders({ background: true })
          if (selectedOrderId) {
            loadOrderDetail(selectedOrderId, { background: true })
          }
        }
      },
    })

    return unsubscribe
  }, [loadOrderDetail, loadOrders, selectedOrderId])

  useEffect(() => {
    const orderItems = detail?.order?.items ?? []
    const next = {}
    orderItems.forEach((item) => {
      next[item.orderItemId] = item.qty
    })
    setCancelQtyByItemId(next)
  }, [detail?.order?.orderId, detail?.order?.status])

  const orderStatus = detail?.order?.status || ''
  const canPrepare = orderStatus === 'PLACED'
  const canConfirm = orderStatus === 'PLACED' || orderStatus === 'PREPARED' || orderStatus === 'SHIPPED'
  const canCancel =
    orderStatus === 'PLACED' || orderStatus === 'PREPARED' || orderStatus === 'SHIPPED' || orderStatus === 'ARRIVED'
  const partialCancelable = orderStatus === 'PLACED'
  const fullCancelOnly = orderStatus === 'PREPARED' || orderStatus === 'SHIPPED' || orderStatus === 'ARRIVED'

  const cancelItems = useMemo(() => {
    const items = detail?.order?.items ?? []
    return items
      .map((item) => {
        const raw = Number(cancelQtyByItemId[item.orderItemId] ?? 0)
        const qty = Math.max(0, Math.min(item.qty, Number.isFinite(raw) ? Math.floor(raw) : 0))
        return {
          orderItemId: item.orderItemId,
          qty,
        }
      })
      .filter((item) => item.qty > 0)
  }, [cancelQtyByItemId, detail?.order?.items])

  const handlePrepare = async () => {
    if (!selectedOrderId) {
      return
    }
    try {
      setActionLoading('prepare')
      const updated = await preparePosOrder(selectedOrderId)
      setDetail(updated)
      await loadOrders({ background: true })
    } catch (error) {
      setErrorMsg(getApiErrorMessage(error, '준비완료 처리에 실패했습니다.'))
    } finally {
      setActionLoading('')
    }
  }

  const handleConfirm = async () => {
    if (!selectedOrderId) {
      return
    }
    try {
      setActionLoading('confirm')
      const updated = await confirmPosOrder(selectedOrderId)
      setDetail(updated)
      await loadOrders({ background: true })
    } catch (error) {
      setErrorMsg(getApiErrorMessage(error, '출고 확정 처리에 실패했습니다.'))
    } finally {
      setActionLoading('')
    }
  }

  const handleCancel = async () => {
    if (!detail?.payment?.paymentId || !canCancel) {
      return
    }

    if (!cancelReason.trim()) {
      setErrorMsg('취소 사유를 입력해 주세요.')
      return
    }

    if (partialCancelable && cancelItems.length === 0) {
      setErrorMsg('부분취소 수량을 1개 이상 입력해 주세요.')
      return
    }

    if (
      !window.confirm(
        fullCancelOnly
          ? '전체취소(전체환불)를 진행하시겠습니까?'
          : '선택한 수량 기준으로 취소(환불)를 진행하시겠습니까?',
      )
    ) {
      return
    }

    try {
      setActionLoading('cancel')
      setErrorMsg('')

      await cancelPayment({
        paymentId: detail.payment.paymentId,
        reason: cancelReason.trim(),
        discardStock,
        items: partialCancelable ? cancelItems : [],
      })

      await loadOrders({ background: true })
      await loadOrderDetail(selectedOrderId, { background: true })
      setCancelReason('')
    } catch (error) {
      setErrorMsg(getApiErrorMessage(error, '취소(환불) 처리에 실패했습니다.'))
    } finally {
      setActionLoading('')
    }
  }

  const handlePrintReceipt = () => {
    if (!detail?.order || !detail?.payment) {
      return
    }

    const order = detail.order
    const payment = detail.payment

    const lines = (order.items || [])
      .map(
        (item) =>
          `<tr>
            <td>${escapeHtml(item.productName || `상품#${item.productId}`)}</td>
            <td>${item.qty}</td>
            <td>${Number(item.unitPrice || 0).toLocaleString()}원</td>
            <td>${Number(item.amount || 0).toLocaleString()}원</td>
          </tr>`,
      )
      .join('')

    const printWindow = window.open('', '_blank', 'width=420,height=680')
    if (!printWindow) {
      setErrorMsg('팝업 차단으로 인해 인쇄 창을 열 수 없습니다.')
      return
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html lang="ko">
      <head>
        <meta charset="UTF-8" />
        <title>영수증 - 주문 ${order.orderId}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 16px; color: #111; }
          h1 { margin: 0 0 12px; font-size: 20px; }
          p { margin: 4px 0; font-size: 13px; }
          table { width: 100%; border-collapse: collapse; margin-top: 10px; }
          th, td { border: 1px solid #ddd; padding: 6px; font-size: 12px; text-align: left; }
          .total { margin-top: 10px; font-weight: 700; font-size: 14px; }
        </style>
      </head>
      <body>
        <h1>주문 영수증</h1>
        <p>주문번호: ${escapeHtml(order.orderId)}</p>
        <p>결제번호: ${escapeHtml(payment.paymentId)}</p>
        <p>주문상태: ${escapeHtml(ORDER_STATUS_LABEL[order.status] || order.status)}</p>
        <p>결제상태: ${escapeHtml(PAYMENT_STATUS_LABEL[payment.paymentStatus] || payment.paymentStatus)}</p>
        <p>서비스: ${escapeHtml(SERVICE_MODE_LABEL[payment.serviceMode] || payment.serviceMode)}</p>
        <p>주문일시: ${escapeHtml(formatDateTime(order.orderedAt))}</p>
        <table>
          <thead>
            <tr>
              <th>상품</th>
              <th>수량</th>
              <th>단가</th>
              <th>금액</th>
            </tr>
          </thead>
          <tbody>${lines}</tbody>
        </table>
        <p class="total">총 결제금액: ${escapeHtml(formatMoney(order.totalAmount))}</p>
      </body>
      </html>
    `)
    printWindow.document.close()
    printWindow.focus()
    printWindow.print()
  }

  return (
    <div className='receipt-layout'>
      <div className='receipt-left'>
        <div className='filter-bar'>
          <label htmlFor='order-status-filter'>주문상태</label>
          <select
            id='order-status-filter'
            value={statusFilter}
            onChange={(event) => {
              setStatusFilter(event.target.value)
            }}
            disabled={loadingList || actionLoading}
          >
            {ORDER_STATUS_FILTERS.map((filter) => (
              <option key={filter.value || 'all'} value={filter.value}>
                {filter.label}
              </option>
            ))}
          </select>
          <button type='button' onClick={() => loadOrders()} disabled={loadingList || actionLoading}>
            새로고침
          </button>
        </div>

        {errorMsg && <div className='receipt-error'>{errorMsg}</div>}

        <div className='receipt-grid'>
          {loadingList ? (
            <div className='receipt-empty'>주문 목록을 불러오는 중입니다...</div>
          ) : orders.length === 0 ? (
            <div className='receipt-empty'>주문 데이터가 없습니다.</div>
          ) : (
            orders.map((item) => (
              <button
                key={item.orderId}
                className={`receipt-cell ${item.orderId === selectedOrderId ? 'active' : ''}`}
                onClick={() => setSelectedOrderId(item.orderId)}
                type='button'
              >
                <div className='receipt-cell-top'>
                  <strong>#{item.orderId}</strong>
                  <span>{SERVICE_MODE_LABEL[item.serviceMode] || item.serviceMode}</span>
                </div>
                <div>{formatMoney(item.totalAmount)}</div>
                <div>{formatDateTime(item.orderedAt)}</div>
                <div className='receipt-cell-status'>
                  {ORDER_STATUS_LABEL[item.orderStatus] || item.orderStatus} /{' '}
                  {PAYMENT_STATUS_LABEL[item.paymentStatus] || item.paymentStatus}
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      <div className='receipt-right'>
        {loadingDetail && <div className='receipt-empty'>주문 상세를 불러오는 중입니다...</div>}

        {!loadingDetail && !detail && <div className='receipt-empty'>왼쪽에서 주문을 선택해 주세요.</div>}

        {!loadingDetail && detail && (
          <>
            <h2>주문 상세 #{detail.order.orderId}</h2>

            <div className='detail'>
              <div className='detail-head'>
                <p>주문상태: {ORDER_STATUS_LABEL[detail.order.status] || detail.order.status}</p>
                <p>결제상태: {PAYMENT_STATUS_LABEL[detail.payment.paymentStatus] || detail.payment.paymentStatus}</p>
                <p>서비스: {SERVICE_MODE_LABEL[detail.payment.serviceMode] || detail.payment.serviceMode}</p>
                <p>주문일시: {formatDateTime(detail.order.orderedAt)}</p>
              </div>

              <div className='detail-items'>
                {(detail.order.items || []).map((item) => (
                  <div key={item.orderItemId} className='item-row'>
                    <div className='item-main'>
                      <strong>{item.productName || `상품#${item.productId}`}</strong>
                      <span>
                        {item.qty}개 x {formatMoney(item.unitPrice)} = {formatMoney(item.amount)}
                      </span>
                    </div>

                    {partialCancelable && (
                      <div className='item-cancel'>
                        <label htmlFor={`cancel-${item.orderItemId}`}>취소수량</label>
                        <input
                          id={`cancel-${item.orderItemId}`}
                          type='number'
                          min='0'
                          max={item.qty}
                          value={cancelQtyByItemId[item.orderItemId] ?? item.qty}
                          onChange={(event) => {
                            const value = Number(event.target.value)
                            setCancelQtyByItemId((prev) => ({
                              ...prev,
                              [item.orderItemId]: Number.isFinite(value) ? value : 0,
                            }))
                          }}
                          disabled={actionLoading === 'cancel'}
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <p className='total'>총 결제금액: {formatMoney(detail.order.totalAmount)}</p>

              {canCancel && (
                <div className='cancel-panel'>
                  <label htmlFor='cancel-reason'>취소 사유</label>
                  <input
                    id='cancel-reason'
                    type='text'
                    value={cancelReason}
                    onChange={(event) => setCancelReason(event.target.value)}
                    placeholder='환불/취소 사유 입력'
                    disabled={actionLoading === 'cancel'}
                  />
                  <label className='discard-checkbox' htmlFor='discard-stock'>
                    <input
                      id='discard-stock'
                      type='checkbox'
                      checked={discardStock}
                      onChange={(event) => setDiscardStock(event.target.checked)}
                      disabled={actionLoading === 'cancel'}
                    />
                    재고 폐기 처리 (미선택 시 재고 복원)
                  </label>
                  {fullCancelOnly && (
                    <p className='cancel-guide'>
                      현재 상태에서는 전체취소(전체환불)만 가능합니다. 부분취소는 주문접수 상태에서만 가능합니다.
                    </p>
                  )}
                </div>
              )}
            </div>

            <div className='receipt-bottom'>
              <button type='button' className='print-btn' onClick={handlePrintReceipt}>
                영수증 출력
              </button>
              <button
                type='button'
                className='prepare-btn'
                disabled={!canPrepare || actionLoading !== ''}
                onClick={handlePrepare}
              >
                {actionLoading === 'prepare' ? '처리 중...' : '준비완료'}
              </button>
              <button
                type='button'
                className='confirm-btn'
                disabled={!canConfirm || actionLoading !== ''}
                onClick={handleConfirm}
              >
                {actionLoading === 'confirm' ? '처리 중...' : '출고 확정'}
              </button>
              <button
                type='button'
                className='cancel-btn'
                disabled={!canCancel || actionLoading !== ''}
                onClick={handleCancel}
              >
                {actionLoading === 'cancel' ? '처리 중...' : fullCancelOnly ? '전체취소' : '부분/전체취소'}
              </button>
              <button type='button' className='receipt-back-btn' onClick={() => navigate('/manager')}>
                관리자 메뉴
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
