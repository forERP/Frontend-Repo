import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../../lib/api';
import { STATUS_LABEL } from '../../../constants/status';
import './PurchaseApprovalDetailPage.css';

export default function PurchaseApprovalDetailPage() {
    const { id: purchaseRequestId } = useParams();
    const navigate = useNavigate();

    const [request, setRequest] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!purchaseRequestId) return;

        api
            .get(`/api/purchase-requests/${purchaseRequestId}`)
            .then(({ data }) => setRequest(data))
            .catch(() => setRequest(null))
            .finally(() => setLoading(false));
    }, [purchaseRequestId]);

    if (loading) {
        return <div className="purchase-page">로딩 중...</div>;
    }

    if (!request) {
        return <div className="purchase-page">발주 요청을 찾을 수 없습니다.</div>;
    }

    return (
        <div className="purchase-page">
            <button
                type="button"
                className="back-btn"
                onClick={() => navigate('/purchases/approvals')}
            >
                목록으로
            </button>

            <h1>발주 요청 상세</h1>

            <div className="store-info-box">
                <p><strong>요청번호:</strong> {request.purchaseRequestId}</p>
                <p><strong>지점 ID:</strong> {request.storeId}</p>
                <p><strong>요청자 ID:</strong> {request.requestedByUserId}</p>
                <p><strong>상태:</strong>{' '}{STATUS_LABEL[request.status] ?? request.status}</p>
                <p><strong>요청일:</strong>{' '} {request.createdAt ? new Date(request.createdAt).toLocaleString() : '-'}</p>
                {request.memo && (
                    <p>
                        <strong>메모:</strong> {request.memo}
                    </p>
                )}
            </div>

            <h2>요청 품목</h2>

            <table className="erp-table">
                <thead>
                    <tr>
                        <th>No</th>
                        <th>품목 ID</th>
                        <th>상품 ID</th>
                        <th>수량</th>
                    </tr>
                </thead>
                <tbody>
                    {request.items?.length === 0 ? (
                        <tr>
                            <td colSpan={4} style={{ textAlign: 'center' }}>
                                품목이 없습니다.
                            </td>
                        </tr>
                    ) : (
                        request.items.map((item, index) => (
                            <tr key={item.purchaseRequestItemId}>
                                <td>{index + 1}</td>
                                <td>{item.purchaseRequestItemId}</td>
                                <td>{item.productId}</td>
                                <td>{item.qty}</td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
    );
}
