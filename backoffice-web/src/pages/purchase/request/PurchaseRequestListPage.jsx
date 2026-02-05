import { useState, useEffect } from 'react';
import api from '../../../lib/api';
import PurchaseRequestFormPage from './PurchaseRequestFormPage';
import PurchaseRequestDetailPage from './PurchaseRequestDetailPage';
import { STATUS_LABEL, getMenuOptions } from '../../../constants/status';
import './PurchaseRequestListPage.css';

export default function PurchaseRequestPage({ storeId }) {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(false);
    const [statusFilter, setStatusFilter] = useState('');
    const [searchNo, setSearchNo] = useState('');
    const [page, setPage] = useState(0);
    const [size] = useState(20);

    const [selectedRequest, setSelectedRequest] = useState(null);
    const [showForm, setShowForm] = useState(false);

    const fetchRequests = async () => {
        setLoading(true);
        try {
            const params = {
                storeId,
                status: statusFilter || undefined,
                page,
                size,
            };
            if (searchNo) params.purchaseRequestId = searchNo;

            const { data } = await api.get('/api/purchase-requests', { params });
            setRequests(data.content);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchRequests(); }, [statusFilter, searchNo, page]);

    return (
        <div className="purchase-request-page">
            <h1>발주 요청</h1>

            <div className="filter-bar">
                <input
                    placeholder="요청 번호 검색"
                    value={searchNo}
                    onChange={e => setSearchNo(e.target.value)}
                />
                <select
                    value={statusFilter}
                    onChange={e => setStatusFilter(e.target.value)}
                >
                    <option value="">전체</option>
                    {Object.entries(STATUS_LABEL).map(([key, label]) => (
                        <option key={key} value={key}>{label}</option>
                    ))}
                </select>
                <button onClick={() => setShowForm(true)}>발주 요청 생성</button>
            </div>

            <table className="request-table">
                <thead>
                    <tr>
                        <th>요청번호</th>
                        <th>요청일</th>
                        <th>매장명</th>
                        <th>상세보기</th>
                        <th>상태</th>
                    </tr>
                </thead>
                <tbody>
                    {loading ? (
                        <tr><td colSpan={5}>로딩 중...</td></tr>
                    ) : requests.length === 0 ? (
                        <tr><td colSpan={5}>요청 목록이 존재하지 않습니다.</td></tr>
                    ) : requests.map(r => (
                        <tr key={r.purchaseRequestId}>
                            <td>{r.purchaseRequestId}</td>
                            <td>{new Date(r.createdAt).toLocaleString()}</td>
                            <td>{r.storeName || '매장명 없음'}</td>
                            <td>
                                <button onClick={() => setSelectedRequest(r.purchaseRequestId)}>
                                    보기
                                </button>
                            </td>
                            <td>{STATUS_LABEL[r.status] || r.status}</td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {showForm && (
                <PurchaseRequestFormPage
                    storeId={storeId}
                    onClose={() => { setShowForm(false); fetchRequests(); }}
                />
            )}

            {selectedRequest && (
                <PurchaseRequestDetailPage
                    purchaseRequestId={selectedRequest}
                    onClose={() => setSelectedRequest(null)}
                />
            )}
        </div>
    );
}
