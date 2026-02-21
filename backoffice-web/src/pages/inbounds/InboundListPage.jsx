import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ListPagination from '../../components/list/ListPagination';
import ListSearchControls from '../../components/list/ListSearchControls';
import { INBOUND_STATUS, SHIPMENT_STATUS } from '../../constants/status';
import { getInboundList } from '../../lib/dataApi';
import { formatDocNumber } from '../../utils/purchaseDisplay';
import '../purchase/request/purchase.css';
import './InboundListPage.css';

const INITIAL_FILTERS = {
  storeKeyword: '',
  status: '',
  shipmentStatus: '',
  from: '',
  to: '',
};

export default function InboundListPage() {
  const navigate = useNavigate();
  const [inbounds, setInbounds] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [filters, setFilters] = useState(INITIAL_FILTERS);
  const [query, setQuery] = useState(INITIAL_FILTERS);

  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  useEffect(() => {
    fetchInbounds(currentPage, query, pageSize);
  }, [currentPage, query, pageSize]);

  const fetchInbounds = async (page, search, size) => {
    try {
      setLoading(true);
      setError(null);

      const filterParams = {
        page,
        size,
      };

      if (search.storeKeyword?.trim()) filterParams.storeKeyword = search.storeKeyword.trim();
      if (search.status) filterParams.status = search.status;
      if (search.shipmentStatus) filterParams.shipmentStatus = search.shipmentStatus;
      if (search.from) filterParams.from = search.from;
      if (search.to) filterParams.to = search.to;

      const result = await getInboundList(filterParams);
      setTotalPages(result.totalPages || 0);
      setTotalElements(result.totalElements || 0);
      setInbounds(result.content || []);
    } catch (err) {
      console.error('입고 목록 조회 실패:', err);
      setError('입고 목록을 불러오지 못했습니다.');
      setInbounds([]);
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

  const getStatusLabel = status => INBOUND_STATUS[status]?.label || status;
  const getStatusColor = status => INBOUND_STATUS[status]?.color || '#666';
  const getShipmentStatusLabel = status => SHIPMENT_STATUS[status]?.label || status;
  const getShipmentStatusColor = status => SHIPMENT_STATUS[status]?.color || '#6C757D';

  return (
    <div className="purchase-page">
      <div className="page-header">
        <h2>입고 목록</h2>
        <button className="btn-primary" onClick={() => navigate('/purchase-orders')}>
          발주 보기
        </button>
      </div>

      <div className="card list-filter-card">
        <ListSearchControls
          formClassName="inbound-list-search-form"
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
              name: 'status',
              label: '상태',
              type: 'select',
              value: filters.status,
              onChange: handleFilterChange,
              options: [
                { value: '', label: '전체' },
                ...Object.entries(INBOUND_STATUS).map(([key, value]) => ({ value: key, label: value.label })),
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

        <table className="erp-table list-table inbound-list-table">
          <thead>
            <tr>
              <th>입고번호</th>
              <th>발주번호</th>
              <th>매장</th>
              <th>상태</th>
              <th>배송 상태</th>
              <th>생성일</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="empty-cell">
                  로딩 중...
                </td>
              </tr>
            ) : inbounds.length === 0 ? (
              <tr>
                <td colSpan={6} className="empty-cell">
                  검색 결과가 없습니다.
                </td>
              </tr>
            ) : (
              inbounds.map(inbound => (
                <tr
                  key={inbound.inboundId}
                  className="clickable-row"
                  onClick={() => navigate(`/inbounds/${inbound.inboundId}`)}
                >
                  <td title={formatDocNumber(inbound.createdAt, inbound.inboundId)}>
                    {formatDocNumber(inbound.createdAt, inbound.inboundId)}
                  </td>
                  <td title={formatDocNumber(inbound.purchaseOrderCreatedAt, inbound.purchaseOrderId)}>
                    {formatDocNumber(inbound.purchaseOrderCreatedAt, inbound.purchaseOrderId)}
                  </td>
                  <td title={`${inbound.storeName || `매장 ${inbound.storeId}`}${inbound.storeCode ? ` (${inbound.storeCode})` : ''}`}>
                    {inbound.storeName || `매장 ${inbound.storeId}`}
                    {inbound.storeCode ? ` (${inbound.storeCode})` : ''}
                  </td>
                  <td>
                    <span className="status-badge" style={{ backgroundColor: getStatusColor(inbound.status), color: '#fff' }}>
                      {getStatusLabel(inbound.status)}
                    </span>
                  </td>
                  <td title={inbound.shipmentStatus || '-'}>
                    {inbound.shipmentStatus ? (
                      <span
                        className="status-badge"
                        style={{ backgroundColor: getShipmentStatusColor(inbound.shipmentStatus), color: '#fff' }}
                      >
                        {getShipmentStatusLabel(inbound.shipmentStatus)}
                      </span>
                    ) : (
                      '-'
                    )}
                  </td>
                  <td title={inbound.createdAt ? new Date(inbound.createdAt).toLocaleDateString('ko-KR') : '-'}>
                    {inbound.createdAt ? new Date(inbound.createdAt).toLocaleDateString('ko-KR') : '-'}
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
