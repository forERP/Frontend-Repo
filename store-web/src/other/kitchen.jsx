import { useCallback, useEffect, useMemo, useState } from 'react'
import { POS_SESSION_UPDATED_EVENT } from '../api/authApi'
import { fetchPosOrderDetail, fetchPosOrderList } from '../api/orderApi'
import {
  getPosAccessToken,
  getPosStoreCode,
  getPosStoreName,
  getPosUserName,
  syncSessionStorageFromShared,
} from '../api/posSessionStorage'
import { subscribePosRealtime } from '../api/realtimeApi'
import { getApiErrorMessage } from '../utils/posUtils'
import './Kitchen.css'

const ORDERS_PER_PAGE = 6
const FETCH_PAGE_SIZE = 100
const MAX_FETCH_PAGES = 5

const ACTIVE_ORDER_STATUS = new Set(['PLACED', 'PREPARED'])

const ORDER_STATUS_LABEL = {
  PLACED: '주문 접수',
  PREPARED: '조리 완료',
}

const SERVICE_MODE_LABEL = {
  DINE_IN: '매장 식사',
  TAKE_OUT: '포장',
  DELIVERY: '배달',
}

function formatTime(value = '') {
  if (!value) {
    return '-'
  }
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) {
    return '-'
  }
  return parsed.toLocaleTimeString('ko-KR', { hour12: false })
}

function getStoreLabel() {
  const storeName = getPosStoreName()
  const storeCode = getPosStoreCode()
  if (storeName && storeCode) {
    return `${storeName}(${storeCode})`
  }
  if (storeCode) {
    return `매장(${storeCode})`
  }
  return 'POS'
}

function getManagerLabel() {
  const userName = getPosUserName()
  return userName ? `매니저 ${userName}` : '매니저'
}

export default function Kitchen() {
  const [clock, setClock] = useState(() =>
    new Date().toLocaleTimeString('ko-KR', { hour12: false }),
  )
  const [page, setPage] = useState(1)
  const [orders, setOrders] = useState([])
  const [orderDetails, setOrderDetails] = useState({})
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [posOnline, setPosOnline] = useState(() => Boolean(getPosAccessToken()))

  const storeLabel = getStoreLabel()
  const managerLabel = getManagerLabel()

  const syncPosState = useCallback(() => {
    syncSessionStorageFromShared()
    setPosOnline(Boolean(getPosAccessToken()))
  }, [])

  const loadOrders = useCallback(
    async ({ background = false } = {}) => {
      syncPosState()
      if (!getPosAccessToken()) {
        setOrders([])
        setOrderDetails({})
        setLoading(false)
        return
      }

      try {
        if (!background) {
          setLoading(true)
        }
        setErrorMsg('')

        const firstPage = await fetchPosOrderList({
          page: 0,
          size: FETCH_PAGE_SIZE,
        })

        let content = Array.isArray(firstPage?.content) ? firstPage.content : []
        const totalPages = Number(firstPage?.totalPages || 1)
        const pageLimit = Math.min(
          Number.isFinite(totalPages) && totalPages > 0 ? totalPages : 1,
          MAX_FETCH_PAGES,
        )

        for (let currentPage = 1; currentPage < pageLimit; currentPage += 1) {
          const nextPage = await fetchPosOrderList({
            page: currentPage,
            size: FETCH_PAGE_SIZE,
          })
          const nextContent = Array.isArray(nextPage?.content) ? nextPage.content : []
          content = [...content, ...nextContent]
        }

        const activeOrders = content
          .filter((order) => ACTIVE_ORDER_STATUS.has(order.orderStatus))
          .sort((a, b) => {
            const right = new Date(b.orderedAt).getTime()
            const left = new Date(a.orderedAt).getTime()
            return right - left
          })

        setOrders(activeOrders)
        setOrderDetails((prev) => {
          const next = {}
          activeOrders.forEach((order) => {
            if (Object.prototype.hasOwnProperty.call(prev, order.orderId)) {
              next[order.orderId] = prev[order.orderId]
            }
          })
          return next
        })
      } catch (error) {
        setErrorMsg(getApiErrorMessage(error, '주문 목록을 불러오지 못했습니다.'))
        setOrders([])
      } finally {
        if (!background) {
          setLoading(false)
        }
      }
    },
    [syncPosState],
  )

  useEffect(() => {
    const timer = setInterval(() => {
      setClock(new Date().toLocaleTimeString('ko-KR', { hour12: false }))
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    syncPosState()
    const onSessionUpdate = () => syncPosState()
    const onStorage = () => syncPosState()

    window.addEventListener(POS_SESSION_UPDATED_EVENT, onSessionUpdate)
    window.addEventListener('storage', onStorage)

    return () => {
      window.removeEventListener(POS_SESSION_UPDATED_EVENT, onSessionUpdate)
      window.removeEventListener('storage', onStorage)
    }
  }, [syncPosState])

  useEffect(() => {
    if (!posOnline) {
      setOrders([])
      setOrderDetails({})
      setErrorMsg('')
      return
    }

    loadOrders()

    const pollTimer = setInterval(() => {
      loadOrders({ background: true })
    }, 10000)

    const unsubscribe = subscribePosRealtime({
      onEvent: ({ type }) => {
        if (
          type === 'order.changed' ||
          type === 'payment.changed' ||
          type === 'shipment.changed' ||
          type === 'connected'
        ) {
          loadOrders({ background: true })
        }
      },
      onError: () => {
        loadOrders({ background: true })
      },
    })

    return () => {
      clearInterval(pollTimer)
      unsubscribe()
    }
  }, [loadOrders, posOnline])

  const totalPages = useMemo(() => Math.max(1, Math.ceil(orders.length / ORDERS_PER_PAGE)), [orders.length])

  useEffect(() => {
    setPage((prev) => Math.min(Math.max(1, prev), totalPages))
  }, [totalPages])

  const visibleOrders = useMemo(() => {
    const startIndex = (page - 1) * ORDERS_PER_PAGE
    return orders.slice(startIndex, startIndex + ORDERS_PER_PAGE)
  }, [orders, page])

  useEffect(() => {
    if (!posOnline || visibleOrders.length === 0) {
      return
    }

    const targets = visibleOrders
      .map((order) => order.orderId)
      .filter((orderId) => !Object.prototype.hasOwnProperty.call(orderDetails, orderId))

    if (targets.length === 0) {
      return
    }

    let canceled = false

    const loadDetails = async () => {
      const results = await Promise.all(
        targets.map(async (orderId) => {
          try {
            const detail = await fetchPosOrderDetail(orderId)
            return { orderId, detail }
          } catch {
            return { orderId, detail: null }
          }
        }),
      )

      if (canceled) {
        return
      }

      setOrderDetails((prev) => {
        const next = { ...prev }
        results.forEach((result) => {
          next[result.orderId] = result.detail
        })
        return next
      })
    }

    loadDetails()

    return () => {
      canceled = true
    }
  }, [orderDetails, posOnline, visibleOrders])

  const firstRow = visibleOrders.slice(0, 3)
  const secondRow = visibleOrders.slice(3, 6)

  const next = () => setPage((prev) => Math.min(totalPages, prev + 1))
  const prev = () => setPage((prevPage) => Math.max(1, prevPage - 1))

  if (!posOnline) {
    return (
      <div className='kitchen-offline'>
        <h1>주방 모니터 대기 중</h1>
        <p>POS 로그인 시 주문 모니터링이 자동으로 시작됩니다.</p>
      </div>
    )
  }

  return (
    <div className='kitchen-wrapper'>
      <header className='kitchen-header'>
        <div>{storeLabel}</div>
        <div>{managerLabel}</div>
        <div>{clock}</div>
      </header>

      {errorMsg && <div className='kitchen-error'>{errorMsg}</div>}

      <section className='kitchen-orders'>
        {loading && orders.length === 0 ? (
          <div className='kitchen-empty'>주문을 불러오는 중입니다...</div>
        ) : firstRow.length === 0 ? (
          <div className='kitchen-empty'>표시할 주문이 없습니다.</div>
        ) : (
          firstRow.map((order) => (
            <OrderCard key={`top-${order.orderId}`} order={order} detail={orderDetails[order.orderId]} />
          ))
        )}
      </section>

      <section className='kitchen-orders'>
        {secondRow.map((order) => (
          <OrderCard key={`bottom-${order.orderId}`} order={order} detail={orderDetails[order.orderId]} />
        ))}
      </section>

      <footer className='kitchen-pagination'>
        <button className='page-btn' type='button' onClick={prev} disabled={page <= 1}>
          ◀
        </button>
        <span className='page-text'>
          Page {page} / {totalPages}
        </span>
        <button className='page-btn' type='button' onClick={next} disabled={page >= totalPages}>
          ▶
        </button>
      </footer>
    </div>
  )
}

function OrderCard({ order, detail }) {
  const items = detail?.order?.items ?? []

  return (
    <div className='order-card'>
      <h3>
        주문 {order.orderId} / {SERVICE_MODE_LABEL[order.serviceMode] || order.serviceMode}
      </h3>

      <p className='order-card-meta'>접수 시각 {formatTime(order.orderedAt)}</p>

      <div className='menu-list'>
        {items.length === 0 ? (
          <p className='menu-list-empty'>상품 정보를 불러오는 중입니다...</p>
        ) : (
          items.map((item) => (
            <p key={item.orderItemId}>
              {item.productName} x{item.qty}
            </p>
          ))
        )}
      </div>

      <button type='button' className='call-btn' disabled>
        {ORDER_STATUS_LABEL[order.orderStatus] || order.orderStatus}
      </button>
    </div>
  )
}
