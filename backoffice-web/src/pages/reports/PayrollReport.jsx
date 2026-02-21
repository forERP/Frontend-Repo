import { useEffect, useMemo, useState } from 'react';
// import {fetchSalaryYearRange,fetchSalaryReport,} from '../../api/PayrollReportApi';
import './PayrollReport.css';

function formatCurrency(value) {
  if (value == null) return '-';
  return new Intl.NumberFormat('ko-KR').format(value) + '원';
}

function formatDate(isoDate) {
  if (!isoDate) return '-';
  const date = new Date(isoDate);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
    2,
    '0'
  )}-${String(date.getDate()).padStart(2, '0')}`;
}

export default function PayrollReportPage() {
  const now = new Date();

  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);

  const [yearRange, setYearRange] = useState(null);
  const [rows, setRows] = useState([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadYearRange = async () => {
      try {
        setLoading(true);
        setError(null);

        const range = await fetchSalaryYearRange();
        setYearRange(range);
      } catch (err) {
        setError('급여 연도 범위 조회에 실패했습니다.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadYearRange();
  }, []);

  useEffect(() => {
    if (!yearRange) return;
    loadReport(year, month);
  }, [year, month, yearRange]);

  const loadReport = async (targetYear, targetMonth) => {
    try {
      setLoading(true);
      setError(null);

      const data = await fetchSalaryReport(targetYear, targetMonth);

      setRows(data?.content ?? []);
    } catch (err) {
      setError('급여 리포트 조회에 실패했습니다.');
      console.error(err);
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  const years = useMemo(() => {
    if (!yearRange) return [];

    const start = Math.min(yearRange.startYear, yearRange.endYear);
    const end = Math.max(yearRange.startYear, yearRange.endYear);

    const list = [];
    for (let y = end; y >= start; y--) list.push(y);
    return list;
  }, [yearRange]);

  const grouped = useMemo(() => {
    return rows.reduce((acc, row) => {
      if (!acc[row.storeName]) acc[row.storeName] = [];
      acc[row.storeName].push(row);
      return acc;
    }, {});
  }, [rows]);


  if (loading && !yearRange) {
    return (
      <div className="payroll-report-page">
        <h1>급여 리포트</h1>
        <div className="payroll-report-empty">로딩 중...</div>
      </div>
    );
  }

  if (error && !yearRange) {
    return (
      <div className="payroll-report-page">
        <h1>급여 리포트</h1>
        <div className="payroll-report-error">{error}</div>
      </div>
    );
  }

  if (!yearRange) return null;

  return (
    <div className="payroll-report-page">
      <div className="payroll-report-header">
        <div>
          <h1>급여 리포트</h1>
        </div>

        <div className="payroll-report-filters">
          <select
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
          >
            {years.map((value) => (
              <option key={value} value={value}>
                {value}년
              </option>
            ))}
          </select>

          <select
            value={month}
            onChange={(e) => setMonth(Number(e.target.value))}
          >
            {Array.from({ length: 12 }).map((_, idx) => (
              <option key={idx + 1} value={idx + 1}>
                {idx + 1}월
              </option>
            ))}
          </select>

          <button
            onClick={() => loadReport(year, month)}
            disabled={loading}
          >
            {loading ? '조회 중...' : '조회'}
          </button>
        </div>
      </div>

      {error && <div className="payroll-report-error">{error}</div>}

      {!loading && rows.length === 0 && (
        <div className="payroll-report-empty">
          조회된 급여 데이터가 없습니다.
        </div>
      )}

      {Object.entries(grouped).map(([storeName, employees]) => (
        <section className="payroll-report-section" key={storeName}>
          <h2>{storeName}</h2>
          <table className="payroll-report-table">
            <thead>
              <tr>
                <th>직원 ID</th>
                <th>직원명</th>
                <th>급여 유형</th>
                <th>기준 급여</th>
                <th>이번달 급여</th>
                <th>지급일</th>
              </tr>
            </thead>
            <tbody>
              {employees.map((row) => (
                <tr key={row.userId}>
                  <td>{row.userId}</td>
                  <td>{row.employeeName}</td>
                  <td>{row.payrollType}</td>
                  <td>{formatCurrency(row.baseAmount)}</td>
                  <td className="is-strong">
                    {formatCurrency(row.thisMonthPay)}
                  </td>
                  <td>{formatDate(row.paymentDate)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      ))}
    </div>
  );
}