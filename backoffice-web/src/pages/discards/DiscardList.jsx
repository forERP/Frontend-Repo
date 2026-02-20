import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ListPagination from '../../components/list/ListPagination';
import ListSearchControls from '../../components/list/ListSearchControls';
import { fetchDiscardPage } from '../../api/discardApi';
import '../purchase/request/purchase.css';
import './DiscardList.css';

const INITIAL_FILTERS = {
  storeKeyword: '',
  warehouseKeyword: '',
  productKeyword: '',
  status: '',
  createdFrom: '',
  createdTo: '',
  discardedFrom: '',
  discardedTo: '',
};

const DISCARD_STATUS = {
  CREATED: { label: '생성됨', color: '#6C757D' },
  CONFIRMED: { label: '확정됨', color: '#16A34A' },
  CANCELED: { label: '취소됨', color: '#DC2626' },
};

const formatDateTime = value => {
  if (!value) return '-';
  return new Date(value).toLocaleString('ko-KR');
};

const formatStoreLabel = item => {
  const name = item.storeName || `매장 ${item.storeId ?? '-'}`;
  if (!item.storeCode) return name;
  return `${name} (${item.storeCode})`;
};

export default function DiscardList() {
  const navigate = useNavigate();
  const [discards, setDiscards] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [filters, setFilters] = useState(INITIAL_FILTERS);
  const [query, setQuery] = useState(INITIAL_FILTERS);

  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  useEffect(() => {
    loadDiscards(currentPage, query, pageSize);
  }, [currentPage, query, pageSize]);

  const loadDiscards = async (page, search, size) => {
    try {
      setLoading(true);
      setError(null);

      const data = await fetchDiscardPage({
        page,
        size,
        storeKeyword: search.storeKeyword,
        warehouseKeyword: search.warehouseKeyword,
        productKeyword: search.productKeyword,
        status: search.status,
        from: search.createdFrom,
        to: search.createdTo,
        discardedFrom: search.discardedFrom,
        discardedTo: search.discardedTo,
      });

      setDiscards(data.content || []);
      setTotalPages(data.totalPages || 0);
      setTotalElements(data.totalElements || 0);
    } catch (err) {
      console.error(err);
      setError('폐기 목록 조회에 실패했습니다.');
      setDiscards([]);
      setTotalPages(0);
      setTotalElements(0);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = event => {
    const { name, value } = event.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const handleSearch = event => {
    event.preventDefault();
    setCurrentPage(0);
    setQuery({ ...filters });
  };

  const handleReset = () => {
    setFilters(INITIAL_FILTERS);
    setQuery(INITIAL_FILTERS);
    setCurrentPage(0);
  };

  const handlePageSizeChange = size => {
    setCurrentPage(0);
    setPageSize(size);
  };

  return (
    <div className="purchase-page">
      <div className="page-header">
        <h2>폐기 조회</h2>
        <button className="btn-primary" onClick={() => navigate('/discards/new')}>
          폐기 등록
        </button>
      </div>

      <div className="card list-filter-card">
        <ListSearchControls
          formClassName="discard-list-search-form"
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
              name: 'status',
              label: '상태',
              type: 'select',
              value: filters.status,
              onChange: handleFilterChange,
              options: [
                { value: '', label: '전체' },
                { value: 'CREATED', label: '생성됨' },
                { value: 'CONFIRMED', label: '확정됨' },
                { value: 'CANCELED', label: '취소됨' },
              ],
            },
            {
              name: 'createdRange',
              label: '생성일 범위',
              type: 'date-range',
              fromName: 'createdFrom',
              toName: 'createdTo',
              fromValue: filters.createdFrom,
              toValue: filters.createdTo,
              onChange: handleFilterChange,
              className: 'date-range-field',
            },
            {
              name: 'discardedRange',
              label: '확정일 범위',
              type: 'date-range',
              fromName: 'discardedFrom',
              toName: 'discardedTo',
              fromValue: filters.discardedFrom,
              toValue: filters.discardedTo,
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

        <table className="erp-table list-table discard-list-table">
          <thead>
            <tr>
              <th>폐기번호</th>
              <th>매장</th>
              <th>상태</th>
              <th>폐기사유</th>
              <th>생성자</th>
              <th>생성일</th>
              <th>확정일</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="empty-cell">
                  로딩 중...
                </td>
              </tr>
            ) : discards.length === 0 ? (
              <tr>
                <td colSpan={7} className="empty-cell">
                  검색 결과가 없습니다.
                </td>
              </tr>
            ) : (
              discards.map(item => (
                <tr
                  key={item.discardId}
                  className="clickable-row"
                  onClick={() => navigate(`/discards/${item.discardId}`)}
                >
                  <td title={String(item.discardId)}>{item.discardId}</td>
                  <td title={formatStoreLabel(item)}>{formatStoreLabel(item)}</td>
                  <td>
                    <span
                      className="status-badge"
                      style={{
                        backgroundColor: DISCARD_STATUS[item.status]?.color || '#6C757D',
                        color: '#fff',
                      }}
                    >
                      {DISCARD_STATUS[item.status]?.label || item.status || '-'}
                    </span>
                  </td>
                  <td title={item.reason || '-'}>{item.reason || '-'}</td>
                  <td title={item.createdByName || '-'}>{item.createdByName || '-'}</td>
                  <td title={formatDateTime(item.createdAt)}>{formatDateTime(item.createdAt)}</td>
                  <td title={formatDateTime(item.discardedAt)}>{formatDateTime(item.discardedAt)}</td>
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
