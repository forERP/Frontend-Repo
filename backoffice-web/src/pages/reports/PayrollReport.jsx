import { useEffect, useState } from 'react';
import ListSearchControls from '../../components/list/ListSearchControls';
import { fetchPayrollReport } from '../../api/reportApi';
import '../purchase/request/purchase.css';
import './PayrollReport.css';

const now = new Date();
const CURRENT_YEAR = now.getFullYear();
const CURRENT_MONTH = now.getMonth() + 1;

const YEAR_OPTIONS = Array.from({ length: 6 }, (_, index) => {
  const year = CURRENT_YEAR - index;
  return { value: String(year), label: `${year}년` };
});

const MONTH_OPTIONS = Array.from({ length: 12 }, (_, index) => {
  const month = index + 1;
  return { value: String(month), label: `${month}월` };
});

const EMPLOYMENT_TYPE_OPTIONS = [
  { value: '', label: '전체' },
  { value: 'HOURLY', label: '시급' },
  { value: 'MONTHLY', label: '월급' },
];

const createInitialFilters = () => ({
  year: String(CURRENT_YEAR),
  month: String(CURRENT_MONTH),
  storeKeyword: '',
  employmentType: '',
});

const EMPTY_REPORT = {
  rows: [],
  stores: [],
  summary: {
    totalEmployeeCount: 0,
    totalPayrollAmount: 0,
    missingSalaryCount: 0,
  },
};

const formatNumber = value => {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return '-';
  return numeric.toLocaleString('ko-KR');
};

const formatCurrency = value => {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return '-';
  return `${numeric.toLocaleString('ko-KR')}원`;
};

const formatPayrollType = value => {
  if (value === 'HOURLY') return '시급';
  if (value === 'MONTHLY') return '월급';
  return '-';
};

export default function PayrollReport() {
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
        const data = await fetchPayrollReport({
          year: Number(query.year),
          month: Number(query.month),
          storeKeyword: query.storeKeyword,
          employmentType: query.employmentType,
        });

        if (!isMounted) return;
        setReport(data);
      } catch (loadError) {
        console.error(loadError);
        if (!isMounted) return;
        setError('급여 리포트 조회에 실패했습니다.');
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
    setError('');
    setQuery({ ...filters });
  };

  const handleReset = () => {
    const initialFilters = createInitialFilters();
    setFilters(initialFilters);
    setQuery(initialFilters);
    setError('');
  };

  const displayMonth = `${query.year}년 ${query.month}월`;

  return (
    <div className="purchase-page report-page payroll-report-page">
      <div className="page-header">
        <h2>급여 리포트</h2>
      </div>

      <div className="card list-filter-card">
        <ListSearchControls
          formClassName="report-search-form payroll-report-search-form"
          actionsClassName="report-search-actions"
          fields={[
            {
              name: 'year',
              label: '연도',
              type: 'select',
              value: filters.year,
              onChange: handleFilterChange,
              options: YEAR_OPTIONS,
            },
            {
              name: 'month',
              label: '월',
              type: 'select',
              value: filters.month,
              onChange: handleFilterChange,
              options: MONTH_OPTIONS,
            },
            {
              name: 'employmentType',
              label: '급여 유형',
              type: 'select',
              value: filters.employmentType,
              onChange: handleFilterChange,
              options: EMPLOYMENT_TYPE_OPTIONS,
            },
            {
              name: 'storeKeyword',
              label: '매장',
              type: 'text',
              value: filters.storeKeyword,
              onChange: handleFilterChange,
              placeholder: '매장명 또는 매장코드',
            },
          ]}
          onSearch={handleSearch}
          onReset={handleReset}
        />
      </div>

      <section className="report-summary-grid">
        <article className="report-summary-card">
          <h3>{displayMonth} 조회 직원 수</h3>
          <strong>{formatNumber(report.summary.totalEmployeeCount)}명</strong>
        </article>
        <article className="report-summary-card">
          <h3>{displayMonth} 총 급여</h3>
          <strong>{formatCurrency(report.summary.totalPayrollAmount)}</strong>
        </article>
        <article className="report-summary-card">
          <h3>급여 기준 미등록</h3>
          <strong>{formatNumber(report.summary.missingSalaryCount)}명</strong>
        </article>
      </section>

      {error && <div className="error-message">{error}</div>}

      {loading && report.stores.length === 0 && (
        <div className="card payroll-report-empty">로딩 중...</div>
      )}

      {!loading && report.stores.length === 0 && (
        <div className="card payroll-report-empty">검색 결과가 없습니다.</div>
      )}

      {report.stores.map(store => (
          <section className="card payroll-report-store-card" key={store.storeId || store.storeName}>
            <div className="payroll-report-store-title-row">
              <h3>{store.storeName}</h3>
              <span>{formatNumber(store.rows.length)}명</span>
            </div>

            <table className="erp-table list-table payroll-report-table">
              <thead>
                <tr>
                  <th>직원코드</th>
                  <th>직원명</th>
                  <th>급여 유형</th>
                  <th className="align-right">시급/월급</th>
                  <th className="align-right">이번달 급여</th>
                  <th>지급일</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} className="empty-cell">
                      로딩 중...
                    </td>
                  </tr>
                ) : (
                  store.rows.map(row => (
                    <tr key={row.userId}>
                      <td>{row.employeeCode || '-'}</td>
                      <td>{row.employeeName || '-'}</td>
                      <td>{formatPayrollType(row.payrollType)}</td>
                      <td className="align-right">{formatCurrency(row.baseAmount)}</td>
                      <td className="align-right">{formatCurrency(row.thisMonthPay)}</td>
                      <td>{row.paymentDate || '-'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </section>
      ))}
    </div>
  );
}
