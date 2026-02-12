import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../../lib/api';
import { getStore, getUser } from '../../../lib/dataApi';
import { PURCHASE_REQUEST_STATUS } from '../../../constants/status';
import './PurchaseRequestListPage.css';
import './purchase.css';

export default function PurchaseRequestListPage() {
    const navigate = useNavigate();
    const [requests, setRequests] = useState([]);
    const [enrichedRequests, setEnrichedRequests] = useState([]);
    const [statusFilter, setStatusFilter] = useState('');
    const [storeIdFilter, setStoreIdFilter] = useState('');
    const [loading, setLoading] = useState(false);

    // 요청 목록 조회
    const fetchRequests = async () => {
        setLoading(true);
        try {
            const params = { page: 0, size: 20 };
            if (storeIdFilter) params.storeId = storeIdFilter;
            if (statusFilter) params.status = statusFilter;
            const { data } = await api.get('/api/purchase-requests', { params });
            setRequests(data.content);
        } catch (err) {
            console.error('발주 요청 목록 조회 실패:', err);
        } finally {
            setLoading(false);
        }
    };

    // 매장명/요청자명 조회
    useEffect(() => {
        const enrichRequests = async () => {
            if (requests.length === 0) {
                setEnrichedRequests([]);
                return;
            }

            try {
                const enrichedData = await Promise.all(
                    requests.map(async (req) => {
                        try {
                            const [store, user] = await Promise.all([
                                req.storeId ? getStore(req.storeId).catch(() => null) : Promise.resolve(null),
                                req.requestedByUserId ? getUser(req.requestedByUserId).catch(() => null) : Promise.resolve(null)
                            ]);

                            return {
                                ...req,
                                storeName: store?.storeName || store?.name || `매장 ${req.storeId}`,
                                storeCode: store?.code || '',
                                userName: user?.name || `사용자 ${req.requestedByUserId}`
                            };
                        } catch (err) {
                            console.warn('데이터 조회 실패:', err);
                            return {
                                ...req,
                                storeName: `매장 ${req.storeId}`,
                                storeCode: '',
                                userName: `사용자 ${req.requestedByUserId}`
                            };
                        }
                    })
                );
                setEnrichedRequests(enrichedData);
            } catch (err) {
                console.error('데이터 조회 중 오류:', err);
                setEnrichedRequests(requests);
            }
        };

        enrichRequests();
    }, [requests]);

    useEffect(() => {
        fetchRequests();
    }, [statusFilter, storeIdFilter]);

    const getStatusLabel = (status) => PURCHASE_REQUEST_STATUS[status]?.label || status;
    const getStatusColor = (status) => PURCHASE_REQUEST_STATUS[status]?.color || '#666';

    return (
        <div className="purchase-page">
            <div className="page-header">
                <h2>발주 요청 목록</h2>
                <button className="btn-primary" onClick={() => navigate('/purchase-orders')}>
                    발주 보기
                </button>
            </div>

            <div className="filter-section">
                <div className="filter-row">
                    <div className="filter-group">
                        <label>매장 ID</label>
                        <input
                            type="number"
                            placeholder="매장 ID 검색"
                            value={storeIdFilter}
                            onChange={e => setStoreIdFilter(e.target.value)}
                        />
                    </div>
                    <div className="filter-group">
                        <label>상태</label>
                        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                            <option value="">전체 상태</option>
                            {Object.entries(PURCHASE_REQUEST_STATUS).map(([k, v]) => (
                                <option key={k} value={k}>{v.label}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="filter-actions">
                    <button className="btn-primary" onClick={() => navigate('/purchase-requests/new')}>
                        발주 요청 생성
                    </button>
                </div>
            </div>

            <table className="erp-table">
                <thead>
                    <tr>
                        <th>요청번호</th>
                        <th>요청일</th>
                        <th>매장명</th>
                        <th>요청자</th>
                        <th>상태</th>
                        <th>작업</th>
                    </tr>
                </thead>
                <tbody>
                    {loading ? (
                        <tr><td colSpan={6}>로딩 중...</td></tr>
                    ) : enrichedRequests.length === 0 ? (
                        <tr><td colSpan={6}>요청 목록이 없습니다.</td></tr>
                    ) : enrichedRequests.map(r => (
                        <tr key={r.purchaseRequestId}>
                            <td>{r.purchaseRequestId}</td>
                            <td>{new Date(r.createdAt).toLocaleString('ko-KR')}</td>
                            <td>{r.storeName}{r.storeCode ? ` (${r.storeCode})` : ''}</td>
                            <td>{r.userName}</td>
                            <td>
                                <span
                                    className="status-badge"
                                    style={{ backgroundColor: getStatusColor(r.status) }}
                                >
                                    {getStatusLabel(r.status)}
                                </span>
                            </td>
                            <td>
                                <button
                                    className="btn-sm btn-info"
                                    onClick={() => navigate(`/purchase-requests/${r.purchaseRequestId}`)}
                                >
                                    상세
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
