import { useCallback, useEffect, useState } from 'react';
import api from '../../lib/api';
import './InventoryReport.css';

const MOVEMENT_FILTER_OPTIONS = [
    { value: 'ALL', label: '전체' },
    { value: 'INBOUND', label: '입고' },
    { value: 'OUTBOUND', label: '출고' },
];

const EMPTY_SUMMARY = {
    totalInboundQty: 0,
    totalOutboundQty: 0,
    netQty: 0,
};

function numberFormat(value) {
    return new Intl.NumberFormat('ko-KR').format(value ?? 0);
}

export default function InventoryReport() {
    const [filters, setFilters] = useState({
        movementType: 'ALL',
        storeId: '',
        fromDate: '',
        toDate: '',
    });

    const [report, setReport] = useState({
        rows: [],
        summary: EMPTY_SUMMARY,
        stores: [],
        canSelectStore: false,
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const hasRows = report.rows.length > 0;

    const loadReport = useCallback(async () => {
        setLoading(true);
        setError('');

        try {
            const params = {
                movementType: filters.movementType,
                storeId: filters.storeId || undefined,
                fromDate: filters.fromDate || undefined,
                toDate: filters.toDate || undefined,
            };

            const { data } = await api.get('/api/inventory-reports', { params });

            setReport({
                rows: data?.content ?? [],
                summary: data?.summary ?? EMPTY_SUMMARY,
                stores: data?.availableStores ?? [],
                canSelectStore: Boolean(data?.canSelectStore),
            });
        } catch (e) {
            setReport((prev) => ({
                ...prev,
                rows: [],
                summary: EMPTY_SUMMARY,
            }));

            setError(
                e?.response?.data?.message ??
                '재고 리포트를 조회하지 못했습니다.'
            );
        } finally {
            setLoading(false);
        }
    }, [filters]);

    useEffect(() => {
        loadReport();
    }, [loadReport]);

    const handleFilterChange = (key, value) => {
        setFilters((prev) => ({
            ...prev,
            [key]: value,
        }));
    };

    const handleSearch = (e) => {
        e.preventDefault();
        loadReport();
    };

    return (
        <div className="inventory-report-page">
            <div className="inventory-report-header">
                <h1>재고 리포트</h1>
            </div>

            <form className="inventory-report-filter-card" onSubmit={handleSearch}>
                <div className="inventory-report-filter-grid">

                    <label className="inventory-report-field">
                        <span>조회 구분</span>
                        <select
                            value={filters.movementType}
                            onChange={(e) =>
                                handleFilterChange('movementType', e.target.value)
                            }
                        >
                            {MOVEMENT_FILTER_OPTIONS.map((option) => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                    </label>

                    <label className="inventory-report-field">
                        <span>매장</span>
                        <select
                            value={filters.storeId}
                            onChange={(e) =>
                                handleFilterChange('storeId', e.target.value)
                            }
                            disabled={!report.canSelectStore}
                        >
                            {report.canSelectStore && <option value="">전체 매장</option>}
                            {report.stores.map((store) => (
                                <option key={store.id} value={store.id}>
                                    {store.name}
                                </option>
                            ))}
                        </select>
                    </label>

                    <label className="inventory-report-field">
                        <span>시작일</span>
                        <input
                            type="date"
                            value={filters.fromDate}
                            onChange={(e) =>
                                handleFilterChange('fromDate', e.target.value)
                            }
                        />
                    </label>

                    <label className="inventory-report-field">
                        <span>종료일</span>
                        <input
                            type="date"
                            value={filters.toDate}
                            onChange={(e) =>
                                handleFilterChange('toDate', e.target.value)
                            }
                        />
                    </label>
                </div>

                <div className="inventory-report-filter-actions">
                    <button type="submit" disabled={loading}>
                        {loading ? '조회 중...' : '조회'}
                    </button>
                </div>
            </form>

            <section className="inventory-report-summary-grid">
                <article className="inventory-report-summary-card">
                    <h3>총 입고량</h3>
                    <p>{numberFormat(report.summary.totalInboundQty)}</p>
                </article>

                <article className="inventory-report-summary-card">
                    <h3>총 출고량</h3>
                    <p>{numberFormat(report.summary.totalOutboundQty)}</p>
                </article>

                <article className="inventory-report-summary-card">
                    <h3>순 증감</h3>
                    <p>{numberFormat(report.summary.netQty)}</p>
                </article>
            </section>

            <section className="inventory-report-table-card">
                <div className="inventory-report-table-header">
                    <h2>상품 재고 이동</h2>
                </div>

                {error && <p className="inventory-report-error">{error}</p>}

                {!error && !loading && !hasRows && (
                    <p className="inventory-report-empty">
                        조건에 해당하는 데이터가 없습니다.
                    </p>
                )}

                <div className="inventory-report-table-wrap">
                    <table>
                        <thead>
                        <tr>
                            <th>상품명</th>
                            <th className="align-right">입고량</th>
                            <th className="align-right">출고량</th>
                            <th className="align-right">순증감</th>
                        </tr>
                        </thead>
                        <tbody>
                        {report.rows.map((row) => (
                            <tr key={`${row.storeId}-${row.productId}`}>
                                <td>{row.productName}</td>
                                <td className="align-right">
                                    {numberFormat(row.inboundQty)}
                                </td>
                                <td className="align-right">
                                    {numberFormat(row.outboundQty)}
                                </td>
                                <td
                                    className={`align-right ${
                                        row.netQty < 0 ? 'decrease' : 'increase'
                                    }`}
                                >
                                    {numberFormat(row.netQty)}
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>
            </section>
        </div>
    );
}
