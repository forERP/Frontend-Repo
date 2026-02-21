import { useEffect, useState } from 'react'
import ListPagination from '../../components/list/ListPagination'
import ListSearchControls from '../../components/list/ListSearchControls'
import { fetchAdminLogPage } from '../../api/logApi'
import '../purchase/request/purchase.css'
import './LogPage.css'

const INITIAL_FILTERS = {
  actorKeyword: '',
  action: '',
  from: '',
  to: '',
}

const ACTION_OPTIONS = [
  { value: '', label: '전체' },
  { value: 'ADMIN_LOGIN', label: '로그인' },
  { value: 'ADMIN_LOGOUT', label: '로그아웃' },
  { value: 'USER_CREATE', label: '직원 등록' },
  { value: 'USER_UPDATE', label: '직원 수정' },
  { value: 'PRODUCT_CREATE', label: '상품 등록' },
  { value: 'PRODUCT_UPDATE', label: '상품 수정' },
  { value: 'PRODUCT_BUNDLE_CREATE', label: '묶음상품 등록' },
  { value: 'PRODUCT_CATEGORY_CREATE', label: '카테고리 등록' },
  { value: 'PRODUCT_CATEGORY_UPDATE', label: '카테고리 수정' },
  { value: 'STORE_CREATE', label: '매장 등록' },
  { value: 'STORE_UPDATE', label: '매장 수정' },
  { value: 'WAREHOUSE_CREATE', label: '창고 등록' },
  { value: 'WAREHOUSE_UPDATE', label: '창고 수정' },
  { value: 'SUPPLIER_CREATE', label: '거래처 등록' },
  { value: 'SUPPLIER_UPDATE', label: '거래처 수정' },
  { value: 'PURCHASE_REQUEST_CREATE', label: '발주 요청' },
  { value: 'PURCHASE_ORDER_DRAFT_CREATE', label: '발주서 작성' },
  { value: 'PURCHASE_REQUEST_APPROVE', label: '발주 요청 승인' },
  { value: 'PURCHASE_REQUEST_REJECT', label: '발주 요청 반려' },
  { value: 'PURCHASE_ORDER_CONFIRM', label: '발주 확정' },
  { value: 'PURCHASE_ORDER_CANCEL', label: '발주 취소' },
  { value: 'INBOUND_CONFIRM', label: '입고 확정' },
  { value: 'INBOUND_CANCEL', label: '입고 취소' },
  { value: 'OUTBOUND_CONFIRM', label: '출고 확정' },
  { value: 'OUTBOUND_CANCEL', label: '출고 취소' },
  { value: 'RETURN_CONFIRM', label: '반품 확정' },
  { value: 'DISCARD_CONFIRM', label: '폐기 확정' },
  { value: 'DISCARD_CANCEL', label: '폐기 취소' },
  { value: 'INVENTORY_ADJUST', label: '재고 조정' },
]

const ACTION_LABEL_MAP = ACTION_OPTIONS.reduce((acc, option) => {
  if (option.value) acc[option.value] = option.label
  return acc
}, {})

const formatDateTime = value => {
  if (!value) return '-'
  return new Date(value).toLocaleString('ko-KR')
}

const formatActor = item => {
  const name = item.actorName || '-'
  const code = item.actorEmployeeCode ? `(${item.actorEmployeeCode})` : ''
  return `${name}${code}`
}

export default function AdminLog() {
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

      const data = await fetchAdminLogPage({
        page,
        size,
        actorKeyword: search.actorKeyword,
        action: search.action,
        from: search.from,
        to: search.to,
      })

      setLogs(data.content || [])
      setTotalPages(data.totalPages || 0)
      setTotalElements(data.totalElements || 0)
    } catch (err) {
      console.error(err)
      setError('관리자 로그 조회에 실패했습니다.')
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
        <h2>관리자 로그</h2>
      </div>

      <div className="card list-filter-card">
        <ListSearchControls
          formClassName="admin-log-search-form"
          fields={[
            {
              name: 'actorKeyword',
              label: '처리자',
              type: 'text',
              value: filters.actorKeyword,
              onChange: handleFilterChange,
              placeholder: '이름/사번/로그인ID',
            },
            {
              name: 'action',
              label: '이벤트',
              type: 'select',
              value: filters.action,
              onChange: handleFilterChange,
              options: ACTION_OPTIONS,
            },
            {
              name: 'createdRange',
              label: '이벤트 일자',
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

        <table className="erp-table list-table admin-log-table">
          <thead>
            <tr>
              <th>이벤트 시각</th>
              <th>이벤트</th>
              <th>처리자</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={3} className="empty-cell">
                  로딩 중...
                </td>
              </tr>
            ) : logs.length === 0 ? (
              <tr>
                <td colSpan={3} className="empty-cell">
                  검색 결과가 없습니다.
                </td>
              </tr>
            ) : (
              logs.map(item => (
                <tr key={item.logId}>
                  <td title={formatDateTime(item.actionAt)}>{formatDateTime(item.actionAt)}</td>
                  <td>
                    <span className="log-action-badge">
                      {ACTION_LABEL_MAP[item.action] || item.action || '-'}
                    </span>
                  </td>
                  <td title={formatActor(item)}>{formatActor(item)}</td>
                </tr>
              ))
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
