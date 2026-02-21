import { useEffect, useState } from 'react';
import ListPagination from '../../components/list/ListPagination';
import ListSearchControls from '../../components/list/ListSearchControls';
import { fetchReturnPage } from '../../api/returnApi';
import '../purchase/request/purchase.css';
import './ReturnList.css';

const INITIAL_FILTERS = {
  storeId: '',
  status: '',
  from: '',
  to: '',
};

const RETURN_STATUS = {
  PROCESSED: { label: '처리완료', color: '#16A34A' },
};

const formatDateTime = value => {
  if (!value) return '-';
  return new Date(value).toLocaleString('ko-KR');
};

const formatMoney = value => {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return '-';
  return `${numeric.toLocaleString('ko-KR')}원`;
};

const formatStoreLabel = item => {
  const name = item.storeName || `매장 ${item.storeId ?? '-'}`;
  if (!item.storeCode) return name;
  return `${name} (${item.storeCode})`;
};

export default function ReturnList() {
  const [returns, setReturns] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [filters, setFilters] = useState(INITIAL_FILTERS);
  const [query, setQuery] = useState(INITIAL_FILTERS);

  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  useEffect(() => {
    loadReturns(currentPage, query, pageSize);
  }, [currentPage, query, pageSize]);

  const loadReturns = async (page, search, size) => {
    try {
      setLoading(true);
      setError(null);

      const data = await fetchReturnPage({
        page,
        size,
        storeId: search.storeId,
        status: search.status,
        from: search.from,
        to: search.to,
      });

      setReturns(data.content || []);
      setTotalPages(data.totalPages || 0);
      setTotalElements(data.totalElements || 0);
    } catch (err) {
      console.error(err);
      setError('반품 목록 조회에 실패했습니다.');
      setReturns([]);
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
        <h2>반품 조회</h2>
      </div>

      <div className="card list-filter-card">
        <ListSearchControls
          formClassName="return-list-search-form"
          fields={[
            {
              name: 'storeId',
              label: '매장ID',
              type: 'text',
              value: filters.storeId,
              onChange: handleFilterChange,
              placeholder: '매장 ID',
            },
            {
              name: 'status',
              label: '상태',
              type: 'select',
              value: filters.status,
              onChange: handleFilterChange,
              options: [
                { value: '', label: '전체' },
                { value: 'PROCESSED', label: '처리완료' },
              ],
            },
            {
              name: 'processedRange',
              label: '처리일',
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

        <table className="erp-table list-table return-list-table">
          <thead>
            <tr>
              <th>반품번호</th>
              <th>주문번호</th>
              <th>매장</th>
              <th>상태</th>
              <th>환불금액</th>
              <th>처리방식</th>
              <th>처리자</th>
              <th>처리일시</th>
              <th>사유</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={9} className="empty-cell">
                  로딩 중...
                </td>
              </tr>
            ) : returns.length === 0 ? (
              <tr>
                <td colSpan={9} className="empty-cell">
                  검색 결과가 없습니다.
                </td>
              </tr>
            ) : (
              returns.map(item => (
                <tr key={item.returnId}>
                  <td title={String(item.returnId || '-')}>{item.returnId || '-'}</td>
                  <td title={String(item.orderId || '-')}>{item.orderId || '-'}</td>
                  <td title={formatStoreLabel(item)}>{formatStoreLabel(item)}</td>
                  <td>
                    <span
                      className="status-badge"
                      style={{
                        backgroundColor: RETURN_STATUS[item.status]?.color || '#6C757D',
                        color: '#fff',
                      }}
                    >
                      {RETURN_STATUS[item.status]?.label || item.status || '-'}
                    </span>
                  </td>
                  <td title={formatMoney(item.refundedAmount)}>{formatMoney(item.refundedAmount)}</td>
                  <td title={item.discardStock ? '폐기 처리' : '재고 복원'}>
                    {item.discardStock ? '폐기 처리' : '재고 복원'}
                  </td>
                  <td title={item.processedByName || '-'}>{item.processedByName || '-'}</td>
                  <td title={formatDateTime(item.processedAt)}>{formatDateTime(item.processedAt)}</td>
                  <td title={item.reason || '-'}>{item.reason || '-'}</td>
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
