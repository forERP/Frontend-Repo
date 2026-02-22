import { useCallback, useEffect, useMemo, useState } from 'react'
import { POS_SESSION_UPDATED_EVENT } from '../api/authApi'
import { fetchPosOrderList } from '../api/orderApi'
import { getPosAccessToken, syncSessionStorageFromShared } from '../api/posSessionStorage'
import { subscribePosRealtime } from '../api/realtimeApi'
import { getApiErrorMessage } from '../utils/posUtils'
import './Number.css'

const FETCH_PAGE_SIZE = 100
const MAX_FETCH_PAGES = 5
const MAX_BOX_COUNT = 12

const READY_STATUSES = new Set(['PLACED', 'PREPARED'])
const DONE_STATUSES = new Set(['SHIPPED', 'ARRIVED'])

function parseDate(value) {
  const timestamp = new Date(value || '').getTime()
  return Number.isFinite(timestamp) ? timestamp : 0
}

export default function NumberPage() {
  const [time, setTime] = useState('')
  const [readyOrders, setReadyOrders] = useState([])
  const [doneOrders, setDoneOrders] = useState([])
  const [errorMsg, setErrorMsg] = useState('')
  const [loading, setLoading] = useState(false)
  const [posOnline, setPosOnline] = useState(() => Boolean(getPosAccessToken()))

  const syncPosState = useCallback(() => {
    syncSessionStorageFromShared()
    setPosOnline(Boolean(getPosAccessToken()))
  }, [])

  const loadOrders = useCallback(
    async ({ background = false } = {}) => {
      syncPosState()
      if (!getPosAccessToken()) {
        setReadyOrders([])
        setDoneOrders([])
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

        const customerVisibleOrders = content.filter(
          (order) => order.serviceMode !== 'DELIVERY' && order.orderStatus !== 'CANCELED',
        )

        const nextReady = customerVisibleOrders
          .filter((order) => READY_STATUSES.has(order.orderStatus))
          .sort((a, b) => parseDate(a.orderedAt) - parseDate(b.orderedAt))
          .slice(0, MAX_BOX_COUNT)

        const nextDone = customerVisibleOrders
          .filter((order) => DONE_STATUSES.has(order.orderStatus))
          .sort((a, b) => parseDate(b.orderedAt) - parseDate(a.orderedAt))
          .slice(0, MAX_BOX_COUNT)

        setReadyOrders(nextReady)
        setDoneOrders(nextDone)
      } catch (error) {
        setErrorMsg(getApiErrorMessage(error, '주문 상황을 불러오지 못했습니다.'))
        setReadyOrders([])
        setDoneOrders([])
      } finally {
        if (!background) {
          setLoading(false)
        }
      }
    },
    [syncPosState],
  )

  useEffect(() => {
    setTime(new Date().toLocaleTimeString('ko-KR', { hour12: false }))
    const timer = setInterval(() => {
      setTime(new Date().toLocaleTimeString('ko-KR', { hour12: false }))
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
      setReadyOrders([])
      setDoneOrders([])
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

  const doneNumbers = useMemo(() => doneOrders.map((order) => order.orderId), [doneOrders])
  const readyNumbers = useMemo(() => readyOrders.map((order) => order.orderId), [readyOrders])

  if (!posOnline) {
    return (
      <div className='status-offline'>
        <h1>주문 현황판 대기 중</h1>
        <p>POS 로그인 시 주문 상태가 자동 표시됩니다.</p>
      </div>
    )
  }

  return (
    <div className='status-wrapper'>
      <header className='status-header'>
        <div className='header-left'>
          <h2>주문하신</h2>
          <h2 className='yellow'>제품이 완료되었습니다</h2>
        </div>

        <div className='header-right'>
          <h2>제품을</h2>
          <h2>준비하는 중입니다</h2>
          <span className='time'>{time}</span>
        </div>
      </header>

      {errorMsg && <div className='status-error'>{errorMsg}</div>}

      <main className='status-main'>
        <section className='status-section left'>
          <div className='status-title'>완료</div>
          <div className='number-grid'>
            {loading && doneNumbers.length === 0 ? (
              <div className='status-empty'>불러오는 중...</div>
            ) : doneNumbers.length === 0 ? (
              <div className='status-empty'>완료 주문 없음</div>
            ) : (
              doneNumbers.map((orderId) => (
                <div key={`done-${orderId}`} className='number-box done'>
                  {orderId}
                </div>
              ))
            )}
          </div>
        </section>

        <section className='status-section right'>
          <div className='status-title'>준비 중</div>
          <div className='number-grid'>
            {loading && readyNumbers.length === 0 ? (
              <div className='status-empty'>불러오는 중...</div>
            ) : readyNumbers.length === 0 ? (
              <div className='status-empty'>준비 중 주문 없음</div>
            ) : (
              readyNumbers.map((orderId) => (
                <div key={`ready-${orderId}`} className='number-box ready'>
                  {orderId}
                </div>
              ))
            )}
          </div>
        </section>
      </main>
    </div>
  )
}
