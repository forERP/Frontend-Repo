import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ListPagination from '../../components/list/ListPagination';
import ListSearchControls from '../../components/list/ListSearchControls';
import { fetchOrderPage } from '../../api/orderApi';
import { ORDER_STATUS } from '../../constants/status';
import { getLockedStoreKeyword, getSessionUser, isStoreAdminUser } from '../../utils/auth';
import '../purchase/request/purchase.css';
import './OrderList.css';

const createInitialFilters = lockedStoreKeyword => ({
  storeKeyword: lockedStoreKeyword || '',
  status: '',
  from: '',
  to: '',
});

export default function OrderList() {
  const navigate = useNavigate();
  const sessionUser = getSessionUser();
  const isStoreAdmin = isStoreAdminUser(sessionUser);
  const lockedStoreKeyword = getLockedStoreKeyword(sessionUser);
  const initialFilters = useMemo(
    () => createInitialFilters(isStoreAdmin ? lockedStoreKeyword : ''),
    [isStoreAdmin, lockedStoreKeyword],
  );

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [filters, setFilters] = useState(initialFilters);
  const [query, setQuery] = useState(initialFilters);

  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  useEffect(() => {
    loadOrders(currentPage, query, pageSize);
  }, [currentPage, query, pageSize]);

  useEffect(() => {
    setFilters(initialFilters);
    setQuery(initialFilters);
    setCurrentPage(0);
  }, [initialFilters]);

  const loadOrders = async (page, search, size) => {
    try {
      setLoading(true);
      setError(null);

      const data = await fetchOrderPage({
        page,
        size,
        storeKeyword: search.storeKeyword,
        status: search.status,
        from: search.from,
        to: search.to,
      });

      setOrders(data.content || []);
      setTotalPages(data.totalPages || 0);
      setTotalElements(data.totalElements || 0);
    } catch (err) {
      console.error(err);
      setError('주문 목록 조회에 실패했습니다.');
      setOrders([]);
      setTotalPages(0);
      setTotalElements(0);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = e => {
    const { name, value } = e.target;
    if (isStoreAdmin && name === 'storeKeyword') {
      return;
    }
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const handleSearch = e => {
    e.preventDefault();
    setCurrentPage(0);
    setQuery(isStoreAdmin ? { ...filters, storeKeyword: lockedStoreKeyword } : { ...filters });
  };

  const handleReset = () => {
    setFilters(initialFilters);
    setCurrentPage(0);
    setQuery(initialFilters);
  };

  const handlePageSizeChange = size => {
    setCurrentPage(0);
    setPageSize(size);
  };

  return (
    <div className="purchase-page">
      <div className="page-header">
        <h2>주문 목록</h2>
      </div>

      <div className="card list-filter-card">
        <ListSearchControls
          formClassName="order-list-search-form"
          fields={[
            {
              name: 'storeKeyword',
              label: '매장',
              type: 'text',
              value: filters.storeKeyword,
              onChange: handleFilterChange,
              placeholder: '매장명 또는 매장코드',
              disabled: isStoreAdmin,
            },
            {
              name: 'status',
              label: '상태',
              type: 'select',
              value: filters.status,
              onChange: handleFilterChange,
              options: [
                { value: '', label: '전체' },
                ...Object.entries(ORDER_STATUS).map(([key, value]) => ({ value: key, label: value.label })),
              ],
            },
            {
              name: 'orderedRange',
              label: '주문일',
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

        <table className="erp-table list-table order-list-table">
          <thead>
            <tr>
              <th>주문번호</th>
              <th>매장</th>
              <th>상태</th>
              <th>주문금액</th>
              <th>주문일시</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className="empty-cell">
                  로딩 중...
                </td>
              </tr>
            ) : orders.length === 0 ? (
              <tr>
                <td colSpan={5} className="empty-cell">
                  검색 결과가 없습니다.
                </td>
              </tr>
            ) : (
              orders.map(order => (
                <tr
                  key={order.orderId}
                  className="clickable-row"
                  onClick={() => navigate(`/orders/${order.orderId}`)}
                >
                  <td title={String(order.orderId)}>{order.orderId}</td>
                  <td title={`${order.storeName || `매장 ${order.storeId}`}${order.storeCode ? ` (${order.storeCode})` : ''}`}>
                    {order.storeName || `매장 ${order.storeId}`}
                    {order.storeCode ? ` (${order.storeCode})` : ''}
                  </td>
                  <td>
                    <span
                      className="status-badge"
                      style={{ backgroundColor: ORDER_STATUS[order.status]?.color || '#6C757D', color: '#fff' }}
                    >
                      {ORDER_STATUS[order.status]?.label || order.status}
                    </span>
                  </td>
                  <td title={order.totalAmount != null ? Number(order.totalAmount).toLocaleString('ko-KR') : '-'}>
                    {order.totalAmount != null ? `${Number(order.totalAmount).toLocaleString('ko-KR')}원` : '-'}
                  </td>
                  <td title={order.orderedAt ? new Date(order.orderedAt).toLocaleString('ko-KR') : '-'}>
                    {order.orderedAt ? new Date(order.orderedAt).toLocaleString('ko-KR') : '-'}
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
