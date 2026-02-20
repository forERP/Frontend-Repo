const TOSS_V1_SCRIPT_SRC = 'https://js.tosspayments.com/v1/payment'

let scriptPromise

const loadTossScript = () => {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('Browser environment is required'))
  }

  if (window.TossPayments) {
    return Promise.resolve(window.TossPayments)
  }

  if (scriptPromise) {
    return scriptPromise
  }

  scriptPromise = new Promise((resolve, reject) => {
    const existingScript = document.querySelector(`script[src="${TOSS_V1_SCRIPT_SRC}"]`)
    if (existingScript) {
      existingScript.addEventListener('load', () => resolve(window.TossPayments), { once: true })
      existingScript.addEventListener('error', () => reject(new Error('Failed to load TossPayments SDK')), {
        once: true,
      })
      return
    }

    const script = document.createElement('script')
    script.src = TOSS_V1_SCRIPT_SRC
    script.async = true
    script.onload = () => resolve(window.TossPayments)
    script.onerror = () => reject(new Error('Failed to load TossPayments SDK'))
    document.head.appendChild(script)
  })

  return scriptPromise
}

export const requestTossCardPayment = async ({
  clientKey,
  amount,
  orderId,
  orderName,
  customerKey,
  customerName,
  successUrl,
  failUrl,
}) => {
  if (!clientKey) {
    throw new Error('Toss client key is missing')
  }

  const tossPaymentsFactory = await loadTossScript()
  if (typeof tossPaymentsFactory !== 'function') {
    throw new Error('TossPayments SDK is not available')
  }

  const tossPayments = tossPaymentsFactory(clientKey)
  await tossPayments.requestPayment('카드', {
    amount,
    orderId,
    orderName,
    customerKey,
    customerName: customerName || 'POS Customer',
    successUrl,
    failUrl,
  })
}
