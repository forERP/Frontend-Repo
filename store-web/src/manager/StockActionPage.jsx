import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createDiscard } from '../api/discardApi'
import { fetchStoreInventory } from '../api/inventoryApi'
import { subscribePosRealtime } from '../api/realtimeApi'
import { fetchUsersByStoreCode } from '../api/userApi'
import { fetchWarehousesByStore } from '../api/warehouseApi'
import { getApiErrorMessage } from '../utils/posUtils'
import '../pages/Menu/Menu.css'
import './stockAction.css'

const DISPOSE_REASON_OPTIONS = ['유통기한 임박', '상품 하자', '품질 저하', '조리 실수', '기타']

const DEFAULT_CONFIRM_MODAL = {
  open: false,
  message: '',
}

const DEFAULT_RESULT_MODAL = {
  open: false,
  title: '',
  message: '',
  discardId: null,
}

const toNumber = (value, fallback = 0) => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

const toText = (value) => String(value ?? '').trim()

function getStockLabel(onHand) {
  if (onHand <= 0) {
    return '재고 없음'
  }
  return `재고 ${onHand}개`
}

function isFrontWarehouse(warehouse) {
  const label = `${toText(warehouse?.name)} ${toText(warehouse?.code)}`.toLowerCase()
  return label.includes('앞') || label.includes('front')
}

function sortWarehousesByMealPriority(list = []) {
  return list
    .map((warehouse, index) => ({ warehouse, index }))
    .sort((a, b) => {
      const frontA = isFrontWarehouse(a.warehouse)
      const frontB = isFrontWarehouse(b.warehouse)
      if (frontA !== frontB) {
        return frontA ? -1 : 1
      }
      return a.index - b.index
    })
    .map((entry) => entry.warehouse)
}

export default function StockActionPage({ mode = 'dispose' }) {
  const navigate = useNavigate()
  const isMealMode = mode === 'meal'
  const pageTitle = isMealMode ? '식사 등록' : '폐기 등록'
  const submitLabel = isMealMode ? '식사 등록' : '폐기 등록'
  const submitLoadingLabel = isMealMode ? '식사 등록 중...' : '폐기 등록 중...'

  const storeId = useMemo(() => toNumber(sessionStorage.getItem('storeId'), 0), [])
  const storeCode = useMemo(() => toText(sessionStorage.getItem('storeCode')), [])
  const sessionEmployeeCode = useMemo(() => toText(sessionStorage.getItem('employeeCode')), [])

  const [warehouses, setWarehouses] = useState([])
  const [selectedWarehouseId, setSelectedWarehouseId] = useState('')

  const [employees, setEmployees] = useState([])
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('')
  const [selectedReason, setSelectedReason] = useState('')

  const [inventory, setInventory] = useState([])
  const [selectedItems, setSelectedItems] = useState([])

  const [loadingOptions, setLoadingOptions] = useState(true)
  const [loadingInventory, setLoadingInventory] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [confirmModal, setConfirmModal] = useState(DEFAULT_CONFIRM_MODAL)
  const [resultModal, setResultModal] = useState(DEFAULT_RESULT_MODAL)

  const selectedEmployee = useMemo(
    () => employees.find((employee) => String(employee.id) === selectedEmployeeId) || null,
    [employees, selectedEmployeeId],
  )

  const reasonText = isMealMode
    ? selectedEmployee
      ? `${selectedEmployee.name}(${selectedEmployee.employeeCode})`
      : ''
    : selectedReason

  const mealReasonForSave = isMealMode && reasonText ? `${reasonText} 식사` : reasonText

  const selectedWarehouse = useMemo(
    () => warehouses.find((warehouse) => String(warehouse.warehouseId) === selectedWarehouseId) || null,
    [warehouses, selectedWarehouseId],
  )

  const stockByProductId = useMemo(() => {
    const map = new Map()
    inventory.forEach((item) => {
      map.set(item.productId, Math.max(0, toNumber(item.onHand)))
    })
    return map
  }, [inventory])

  const selectedSummary = useMemo(() => {
    return selectedItems.reduce(
      (acc, item) => {
        acc.types += 1
        acc.qty += item.qty
        return acc
      },
      { types: 0, qty: 0 },
    )
  }, [selectedItems])

  useEffect(() => {
    if (!storeId) {
      setErrorMsg('매장 정보를 찾을 수 없습니다. 다시 로그인해 주세요.')
    }
  }, [storeId])

  const resolveMealWarehouseId = useCallback(
    async (warehouseList) => {
      const sortedWarehouses = sortWarehousesByMealPriority(warehouseList)
      if (sortedWarehouses.length === 0) {
        return ''
      }

      const checks = await Promise.all(
        sortedWarehouses.map(async (warehouse) => {
          try {
            const items = await fetchStoreInventory(storeId, {
              warehouseId: warehouse.warehouseId,
            })
            const hasStock = items.some((item) => item.onHand > 0)
            return {
              warehouseId: String(warehouse.warehouseId),
              hasStock,
            }
          } catch {
            return {
              warehouseId: String(warehouse.warehouseId),
              hasStock: false,
            }
          }
        }),
      )

      const firstWithStock = checks.find((item) => item.hasStock)
      if (firstWithStock) {
        return firstWithStock.warehouseId
      }

      return String(sortedWarehouses[0].warehouseId)
    },
    [storeId],
  )

  const loadOptions = useCallback(async () => {
    if (!storeId) {
      setLoadingOptions(false)
      return
    }

    try {
      setLoadingOptions(true)
      setErrorMsg('')

      const [warehouseData, employeeData] = await Promise.all([
        fetchWarehousesByStore(storeId),
        isMealMode && storeCode ? fetchUsersByStoreCode(storeCode) : Promise.resolve([]),
      ])

      const activeWarehouses = warehouseData.filter((warehouse) => warehouse.active)
      const normalizedWarehouses = (activeWarehouses.length > 0 ? activeWarehouses : warehouseData)
        .filter((warehouse) => warehouse.warehouseId)
        .sort((a, b) => String(a.name).localeCompare(String(b.name), 'ko'))

      setWarehouses(normalizedWarehouses)
      if (isMealMode) {
        const autoWarehouseId = await resolveMealWarehouseId(normalizedWarehouses)
        setSelectedWarehouseId(autoWarehouseId)
      } else {
        setSelectedWarehouseId((prev) => {
          const hasPrev = normalizedWarehouses.some((warehouse) => String(warehouse.warehouseId) === prev)
          if (hasPrev) {
            return prev
          }
          return normalizedWarehouses[0] ? String(normalizedWarehouses[0].warehouseId) : ''
        })
      }

      if (isMealMode) {
        const normalizedEmployees = employeeData
          .filter((employee) => employee.id && employee.name && employee.employeeCode)
          .sort((a, b) => {
            const byName = a.name.localeCompare(b.name, 'ko')
            if (byName !== 0) {
              return byName
            }
            return a.employeeCode.localeCompare(b.employeeCode, 'ko')
          })

        setEmployees(normalizedEmployees)
        setSelectedEmployeeId((prev) => {
          const hasPrev = normalizedEmployees.some((employee) => String(employee.id) === prev)
          if (hasPrev) {
            return prev
          }

          const me = normalizedEmployees.find(
            (employee) => employee.employeeCode === sessionEmployeeCode,
          )
          if (me) {
            return String(me.id)
          }
          return normalizedEmployees[0] ? String(normalizedEmployees[0].id) : ''
        })
      }
    } catch (error) {
      setErrorMsg(getApiErrorMessage(error, '초기 데이터를 불러오지 못했습니다.'))
      setWarehouses([])
      setEmployees([])
      setSelectedWarehouseId('')
      setSelectedEmployeeId('')
    } finally {
      setLoadingOptions(false)
    }
  }, [isMealMode, resolveMealWarehouseId, sessionEmployeeCode, storeCode, storeId])

  useEffect(() => {
    loadOptions()
  }, [loadOptions])

  const loadInventory = useCallback(
    async ({ background = false } = {}) => {
      if (!storeId || !selectedWarehouseId) {
        setInventory([])
        return
      }

      try {
        if (!background) {
          setLoadingInventory(true)
        }
        setErrorMsg('')

        const inventoryList = await fetchStoreInventory(storeId, {
          warehouseId: Number(selectedWarehouseId),
        })

        const normalizedInventory = inventoryList
          .filter((item) => item.productId && item.productName && item.onHand > 0)
          .sort((a, b) => a.productName.localeCompare(b.productName, 'ko'))

        setInventory(normalizedInventory)
      } catch (error) {
        setInventory([])
        setErrorMsg(getApiErrorMessage(error, '재고 목록을 불러오지 못했습니다.'))
      } finally {
        if (!background) {
          setLoadingInventory(false)
        }
      }
    },
    [selectedWarehouseId, storeId],
  )

  useEffect(() => {
    loadInventory()
  }, [loadInventory])

  useEffect(() => {
    const unsubscribe = subscribePosRealtime({
      onEvent: ({ type }) => {
        if (type === 'inventory.changed' || type === 'connected') {
          loadInventory({ background: true })
        }
      },
    })

    return unsubscribe
  }, [loadInventory])

  useEffect(() => {
    setSelectedItems((prev) =>
      prev
        .map((item) => {
          const stock = stockByProductId.get(item.productId) ?? 0
          if (stock <= 0) {
            return null
          }

          return {
            ...item,
            qty: Math.min(item.qty, stock),
          }
        })
        .filter(Boolean),
    )
  }, [stockByProductId])

  const addProduct = (product) => {
    if (!product?.productId || submitting || confirmModal.open || resultModal.open) {
      return
    }

    const stock = stockByProductId.get(product.productId) ?? 0
    if (stock <= 0) {
      return
    }

    setErrorMsg('')
    setSelectedItems((prev) => {
      const index = prev.findIndex((item) => item.productId === product.productId)
      if (index < 0) {
        return [
          ...prev,
          {
            productId: product.productId,
            productName: product.productName,
            sku: product.sku,
            qty: 1,
          },
        ]
      }

      if (prev[index].qty >= stock) {
        return prev
      }

      const next = [...prev]
      next[index] = { ...next[index], qty: next[index].qty + 1 }
      return next
    })
  }

  const increaseItemQty = (productId) => {
    const stock = stockByProductId.get(productId) ?? 0
    if (stock <= 0 || submitting) {
      return
    }

    setSelectedItems((prev) =>
      prev.map((item) => {
        if (item.productId !== productId) {
          return item
        }

        if (item.qty >= stock) {
          return item
        }
        return { ...item, qty: item.qty + 1 }
      }),
    )
  }

  const decreaseItemQty = (productId) => {
    if (submitting) {
      return
    }

    setSelectedItems((prev) =>
      prev
        .map((item) => (item.productId === productId ? { ...item, qty: item.qty - 1 } : item))
        .filter((item) => item.qty > 0),
    )
  }

  const closeConfirmModal = () => {
    setConfirmModal(DEFAULT_CONFIRM_MODAL)
  }

  const closeResultModal = () => {
    setResultModal(DEFAULT_RESULT_MODAL)
  }

  const validateSubmit = () => {
    if (!storeId) {
      return '매장 정보를 찾을 수 없습니다. 다시 로그인해 주세요.'
    }
    if (!selectedWarehouseId) {
      return isMealMode
        ? '재고가 있는 창고를 찾지 못했습니다.'
        : '폐기 대상 창고를 선택해 주세요.'
    }
    if (selectedItems.length === 0) {
      return '상품을 1개 이상 선택해 주세요.'
    }
    if (!reasonText) {
      return isMealMode ? '직원을 선택해 주세요.' : '폐기 사유를 선택해 주세요.'
    }
    return ''
  }

  const handleRequestCreate = () => {
    if (submitting) {
      return
    }

    const validationError = validateSubmit()
    if (validationError) {
      setErrorMsg(validationError)
      return
    }

    setErrorMsg('')
    setConfirmModal({
      open: true,
      message: isMealMode
        ? `${reasonText} 식사 처리로 ${selectedSummary.qty}개 상품을 등록하시겠습니까?`
        : `${selectedSummary.qty}개 상품을 폐기로 등록하시겠습니까?`,
    })
  }

  const handleCreateDiscard = async () => {
    const validationError = validateSubmit()
    if (validationError) {
      setErrorMsg(validationError)
      closeConfirmModal()
      return
    }

    try {
      closeConfirmModal()
      setSubmitting(true)
      setErrorMsg('')

      const created = await createDiscard({
        storeId,
        warehouseId: Number(selectedWarehouseId),
        reason: mealReasonForSave,
        items: selectedItems.map((item) => ({
          productId: item.productId,
          qty: item.qty,
        })),
      })

      setSelectedItems([])
      if (!isMealMode) {
        setSelectedReason('')
      }

      setResultModal({
        open: true,
        title: isMealMode ? '식사 등록 완료' : '폐기 등록 완료',
        message: '폐기 내역이 생성되었습니다. 확정은 관리자 페이지에서 진행해 주세요.',
        discardId: created?.discardId ?? null,
      })
    } catch (error) {
      setErrorMsg(getApiErrorMessage(error, '폐기 등록에 실패했습니다.'))
    } finally {
      setSubmitting(false)
    }
  }

  const controlDisabled =
    loadingOptions || loadingInventory || submitting || confirmModal.open || resultModal.open

  return (
    <div className='menu-layout stock-action-layout'>
      <div className='menu-main stock-action-main'>
        <div className='menu-display stock-action-display'>
          <div className='stock-action-header'>
            <h2>{pageTitle}</h2>
          </div>

          <div className='stock-config-panel'>
            {!isMealMode && (
              <>
                <label>창고 선택</label>
                <div className='stock-choice-grid'>
                  {warehouses.map((warehouse) => (
                    <button
                      key={warehouse.warehouseId}
                      type='button'
                      className={`stock-choice-btn ${
                        selectedWarehouseId === String(warehouse.warehouseId) ? 'active' : ''
                      }`}
                      onClick={() => setSelectedWarehouseId(String(warehouse.warehouseId))}
                      disabled={controlDisabled}
                    >
                      {warehouse.name}
                    </button>
                  ))}
                  {!loadingOptions && warehouses.length === 0 && (
                    <div className='stock-empty-inline'>사용 가능한 창고가 없습니다.</div>
                  )}
                </div>
              </>
            )}

            {isMealMode && (
              <p className='stock-auto-warehouse'>
                자동 할당 창고: {selectedWarehouse?.name || '재고 창고 탐색 중'}
              </p>
            )}

            {isMealMode ? (
              <>
                <label>직원 선택</label>
                <div className='stock-choice-grid'>
                  {employees.map((employee) => (
                    <button
                      key={employee.id}
                      type='button'
                      className={`stock-choice-btn ${
                        selectedEmployeeId === String(employee.id) ? 'active' : ''
                      }`}
                      onClick={() => setSelectedEmployeeId(String(employee.id))}
                      disabled={controlDisabled}
                    >
                      {employee.name}({employee.employeeCode})
                    </button>
                  ))}
                  {!loadingOptions && employees.length === 0 && (
                    <div className='stock-empty-inline'>선택 가능한 직원이 없습니다.</div>
                  )}
                </div>
              </>
            ) : (
              <>
                <label>폐기 사유 선택</label>
                <div className='stock-choice-grid'>
                  {DISPOSE_REASON_OPTIONS.map((reason) => (
                    <button
                      key={reason}
                      type='button'
                      className={`stock-choice-btn ${selectedReason === reason ? 'active' : ''}`}
                      onClick={() => setSelectedReason(reason)}
                      disabled={controlDisabled}
                    >
                      {reason}
                    </button>
                  ))}
                </div>
              </>
            )}

            <p className='stock-selected-reason'>기록 사유: {reasonText || '미선택'}</p>
          </div>

          <div className='stock-selected-panel'>
            <div className='stock-selected-head'>
              <strong>선택 상품</strong>
              <span>
                {selectedSummary.types}종 / {selectedSummary.qty}개
              </span>
            </div>

            {selectedItems.length === 0 ? (
              <div className='stock-empty'>오른쪽 상품 버튼을 눌러 선택해 주세요.</div>
            ) : (
              <div className='stock-selected-list'>
                {selectedItems.map((item) => {
                  const stock = stockByProductId.get(item.productId) ?? 0
                  return (
                    <div key={item.productId} className='stock-selected-item'>
                      <div className='stock-selected-meta'>
                        <strong>{item.productName}</strong>
                        <span>
                          {item.sku || '-'} / 재고 {stock}개
                        </span>
                      </div>
                      <div className='menu-count stock-item-count'>
                        <button type='button' onClick={() => decreaseItemQty(item.productId)} disabled={controlDisabled}>
                          -
                        </button>
                        <span>{item.qty}</span>
                        <button
                          type='button'
                          onClick={() => increaseItemQty(item.productId)}
                          disabled={controlDisabled || item.qty >= stock}
                        >
                          +
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        <div className='menu-category stock-product-panel'>
          <div className='menu-grid stock-product-grid'>
            {loadingInventory ? (
              <div className='menu-grid-message'>재고 상품을 불러오는 중입니다...</div>
            ) : inventory.length === 0 ? (
              <div className='menu-grid-message'>
                {selectedWarehouse
                  ? '선택 가능한 재고 상품이 없습니다.'
                  : '창고를 먼저 선택해 주세요.'}
              </div>
            ) : (
              inventory.map((item) => {
                const selectedItem = selectedItems.find((selected) => selected.productId === item.productId)
                const selectedQty = selectedItem?.qty ?? 0
                const disabled = controlDisabled || item.onHand <= 0 || selectedQty >= item.onHand
                return (
                  <button
                    key={`${item.productId}-${item.warehouseId}`}
                    type='button'
                    className={`menu-button stock-product-btn ${disabled ? 'soldout' : ''}`}
                    onClick={() => addProduct(item)}
                    disabled={disabled}
                  >
                    <strong className='menu-button-name'>{item.productName}</strong>
                    <span className='menu-button-price'>{item.sku || '-'}</span>
                    <span className={`menu-button-stock ${item.onHand <= 0 ? 'soldout' : ''}`}>
                      {getStockLabel(item.onHand)}
                    </span>
                    {selectedQty > 0 && <span className='stock-product-selected'>선택 {selectedQty}개</span>}
                  </button>
                )
              })
            )}
          </div>
        </div>
      </div>

      <div className={`menu-footer stock-action-footer ${errorMsg ? 'has-error' : ''}`.trim()}>
        {errorMsg && (
          <div className='stock-footer-error'>
            <div className='stock-error'>{errorMsg}</div>
          </div>
        )}

        <button type='button' className='back-btn' onClick={() => navigate('/manager')} disabled={submitting}>
          관리자 메뉴
        </button>

        <button type='button' className='pay-btn stock-submit-btn' onClick={handleRequestCreate} disabled={controlDisabled}>
          {submitting ? submitLoadingLabel : submitLabel}
        </button>
      </div>

      {confirmModal.open && (
        <div className='stock-modal-backdrop'>
          <div className='stock-modal' role='dialog' aria-modal='true' aria-labelledby='stock-confirm-title'>
            <h3 id='stock-confirm-title'>{submitLabel} 확인</h3>
            <p>{confirmModal.message}</p>
            <div className='stock-modal-actions'>
              <button type='button' className='stock-modal-cancel' onClick={closeConfirmModal} disabled={submitting}>
                닫기
              </button>
              <button type='button' className='stock-modal-confirm' onClick={handleCreateDiscard} disabled={submitting}>
                등록 진행
              </button>
            </div>
          </div>
        </div>
      )}

      {resultModal.open && (
        <div className='stock-modal-backdrop'>
          <div className='stock-modal' role='dialog' aria-modal='true' aria-labelledby='stock-result-title'>
            <h3 id='stock-result-title'>{resultModal.title}</h3>
            <p>{resultModal.message}</p>
            {resultModal.discardId && <p className='stock-result-id'>번호: {resultModal.discardId}</p>}
            <div className='stock-modal-actions'>
              <button type='button' className='stock-modal-confirm' onClick={closeResultModal}>
                확인
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
