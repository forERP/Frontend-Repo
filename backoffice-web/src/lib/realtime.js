import api from './api'

const DEFAULT_EVENTS = ['connected', 'inventory.changed', 'order.changed', 'payment.changed']

const resolveStreamBaseUrl = () => {
  const baseURL = api.defaults.baseURL || ''
  const resolved = new URL(baseURL || '/', window.location.origin)
  return resolved.origin
}

export const subscribeAdminRealtime = ({ storeId, onEvent, onError, events = DEFAULT_EVENTS } = {}) => {
  if (typeof window === 'undefined' || typeof window.EventSource === 'undefined') {
    return () => {}
  }

  const token = sessionStorage.getItem('accessToken')
  if (!token) {
    return () => {}
  }

  const params = new URLSearchParams()
  params.set('access_token', token)

  const normalizedStoreId = Number(storeId)
  if (Number.isInteger(normalizedStoreId) && normalizedStoreId > 0) {
    params.set('storeId', String(normalizedStoreId))
  }

  const eventSource = new EventSource(`${resolveStreamBaseUrl()}/api/events/stream?${params.toString()}`)

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
