export const POS_SHARED_SESSION_KEY = 'pos-shared-session'

export const POS_STORAGE_KEYS = [
  'accessToken',
  'role',
  'userRole',
  'userId',
  'storeId',
  'storeName',
  'storeCode',
  'userName',
  'employeeCode',
]

const isBrowser = () => typeof window !== 'undefined'

const readSessionValue = (key) => {
  if (!isBrowser()) {
    return ''
  }
  return sessionStorage.getItem(key) || ''
}

const readLocalStorage = () => {
  if (!isBrowser()) {
    return null
  }

  const raw = window.localStorage.getItem(POS_SHARED_SESSION_KEY)
  if (!raw) {
    return null
  }

  try {
    const parsed = JSON.parse(raw)
    return parsed && typeof parsed === 'object' ? parsed : null
  } catch {
    return null
  }
}

const readSessionStorage = () => {
  if (!isBrowser()) {
    return null
  }

  const token = readSessionValue('accessToken')
  if (!token) {
    return null
  }

  return POS_STORAGE_KEYS.reduce((acc, key) => {
    acc[key] = readSessionValue(key)
    return acc
  }, {})
}

export const getPosSession = () => readSessionStorage() || readLocalStorage()

export const getPosAccessToken = () => {
  const session = getPosSession()
  return String(session?.accessToken || '')
}

export const getPosStoreId = () => {
  const session = getPosSession()
  const raw = Number(session?.storeId || 0)
  return Number.isFinite(raw) && raw > 0 ? raw : null
}

export const getPosStoreCode = () => {
  const session = getPosSession()
  return String(session?.storeCode || '')
}

export const getPosStoreName = () => {
  const session = getPosSession()
  return String(session?.storeName || '')
}

export const getPosUserName = () => {
  const session = getPosSession()
  return String(session?.userName || '')
}

export const getPosEmployeeCode = () => {
  const session = getPosSession()
  return String(session?.employeeCode || '')
}

export const writeSharedPosSession = (values = {}) => {
  if (!isBrowser()) {
    return
  }

  const payload = POS_STORAGE_KEYS.reduce((acc, key) => {
    acc[key] = String(values[key] ?? '')
    return acc
  }, {})

  payload.updatedAt = new Date().toISOString()
  window.localStorage.setItem(POS_SHARED_SESSION_KEY, JSON.stringify(payload))
}

export const clearSharedPosSession = () => {
  if (!isBrowser()) {
    return
  }
  window.localStorage.removeItem(POS_SHARED_SESSION_KEY)
}

export const syncSessionStorageFromShared = () => {
  if (!isBrowser()) {
    return
  }

  const hasToken = Boolean(readSessionValue('accessToken'))
  if (hasToken) {
    return
  }

  const shared = readLocalStorage()
  if (!shared?.accessToken) {
    return
  }

  POS_STORAGE_KEYS.forEach((key) => {
    const value = shared[key]
    if (value === undefined || value === null || value === '') {
      return
    }
    sessionStorage.setItem(key, String(value))
  })
}
