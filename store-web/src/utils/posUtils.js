export function maskCode(value, length) {
  const safeValue = String(value ?? '')
  const enteredCount = Math.min(safeValue.length, length)
  const hidden = '·'.repeat(enteredCount)
  const empty = '-'.repeat(Math.max(0, length - enteredCount))
  return `${empty}${hidden}`
}

export function getApiErrorMessage(error, fallbackMessage) {
  return error?.response?.data?.message || error?.message || fallbackMessage
}
