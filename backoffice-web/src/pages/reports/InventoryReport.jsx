import { useEffect, useState } from 'react';
import ListSearchControls from '../../components/list/ListSearchControls';
import { fetchInventoryReport } from '../../api/reportApi';
import '../purchase/request/purchase.css';
import './InventoryReport.css';

const GROUP_OPTIONS = [
  { value: 'product', label: '상품별' },
  { value: 'store', label: '매장별' },
];

const MOVEMENT_OPTIONS = [
  { value: 'ALL', label: '전체' },
  { value: 'INBOUND', label: '입고 중심' },
  { value: 'OUTBOUND', label: '출고 중심' },
];

const createInitialFilters = () => ({
  groupBy: 'product',
  movementType: 'ALL',
  storeKeyword: '',
  from: '',
  to: '',
});

const EMPTY_REPORT = {
  rows: [],
  summary: {
    totalInboundQty: 0,
    totalOutboundQty: 0,
    netQty: 0,
  },
  totalRows: 0,
};

const formatNumber = value => toNumber(value).toLocaleString('ko-KR');

const toNumber = value => {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : 0;
};

export default function InventoryReport() {
  const [filters, setFilters] = useState(createInitialFilters);
  const [query, setQuery] = useState(createInitialFilters);
  const [report, setReport] = useState(EMPTY_REPORT);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let isMounted = true;

    const load = async () => {
      try {
        setLoading(true);
        setError('');
        const data = await fetchInventoryReport(query);
        if (!isMounted) return;
        setReport(data);
      } catch (loadError) {
        console.error(loadError);
        if (!isMounted) return;
        setError('재고 리포트 조회에 실패했습니다.');
        setReport(EMPTY_REPORT);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    load();
    return () => {
      isMounted = false;
    };
  }, [query]);

  const handleFilterChange = event => {
    const { name, value } = event.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const handleSearch = event => {
    event.preventDefault();

    if (filters.from && filters.to && filters.from > filters.to) {
      setError('조회 시작일은 종료일보다 이후일 수 없습니다.');
      return;
    }

    setError('');
    setQuery({ ...filters });
  };

  const handleReset = () => {
    const initialFilters = createInitialFilters();
    setFilters(initialFilters);
    setQuery(initialFilters);
    setError('');
  };

  const titleLabel = query.groupBy === 'product' ? '상품' : '매장';

  return (
    <div className="purchase-page report-page inventory-report-page">
      <div className="page-header">
        <h2>재고 리포트</h2>
      </div>

      <div className="card list-filter-card">
        <ListSearchControls
          formClassName="report-search-form inventory-report-search-form"
          actionsClassName="report-search-actions"
          fields={[
            {
              name: 'groupBy',
              label: '집계 기준',
              type: 'select',
              value: filters.groupBy,
              onChange: handleFilterChange,
              options: GROUP_OPTIONS,
            },
            {
              name: 'movementType',
              label: '조회 구분',
              type: 'select',
              value: filters.movementType,
              onChange: handleFilterChange,
              options: MOVEMENT_OPTIONS,
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
              name: 'createdRange',
              label: '조회일',
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

      <section className="report-summary-grid">
        <article className="report-summary-card">
          <h3>총 입고량</h3>
          <strong>{formatNumber(report.summary.totalInboundQty)}개</strong>
        </article>
        <article className="report-summary-card">
          <h3>총 출고량</h3>
          <strong>{formatNumber(report.summary.totalOutboundQty)}개</strong>
        </article>
        <article className="report-summary-card">
          <h3>순 증감</h3>
          <strong className={report.summary.netQty < 0 ? 'decrease' : 'increase'}>
            {formatNumber(report.summary.netQty)}개
          </strong>
        </article>
      </section>

      {error && <div className="error-message">{error}</div>}

      <div className="card list-card">
        <div className="table-toolbar">
          <span className="total-count">총 {formatNumber(report.totalRows)}건</span>
        </div>

        <table className="erp-table list-table inventory-report-table">
          <thead>
            <tr>
              <th>{titleLabel}</th>
              <th className="align-right">입고량</th>
              <th className="align-right">출고량</th>
              <th className="align-right">순 증감</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={4} className="empty-cell">
                  로딩 중...
                </td>
              </tr>
            ) : report.rows.length === 0 ? (
              <tr>
                <td colSpan={4} className="empty-cell">
                  검색 결과가 없습니다.
                </td>
              </tr>
            ) : (
              report.rows.map(row => (
                <tr key={row.key}>
                  <td title={row.name}>{row.name}</td>
                  <td className="align-right">{formatNumber(row.inboundQty)}</td>
                  <td className="align-right">{formatNumber(row.outboundQty)}</td>
                  <td className={`align-right ${row.netQty < 0 ? 'decrease' : 'increase'}`}>
                    {formatNumber(row.netQty)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
