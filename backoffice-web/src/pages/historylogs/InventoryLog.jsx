import { useEffect, useState } from 'react'
import ListPagination from '../../components/list/ListPagination'
import ListSearchControls from '../../components/list/ListSearchControls'
import { fetchInventoryLogPage } from '../../api/logApi'
import '../purchase/request/purchase.css'
import './LogPage.css'

const INITIAL_FILTERS = {
  eventType: '',
  storeKeyword: '',
  warehouseKeyword: '',
  productKeyword: '',
  actorKeyword: '',
  from: '',
  to: '',
}

const EVENT_OPTIONS = [
  { value: '', label: '전체' },
  { value: 'INBOUND', label: '입고' },
  { value: 'OUTBOUND', label: '출고' },
  { value: 'RETURN', label: '반품' },
  { value: 'DISCARD', label: '폐기' },
  { value: 'ADJUST', label: '재고 조정' },
]

const EVENT_LABEL_MAP = EVENT_OPTIONS.reduce((acc, option) => {
  if (option.value) acc[option.value] = option.label
  return acc
}, {})

const EVENT_COLOR_MAP = {
  INBOUND: '#16a34a',
  OUTBOUND: '#1d4ed8',
  RETURN: '#059669',
  DISCARD: '#dc2626',
  ADJUST: '#7c3aed',
}

const formatDateTime = value => {
  if (!value) return '-'
  return new Date(value).toLocaleString('ko-KR')
}

const formatStoreWarehouse = item => {
  const store = item.storeName || `매장 ${item.storeId ?? '-'}`
  const storeCode = item.storeCode ? `(${item.storeCode})` : ''
  const warehouse = item.warehouseName || `창고 ${item.warehouseId ?? '-'}`
  const warehouseCode = item.warehouseCode ? `(${item.warehouseCode})` : ''
  return `${store} ${storeCode} / ${warehouse} ${warehouseCode}`.trim()
}

const formatProduct = item => {
  const name = item.productName || `상품 ${item.productId ?? '-'}`
  const sku = item.productSku ? `(${item.productSku})` : ''
  return `${name} ${sku}`.trim()
}

const formatActor = item => {
  if (!item.actorUserId) {
    return '-'
  }
  const name = item.actorName || '-'
  const code = item.actorEmployeeCode ? `(${item.actorEmployeeCode})` : ''
  return `${name}${code}`
}

const resolveDeltaQty = item => {
  const qty = Number(item.changeQty || 0)

  if (item.eventType === 'INBOUND' || item.eventType === 'RETURN') {
    return qty
  }
  if (item.eventType === 'OUTBOUND' || item.eventType === 'DISCARD') {
    return -qty
  }
  if (item.eventType === 'ADJUST') {
    const beforeQty = Number(item.beforeQty || 0)
    const afterQty = Number(item.afterQty || 0)
    return afterQty - beforeQty
  }

  if (item.changeType === 'IN') {
    return qty
  }
  if (item.changeType === 'OUT') {
    return -qty
  }
  return qty
}

const formatDeltaQty = item => {
  const delta = resolveDeltaQty(item)
  if (delta > 0) return `+${delta.toLocaleString('ko-KR')}`
  return delta.toLocaleString('ko-KR')
}

export default function InventoryLog() {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const [filters, setFilters] = useState(INITIAL_FILTERS)
  const [query, setQuery] = useState(INITIAL_FILTERS)

  const [currentPage, setCurrentPage] = useState(0)
  const [pageSize, setPageSize] = useState(10)
  const [totalPages, setTotalPages] = useState(0)
  const [totalElements, setTotalElements] = useState(0)

  useEffect(() => {
    loadLogs(currentPage, query, pageSize)
  }, [currentPage, query, pageSize])

  const loadLogs = async (page, search, size) => {
    try {
      setLoading(true)
      setError(null)

      const data = await fetchInventoryLogPage({
        page,
        size,
        eventType: search.eventType,
        storeKeyword: search.storeKeyword,
        warehouseKeyword: search.warehouseKeyword,
        productKeyword: search.productKeyword,
        actorKeyword: search.actorKeyword,
        from: search.from,
        to: search.to,
      })

      setLogs(data.content || [])
      setTotalPages(data.totalPages || 0)
      setTotalElements(data.totalElements || 0)
    } catch (err) {
      console.error(err)
      setError('재고 이동 로그 조회에 실패했습니다.')
      setLogs([])
      setTotalPages(0)
      setTotalElements(0)
    } finally {
      setLoading(false)
    }
  }

  const handleFilterChange = event => {
    const { name, value } = event.target
    setFilters(prev => ({ ...prev, [name]: value }))
  }

  const handleSearch = event => {
    event.preventDefault()
    setCurrentPage(0)
    setQuery({ ...filters })
  }

  const handleReset = () => {
    setFilters(INITIAL_FILTERS)
    setQuery(INITIAL_FILTERS)
    setCurrentPage(0)
  }

  const handlePageSizeChange = size => {
    setCurrentPage(0)
    setPageSize(size)
  }

  return (
    <div className="purchase-page log-page">
      <div className="page-header">
        <h2>재고 이동 로그</h2>
      </div>

      <div className="card list-filter-card">
        <ListSearchControls
          formClassName="inventory-log-search-form"
          fields={[
            {
              name: 'eventType',
              label: '이벤트',
              type: 'select',
              value: filters.eventType,
              onChange: handleFilterChange,
              options: EVENT_OPTIONS,
            },
            {
              name: 'storeKeyword',
              label: '매장',
              type: 'text',
              value: filters.storeKeyword,
              onChange: handleFilterChange,
              placeholder: '매장명 또는 매장코드',
            },
            {
              name: 'warehouseKeyword',
              label: '창고',
              type: 'text',
              value: filters.warehouseKeyword,
              onChange: handleFilterChange,
              placeholder: '창고명 또는 창고코드',
            },
            {
              name: 'productKeyword',
              label: '상품',
              type: 'text',
              value: filters.productKeyword,
              onChange: handleFilterChange,
              placeholder: '상품명 또는 SKU',
            },
            {
              name: 'actorKeyword',
              label: '행위자',
              type: 'text',
              value: filters.actorKeyword,
              onChange: handleFilterChange,
              placeholder: '이름/사번/로그인ID',
            },
            {
              name: 'movedRange',
              label: '이동 일자',
              type: 'date-range',
              fromName: 'from',
              toName: 'to',
              fromValue: filters.from,
              toValue: filters.to,
              onChange: handleFilterChange,
              className: 'date-range-field',
            },
          ]}
          onSearch={handleSearch}
          onReset={handleReset}
        />
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="card list-card">
        <div className="table-toolbar">
          <span className="total-count">총 {totalElements.toLocaleString('ko-KR')}건</span>
        </div>

        <table className="erp-table list-table inventory-log-table">
          <thead>
            <tr>
              <th>이동시각</th>
              <th>이벤트</th>
              <th>매장/창고</th>
              <th>상품</th>
              <th>이동량/전후재고</th>
              <th>행위자</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={8} className="empty-cell">
                  로딩 중...
                </td>
              </tr>
            ) : logs.length === 0 ? (
              <tr>
                <td colSpan={8} className="empty-cell">
                  검색 결과가 없습니다.
                </td>
              </tr>
            ) : (
              logs.map(item => {
                const delta = resolveDeltaQty(item)
                const beforeQty = Number(item.beforeQty || 0).toLocaleString('ko-KR')
                const afterQty = Number(item.afterQty || 0).toLocaleString('ko-KR')
                return (
                  <tr key={item.logId}>
                    <td title={formatDateTime(item.movedAt)}>{formatDateTime(item.movedAt)}</td>
                    <td>
                      <span
                        className="log-action-badge"
                        style={{ backgroundColor: `${EVENT_COLOR_MAP[item.eventType] || '#6b7280'}22`, color: EVENT_COLOR_MAP[item.eventType] || '#374151' }}
                      >
                        {EVENT_LABEL_MAP[item.eventType] || item.eventType || '-'}
                      </span>
                    </td>
                    <td title={formatStoreWarehouse(item)}>{formatStoreWarehouse(item)}</td>
                    <td title={formatProduct(item)}>{formatProduct(item)}</td>
                    <td title={`${formatDeltaQty(item)} | ${beforeQty} -> ${afterQty}`}>
                      <span className={delta > 0 ? 'qty-positive' : delta < 0 ? 'qty-negative' : 'qty-neutral'}>
                        {formatDeltaQty(item)}
                      </span>
                      <span className="qty-flow-text">
                        {beforeQty} -&gt; {afterQty}
                      </span>
                    </td>
                    <td title={formatActor(item)}>{formatActor(item)}</td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>

        <ListPagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          pageSize={pageSize}
          onPageSizeChange={handlePageSizeChange}
        />
      </div>
    </div>
  )
}
