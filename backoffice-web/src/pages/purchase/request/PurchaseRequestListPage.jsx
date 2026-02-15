import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ListPagination from '../../../components/list/ListPagination';
import ListSearchControls from '../../../components/list/ListSearchControls';
import api from '../../../lib/api';
import { PURCHASE_REQUEST_STATUS } from '../../../constants/status';
import './PurchaseRequestListPage.css';
import './purchase.css';

const INITIAL_FILTERS = {
  storeName: '',
  storeCode: '',
  status: '',
};

export default function PurchaseRequestListPage() {
  const navigate = useNavigate();

  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [filters, setFilters] = useState(INITIAL_FILTERS);
  const [query, setQuery] = useState(INITIAL_FILTERS);

  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  useEffect(() => {
    fetchRequests(currentPage, query, pageSize);
  }, [currentPage, query, pageSize]);

  const fetchRequests = async (page, search, size) => {
    setLoading(true);
    try {
      setError(null);

      const params = {
        page,
        size,
      };

      if (search.storeName?.trim()) params.storeName = search.storeName.trim();
      if (search.storeCode?.trim()) params.storeCode = search.storeCode.trim();
      if (search.status) params.status = search.status;

      const { data } = await api.get('/api/purchase-requests', { params });
      setRequests(data.content || []);
      setTotalPages(data.totalPages || 0);
      setTotalElements(data.totalElements || 0);
    } catch (err) {
      console.error('발주 요청 목록 조회 실패:', err);
      setError('발주 요청 목록을 불러올 수 없습니다.');
      setRequests([]);
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

  const handlePageSizeChange = nextSize => {
    setCurrentPage(0);
    setPageSize(nextSize);
  };

  const getStatusLabel = status => PURCHASE_REQUEST_STATUS[status]?.label || status;
  const getStatusColor = status => PURCHASE_REQUEST_STATUS[status]?.color || '#666';

  return (
    <div className="purchase-page">
      <div className="page-header">
        <h2>발주 요청 목록</h2>
        <div className="header-actions">
          <button className="btn-primary" onClick={() => navigate('/purchase-requests/new')}>
            발주 요청 생성
          </button>
          <button className="btn-primary" onClick={() => navigate('/purchase-orders')}>
            발주 보기
          </button>
        </div>
      </div>

      <div className="card list-filter-card">
        <ListSearchControls
          fields={[
            {
              name: 'storeName',
              label: '매장명',
              type: 'text',
              value: filters.storeName,
              onChange: handleFilterChange,
              placeholder: '매장명 검색',
            },
            {
              name: 'storeCode',
              label: '매장코드',
              type: 'text',
              value: filters.storeCode,
              onChange: handleFilterChange,
              placeholder: '매장코드 검색',
            },
            {
              name: 'status',
              label: '상태',
              type: 'select',
              value: filters.status,
              onChange: handleFilterChange,
              options: [
                { value: '', label: '전체' },
                ...Object.entries(PURCHASE_REQUEST_STATUS).map(([k, v]) => ({ value: k, label: v.label })),
              ],
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

        <table className="erp-table list-table purchase-request-list-table">
          <thead>
            <tr>
              <th>요청번호</th>
              <th>요청일</th>
              <th>매장명</th>
              <th>요청자</th>
              <th>상태</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className="empty-cell">
                  로딩 중...
                </td>
              </tr>
            ) : requests.length === 0 ? (
              <tr>
                <td colSpan={5} className="empty-cell">
                  검색 결과가 없습니다.
                </td>
              </tr>
            ) : (
              requests.map(request => (
                <tr
                  key={request.purchaseRequestId}
                  className="clickable-row"
                  onClick={() => navigate(`/purchase-requests/${request.purchaseRequestId}`)}
                >
                  <td title={String(request.purchaseRequestId)}>{request.purchaseRequestId}</td>
                  <td title={request.createdAt ? new Date(request.createdAt).toLocaleString('ko-KR') : '-'}>
                    {request.createdAt ? new Date(request.createdAt).toLocaleString('ko-KR') : '-'}
                  </td>
                  <td title={`${request.storeName || '-'}${request.storeCode ? ` (${request.storeCode})` : ''}`}>
                    {request.storeName || '-'}
                    {request.storeCode ? ` (${request.storeCode})` : ''}
                  </td>
                  <td title={request.requestedByUserId ? `사용자 ${request.requestedByUserId}` : '-'}>
                    {request.requestedByUserId ? `사용자 ${request.requestedByUserId}` : '-'}
                  </td>
                  <td>
                    <span
                      className="status-badge"
                      style={{ backgroundColor: getStatusColor(request.status), color: '#fff' }}
                    >
                      {getStatusLabel(request.status)}
                    </span>
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
