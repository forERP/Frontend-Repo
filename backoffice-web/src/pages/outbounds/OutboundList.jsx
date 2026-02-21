import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ListPagination from '../../components/list/ListPagination';
import ListSearchControls from '../../components/list/ListSearchControls';
import { fetchOutboundPage } from '../../api/outboundApi';
import { OUTBOUND_STATUS, SHIPMENT_STATUS } from '../../constants/status';
import { getLockedStoreKeyword, getSessionUser, isStoreAdminUser } from '../../utils/auth';
import '../purchase/request/purchase.css';
import './OutboundList.css';

const createInitialFilters = lockedStoreKeyword => ({
  storeKeyword: lockedStoreKeyword || '',
  status: '',
  shipmentStatus: '',
  from: '',
  to: '',
});

export default function OutboundList() {
  const navigate = useNavigate();
  const sessionUser = getSessionUser();
  const isStoreAdmin = isStoreAdminUser(sessionUser);
  const lockedStoreKeyword = getLockedStoreKeyword(sessionUser);
  const initialFilters = useMemo(
    () => createInitialFilters(isStoreAdmin ? lockedStoreKeyword : ''),
    [isStoreAdmin, lockedStoreKeyword],
  );

  const [outbounds, setOutbounds] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [filters, setFilters] = useState(initialFilters);
  const [query, setQuery] = useState(initialFilters);

  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  useEffect(() => {
    loadOutbounds(currentPage, query, pageSize);
  }, [currentPage, query, pageSize]);

  useEffect(() => {
    setFilters(initialFilters);
    setQuery(initialFilters);
    setCurrentPage(0);
  }, [initialFilters]);

  const loadOutbounds = async (page, search, size) => {
    try {
      setLoading(true);
      setError(null);

      const data = await fetchOutboundPage({
        page,
        size,
        storeKeyword: search.storeKeyword,
        status: search.status,
        shipmentStatus: search.shipmentStatus,
        from: search.from,
        to: search.to,
      });

      setOutbounds(data.content || []);
      setTotalPages(data.totalPages || 0);
      setTotalElements(data.totalElements || 0);
    } catch (err) {
      console.error(err);
      setError('출고 목록 조회에 실패했습니다.');
      setOutbounds([]);
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
        <h2>출고 목록</h2>
      </div>

      <div className="card list-filter-card">
        <ListSearchControls
          formClassName="outbound-list-search-form"
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
              label: '출고상태',
              type: 'select',
              value: filters.status,
              onChange: handleFilterChange,
              options: [
                { value: '', label: '전체' },
                ...Object.entries(OUTBOUND_STATUS).map(([key, value]) => ({ value: key, label: value.label })),
              ],
            },
            {
              name: 'shipmentStatus',
              label: '배송상태',
              type: 'select',
              value: filters.shipmentStatus,
              onChange: handleFilterChange,
              options: [
                { value: '', label: '전체' },
                ...Object.entries(SHIPMENT_STATUS).map(([key, value]) => ({ value: key, label: value.label })),
              ],
            },
            {
              name: 'createdRange',
              label: '생성일',
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

        <table className="erp-table list-table outbound-list-table">
          <thead>
            <tr>
              <th>출고번호</th>
              <th>주문번호</th>
              <th>매장</th>
              <th>창고</th>
              <th>출고상태</th>
              <th>배송상태</th>
              <th>생성일</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="empty-cell">
                  로딩 중...
                </td>
              </tr>
            ) : outbounds.length === 0 ? (
              <tr>
                <td colSpan={7} className="empty-cell">
                  검색 결과가 없습니다.
                </td>
              </tr>
            ) : (
              outbounds.map(outbound => (
                <tr
                  key={outbound.outboundId}
                  className="clickable-row"
                  onClick={() => navigate(`/outbounds/${outbound.outboundId}`)}
                >
                  <td title={String(outbound.outboundId)}>{outbound.outboundId}</td>
                  <td title={String(outbound.orderId)}>{outbound.orderId}</td>
                  <td title={`${outbound.storeName || `매장 ${outbound.storeId}`}${outbound.storeCode ? ` (${outbound.storeCode})` : ''}`}>
                    {outbound.storeName || `매장 ${outbound.storeId}`}
                    {outbound.storeCode ? ` (${outbound.storeCode})` : ''}
                  </td>
                  <td title={`${outbound.warehouseName || '-'}${outbound.warehouseCode ? ` (${outbound.warehouseCode})` : ''}`}>
                    {outbound.warehouseName || '-'}
                    {outbound.warehouseCode ? ` (${outbound.warehouseCode})` : ''}
                  </td>
                  <td>
                    <span
                      className="status-badge"
                      style={{ backgroundColor: OUTBOUND_STATUS[outbound.status]?.color || '#6C757D', color: '#fff' }}
                    >
                      {OUTBOUND_STATUS[outbound.status]?.label || outbound.status}
                    </span>
                  </td>
                  <td>
                    <span
                      className="status-badge"
                      style={{ backgroundColor: SHIPMENT_STATUS[outbound.shipmentStatus]?.color || '#6C757D', color: '#fff' }}
                    >
                      {SHIPMENT_STATUS[outbound.shipmentStatus]?.label || outbound.shipmentStatus || '-'}
                    </span>
                  </td>
                  <td title={outbound.createdAt ? new Date(outbound.createdAt).toLocaleString('ko-KR') : '-'}>
                    {outbound.createdAt ? new Date(outbound.createdAt).toLocaleString('ko-KR') : '-'}
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
