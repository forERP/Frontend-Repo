import { useEffect, useMemo, useState } from 'react';
import { Bar } from 'react-chartjs-2';
import 'chart.js/auto';
import ListSearchControls from '../../components/list/ListSearchControls';
import { fetchSalesReport } from '../../api/reportApi';
import { ORDER_STATUS } from '../../constants/status';
import '../purchase/request/purchase.css';
import './SalesReport.css';

const GROUP_OPTIONS = [
  { value: 'product', label: '상품별' },
  { value: 'store', label: '매장별' },
];

const ORDER_STATUS_OPTIONS = [
  { value: 'EXCLUDE_CANCELED', label: '취소 제외' },
  { value: '', label: '전체' },
  ...Object.entries(ORDER_STATUS).map(([value, status]) => ({
    value,
    label: status.label,
  })),
];

const formatDateInput = date =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

const getDefaultDateRange = () => {
  const now = new Date();
  const from = new Date(now);
  from.setDate(from.getDate() - 30);
  return {
    from: formatDateInput(from),
    to: formatDateInput(now),
  };
};

const { from: defaultFrom, to: defaultTo } = getDefaultDateRange();

const createInitialFilters = () => ({
  groupBy: 'product',
  storeKeyword: '',
  orderStatus: 'EXCLUDE_CANCELED',
  from: defaultFrom,
  to: defaultTo,
});

const EMPTY_REPORT = {
  rows: [],
  summary: {
    totalSalesAmount: 0,
    totalOrderCount: 0,
    totalSoldQty: 0,
    totalGroupCount: 0,
  },
};

const currencyFormatter = new Intl.NumberFormat('ko-KR', {
  style: 'currency',
  currency: 'KRW',
  maximumFractionDigits: 0,
});

const numberFormatter = new Intl.NumberFormat('ko-KR');

export default function SalesReport() {
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
        const data = await fetchSalesReport(query);
        if (!isMounted) return;
        setReport(data);
      } catch (loadError) {
        console.error(loadError);
        if (!isMounted) return;
        setError('매출 리포트 조회에 실패했습니다.');
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

  const chartData = useMemo(() => ({
    labels: report.rows.map(row => row.name || '-'),
    datasets: [
      {
        label: '매출액',
        data: report.rows.map(row => Number(row.salesAmount || 0)),
        backgroundColor: 'rgba(37, 99, 235, 0.72)',
        borderColor: 'rgba(37, 99, 235, 1)',
        borderWidth: 1,
        borderRadius: 6,
        maxBarThickness: 48,
      },
    ],
  }), [report.rows]);

  const chartOptions = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: true, position: 'top' },
      tooltip: {
        callbacks: {
          label: context => `${context.dataset.label}: ${currencyFormatter.format(context.parsed.y || 0)}`,
        },
      },
    },
    scales: {
      y: {
        ticks: {
          callback: value => currencyFormatter.format(Number(value)),
        },
        beginAtZero: true,
      },
    },
  }), []);

  const isProductView = query.groupBy === 'product';

  return (
    <section className="purchase-page report-page sales-report-page">
      <div className="page-header">
        <h2>매출 리포트</h2>
      </div>

      <div className="card list-filter-card">
        <ListSearchControls
          formClassName="report-search-form sales-report-search-form"
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
              name: 'orderStatus',
              label: '주문 상태',
              type: 'select',
              value: filters.orderStatus,
              onChange: handleFilterChange,
              options: ORDER_STATUS_OPTIONS,
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

      <section className="report-summary-grid">
        <article className="report-summary-card">
          <h3>총 매출액</h3>
          <strong>{currencyFormatter.format(report.summary.totalSalesAmount || 0)}</strong>
        </article>
        <article className="report-summary-card">
          <h3>총 주문 수</h3>
          <strong>{numberFormatter.format(report.summary.totalOrderCount || 0)}건</strong>
        </article>
        <article className="report-summary-card">
          <h3>{isProductView ? '총 판매수량' : '집계 매장 수'}</h3>
          <strong>
            {isProductView
              ? `${numberFormatter.format(report.summary.totalSoldQty || 0)}개`
              : `${numberFormatter.format(report.summary.totalGroupCount || 0)}곳`}
          </strong>
        </article>
      </section>

      {error && <div className="error-message">{error}</div>}

      <div className="card sales-report-chart-card">
        <h3>{isProductView ? '상품별 매출 차트' : '매장별 매출 차트'}</h3>
        <div className="sales-report-chart-wrap">
          <Bar data={chartData} options={chartOptions} />
        </div>
      </div>

      <div className="card list-card">
        <div className="table-toolbar">
          <span className="total-count">총 {numberFormatter.format(report.rows.length)}건</span>
        </div>

        <table className="erp-table list-table sales-report-table">
          <thead>
            <tr>
              <th>{isProductView ? '상품명' : '매장명'}</th>
              <th className="align-right">{isProductView ? '판매수량' : '주문 수'}</th>
              <th className="align-right">매출액</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={3} className="empty-cell">
                  로딩 중...
                </td>
              </tr>
            ) : report.rows.length === 0 ? (
              <tr>
                <td colSpan={3} className="empty-cell">
                  검색 결과가 없습니다.
                </td>
              </tr>
            ) : (
              report.rows.map(row => (
                <tr key={row.key}>
                  <td title={row.name}>{row.name}</td>
                  <td className="align-right">
                    {numberFormatter.format(isProductView ? row.soldQty || 0 : row.orderCount || 0)}
                  </td>
                  <td className="align-right">{currencyFormatter.format(row.salesAmount || 0)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
