import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../../lib/api';
import { getStore, getUser } from '../../../lib/dataApi';
import { STATUS_LABEL, PURCHASE_REQUEST_STATUS } from '../../../constants/status';
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
                                storeName: store?.name || `매장 ${req.storeId}`,
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

    return (
        <div className="purchase-page">
            <h1>발주 요청</h1>

            <div className="filter-bar">
                <input
                    type="number"
                    placeholder="매장 ID 검색"
                    value={storeIdFilter}
                    onChange={e => setStoreIdFilter(e.target.value)}
                />
                <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                    <option value="">전체 상태</option>
                    {Object.entries(PURCHASE_REQUEST_STATUS).map(([k, v]) => (
                        <option key={k} value={v}>{STATUS_LABEL[v]}</option>
                    ))}
                </select>
                <button onClick={() => navigate('/purchase-requests/new')} className="btn-primary">
                    발주 요청 생성
                </button>
            </div>

            <table className="erp-table">
                <thead>
                    <tr>
                        <th>요청번호</th>
                        <th>요청일</th>
                        <th>매장명</th>
                        <th>요청자</th>
                        <th>상태</th>
                        <th>상세보기</th>
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
                            <td>{STATUS_LABEL[r.status]}</td>
                            <td>
                                <button
                                    className="btn-secondary"
                                    onClick={() => navigate(`/purchase-requests/${r.purchaseRequestId}`)}
                                >
                                    보기
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
