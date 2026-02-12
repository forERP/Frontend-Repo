import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getPurchaseOrder, getStore, getSupplier, getWarehouse, confirmPurchaseOrder, cancelPurchaseOrder } from '../../../lib/dataApi';
import { PURCHASE_ORDER_STATUS } from '../../../constants/status';
import '../request/purchase.css';
import './PurchaseOrderDetailPage.css';

export default function PurchaseOrderDetailPage() {
    const { orderId } = useParams();
    const navigate = useNavigate();
    const [order, setOrder] = useState(null);
    const [storeName, setStoreName] = useState('');
    const [storeCode, setStoreCode] = useState('');
    const [supplierName, setSupplierName] = useState('');
    const [warehouseInfo, setWarehouseInfo] = useState(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [showCancelModal, setShowCancelModal] = useState(false);

    // 발주 상세 조회
    useEffect(() => {
        const fetchOrder = async () => {
            try {
                setLoading(true);
                const orderData = await getPurchaseOrder(orderId);
                setOrder(orderData);

                // 매장, 거래처, 창고 정보 동시 조회
                try {
                    const [storeData, supplierData, warehouseData] = await Promise.all([
                        getStore(orderData.storeId),
                        getSupplier(orderData.supplierId),
                        getWarehouse(orderData.warehouseId)
                    ]);
                    setStoreName(storeData.storeName || `매장 ${orderData.storeId}`);
                    setStoreCode(storeData.code || '');
                    setSupplierName(supplierData.name || `거래처 ${orderData.supplierId}`);
                    setWarehouseInfo(warehouseData);
                } catch (err) {
                    console.warn('관련 정보 로드 실패:', err);
                    setStoreName(`매장 ${orderData.storeId}`);
                    setSupplierName(`거래처 ${orderData.supplierId}`);
                }
            } catch (err) {
                console.error('발주 조회 실패:', err);
                alert('발주 정보를 불러오는데 실패했습니다.');
            } finally {
                setLoading(false);
            }
        };
        fetchOrder();
    }, [orderId]);

    const handleConfirm = async () => {
        setSubmitting(true);
        try {
            const updated = await confirmPurchaseOrder(orderId);
            setOrder(updated);
            setShowConfirmModal(false);
            alert('발주가 확정되었습니다.');
        } catch (err) {
            console.error('발주 확정 실패:', err);
            alert(err.response?.data?.message || '발주 확정에 실패했습니다.');
        } finally {
            setSubmitting(false);
        }
    };

    const handleCancel = async () => {
        setSubmitting(true);
        try {
            const updated = await cancelPurchaseOrder(orderId);
            setOrder(updated);
            setShowCancelModal(false);
            alert('발주가 취소되었습니다.');
        } catch (err) {
            console.error('발주 취소 실패:', err);
            alert(err.response?.data?.message || '발주 취소에 실패했습니다.');
        } finally {
            setSubmitting(false);
        }
    };

    const getStatusLabel = (status) => PURCHASE_ORDER_STATUS[status]?.label || status;
    const getStatusColor = (status) => PURCHASE_ORDER_STATUS[status]?.color || '#666';

    if (loading) return <div className="purchase-page">로딩 중...</div>;
    if (!order) return <div className="purchase-page">발주 정보 없음</div>;

    const isCreated = order.status === 'CREATED';

    return (
        <div className="purchase-page">
            <div className="page-header">
                <h2>발주 상세</h2>
                <button className="btn-secondary" onClick={() => navigate(-1)}>목록으로</button>
            </div>

            {/* 기본 정보 */}
            <div className="detail-section">
                <h3>기본 정보</h3>
                <div className="info-grid">
                    <div className="info-item">
                        <label>발주번호</label>
                        <span>{order.purchaseOrderId}</span>
                    </div>
                    <div className="info-item">
                        <label>발주 요청번호</label>
                        <span>{order.purchaseRequestId || '-'}</span>
                    </div>
                    <div className="info-item">
                        <label>상태</label>
                        <span
                            className="status-badge"
                            style={{ backgroundColor: getStatusColor(order.status) }}
                        >
                            {getStatusLabel(order.status)}
                        </span>
                    </div>
                    <div className="info-item">
                        <label>생성일</label>
                        <span>{new Date(order.createdAt).toLocaleString('ko-KR')}</span>
                    </div>
                    <div className="info-item">
                        <label>확정일</label>
                        <span>{order.orderedAt ? new Date(order.orderedAt).toLocaleString('ko-KR') : '-'}</span>
                    </div>
                </div>
            </div>

            {/* 발주처 정보 */}
            <div className="detail-section">
                <h3>발주처 정보</h3>
                <div className="info-grid">
                    <div className="info-item">
                        <label>매장명</label>
                        <span>{storeName} ({storeCode})</span>
                    </div>
                    <div className="info-item">
                        <label>거래처명</label>
                        <span>{supplierName}</span>
                    </div>
                    <div className="info-item">
                        <label>창고명</label>
                        <span>{warehouseInfo?.code} ({warehouseInfo?.name})</span>
                    </div>
                </div>
            </div>

            {/* 메모 */}
            {order.memo && (
                <div className="detail-section">
                    <h3>메모</h3>
                    <div className="memo-box">{order.memo}</div>
                </div>
            )}

            {/* 품목 목록 */}
            <div className="detail-section">
                <h3>발주 품목</h3>
                <table className="erp-table">
                    <thead>
                        <tr>
                            <th>No</th>
                            <th>상품ID</th>
                            <th>수량</th>
                        </tr>
                    </thead>
                    <tbody>
                        {order.items && order.items.length > 0 ? (
                            order.items.map((item, idx) => (
                                <tr key={item.purchaseOrderItemId || idx}>
                                    <td>{idx + 1}</td>
                                    <td>{item.productId}</td>
                                    <td>{item.qty}</td>
                                </tr>
                            ))
                        ) : (
                            <tr><td colSpan={3}>품목 정보 없음</td></tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* 액션 버튼 */}
            <div className="form-actions">
                {isCreated && (
                    <>
                        <button
                            className="btn-primary"
                            onClick={() => setShowConfirmModal(true)}
                        >
                            발주 확정
                        </button>
                        <button
                            className="btn-danger"
                            onClick={() => setShowCancelModal(true)}
                        >
                            발주 취소
                        </button>
                    </>
                )}
                <button
                    className="btn-secondary"
                    onClick={() => navigate(-1)}
                >
                    뒤로가기
                </button>
            </div>

            {/* 발주 확정 모달 */}
            {showConfirmModal && (
                <div className="modal-overlay">
                    <div className="modal">
                        <h3>발주 확정</h3>
                        <p>이 발주를 확정하시겠습니까?</p>
                        <div className="modal-actions">
                            <button
                                className="btn-primary"
                                onClick={handleConfirm}
                                disabled={submitting}
                            >
                                {submitting ? '처리 중...' : '확정'}
                            </button>
                            <button
                                className="btn-secondary"
                                onClick={() => setShowConfirmModal(false)}
                                disabled={submitting}
                            >
                                취소
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* 발주 취소 모달 */}
            {showCancelModal && (
                <div className="modal-overlay">
                    <div className="modal">
                        <h3>발주 취소</h3>
                        <p>이 발주를 취소하시겠습니까?</p>
                        <div className="modal-actions">
                            <button
                                className="btn-danger"
                                onClick={handleCancel}
                                disabled={submitting}
                            >
                                {submitting ? '처리 중...' : '취소'}
                            </button>
                            <button
                                className="btn-secondary"
                                onClick={() => setShowCancelModal(false)}
                                disabled={submitting}
                            >
                                닫기
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
