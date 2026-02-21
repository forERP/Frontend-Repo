import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ListPagination from '../../../components/list/ListPagination';
import ListSearchControls from '../../../components/list/ListSearchControls';
import { PURCHASE_ORDER_STATUS } from '../../../constants/status';
import { getPurchaseOrderList } from '../../../lib/dataApi';
import { formatDocNumber } from '../../../utils/purchaseDisplay';
import '../request/purchase.css';
import './PurchaseOrderListPage.css';

const INITIAL_FILTERS = {
  storeKeyword: '',
  supplierName: '',
  status: '',
  createdFrom: '',
  createdTo: '',
  orderedFrom: '',
  orderedTo: '',
};

export default function PurchaseOrderListPage() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [filters, setFilters] = useState(INITIAL_FILTERS);
  const [query, setQuery] = useState(INITIAL_FILTERS);

  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  useEffect(() => {
    fetchOrders(currentPage, query, pageSize);
  }, [currentPage, query, pageSize]);

  const fetchOrders = async (page, search, size) => {
    try {
      setLoading(true);
      setError(null);

      const filterParams = {
        page,
        size,
      };

      if (search.storeKeyword?.trim()) filterParams.storeKeyword = search.storeKeyword.trim();
      if (search.supplierName?.trim()) filterParams.supplierName = search.supplierName.trim();
      if (search.status) filterParams.status = search.status;
      if (search.createdFrom) filterParams.createdFrom = search.createdFrom;
      if (search.createdTo) filterParams.createdTo = search.createdTo;
      if (search.orderedFrom) filterParams.orderedFrom = search.orderedFrom;
      if (search.orderedTo) filterParams.orderedTo = search.orderedTo;

      const result = await getPurchaseOrderList(filterParams);
      setTotalPages(result.totalPages || 0);
      setTotalElements(result.totalElements || 0);
      setOrders(result.content || []);
    } catch (err) {
      console.error('발주 목록 조회 실패:', err);
      setError('발주 목록을 불러오지 못했습니다.');
      setOrders([]);
      setTotalPages(0);
      setTotalElements(0);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = e => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const handleSearch = e => {
    e.preventDefault();
    setCurrentPage(0);
    setQuery({ ...filters });
  };

  const handleReset = () => {
    setFilters(INITIAL_FILTERS);
    setCurrentPage(0);
    setQuery(INITIAL_FILTERS);
  };

  const handlePageSizeChange = size => {
    setCurrentPage(0);
    setPageSize(size);
  };

  const getStatusLabel = status => PURCHASE_ORDER_STATUS[status]?.label || status;
  const getStatusColor = status => PURCHASE_ORDER_STATUS[status]?.color || '#666';

  return (
    <div className="purchase-page">
      <div className="page-header">
        <h2>발주 목록</h2>
        <button className="btn-primary" onClick={() => navigate('/purchase-requests')}>
          발주 요청 보기
        </button>
      </div>

      <div className="card list-filter-card">
        <ListSearchControls
          formClassName="purchase-order-list-search-form"
          fields={[
            {
              name: 'storeKeyword',
              label: '매장',
              type: 'text',
              value: filters.storeKeyword,
              onChange: handleFilterChange,
              placeholder: '매장명 또는 매장코드',
            },
            {
              name: 'supplierName',
              label: '거래처명',
              type: 'text',
              value: filters.supplierName,
              onChange: handleFilterChange,
              placeholder: '거래처명 검색',
            },
            {
              name: 'status',
              label: '상태',
              type: 'select',
              value: filters.status,
              onChange: handleFilterChange,
              options: [
                { value: '', label: '전체' },
                ...Object.entries(PURCHASE_ORDER_STATUS).map(([key, value]) => ({ value: key, label: value.label })),
              ],
            },
            {
              name: 'createdRange',
              label: '생성일',
              type: 'date-range',
              fromName: 'createdFrom',
              toName: 'createdTo',
              fromValue: filters.createdFrom,
              toValue: filters.createdTo,
              onChange: handleFilterChange,
              className: 'date-range-field',
            },
            {
              name: 'orderedRange',
              label: '확정일',
              type: 'date-range',
              fromName: 'orderedFrom',
              toName: 'orderedTo',
              fromValue: filters.orderedFrom,
              toValue: filters.orderedTo,
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

        <table className="erp-table list-table purchase-order-list-table">
          <thead>
            <tr>
              <th>발주번호</th>
              <th>매장</th>
              <th>거래처</th>
              <th>상태</th>
              <th>생성일</th>
              <th>확정일</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="empty-cell">
                  로딩 중...
                </td>
              </tr>
            ) : orders.length === 0 ? (
              <tr>
                <td colSpan={6} className="empty-cell">
                  검색 결과가 없습니다.
                </td>
              </tr>
            ) : (
              orders.map(order => (
                <tr
                  key={order.purchaseOrderId}
                  className="clickable-row"
                  onClick={() => navigate(`/purchase-orders/${order.purchaseOrderId}`)}
                >
                  <td title={formatDocNumber(order.createdAt, order.purchaseOrderId)}>
                    {formatDocNumber(order.createdAt, order.purchaseOrderId)}
                  </td>
                  <td title={`${order.storeName || `매장 ${order.storeId}`}${order.storeCode ? ` (${order.storeCode})` : ''}`}>
                    {order.storeName || `매장 ${order.storeId}`}
                    {order.storeCode ? ` (${order.storeCode})` : ''}
                  </td>
                  <td title={order.supplierName || `거래처 ${order.supplierId}`}>
                    {order.supplierName || `거래처 ${order.supplierId}`}
                  </td>
                  <td>
                    <span className="status-badge" style={{ backgroundColor: getStatusColor(order.status), color: '#fff' }}>
                      {getStatusLabel(order.status)}
                    </span>
                  </td>
                  <td title={order.createdAt ? new Date(order.createdAt).toLocaleDateString('ko-KR') : '-'}>
                    {order.createdAt ? new Date(order.createdAt).toLocaleDateString('ko-KR') : '-'}
                  </td>
                  <td title={order.orderedAt ? new Date(order.orderedAt).toLocaleDateString('ko-KR') : '-'}>
                    {order.orderedAt ? new Date(order.orderedAt).toLocaleDateString('ko-KR') : '-'}
                  </td>
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
  );
}
