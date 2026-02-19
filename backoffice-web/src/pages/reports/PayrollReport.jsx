import { useEffect, useMemo, useState } from 'react';
import api from '../../lib/api';
import './PayrollReport.css';

function formatCurrency(value) {
    if (value == null) return '-';
    return new Intl.NumberFormat('ko-KR').format(value) + '원';
}

function formatDate(isoDate) {
    if (!isoDate) return '-';
    const date = new Date(isoDate);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export default function PayrollReport() {
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1;

    const [year, setYear] = useState(currentYear);
    const [month, setMonth] = useState(currentMonth);

    const [yearRange, setYearRange] = useState({ startYear: currentYear, endYear: currentYear });

    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const years = useMemo(() => {
        const start = Math.min(yearRange.startYear, yearRange.endYear);
        const end = Math.max(yearRange.startYear, yearRange.endYear);
        const list = [];

        for (let value = end; value >= start; value -= 1) {
            list.push(value);
        }
        return list;
    }, [yearRange]);

    const grouped = useMemo(() => {
        return rows.reduce((acc, row) => {
            if (!acc[row.storeName]) acc[row.storeName] = [];
            acc[row.storeName].push(row);
            return acc;
        }, {});
    }, [rows]);

    const fetchYearRange = async () => {
        try {
            const response = await api.get('/salary/report/year-range');
            const startYear = Number(response.data?.startYear);
            const endYear = Number(response.data?.endYear);

            if (Number.isFinite(startYear) && Number.isFinite(endYear)) {
                setYearRange({ startYear, endYear });
                if (year < startYear || year > endYear) {
                    setYear(endYear);
                }
            }
        } catch (e) {
            setYearRange({ startYear: currentYear, endYear: currentYear });
        }
    };

    const fetchReport = async () => {
        setLoading(true);
        setError('');
        try {
            const response = await api.get('/salary/report', {
                params: { year, month }
            });
            setRows(response.data.content ?? []);
        } catch (e) {
            setError(e?.response?.data?.message || '급여 리포트를 불러오지 못했습니다.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchYearRange();
        fetchReport();
    }, []);

    return (
        <div className="payroll-report-page">
            <div className="payroll-report-header">
                <div>
                    <h1>급여 리포트</h1>
                </div>

                <div className="payroll-report-filters">
                    <select value={year} onChange={(e) => setYear(Number(e.target.value))}>
                        {years.map((value) => (
                            <option key={value} value={value}>
                                {value}년
                            </option>
                        ))}
                    </select>

                    <select value={month} onChange={(e) => setMonth(Number(e.target.value))}>
                        {Array.from({ length: 12 }).map((_, idx) => (
                            <option key={idx + 1} value={idx + 1}>
                                {idx + 1}월
                            </option>
                        ))}
                    </select>

                    <button onClick={fetchReport} disabled={loading}>
                        {loading ? '조회 중...' : '조회'}
                    </button>
                </div>
            </div>

            {error ? <div className="payroll-report-error">{error}</div> : null}

            {!loading && rows.length === 0 ? (
                <div className="payroll-report-empty">조회된 급여 데이터가 없습니다.</div>
            ) : null}

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
                                    <td className="is-strong">{formatCurrency(row.thisMonthPay)}</td>
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
