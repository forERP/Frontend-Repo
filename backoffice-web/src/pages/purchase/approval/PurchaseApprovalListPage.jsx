import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../../lib/api';
import './PurchaseApprovalListPage.css';

export default function PurchaseApprovalListPage() {
    const navigate = useNavigate();
    const [list, setList] = useState([]);
    const [loading, setLoading] = useState(false);

    const [searchApprovalNo, setSearchApprovalNo] = useState('');

    const fetchList = async () => {
        setLoading(true);
        try {
            const params = {
                status: 'REQUESTED',
                page: 0,
                size: 20,
            };
            if (searchApprovalNo) params.purchaseRequestId = searchApprovalNo;

            const { data } = await api.get('/api/purchase-requests', { params });
            setList(data.content);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchList();
    }, []);

    const approve = async (id) => {
        await api.post(`/api/purchase-requests/${id}/approve`, {
            supplierId: 1,
            warehouseId: 1,
            memo: '자동 승인',
        });
        fetchList();
    };

    const reject = async (id) => {
        await api.post(`/api/purchase-requests/${id}/reject`, {
            reason: '반려',
        });
        fetchList();
    };

    return (
        <div className="purchase-page">
            <h1>발주 요청 승인</h1>

            <div className="filter-bar">
                <input
                    placeholder="승인번호 검색"
                    value={searchApprovalNo}
                    onChange={e => setSearchApprovalNo(e.target.value)}
                />
                <button onClick={fetchList}>검색</button>
            </div>

            <table className="erp-table">
                <thead>
                    <tr>
                        <th>승인번호</th>
                        <th>매장명</th>
                        <th>총금액</th>
                        <th>상세보기</th>
                        <th>상태버튼</th>
                    </tr>
                </thead>

                <tbody>
                    {loading ? (
                        <tr>
                            <td colSpan={5}>로딩 중...</td>
                        </tr>
                    ) : list.length === 0 ? (
                        <tr>
                            <td colSpan={5}>데이터 없음</td>
                        </tr>
                    ) : (
                        list.map(r => (
                            <tr key={r.purchaseRequestId}>
                                <td>{r.purchaseRequestId}</td>
                                <td>{r.storeName}</td>
                                <td>{r.totalAmount?.toLocaleString() || 0}</td>

                                <td>
                                    <button
                                        onClick={() =>
                                            navigate(`/purchases/approvals/${r.purchaseRequestId}`)
                                        }
                                    >
                                        보기
                                    </button>
                                </td>

                                <td>
                                    <div className="status-action">
                                        <span className="status-label">요청중</span>
                                        <div className="action-buttons">
                                            <button
                                                className="approve"
                                                onClick={() => approve(r.purchaseRequestId)}
                                            >
                                                승인
                                            </button>
                                            <button
                                                className="reject"
                                                onClick={() => reject(r.purchaseRequestId)}
                                            >
                                                반려
                                            </button>
                                        </div>
                                    </div>
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
    );
}