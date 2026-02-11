import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../../lib/api';
import { getStore, getUser, getAllSuppliers, getWarehouses } from '../../../lib/dataApi';
import { STATUS_LABEL } from '../../../constants/status';
import './purchase.css';
import './PurchaseRequestDetailPage.css';

export default function PurchaseRequestDetailPage() {
    const { id: purchaseRequestId } = useParams();
    const navigate = useNavigate();
    
    const [request, setRequest] = useState(null);
    const [storeName, setStoreName] = useState('');
    const [userName, setUserName] = useState('');
    const [loading, setLoading] = useState(false);
    const [suppliers, setSuppliers] = useState([]);
    const [warehouses, setWarehouses] = useState([]);
    const [showApproveModal, setShowApproveModal] = useState(false);
    const [approvalForm, setApprovalForm] = useState({ supplierId: '', warehouseId: '', memo: '' });
    const [submitting, setSubmitting] = useState(false);

    // 발주 요청 상세 조회
    useEffect(() => {
        const fetchRequest = async () => {
            setLoading(true);
            try {
                const res = await api.get(`/api/purchase-requests/${purchaseRequestId}`);
                setRequest(res.data);
                setApprovalForm(prev => ({ ...prev, memo: res.data.memo }));

                // 매장명과 요청자명 조회
                if (res.data.storeId) {
                    try {
                        const store = await getStore(res.data.storeId);
                        setStoreName(`${store.name}(${store.code || ''})`);
                    } catch (err) {
                        console.warn('매장 조회 실패:', err);
                        setStoreName(`매장 ${res.data.storeId}`);
                    }
                }

                if (res.data.requestedByUserId) {
                    try {
                        const user = await getUser(res.data.requestedByUserId);
                        setUserName(user.name);
                    } catch (err) {
                        console.warn('사용자 조회 실패:', err);
                        setUserName(`사용자 ${res.data.requestedByUserId}`);
                    }
                }
            } catch (err) {
                console.error('발주 요청 조회 실패:', err);
                alert('발주 요청을 조회할 수 없습니다.');
            } finally {
                setLoading(false);
            }
        };
        fetchRequest();
    }, [purchaseRequestId]);

    // 거래처 및 창고 목록 조회
    useEffect(() => {
        const fetchData = async () => {
            try {
                const [suppliersData, warehousesData] = await Promise.all([
                    getAllSuppliers(),
                    request ? getWarehouses(request.storeId) : Promise.resolve([])
                ]);
                setSuppliers(suppliersData);
                setWarehouses(warehousesData);
            } catch (err) {
                console.error('거래처/창고 조회 실패:', err);
            }
        };
        if (request) {
            fetchData();
        }
    }, [request]);

    const handleApprove = async e => {
        e.preventDefault();
        if (!approvalForm.supplierId || !approvalForm.warehouseId) {
            alert('거래처와 창고를 선택해주세요');
            return;
        }

        setSubmitting(true);
        try {
            const response = await api.post(
                `/api/purchase-requests/${purchaseRequestId}/approve`,
                {
                    supplierId: parseInt(approvalForm.supplierId),
                    warehouseId: parseInt(approvalForm.warehouseId),
                    memo: approvalForm.memo
                }
            );
            alert('발주 승인 완료. 발주 번호: ' + response.data.purchaseOrderId);
            setShowApproveModal(false);
            navigate('/purchase-orders');
        } catch (err) {
            console.error('승인 실패:', err);
            alert(err.response?.data?.message || '승인 처리 중 오류가 발생했습니다.');
        } finally {
            setSubmitting(false);
        }
    };

    const handleReject = async () => {
        if (!window.confirm('정말 반려하시겠습니까?')) return;

        try {
            await api.post(`/api/purchase-requests/${purchaseRequestId}/reject`);
            alert('발주 요청이 반려되었습니다.');
            navigate('/purchase-requests');
        } catch (err) {
            console.error('반려 실패:', err);
            alert(err.response?.data?.message || '반려 처리 중 오류가 발생했습니다.');
        }
    };

    if (loading) return <div className="purchase-page">로딩 중...</div>;
    if (!request) return <div className="purchase-page">발주 요청을 찾을 수 없습니다.</div>;

    const canApprove = request.status === 'REQUESTED';

    return (
        <div className="purchase-page">
            <h2>발주 요청 상세</h2>
            <button className="btn-secondary" onClick={() => navigate(-1)}>목록으로</button>

            <div className="info-box">
                <h3>요청 정보</h3>
                <table className="info-table">
                    <tbody>
                        <tr>
                            <th>요청번호</th>
                            <td>{request.purchaseRequestId}</td>
                        </tr>
                        <tr>
                            <th>매장</th>
                            <td>{storeName || `매장 ${request.storeId}`}</td>
                        </tr>
                        <tr>
                            <th>요청자</th>
                            <td>{userName || `사용자 ${request.requestedByUserId}`}</td>
                        </tr>
                        <tr>
                            <th>상태</th>
                            <td className={`status-${request.status.toLowerCase()}`}>
                                {STATUS_LABEL[request.status]}
                            </td>
                        </tr>
                        <tr>
                            <th>요청일</th>
                            <td>{new Date(request.createdAt).toLocaleString('ko-KR')}</td>
                        </tr>
                        <tr>
                            <th>메모</th>
                            <td>{request.memo || '-'}</td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <div className="info-box">
                <h3>요청 상품</h3>
                <table className="erp-table">
                    <thead>
                        <tr>
                            <th>No</th>
                            <th>상품ID</th>
                            <th>수량</th>
                        </tr>
                    </thead>
                    <tbody>
                        {request.items && request.items.length > 0 ? (
                            request.items.map((item, idx) => (
                                <tr key={item.purchaseRequestItemId}>
                                    <td>{idx + 1}</td>
                                    <td>{item.productId}</td>
                                    <td>{item.qty}</td>
                                </tr>
                            ))
                        ) : (
                            <tr><td colSpan={3}>상품이 없습니다.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>

            {canApprove && (
                <div className="form-actions">
                    <button
                        className="btn-primary"
                        onClick={() => setShowApproveModal(true)}
                    >
                        승인
                    </button>
                    <button
                        className="btn-danger"
                        onClick={handleReject}
                    >
                        반려
                    </button>
                </div>
            )}

            {showApproveModal && (
                <div className="modal-overlay" onClick={() => setShowApproveModal(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <h3>발주 승인 (발주서 작성)</h3>
                        <form onSubmit={handleApprove}>
                            <div className="form-group">
                                <label>거래처 *</label>
                                <select
                                    value={approvalForm.supplierId}
                                    onChange={e => setApprovalForm(prev => ({ ...prev, supplierId: e.target.value }))}
                                    required
                                >
                                    <option value="">거래처 선택</option>
                                    {suppliers.map(s => (
                                        <option key={s.supplierId} value={s.supplierId}>
                                            {s.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="form-group">
                                <label>창고 *</label>
                                <select
                                    value={approvalForm.warehouseId}
                                    onChange={e => setApprovalForm(prev => ({ ...prev, warehouseId: e.target.value }))}
                                    required
                                >
                                    <option value="">창고 선택</option>
                                    {warehouses.map(w => (
                                        <option key={w.warehouseId} value={w.warehouseId}>
                                            {w.code}({w.name})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="form-group">
                                <label>메모</label>
                                <textarea
                                    value={approvalForm.memo}
                                    onChange={e => setApprovalForm(prev => ({ ...prev, memo: e.target.value }))}
                                    maxLength={100}
                                />
                                <small>{approvalForm.memo.length}/100</small>
                            </div>

                            <div className="modal-actions">
                                <button type="submit" disabled={submitting} className="btn-primary">
                                    {submitting ? '처리 중...' : '승인'}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setShowApproveModal(false)}
                                    className="btn-secondary"
                                >
                                    취소
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}