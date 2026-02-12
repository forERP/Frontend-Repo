import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getPurchaseOrderList, getStore, getSupplier } from '../../../lib/dataApi';
import { PURCHASE_ORDER_STATUS } from '../../../constants/status';
import '../request/purchase.css';
import './PurchaseOrderListPage.css';

export default function PurchaseOrderListPage() {
    const navigate = useNavigate();
    const [orders, setOrders] = useState([]);
    const [enrichedOrders, setEnrichedOrders] = useState([]);
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    
    // 필터
    const [filters, setFilters] = useState({
        storeId: '',
        supplierId: '',
        status: '',
        from: '',
        to: ''
    });

    // 목록 조회
    const fetchOrders = async (pageNum = 0) => {
        try {
            setLoading(true);
            const filterParams = {
                page: pageNum,
                size: 20
            };
            if (filters.storeId) filterParams.storeId = parseInt(filters.storeId);
            if (filters.supplierId) filterParams.supplierId = parseInt(filters.supplierId);
            if (filters.status) filterParams.status = filters.status;
            if (filters.from) filterParams.from = filters.from;
            if (filters.to) filterParams.to = filters.to;

            const result = await getPurchaseOrderList(filterParams);
            const orderList = result.content || [];
            setOrders(orderList);
            setPage(pageNum);
            setTotalPages(result.totalPages || 0);

            // 데이터 풍부화 - 매장명과 거래처명 조회
            const enriched = await Promise.all(
                orderList.map(async (order) => {
                    try {
                        const [storeData, supplierData] = await Promise.all([
                            getStore(order.storeId),
                            getSupplier(order.supplierId)
                        ]);
                        return {
                            ...order,
                            storeName: storeData.storeName || `매장 ${order.storeId}`,
                            storeCode: storeData.code || '',
                            supplierName: supplierData.name || `거래처 ${order.supplierId}`
                        };
                    } catch (err) {
                        console.warn(`발주 ${order.purchaseOrderId} 데이터 로드 실패:`, err);
                        return {
                            ...order,
                            storeName: `매장 ${order.storeId}`,
                            storeCode: '',
                            supplierName: `거래처 ${order.supplierId}`
                        };
                    }
                })
            );
            setEnrichedOrders(enriched);
        } catch (err) {
            console.error('발주 목록 조회 실패:', err);
            alert('발주 목록을 불러오는데 실패했습니다.');
        } finally {
            setLoading(false);
        }
    };

    // 초기 로드 및 필터 변경 시
    useEffect(() => {
        fetchOrders(0);
    }, [filters]);

    const handleFilterChange = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    };

    const handleSearch = () => {
        fetchOrders(0);
    };

    const handleReset = () => {
        setFilters({
            storeId: '',
            supplierId: '',
            status: '',
            from: '',
            to: ''
        });
    };

    const getStatusLabel = (status) => PURCHASE_ORDER_STATUS[status]?.label || status;
    const getStatusColor = (status) => PURCHASE_ORDER_STATUS[status]?.color || '#666';

    return (
        <div className="purchase-page">
            <div className="page-header">
                <h2>발주</h2>
                <button className="btn-primary" onClick={() => navigate('/purchase-requests')}>
                    발주 요청 보기
                </button>
            </div>

            {/* 필터 */}
            <div className="filter-section">
                <div className="filter-row">
                    <div className="filter-group">
                        <label>상태</label>
                        <select value={filters.status} onChange={e => handleFilterChange('status', e.target.value)}>
                            <option value="">전체</option>
                            {Object.entries(PURCHASE_ORDER_STATUS).map(([key, val]) => (
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
            ) : enrichedOrders.length === 0 ? (
                <p>발주 정보가 없습니다.</p>
            ) : (
                <>
                    <table className="erp-table">
                        <thead>
                            <tr>
                                <th>발주번호</th>
                                <th>매장</th>
                                <th>거래처</th>
                                <th>상태</th>
                                <th>생성일</th>
                                <th>확정일</th>
                                <th>작업</th>
                            </tr>
                        </thead>
                        <tbody>
                            {enrichedOrders.map(order => (
                                <tr key={order.purchaseOrderId}>
                                    <td>{order.purchaseOrderId}</td>
                                    <td>{order.storeName}({order.storeCode})</td>
                                    <td>{order.supplierName}</td>
                                    <td>
                                        <span
                                            className="status-badge"
                                            style={{ backgroundColor: getStatusColor(order.status) }}
                                        >
                                            {getStatusLabel(order.status)}
                                        </span>
                                    </td>
                                    <td>{new Date(order.createdAt).toLocaleDateString('ko-KR')}</td>
                                    <td>{order.orderedAt ? new Date(order.orderedAt).toLocaleDateString('ko-KR') : '-'}</td>
                                    <td>
                                        <button
                                            className="btn-sm btn-info"
                                            onClick={() => navigate(`/purchase-orders/${order.purchaseOrderId}`)}
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
                            onClick={() => fetchOrders(page - 1)}
                            className="btn-sm btn-secondary"
                        >
                            이전
                        </button>
                        <span>{page + 1} / {totalPages}</span>
                        <button
                            disabled={page >= totalPages - 1}
                            onClick={() => fetchOrders(page + 1)}
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
