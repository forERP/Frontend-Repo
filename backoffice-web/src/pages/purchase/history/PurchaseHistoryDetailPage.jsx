import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../../lib/api';
import { ORDER_STATUS_LABEL } from '../../../constants/status';
import '../request/purchase.css';

export default function PurchaseHistoryDetailPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [cancelling, setCancelling] = useState(false);

    useEffect(() => {
        if (!id) return;
        api.get(`/api/purchase-orders/${id}`)
            .then(({ data }) => setOrder(data))
            .catch(() => setOrder(null))
            .finally(() => setLoading(false));
    }, [id]);

    const handleCancel = async () => {
        if (!order) return;
        if (!window.confirm('정말 발주를 취소하시겠습니까?')) return;

        setCancelling(true);
        try {
            const { data } = await api.post(`/api/purchase-orders/${order.purchaseOrderId}/cancel`);
            setOrder(data);
            alert('발주가 취소되었습니다.');
        } catch (err) {
            console.error(err);
            alert('발주 취소에 실패했습니다.');
        } finally {
            setCancelling(false);
        }
    };

    if (loading) return <div className="purchase-page">로딩 중...</div>;
    if (!order) return <div className="purchase-page">발주 내역을 찾을 수 없습니다.</div>;

    return (
        <div className="purchase-page">
            <button type="button" className="back-btn" onClick={() => navigate('/purchases')}>
                목록으로
            </button>
            <h1>발주 상세 이력</h1>
            {order.status === 'CREATED' && (
                <button
                    type="button"
                    className="cancel-btn"
                    onClick={handleCancel}
                    disabled={cancelling}
                    style={{ marginLeft: '20px' }}
                >
                    {cancelling ? '취소 중...' : '발주 취소'}
                </button>
            )}
            <div className="store-info-box">
                <p><strong>발주번호:</strong> {order.purchaseOrderId}</p>
                <p><strong>요청번호:</strong> {order.purchaseRequestId}</p>
                <p><strong>지점 ID:</strong> {order.storeId}</p>
                <p><strong>창고 ID:</strong> {order.warehouseId}</p>
                <p><strong>공급처 ID:</strong> {order.supplierId}</p>
                <p><strong>상태:</strong> {ORDER_STATUS_LABEL[order.status] ?? order.status}</p>
                <p><strong>생성일:</strong> {order.createdAt ? new Date(order.createdAt).toLocaleString() : '-'}</p>
                <p><strong>발주일:</strong> {order.orderedAt ? new Date(order.orderedAt).toLocaleString() : '-'}</p>
                {order.memo && <p><strong>메모:</strong> {order.memo}</p>}
            </div>

            {order.items?.length > 0 && (
                <>
                    <h2>품목 내역</h2>
                    <table className="erp-table">
                        <thead>
                            <tr>
                                <th>품목 ID</th>
                                <th>상품 ID</th>
                                <th>수량</th>
                            </tr>
                        </thead>
                        <tbody>
                            {order.items.map(item => (
                                <tr key={item.purchaseOrderItemId}>
                                    <td>{item.purchaseOrderItemId}</td>
                                    <td>{item.productId}</td>
                                    <td>{item.qty}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </>
            )}
        </div>
    );
}
