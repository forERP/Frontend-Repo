import api from './axiosConfig'
import { getPosAccessToken, getPosStoreId, syncSessionStorageFromShared } from './posSessionStorage'

const DEFAULT_EVENTS = ['connected', 'inventory.changed', 'order.changed', 'payment.changed', 'shipment.changed']

const resolveEventStreamUrl = () => {
  const baseUrl = api.defaults.baseURL || '/api'
  const resolved = new URL(baseUrl, window.location.origin)
  return `${resolved.origin}/api/events/stream`
}

export const subscribePosRealtime = ({ onEvent, onError, events = DEFAULT_EVENTS } = {}) => {
  if (typeof window === 'undefined' || typeof window.EventSource === 'undefined') {
    return () => {}
  }

  syncSessionStorageFromShared()
  const token = getPosAccessToken()
  if (!token) {
    return () => {}
  }

  const params = new URLSearchParams()
  params.set('access_token', token)

  const storeId = getPosStoreId()
  if (storeId) {
    params.set('storeId', String(storeId))
  }

  const eventSource = new EventSource(`${resolveEventStreamUrl()}?${params.toString()}`)

  const listener = (event) => {
    if (typeof onEvent !== 'function') {
      return
    }

    let payload = null
    try {
      payload = event.data ? JSON.parse(event.data) : null
    } catch {
      payload = null
    }

    onEvent({
      type: event.type,
      data: payload,
      raw: event,
    })
  }

  events.forEach((eventName) => {
    eventSource.addEventListener(eventName, listener)
  })

  eventSource.onerror = (error) => {
    if (typeof onError === 'function') {
      onError(error)
    }
  }

  return () => {
    events.forEach((eventName) => {
      eventSource.removeEventListener(eventName, listener)
    })
    eventSource.close()
  }
}
