import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getInboundList, getStore } from '../../lib/dataApi';
import { INBOUND_STATUS } from '../../constants/status';
import '../purchase/request/purchase.css';
import './InboundListPage.css';

export default function InboundListPage() {
    const navigate = useNavigate();
    const [inbounds, setInbounds] = useState([]);
    const [enrichedInbounds, setEnrichedInbounds] = useState([]);
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    
    // 필터
    const [filters, setFilters] = useState({
        storeId: '',
        status: '',
        from: '',
        to: ''
    });

    // 목록 조회
    const fetchInbounds = async (pageNum = 0) => {
        try {
            setLoading(true);
            const filterParams = {
                page: pageNum,
                size: 20
            };
            if (filters.storeId) filterParams.storeId = parseInt(filters.storeId);
            if (filters.status) filterParams.status = filters.status;
            if (filters.from) filterParams.from = filters.from;
            if (filters.to) filterParams.to = filters.to;

            const result = await getInboundList(filterParams);
            const inboundList = result.content || [];
            setInbounds(inboundList);
            setPage(pageNum);
            setTotalPages(result.totalPages || 0);

            // 데이터 풍부화 - 매장명 조회
            const enriched = await Promise.all(
                inboundList.map(async (inbound) => {
                    try {
                        const storeData = await getStore(inbound.storeId);
                        return {
                            ...inbound,
                            storeName: storeData.storeName || storeData.name || `매장 ${inbound.storeId}`,
                            storeCode: storeData.code || ''
                        };
                    } catch (err) {
                        console.warn(`입고 ${inbound.inboundId} 데이터 로드 실패:`, err);
                        return {
                            ...inbound,
                            storeName: `매장 ${inbound.storeId}`,
                            storeCode: ''
                        };
                    }
                })
            );
            setEnrichedInbounds(enriched);
        } catch (err) {
            console.error('입고 목록 조회 실패:', err);
            alert('입고 목록을 불러오는데 실패했습니다.');
        } finally {
            setLoading(false);
        }
    };

    // 초기 로드 및 필터 변경 시
    useEffect(() => {
        fetchInbounds(0);
    }, [filters]);

    const handleFilterChange = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    };

    const handleSearch = () => {
        fetchInbounds(0);
    };

    const handleReset = () => {
        setFilters({
            storeId: '',
            status: '',
            from: '',
            to: ''
        });
    };

    const getStatusLabel = (status) => INBOUND_STATUS[status]?.label || status;
    const getStatusColor = (status) => INBOUND_STATUS[status]?.color || '#666';

    return (
        <div className="purchase-page">
            <div className="page-header">
                <h2>입고</h2>
                <button className="btn-primary" onClick={() => navigate('/purchase-orders')}>
                    발주 보기
                </button>
            </div>

            {/* 필터 */}
            <div className="filter-section">
                <div className="filter-row">
                    <div className="filter-group">
                        <label>매장 ID</label>
                        <input
                            type="number"
                            placeholder="매장 ID"
                            value={filters.storeId}
                            onChange={e => handleFilterChange('storeId', e.target.value)}
                        />
                    </div>

                    <div className="filter-group">
                        <label>상태</label>
                        <select value={filters.status} onChange={e => handleFilterChange('status', e.target.value)}>
                            <option value="">전체</option>
                            {Object.entries(INBOUND_STATUS).map(([key, val]) => (
                                <option key={key} value={key}>{val.label}</option>
                            ))}
                        </select>
                    </div>

                    <div className="filter-group">
                        <label>시작일</label>
                        <input
                            type="date"
                            value={filters.from}
                            onChange={e => handleFilterChange('from', e.target.value)}
                        />
                    </div>

                    <div className="filter-group">
                        <label>종료일</label>
                        <input
                            type="date"
                            value={filters.to}
                            onChange={e => handleFilterChange('to', e.target.value)}
                        />
                    </div>
                </div>

                <div className="filter-actions">
                    <button className="btn-primary" onClick={handleSearch}>검색</button>
                    <button className="btn-secondary" onClick={handleReset}>초기화</button>
                </div>
            </div>

            {/* 목록 */}
            {loading ? (
                <p>로딩 중...</p>
            ) : enrichedInbounds.length === 0 ? (
                <p>입고 정보가 없습니다.</p>
            ) : (
                <>
                    <table className="erp-table">
                        <thead>
                            <tr>
                                <th>입고번호</th>
                                <th>발주번호</th>
                                <th>매장</th>
                                <th>상태</th>
                                <th>배송 상태</th>
                                <th>생성일</th>
                                <th>작업</th>
                            </tr>
                        </thead>
                        <tbody>
                            {enrichedInbounds.map(inbound => (
                                <tr key={inbound.inboundId}>
                                    <td>{inbound.inboundId}</td>
                                    <td>{inbound.purchaseOrderId}</td>
                                    <td>{inbound.storeName}({inbound.storeCode})</td>
                                    <td>
                                        <span
                                            className="status-badge"
                                            style={{ backgroundColor: getStatusColor(inbound.status) }}
                                        >
                                            {getStatusLabel(inbound.status)}
                                        </span>
                                    </td>
                                    <td>{inbound.shipmentStatus || '-'}</td>
                                    <td>{new Date(inbound.createdAt).toLocaleDateString('ko-KR')}</td>
                                    <td>
                                        <button
                                            className="btn-sm btn-info"
                                            onClick={() => navigate(`/inbounds/${inbound.inboundId}`)}
                                        >
                                            상세
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {/* 페이지 네이션 */}
                    <div className="pagination">
                        <button
                            disabled={page === 0}
                            onClick={() => fetchInbounds(page - 1)}
                            className="btn-sm btn-secondary"
                        >
                            이전
                        </button>
                        <span>{page + 1} / {totalPages}</span>
                        <button
                            disabled={page >= totalPages - 1}
                            onClick={() => fetchInbounds(page + 1)}
                            className="btn-sm btn-secondary"
                        >
                            다음
                        </button>
                    </div>
                </>
            )}
        </div>
    );
}
