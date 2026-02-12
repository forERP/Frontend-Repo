import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getInbound, getStore, confirmInbound, cancelInbound, departShipment } from '../../lib/dataApi';
import { INBOUND_STATUS } from '../../constants/status';
import '../purchase/request/purchase.css';
import './InboundDetailPage.css';

export default function InboundDetailPage() {
    const { id: inboundId } = useParams();
    const navigate = useNavigate();
    const [inbound, setInbound] = useState(null);
    const [storeName, setStoreName] = useState('');
    const [storeCode, setStoreCode] = useState('');
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [showDepartModal, setShowDepartModal] = useState(false);
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [departForm, setDepartForm] = useState({ carrier: '', trackingNumber: '' });

    // 입고 상세 조회
    useEffect(() => {
        const fetchInbound = async () => {
            try {
                setLoading(true);
                const inboundData = await getInbound(inboundId);
                setInbound(inboundData);

                // 매장 정보 조회
                if (inboundData.storeId) {
                    try {
                        const storeData = await getStore(inboundData.storeId);
                        setStoreName(storeData.storeName || storeData.name || `매장 ${inboundData.storeId}`);
                        setStoreCode(storeData.code || '');
                    } catch (err) {
                        console.warn('매장 조회 실패:', err);
                        setStoreName(`매장 ${inboundData.storeId}`);
                    }
                }
            } catch (err) {
                console.error('입고 조회 실패:', err);
                alert('입고 정보를 불러오는데 실패했습니다.');
            } finally {
                setLoading(false);
            }
        };
        fetchInbound();
    }, [inboundId]);

    const handleConfirm = async () => {
        setSubmitting(true);
        try {
            const updated = await confirmInbound(inboundId);
            setInbound(updated);
            setShowConfirmModal(false);
            alert('입고가 확정되었습니다.');
        } catch (err) {
            console.error('입고 확정 실패:', err);
            alert(err.response?.data?.message || '입고 확정에 실패했습니다.');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDepart = async () => {
        if (!departForm.carrier || !departForm.trackingNumber) {
            alert('운송사와 송장번호를 입력해주세요.');
            return;
        }
        setSubmitting(true);
        try {
            const updated = await departShipment(inboundId, departForm.carrier, departForm.trackingNumber);
            setInbound({
                ...inbound,
                shipment: updated
            });
            setShowDepartModal(false);
            setDepartForm({ carrier: '', trackingNumber: '' });
            alert('배송이 출발 처리되었습니다.');
        } catch (err) {
            console.error('배송 출발 실패:', err);
            alert(err.response?.data?.message || '배송 출발 처리에 실패했습니다.');
        } finally {
            setSubmitting(false);
        }
    };

    const handleCancel = async () => {
        setSubmitting(true);
        try {
            const updated = await cancelInbound(inboundId);
            setInbound(updated);
            setShowCancelModal(false);
            alert('입고가 취소되었습니다.');
        } catch (err) {
            console.error('입고 취소 실패:', err);
            alert(err.response?.data?.message || '입고 취소에 실패했습니다.');
        } finally {
            setSubmitting(false);
        }
    };

    const getStatusLabel = (status) => INBOUND_STATUS[status]?.label || status;
    const getStatusColor = (status) => INBOUND_STATUS[status]?.color || '#666';

    if (loading) return <div className="purchase-page">로딩 중...</div>;
    if (!inbound) return <div className="purchase-page">입고 정보 없음</div>;

    const isCreated = inbound.status === 'CREATED';
    const isReadyForDepart = inbound.shipment?.status === 'READY';

    return (
        <div className="purchase-page">
            <div className="page-header">
                <h2>입고 상세</h2>
                <button className="btn-secondary" onClick={() => navigate(-1)}>목록으로</button>
            </div>

            {/* 기본 정보 */}
            <div className="detail-section">
                <h3>기본 정보</h3>
                <div className="info-grid">
                    <div className="info-item">
                        <label>입고번호</label>
                        <span>{inbound.inboundId}</span>
                    </div>
                    <div className="info-item">
                        <label>발주번호</label>
                        <span>{inbound.purchaseOrderId}</span>
                    </div>
                    <div className="info-item">
                        <label>상태</label>
                        <span
                            className="status-badge"
                            style={{ backgroundColor: getStatusColor(inbound.status) }}
                        >
                            {getStatusLabel(inbound.status)}
                        </span>
                    </div>
                    <div className="info-item">
                        <label>생성일</label>
                        <span>{new Date(inbound.createdAt).toLocaleString('ko-KR')}</span>
                    </div>
                </div>
            </div>

            {/* 입고처 정보 */}
            <div className="detail-section">
                <h3>입고처 정보</h3>
                <div className="info-grid">
                    <div className="info-item">
                        <label>매장명</label>
                        <span>{storeName} ({storeCode})</span>
                    </div>
                    <div className="info-item">
                        <label>창고</label>
                        <span>{inbound.warehouseId}</span>
                    </div>
                </div>
            </div>

            {/* 배송 정보 */}
            {inbound.shipment && (
                <div className="detail-section">
                    <h3>배송 정보</h3>
                    <div className="info-grid">
                        <div className="info-item">
                            <label>배송 상태</label>
                            <span>{inbound.shipment.status}</span>
                        </div>
                        <div className="info-item">
                            <label>운송사</label>
                            <span>{inbound.shipment.carrier || '-'}</span>
                        </div>
                        <div className="info-item">
                            <label>송장번호</label>
                            <span>{inbound.shipment.trackingNumber || '-'}</span>
                        </div>
                    </div>
                </div>
            )}

            {/* 품목 목록 */}
            <div className="detail-section">
                <h3>입고 품목</h3>
                <table className="erp-table">
                    <thead>
                        <tr>
                            <th>No</th>
                            <th>상품ID</th>
                            <th>수량</th>
                        </tr>
                    </thead>
                    <tbody>
                        {inbound.items && inbound.items.length > 0 ? (
                            inbound.items.map((item, idx) => (
                                <tr key={item.inboundItemId || idx}>
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
                {isReadyForDepart && (
                    <button
                        className="btn-primary"
                        onClick={() => setShowDepartModal(true)}
                    >
                        배송 출발
                    </button>
                )}
                {(inbound.shipment?.status === 'SHIPPING' || inbound.shipment?.status === 'ARRIVED') && (
                    <button
                        className="btn-success"
                        onClick={() => setShowConfirmModal(true)}
                    >
                        입고 확정
                    </button>
                )}
                {isCreated && (
                    <>
                        <button
                            className="btn-danger"
                            onClick={() => setShowCancelModal(true)}
                        >
                            입고 취소
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

            {/* 배송 출발 모달 */}
            {showDepartModal && (
                <div className="modal-overlay">
                    <div className="modal">
                        <h3>배송 출발 (송장 입력)</h3>
                        <form onSubmit={e => { e.preventDefault(); handleDepart(); }}>
                            <div className="form-group">
                                <label>운송사 *</label>
                                <input
                                    type="text"
                                    placeholder="운송사 입력 (예: 쿠팡, CJ대한통운)"
                                    value={departForm.carrier}
                                    onChange={e => setDepartForm(prev => ({ ...prev, carrier: e.target.value }))}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>송장번호 *</label>
                                <input
                                    type="text"
                                    placeholder="송장번호 입력"
                                    value={departForm.trackingNumber}
                                    onChange={e => setDepartForm(prev => ({ ...prev, trackingNumber: e.target.value }))}
                                    required
                                />
                            </div>
                            <div className="modal-actions">
                                <button type="submit" disabled={submitting} className="btn-primary">
                                    {submitting ? '처리 중...' : '출발'}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setShowDepartModal(false)}
                                    className="btn-secondary"
                                    disabled={submitting}
                                >
                                    취소
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* 입고 확정 모달 */}
            {showConfirmModal && (
                <div className="modal-overlay">
                    <div className="modal">
                        <h3>입고 확정</h3>
                        <p>배송 도착을 확인하고 입고를 확정하시겠습니까?</p>
                        <div className="modal-actions">
                            <button
                                className="btn-success"
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

            {/* 입고 취소 모달 */}
            {showCancelModal && (
                <div className="modal-overlay">
                    <div className="modal">
                        <h3>입고 취소</h3>
                        <p>이 입고를 취소하시겠습니까?</p>
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
