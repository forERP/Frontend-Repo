import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  cancelPurchaseOrder,
  confirmPurchaseOrder,
  deletePurchaseOrderDraft,
  downloadPurchaseOrderDocument,
  getAllSuppliers,
  getProduct,
  getPurchaseOrder,
  getStore,
  getSupplier,
  getWarehouse,
  getWarehouses,
  updatePurchaseOrderDraft,
} from '../../../lib/dataApi';
import { PURCHASE_ORDER_STATUS, STATUS_LABEL } from '../../../constants/status';
import { formatDocNumber, formatNameAndCode } from '../../../utils/purchaseDisplay';
import { getSessionUser, isStoreAdminUser } from '../../../utils/auth';
import '../request/purchase.css';
import './PurchaseOrderDetailPage.css';

const PAYMENT_TERMS_OPTIONS = ['월말정산', '즉결제', '납품 후 7일', '납품 후 15일'];

const EMPTY_EDIT_FORM = {
  supplierId: '',
  warehouseId: '',
  deliveryDueDate: '',
  receiverName: '',
  receiverPhone: '',
  shippingAddress: '',
  paymentTerms: '월말정산',
  memo: '',
};

const toEditForm = order => ({
  supplierId: order?.supplierId ? String(order.supplierId) : '',
  warehouseId: order?.warehouseId ? String(order.warehouseId) : '',
  deliveryDueDate: order?.deliveryDueDate || '',
  receiverName: order?.receiverName || '',
  receiverPhone: order?.receiverPhone || '',
  shippingAddress: order?.shippingAddress || '',
  paymentTerms: order?.paymentTerms || '월말정산',
  memo: order?.memo || '',
});

const toProductDisplay = (item, productMap) => {
  const product = productMap[item.productId];
  const display = formatNameAndCode(product?.name, product?.sku);
  return display === '-' ? String(item.productId) : display;
};

export default function PurchaseOrderDetailPage() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const isStoreAdmin = isStoreAdminUser(getSessionUser());

  const [order, setOrder] = useState(null);
  const [storeName, setStoreName] = useState('');
  const [storeCode, setStoreCode] = useState('');
  const [supplierName, setSupplierName] = useState('');
  const [warehouseInfo, setWarehouseInfo] = useState(null);
  const [productMap, setProductMap] = useState({});

  const [suppliers, setSuppliers] = useState([]);
  const [warehouses, setWarehouses] = useState([]);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [downloadingDocument, setDownloadingDocument] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState(EMPTY_EDIT_FORM);

  const selectedSupplier = useMemo(
    () => suppliers.find(s => String(s.supplierId) === String(editForm.supplierId)),
    [suppliers, editForm.supplierId],
  );

  const selectedWarehouse = useMemo(
    () => warehouses.find(w => String(w.warehouseId) === String(editForm.warehouseId)),
    [warehouses, editForm.warehouseId],
  );

  useEffect(() => {
    if (!selectedWarehouse?.address) return;
    setEditForm(prev => ({
      ...prev,
      shippingAddress: prev.shippingAddress || selectedWarehouse.address,
    }));
  }, [selectedWarehouse]);

  useEffect(() => {
    const fetchOrder = async () => {
      setLoading(true);
      try {
        const orderData = await getPurchaseOrder(orderId);
        setOrder(orderData);
        setEditForm(toEditForm(orderData));

        try {
          const [storeData, supplierData, warehouseData] = await Promise.all([
            getStore(orderData.storeId),
            getSupplier(orderData.supplierId),
            getWarehouse(orderData.warehouseId),
          ]);

          setStoreName(storeData.storeName || storeData.name || `매장 ${orderData.storeId}`);
          setStoreCode(storeData.code || '');
          setSupplierName(supplierData.name || `거래처 ${orderData.supplierId}`);
          setWarehouseInfo(warehouseData);
        } catch (err) {
          console.warn('기본 참조 정보 로드 실패:', err);
          setStoreName(`매장 ${orderData.storeId}`);
          setStoreCode('');
          setSupplierName(`거래처 ${orderData.supplierId}`);
          setWarehouseInfo(null);
        }

        try {
          const [supplierList, warehouseList] = await Promise.all([
            getAllSuppliers(),
            orderData.storeId ? getWarehouses(orderData.storeId) : Promise.resolve([]),
          ]);
          setSuppliers(supplierList);
          setWarehouses(warehouseList);
        } catch (err) {
          console.warn('발주서 수정용 데이터 로드 실패:', err);
        }
      } catch (err) {
        console.error('발주 조회 실패:', err);
        alert('발주 정보를 불러오지 못했습니다.');
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [orderId]);

  useEffect(() => {
    const fetchProducts = async () => {
      if (!order?.items?.length) {
        setProductMap({});
        return;
      }

      const ids = [...new Set(order.items.map(item => item.productId).filter(Boolean))];
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
        console.warn('상품 조회 실패:', err);
      }
    };

    fetchProducts();
  }, [order]);

  const handleConfirm = async () => {
    setSubmitting(true);
    try {
      const updated = await confirmPurchaseOrder(orderId);
      setOrder(updated);
      setShowConfirmModal(false);
      alert('발주서를 전송하였습니다.');
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

  const handleDownloadDocument = async () => {
    try {
      setDownloadingDocument(true);
      const response = await downloadPurchaseOrderDocument(orderId);
      const blob = new Blob([response.data], {
        type: response.headers['content-type'] || 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const fileDocNumber = order?.documentNumber || formatDocNumber(order?.createdAt, order?.purchaseOrderId);
      link.download = `po-${fileDocNumber === '-' ? orderId : fileDocNumber}.xlsx`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('발주서 다운로드 실패:', err);
      alert(err.response?.data?.message || '발주서 다운로드에 실패했습니다.');
    } finally {
      setDownloadingDocument(false);
    }
  };

  const handleOpenEditModal = () => {
    if (!order) return;
    setEditForm(toEditForm(order));
    setShowEditModal(true);
  };

  const handleUpdateDraft = async e => {
    e.preventDefault();

    if (!editForm.supplierId || !editForm.warehouseId) {
      alert('거래처와 창고를 선택해주세요.');
      return;
    }

    setSubmitting(true);
    try {
      const updated = await updatePurchaseOrderDraft(orderId, {
        supplierId: Number(editForm.supplierId),
        warehouseId: Number(editForm.warehouseId),
        deliveryDueDate: editForm.deliveryDueDate || null,
        receiverName: editForm.receiverName || null,
        receiverPhone: editForm.receiverPhone || null,
        shippingAddress: editForm.shippingAddress || null,
        paymentTerms: editForm.paymentTerms || null,
        memo: editForm.memo || null,
      });

      setOrder(updated);
      setEditForm(toEditForm(updated));
      setShowEditModal(false);

      try {
        const [supplierData, warehouseData] = await Promise.all([
          getSupplier(updated.supplierId),
          getWarehouse(updated.warehouseId),
        ]);
        setSupplierName(supplierData.name || `거래처 ${updated.supplierId}`);
        setWarehouseInfo(warehouseData);
      } catch (err) {
        console.warn('수정 후 참조정보 갱신 실패:', err);
      }

      alert('발주서를 수정했습니다.');
    } catch (err) {
      console.error('발주서 수정 실패:', err);
      alert(err.response?.data?.message || '발주서 수정에 실패했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteDraft = async () => {
    if (!window.confirm('발주서 초안을 삭제하시겠습니까?')) return;

    setSubmitting(true);
    try {
      await deletePurchaseOrderDraft(orderId);
      alert('발주서 초안을 삭제했습니다.');

      if (order?.purchaseRequestId) {
        navigate(`/purchase-requests/${order.purchaseRequestId}`);
      } else {
        navigate('/purchase-requests');
      }
    } catch (err) {
      console.error('발주서 삭제 실패:', err);
      alert(err.response?.data?.message || '발주서 삭제에 실패했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusLabel = status => PURCHASE_ORDER_STATUS[status]?.label || status;
  const getStatusColor = status => PURCHASE_ORDER_STATUS[status]?.color || '#666';

  if (loading) return <div className="purchase-page">로딩 중...</div>;
  if (!order) return <div className="purchase-page">발주 정보가 없습니다.</div>;

  const isCreated = order.status === 'CREATED';
  const isDraftEditable = isCreated && order.purchaseRequestStatus === 'REQUESTED';
  const canConfirmOrder = !isStoreAdmin && isCreated && order.purchaseRequestStatus === 'APPROVED';
  const canCancelOrder = !isStoreAdmin && isCreated && order.purchaseRequestStatus === 'APPROVED';
  const requestStatusLabel = order.purchaseRequestStatus ? STATUS_LABEL[order.purchaseRequestStatus] || order.purchaseRequestStatus : '-';
  const documentNumber = order.documentNumber || formatDocNumber(order.createdAt, order.purchaseOrderId);
  const authorLabel = formatNameAndCode(order.authoredByName, order.authoredByCode);

  return (
    <div className="purchase-page">
      <div className="page-header">
        <h2>발주 상세</h2>
        <button className="btn-secondary" onClick={() => navigate(-1)}>
          목록으로
        </button>
      </div>

      <div className="detail-section">
        <h3>기본 정보</h3>
        <div className="info-grid">
          <div className="info-item">
            <label>문서번호</label>
            <span>{documentNumber}</span>
          </div>
          <div className="info-item">
            <label>발주번호</label>
            <span>{formatDocNumber(order.createdAt, order.purchaseOrderId)}</span>
          </div>
          <div className="info-item">
            <label>발주 요청번호</label>
            <span>{order.purchaseRequestId ? formatDocNumber(order.purchaseRequestCreatedAt, order.purchaseRequestId) : '-'}</span>
          </div>
          <div className="info-item">
            <label>발주 요청 상태</label>
            <span>{requestStatusLabel}</span>
          </div>
          <div className="info-item">
            <label>상태</label>
            <span className="status-badge" style={{ backgroundColor: getStatusColor(order.status), color: '#fff' }}>
              {getStatusLabel(order.status)}
            </span>
          </div>
          <div className="info-item">
            <label>작성일</label>
            <span>{new Date(order.createdAt).toLocaleString('ko-KR')}</span>
          </div>
          <div className="info-item">
            <label>확정일</label>
            <span>{order.orderedAt ? new Date(order.orderedAt).toLocaleString('ko-KR') : '-'}</span>
          </div>
          <div className="info-item">
            <label>작성자</label>
            <span>{authorLabel}</span>
          </div>
          <div className="info-item">
            <label>직인</label>
            <span>직인생략</span>
          </div>
        </div>
      </div>

      <div className="detail-section">
        <h3>발주처 정보</h3>
        <div className="info-grid">
          <div className="info-item">
            <label>매장명</label>
            <span>{formatNameAndCode(storeName, storeCode)}</span>
          </div>
          <div className="info-item">
            <label>거래처명</label>
            <span>{supplierName}</span>
          </div>
          <div className="info-item">
            <label>창고명</label>
            <span>{formatNameAndCode(warehouseInfo?.name, warehouseInfo?.code)}</span>
          </div>
          <div className="info-item">
            <label>납기요청일</label>
            <span>{order.deliveryDueDate || '-'}</span>
          </div>
          <div className="info-item">
            <label>수령인</label>
            <span>{order.receiverName || '-'}</span>
          </div>
          <div className="info-item">
            <label>수령인 연락처</label>
            <span>{order.receiverPhone || '-'}</span>
          </div>
          <div className="info-item">
            <label>납품주소</label>
            <span>{order.shippingAddress || '-'}</span>
          </div>
          <div className="info-item">
            <label>결제조건</label>
            <span>{order.paymentTerms || '-'}</span>
          </div>
        </div>
      </div>

      {order.memo && (
        <div className="detail-section">
          <h3>메모</h3>
          <div className="memo-box">{order.memo}</div>
        </div>
      )}

      <div className="detail-section">
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
            {order.items && order.items.length > 0 ? (
              order.items.map((item, idx) => (
                <tr key={item.purchaseOrderItemId || idx}>
                  <td>{idx + 1}</td>
                  <td>{toProductDisplay(item, productMap)}</td>
                  <td>{item.qty}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={3}>항목 정보가 없습니다.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="form-actions">
        <button className="btn-info" onClick={handleDownloadDocument} disabled={downloadingDocument}>
          {downloadingDocument ? '다운로드 중...' : '발주서 출력'}
        </button>

        {isDraftEditable && (
          <>
            <button className="btn-primary" onClick={handleOpenEditModal} disabled={submitting}>
              발주서 수정
            </button>
            <button className="btn-danger" onClick={handleDeleteDraft} disabled={submitting}>
              발주서 삭제
            </button>
          </>
        )}

        {canConfirmOrder && (
          <button className="btn-primary" onClick={() => setShowConfirmModal(true)} disabled={submitting}>
            발주 확정
          </button>
        )}

        {canCancelOrder && (
          <button className="btn-danger" onClick={() => setShowCancelModal(true)} disabled={submitting}>
            발주 취소
          </button>
        )}

        <button className="btn-secondary" onClick={() => navigate(-1)}>
          뒤로가기
        </button>
      </div>

      {showEditModal && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="modal order-document-modal" onClick={e => e.stopPropagation()}>
            <h3>발주서 수정</h3>
            <form onSubmit={handleUpdateDraft}>
              <div className="order-document-section">
                <h4>문서 기본 정보</h4>
                <div className="order-document-grid">
                  <div className="order-document-item">
                    <label>문서번호</label>
                    <span>{documentNumber}</span>
                  </div>
                  <div className="order-document-item">
                    <label>작성일</label>
                    <span>{new Date(order.createdAt).toLocaleDateString('ko-KR')}</span>
                  </div>
                  <div className="order-document-item">
                    <label>작성자</label>
                    <span>{authorLabel}</span>
                  </div>
                  <div className="order-document-item">
                    <label>직인</label>
                    <span>직인생략</span>
                  </div>
                </div>
              </div>

              <div className="order-document-section">
                <h4>거래 정보</h4>
                <div className="form-group">
                  <label>거래처 *</label>
                  <select
                    value={editForm.supplierId}
                    onChange={e => setEditForm(prev => ({ ...prev, supplierId: e.target.value }))}
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
                      <label>담당자</label>
                      <span>{selectedSupplier.contactName || '-'}</span>
                    </div>
                    <div className="order-document-item">
                      <label>연락처</label>
                      <span>{selectedSupplier.contactPhone || '-'}</span>
                    </div>
                    <div className="order-document-item order-document-item-full">
                      <label>주소</label>
                      <span>{selectedSupplier.address || '-'}</span>
                    </div>
                  </div>
                )}

                <div className="form-group">
                  <label>납품 창고 *</label>
                  <select
                    value={editForm.warehouseId}
                    onChange={e => setEditForm(prev => ({ ...prev, warehouseId: e.target.value }))}
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
                      value={editForm.deliveryDueDate}
                      onChange={e => setEditForm(prev => ({ ...prev, deliveryDueDate: e.target.value }))}
                    />
                  </div>
                  <div className="form-group">
                    <label>결제조건</label>
                    <select
                      value={editForm.paymentTerms}
                      onChange={e => setEditForm(prev => ({ ...prev, paymentTerms: e.target.value }))}
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
                      value={editForm.receiverName}
                      onChange={e => setEditForm(prev => ({ ...prev, receiverName: e.target.value }))}
                      placeholder="수령인"
                    />
                  </div>
                  <div className="form-group">
                    <label>수령인 연락처</label>
                    <input
                      type="text"
                      value={editForm.receiverPhone}
                      onChange={e => setEditForm(prev => ({ ...prev, receiverPhone: e.target.value }))}
                      placeholder="연락처"
                    />
                  </div>
                  <div className="form-group order-document-item-full">
                    <label>납품주소</label>
                    <input
                      type="text"
                      value={editForm.shippingAddress}
                      onChange={e => setEditForm(prev => ({ ...prev, shippingAddress: e.target.value }))}
                      placeholder="납품주소"
                    />
                  </div>
                </div>
              </div>

              <div className="order-document-section">
                <h4>발주 항목</h4>
                <table className="erp-table order-document-table">
                  <thead>
                    <tr>
                      <th>No</th>
                      <th>상품</th>
                      <th>수량</th>
                    </tr>
                  </thead>
                  <tbody>
                    {order.items?.map((item, idx) => (
                      <tr key={item.purchaseOrderItemId || idx}>
                        <td>{idx + 1}</td>
                        <td>{toProductDisplay(item, productMap)}</td>
                        <td>{item.qty}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="form-group">
                <label>비고/메모</label>
                <textarea
                  value={editForm.memo}
                  onChange={e => setEditForm(prev => ({ ...prev, memo: e.target.value }))}
                  maxLength={100}
                />
                <small>{editForm.memo.length}/100</small>
              </div>

              <div className="modal-actions">
                <button type="submit" disabled={submitting} className="btn-primary">
                  {submitting ? '처리 중...' : '저장'}
                </button>
                <button type="button" onClick={() => setShowEditModal(false)} className="btn-secondary" disabled={submitting}>
                  취소
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showConfirmModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>발주 확정</h3>
            <p>현재 발주서를 거래처에 전송하시겠습니까?</p>
            <div className="modal-actions">
              <button className="btn-primary" onClick={handleConfirm} disabled={submitting}>
                {submitting ? '처리 중...' : '확정'}
              </button>
              <button className="btn-secondary" onClick={() => setShowConfirmModal(false)} disabled={submitting}>
                취소
              </button>
            </div>
          </div>
        </div>
      )}

      {showCancelModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>발주 취소</h3>
            <p>현재 발주를 취소하시겠습니까?</p>
            <div className="modal-actions">
              <button className="btn-danger" onClick={handleCancel} disabled={submitting}>
                {submitting ? '처리 중...' : '취소'}
              </button>
              <button className="btn-secondary" onClick={() => setShowCancelModal(false)} disabled={submitting}>
                닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
