import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../../lib/api';
import {
  approvePurchaseRequest,
  createPurchaseOrderDraft,
  getAllSuppliers,
  getProduct,
  getPurchaseOrderDraft,
  getStore,
  getUser,
  getWarehouses,
} from '../../../lib/dataApi';
import { STATUS_LABEL } from '../../../constants/status';
import { formatDocNumber, formatNameAndCode } from '../../../utils/purchaseDisplay';
import { getSessionUser, isStoreAdminUser } from '../../../utils/auth';
import './purchase.css';
import './PurchaseRequestDetailPage.css';

const PAYMENT_TERMS_OPTIONS = ['월말정산', '즉결제', '납품 후 7일', '납품 후 15일'];

const INITIAL_APPROVAL_FORM = {
  supplierId: '',
  warehouseId: '',
  deliveryDueDate: '',
  receiverName: '',
  receiverPhone: '',
  shippingAddress: '',
  paymentTerms: '월말정산',
  memo: '',
};

const toReceiverDefault = requesterName => {
  const name = requesterName?.trim();
  return name || '';
};

const toDateTimeText = value => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleString('ko-KR');
};

export default function PurchaseRequestDetailPage() {
  const { id: purchaseRequestId } = useParams();
  const navigate = useNavigate();

  const [request, setRequest] = useState(null);
  const [draftOrder, setDraftOrder] = useState(null);

  const [storeName, setStoreName] = useState('');
  const [storeRawName, setStoreRawName] = useState('');
  const [requesterName, setRequesterName] = useState('');
  const [requesterPhone, setRequesterPhone] = useState('');
  const [userName, setUserName] = useState('');

  const [loading, setLoading] = useState(false);
  const [draftLoading, setDraftLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [suppliers, setSuppliers] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [productMap, setProductMap] = useState({});

  const [showDraftModal, setShowDraftModal] = useState(false);
  const [approvalForm, setApprovalForm] = useState(INITIAL_APPROVAL_FORM);
  const isStoreAdmin = isStoreAdminUser(getSessionUser());

  const selectedSupplier = useMemo(
    () => suppliers.find(s => String(s.supplierId) === String(approvalForm.supplierId)),
    [suppliers, approvalForm.supplierId],
  );

  const selectedWarehouse = useMemo(
    () => warehouses.find(w => String(w.warehouseId) === String(approvalForm.warehouseId)),
    [warehouses, approvalForm.warehouseId],
  );

  useEffect(() => {
    const fetchRequest = async () => {
      setLoading(true);
      try {
        const { data } = await api.get(`/api/purchase-requests/${purchaseRequestId}`);
        setRequest(data);
        setApprovalForm(prev => ({ ...prev, memo: data.memo || '' }));

        const shouldLoadDraft = data.status === 'REQUESTED' || data.status === 'APPROVED';
        if (shouldLoadDraft) {
          setDraftLoading(true);
          try {
            const draft = await getPurchaseOrderDraft(purchaseRequestId);
            setDraftOrder(draft);
          } catch (err) {
            const status = err.response?.status;
            if (status === 400 || status === 403 || status === 404) {
              setDraftOrder(null);
            } else {
              console.error('Draft order fetch failed:', err);
            }
          } finally {
            setDraftLoading(false);
          }
        } else {
          setDraftOrder(null);
          setDraftLoading(false);
        }

        if (data.storeId) {
          try {
            const store = await getStore(data.storeId);
            const name = store.storeName || store.name || '';
            setStoreRawName(name);
            setStoreName(formatNameAndCode(name, store.code));
          } catch (err) {
            console.warn('Store fetch failed:', err);
            setStoreName(`매장 ${data.storeId}`);
          }
        }

        if (data.requestedByUserId) {
          try {
            const user = await getUser(data.requestedByUserId);
            setRequesterName(user.name || '');
            setRequesterPhone(user.phoneNumber || '');
            setUserName(formatNameAndCode(user.name, user.employeeCode));
          } catch (err) {
            console.warn('Requester fetch failed:', err);
            setUserName(`사용자 ${data.requestedByUserId}`);
          }
        }
      } catch (err) {
        console.error('Purchase request fetch failed:', err);
        alert('발주 요청 상세 조회에 실패했습니다.');
      } finally {
        setLoading(false);
      }
    };

    fetchRequest();
  }, [purchaseRequestId]);

  useEffect(() => {
    if (!request || request.status !== 'REQUESTED' || draftOrder) {
      setSuppliers([]);
      setWarehouses([]);
      return;
    }

    const fetchReferenceData = async () => {
      try {
        const [supplierData, warehouseData] = await Promise.all([
          getAllSuppliers(),
          getWarehouses(request.storeId),
        ]);
        setSuppliers(supplierData);
        setWarehouses(warehouseData);
      } catch (err) {
        console.error('Supplier/warehouse fetch failed:', err);
      }
    };

    fetchReferenceData();
  }, [request, draftOrder]);

  useEffect(() => {
    const fetchProducts = async () => {
      if (!request?.items?.length) {
        setProductMap({});
        return;
      }

      const ids = [...new Set(request.items.map(item => item.productId).filter(Boolean))];
      try {
        const products = await Promise.all(ids.map(productId => getProduct(productId)));
        const nextMap = products.reduce((acc, product) => {
          acc[product.id] = {
            name: product.name,
            sku: product.sku,
          };
          return acc;
        }, {});
        setProductMap(nextMap);
      } catch (err) {
        console.warn('Product fetch failed:', err);
      }
    };

    fetchProducts();
  }, [request]);

  useEffect(() => {
    const receiverDefault = toReceiverDefault(requesterName);
    setApprovalForm(prev => ({
      ...prev,
      receiverName: prev.receiverName || receiverDefault,
      receiverPhone: prev.receiverPhone || requesterPhone,
    }));
  }, [requesterName, requesterPhone]);

  useEffect(() => {
    if (!selectedWarehouse?.address) return;
    setApprovalForm(prev => ({
      ...prev,
      shippingAddress: prev.shippingAddress || selectedWarehouse.address,
    }));
  }, [selectedWarehouse]);

  const resolveProductDisplay = item => {
    const productDisplay = formatNameAndCode(productMap[item.productId]?.name, productMap[item.productId]?.sku);
    return productDisplay === '-' ? String(item.productId) : productDisplay;
  };

  const handleCreateDraft = async e => {
    e.preventDefault();
    if (!approvalForm.supplierId || !approvalForm.warehouseId) {
      alert('거래처와 창고를 선택해 주세요.');
      return;
    }

    setSubmitting(true);
    try {
      const draft = await createPurchaseOrderDraft(purchaseRequestId, {
        supplierId: Number(approvalForm.supplierId),
        warehouseId: Number(approvalForm.warehouseId),
        deliveryDueDate: approvalForm.deliveryDueDate || null,
        receiverName: approvalForm.receiverName || null,
        receiverPhone: approvalForm.receiverPhone || null,
        shippingAddress: approvalForm.shippingAddress || null,
        paymentTerms: approvalForm.paymentTerms || null,
        memo: approvalForm.memo || null,
      });

      setDraftOrder(draft);
      setShowDraftModal(false);
      alert('발주서 초안을 저장했습니다. 이후 발주 요청 승인을 진행해 주세요.');
    } catch (err) {
      console.error('Create draft order failed:', err);
      alert(err.response?.data?.message || '발주서 작성 중 오류가 발생했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleApproveRequest = async () => {
    if (!window.confirm('작성된 발주서를 기준으로 발주 요청을 승인하시겠습니까?')) return;

    setSubmitting(true);
    try {
      const approved = await approvePurchaseRequest(purchaseRequestId);
      setDraftOrder(approved);
      setRequest(prev => ({ ...prev, status: 'APPROVED' }));
      alert('발주 요청이 승인되었습니다.');
    } catch (err) {
      console.error('Approve purchase request failed:', err);
      alert(err.response?.data?.message || '발주 요청 승인에 실패했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!window.confirm('정말 반려하시겠습니까?')) return;

    try {
      await api.post(`/api/purchase-requests/${purchaseRequestId}/reject`);
      alert('발주 요청을 반려했습니다.');
      navigate('/purchase-requests');
    } catch (err) {
      console.error('Reject purchase request failed:', err);
      alert(err.response?.data?.message || '반려 처리 중 오류가 발생했습니다.');
    }
  };

  if (loading) return <div className="purchase-page">로딩 중...</div>;
  if (!request) return <div className="purchase-page">발주 요청을 찾을 수 없습니다.</div>;

  const isRequested = request.status === 'REQUESTED';

  return (
    <div className="purchase-page">
      <div className="page-header">
        <h2>발주 요청 상세</h2>
        <button type="button" className="btn-secondary" onClick={() => navigate(-1)}>
          목록으로
        </button>
      </div>

      <div className="info-box">
        <h3>요청 정보</h3>
        <table className="info-table">
          <tbody>
            <tr>
              <th>요청번호</th>
              <td>{formatDocNumber(request.createdAt, request.purchaseRequestId)}</td>
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
              <td className={`status-${request.status.toLowerCase()}`}>{STATUS_LABEL[request.status]}</td>
            </tr>
            <tr>
              <th>요청일</th>
              <td>{toDateTimeText(request.createdAt)}</td>
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
              <th>상품</th>
              <th>수량</th>
            </tr>
          </thead>
          <tbody>
            {request.items && request.items.length > 0 ? (
              request.items.map((item, idx) => (
                <tr key={item.purchaseRequestItemId}>
                  <td>{idx + 1}</td>
                  <td>{resolveProductDisplay(item)}</td>
                  <td>{item.qty}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={3}>요청 상품이 없습니다.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="form-actions">
        {isRequested && !draftOrder && (
          <button className="btn-primary" onClick={() => setShowDraftModal(true)} disabled={draftLoading || submitting}>
            발주서 작성
          </button>
        )}

        {isRequested && draftOrder && (
          <>
            {!isStoreAdmin && (
              <button className="btn-primary" onClick={handleApproveRequest} disabled={submitting}>
                발주 요청 승인
              </button>
            )}
            <button className="btn-info" onClick={() => navigate(`/purchase-orders/${draftOrder.purchaseOrderId}`)}>
              발주서 조회
            </button>
          </>
        )}

        {!isRequested && draftOrder && (
          <button className="btn-info" onClick={() => navigate(`/purchase-orders/${draftOrder.purchaseOrderId}`)}>
            발주서 조회
          </button>
        )}

        {isRequested && !isStoreAdmin && (
          <button className="btn-danger" onClick={handleReject}>
            반려
          </button>
        )}
      </div>

      {showDraftModal && (
        <div className="modal-overlay" onClick={() => setShowDraftModal(false)}>
          <div className="modal order-document-modal" onClick={e => e.stopPropagation()}>
            <h3>발주서 작성</h3>
            <form onSubmit={handleCreateDraft}>
              <div className="order-document-section">
                <h4>문서 기본 정보</h4>
                <div className="order-document-grid">
                  <div className="order-document-item">
                    <label>문서번호(예정)</label>
                    <span>{formatDocNumber(request.createdAt, request.purchaseRequestId)}</span>
                  </div>
                  <div className="order-document-item">
                    <label>작성일</label>
                    <span>{new Date().toLocaleDateString('ko-KR')}</span>
                  </div>
                  <div className="order-document-item">
                    <label>요청 매장</label>
                    <span>{storeName || '-'}</span>
                  </div>
                  <div className="order-document-item">
                    <label>요청자</label>
                    <span>{userName || '-'}</span>
                  </div>
                </div>
              </div>

              <div className="order-document-section">
                <h4>거래 정보</h4>
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

                {selectedSupplier && (
                  <div className="order-document-grid">
                    <div className="order-document-item">
                      <label>거래처 담당자</label>
                      <span>{selectedSupplier.contactName || '-'}</span>
                    </div>
                    <div className="order-document-item">
                      <label>거래처 연락처</label>
                      <span>{selectedSupplier.contactPhone || '-'}</span>
                    </div>
                    <div className="order-document-item order-document-item-full">
                      <label>거래처 주소</label>
                      <span>{selectedSupplier.address || '-'}</span>
                    </div>
                  </div>
                )}

                <div className="form-group">
                  <label>납품 창고 *</label>
                  <select
                    value={approvalForm.warehouseId}
                    onChange={e => setApprovalForm(prev => ({ ...prev, warehouseId: e.target.value }))}
                    required
                  >
                    <option value="">창고 선택</option>
                    {warehouses.map(w => (
                      <option key={w.warehouseId} value={w.warehouseId}>
                        {formatNameAndCode(w.name, w.code)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="order-document-section">
                <h4>납품/결제 정보</h4>
                <div className="order-document-grid">
                  <div className="form-group">
                    <label>납기요청일</label>
                    <input
                      type="date"
                      value={approvalForm.deliveryDueDate}
                      onChange={e => setApprovalForm(prev => ({ ...prev, deliveryDueDate: e.target.value }))}
                    />
                  </div>
                  <div className="form-group">
                    <label>결제조건</label>
                    <select
                      value={approvalForm.paymentTerms}
                      onChange={e => setApprovalForm(prev => ({ ...prev, paymentTerms: e.target.value }))}
                    >
                      {PAYMENT_TERMS_OPTIONS.map(option => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>수령인</label>
                    <input
                      type="text"
                      value={approvalForm.receiverName}
                      onChange={e => setApprovalForm(prev => ({ ...prev, receiverName: e.target.value }))}
                      placeholder="요청자명(매장명)"
                    />
                  </div>
                  <div className="form-group">
                    <label>수령인 연락처</label>
                    <input
                      type="text"
                      value={approvalForm.receiverPhone}
                      onChange={e => setApprovalForm(prev => ({ ...prev, receiverPhone: e.target.value }))}
                      placeholder="요청자 연락처"
                    />
                  </div>
                  <div className="form-group order-document-item-full">
                    <label>납품주소(창고 주소)</label>
                    <input
                      type="text"
                      value={approvalForm.shippingAddress}
                      onChange={e => setApprovalForm(prev => ({ ...prev, shippingAddress: e.target.value }))}
                      placeholder="창고 주소"
                    />
                  </div>
                </div>
              </div>

              <div className="order-document-section">
                <h4>발주 품목</h4>
                <table className="erp-table order-document-table">
                  <thead>
                    <tr>
                      <th>No</th>
                      <th>상품</th>
                      <th>수량</th>
                    </tr>
                  </thead>
                  <tbody>
                    {request.items?.map((item, idx) => (
                      <tr key={item.purchaseRequestItemId}>
                        <td>{idx + 1}</td>
                        <td>{resolveProductDisplay(item)}</td>
                        <td>{item.qty}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="form-group">
                <label>비고/요청 메모</label>
                <textarea
                  value={approvalForm.memo}
                  onChange={e => setApprovalForm(prev => ({ ...prev, memo: e.target.value }))}
                  maxLength={100}
                />
                <small>{approvalForm.memo.length}/100</small>
              </div>

              <div className="modal-actions">
                <button type="submit" disabled={submitting} className="btn-primary">
                  {submitting ? '처리 중...' : '발주서 저장'}
                </button>
                <button type="button" onClick={() => setShowDraftModal(false)} className="btn-secondary">
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
