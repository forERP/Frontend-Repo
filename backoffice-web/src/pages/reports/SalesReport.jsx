import { useEffect, useMemo, useState } from 'react';
import { Bar } from 'react-chartjs-2';
import 'chart.js/auto';
// import api from '../../lib/api';
import './SalesReport.css';

const GROUP_OPTIONS = [
  { label: '상품별', value: 'product' },
  { label: '매장별', value: 'store' },
];

const currencyFormatter = new Intl.NumberFormat('ko-KR', {
  style: 'currency',
  currency: 'KRW',
  maximumFractionDigits: 0,
});

const numberFormatter = new Intl.NumberFormat('ko-KR');

function getDefaultDateRange() {
  const now = new Date();
  const toDate = now.toISOString().slice(0, 10);
  const from = new Date(now);
  from.setDate(from.getDate() - 30);
  const fromDate = from.toISOString().slice(0, 10);
  return { fromDate, toDate };
}

const EMPTY_SUMMARY = {
  totalSalesAmount: 0,
  totalOrderCount: 0,
  totalItemCount: 0,
};

export default function SalesReport() {
  const { fromDate: defaultFromDate, toDate: defaultToDate } = getDefaultDateRange();

  const [groupBy, setGroupBy] = useState('product');
  const [fromDate, setFromDate] = useState(defaultFromDate);
  const [toDate, setToDate] = useState(defaultToDate);

  const [salesItems, setSalesItems] = useState([]);
  const [summary, setSummary] = useState(EMPTY_SUMMARY);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const loadSalesReport = async (params) => {
    try {
      setLoading(true);
      setError('');

      const response = await api.get('/reports/sales', {
        params,
      });

      const payload = response?.data ?? {};

      setSalesItems(Array.isArray(payload.items) ? payload.items : []);
      setSummary(payload.summary ?? EMPTY_SUMMARY);
    } catch (err) {
      const serverMessage = err?.response?.data?.message;
      setError(serverMessage || '매출 리포트를 불러오지 못했습니다.');
      setSalesItems([]);
      setSummary(EMPTY_SUMMARY);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSalesReport({
      groupBy,
      fromDate,
      toDate,
    });
  }, []);

  const chartData = useMemo(() => ({
    labels: salesItems.map((item) => item.name ?? '-'),
    datasets: [
      {
        label: '매출액',
        data: salesItems.map((item) => Number(item.salesAmount ?? 0)),
        backgroundColor: 'rgba(37, 99, 235, 0.72)',
        borderColor: 'rgba(37, 99, 235, 1)',
        borderWidth: 1,
        borderRadius: 6,
        maxBarThickness: 48,
      },
    ],
  }), [salesItems]);

  const chartOptions = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: true, position: 'top' },
      tooltip: {
        callbacks: {
          label: (context) =>
            `${context.dataset.label}: ${currencyFormatter.format(context.parsed.y || 0)}`,
        },
      },
    },
    scales: {
      y: {
        ticks: {
          callback: (value) => currencyFormatter.format(Number(value)),
        },
        beginAtZero: true,
      },
    },
  }), []);

  const onSubmit = (e) => {
    e.preventDefault();

    if (fromDate > toDate) {
      setError('조회 시작일은 종료일보다 이후일 수 없습니다.');
      return;
    }

    loadSalesReport({
      groupBy,
      fromDate,
      toDate,
    });
  };

  return (
    <section className="sales-report-page">
      <header className="sales-report-page__header">
        <h1>매출 리포트</h1>
      </header>

      <form className="sales-report-filter" onSubmit={onSubmit}>
        <label>
          구분
          <select value={groupBy} onChange={(e) => setGroupBy(e.target.value)}>
            {GROUP_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label>
          시작일
          <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
        </label>

        <label>
          종료일
          <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} />
        </label>

        <button type="submit" disabled={loading}>
          {loading ? '조회 중...' : '조회'}
        </button>
      </form>

      {error && (
        <p className="sales-report-message sales-report-message--error">
          {error}
        </p>
      )}

      <div className="sales-report-summary">
        <article>
          <h2>총 매출액</h2>
          <strong>{currencyFormatter.format(summary.totalSalesAmount ?? 0)}</strong>
        </article>
        <article>
          <h2>총 주문 수</h2>
          <strong>{numberFormatter.format(summary.totalOrderCount ?? 0)}건</strong>
        </article>
        <article>
          <h2>조회 항목 수</h2>
          <strong>{numberFormatter.format(summary.totalItemCount ?? 0)}개</strong>
        </article>
      </div>

      <div className="sales-report-chart-card">
        <h2>{groupBy === 'product' ? '상품별 매출' : '매장별 매출'} 차트</h2>
        <div className="sales-report-chart-wrap">
          <Bar data={chartData} options={chartOptions} />
        </div>
      </div>

      <div className="sales-report-table-card">
        <h2>상세 내역</h2>
        <div className="sales-report-table-wrap">
          <table>
            <thead>
              <tr>
                <th>{groupBy === 'product' ? '상품명' : '매장명'}</th>
                <th>주문 수</th>
                <th>매출액</th>
              </tr>
            </thead>
            <tbody>
              {salesItems.length === 0 ? (
                <tr>
                  <td colSpan={3} className="sales-report-table__empty">
                    조회된 데이터가 없습니다.
                  </td>
                </tr>
              ) : (
                salesItems.map((item, idx) => (
                  <tr key={`${item.name}-${idx}`}>
                    <td>{item.name ?? '-'}</td>
                    <td>{numberFormatter.format(item.orderCount ?? 0)}건</td>
                    <td>{currencyFormatter.format(item.salesAmount ?? 0)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}