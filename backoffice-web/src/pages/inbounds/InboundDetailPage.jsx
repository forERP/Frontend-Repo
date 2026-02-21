import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  cancelInbound,
  confirmInbound,
  departShipment,
  getInbound,
  getProduct,
  getShipmentCarriers,
  getStore,
} from '../../lib/dataApi';
import { INBOUND_STATUS } from '../../constants/status';
import { formatDocNumber, formatNameAndCode } from '../../utils/purchaseDisplay';
import '../purchase/request/purchase.css';
import './InboundDetailPage.css';

const INITIAL_DEPART_FORM = {
  carrierInput: '',
  carrierCode: '',
  carrier: '',
  trackingNumber: '',
};

export default function InboundDetailPage() {
  const { id: inboundId } = useParams();
  const navigate = useNavigate();

  const [inbound, setInbound] = useState(null);
  const [productMap, setProductMap] = useState({});
  const [storeName, setStoreName] = useState('');
  const [storeCode, setStoreCode] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showDepartModal, setShowDepartModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);

  const [departForm, setDepartForm] = useState(INITIAL_DEPART_FORM);
  const [carrierOptions, setCarrierOptions] = useState([]);

  useEffect(() => {
    loadInbound();
  }, [inboundId]);

  useEffect(() => {
    loadProducts();
  }, [inbound]);

  useEffect(() => {
    if (!showDepartModal) {
      return;
    }
    loadCarrierOptions();
  }, [showDepartModal]);

  const loadInbound = async () => {
    try {
      setLoading(true);
      const inboundData = await getInbound(inboundId);
      setInbound(inboundData);

      if (inboundData.storeId) {
        try {
          const storeData = await getStore(inboundData.storeId);
          setStoreName(storeData.storeName || storeData.name || `매장 ${inboundData.storeId}`);
          setStoreCode(storeData.code || '');
        } catch (storeErr) {
          console.warn('매장 정보를 불러오지 못했습니다:', storeErr);
          setStoreName(`매장 ${inboundData.storeId}`);
          setStoreCode('');
        }
      }
    } catch (err) {
      console.error('입고 조회 실패:', err);
      alert('입고 정보를 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const loadProducts = async () => {
    if (!inbound?.items?.length) {
      setProductMap({});
      return;
    }

    const ids = [...new Set(inbound.items.map(item => item.productId).filter(Boolean))];
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
      console.warn('상품 상세 조회 실패:', err);
      setProductMap({});
    }
  };

  const loadCarrierOptions = async searchText => {
    try {
      const carriers = await getShipmentCarriers({ searchText, size: 100 });
      setCarrierOptions(Array.isArray(carriers) ? carriers : []);
    } catch (err) {
      console.warn('택배사 목록 조회 실패:', err);
      setCarrierOptions([]);
    }
  };

  const handleCarrierInputChange = value => {
    const raw = value || '';
    const parsed = raw.match(/^(.*)\s\(([^()]+)\)$/);
    const parsedName = parsed ? parsed[1].trim() : raw.trim();
    const parsedCode = parsed ? parsed[2].trim() : '';

    const matched = carrierOptions.find(
      option => option.carrierCode === parsedCode || option.carrierName === parsedName,
    );

    setDepartForm(prev => ({
      ...prev,
      carrierInput: raw,
      carrier: parsedName,
      carrierCode: matched?.carrierCode || parsedCode || '',
    }));
  };

  const handleConfirm = async () => {
    setSubmitting(true);
    try {
      const updated = await confirmInbound(inboundId);
      setInbound(updated);
      setShowConfirmModal(false);
      alert('입고 확정이 완료되었습니다.');
    } catch (err) {
      console.error('입고 확정 실패:', err);
      alert(err.response?.data?.message || '입고 확정에 실패했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDepart = async () => {
    if (!departForm.carrier || !departForm.trackingNumber) {
      alert('택배사와 송장번호를 입력해 주세요.');
      return;
    }

    setSubmitting(true);
    try {
      const updated = await departShipment(inboundId, {
        carrierCode: departForm.carrierCode || null,
        carrier: departForm.carrier,
        trackingNumber: departForm.trackingNumber,
      });

      setInbound(prev => ({ ...prev, shipment: updated }));
      setShowDepartModal(false);
      setDepartForm(INITIAL_DEPART_FORM);
      alert('배송 출발 처리가 완료되었습니다.');
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
      alert('입고 취소가 완료되었습니다.');
    } catch (err) {
      console.error('입고 취소 실패:', err);
      alert(err.response?.data?.message || '입고 취소에 실패했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusLabel = status => INBOUND_STATUS[status]?.label || status;
  const getStatusColor = status => INBOUND_STATUS[status]?.color || '#666';
  const resolveProductDisplay = item => {
    const product = productMap[item.productId];
    const display = formatNameAndCode(product?.name, product?.sku);
    return display === '-' ? String(item.productId) : display;
  };

  if (loading) return <div className="purchase-page">로딩 중...</div>;
  if (!inbound) return <div className="purchase-page">입고 정보를 찾을 수 없습니다.</div>;

  const isCreated = inbound.status === 'CREATED';
  const isReadyForDepart = inbound.shipment?.status === 'READY';
  const canShowConfirmButton = inbound.shipment?.status === 'SHIPPING' || inbound.shipment?.status === 'ARRIVED';
  const isConfirmedInbound = inbound.status === 'CONFIRMED';
  const carrierDatalistId = `carrier-options-${inboundId}`;

  return (
    <div className="purchase-page">
      <div className="page-header">
        <h2>입고 상세</h2>
        <button className="btn-secondary" onClick={() => navigate(-1)}>
          뒤로
        </button>
      </div>

      <div className="detail-section">
        <h3>기본 정보</h3>
        <div className="info-grid">
          <div className="info-item">
            <label>입고번호</label>
            <span>{formatDocNumber(inbound.createdAt, inbound.inboundId)}</span>
          </div>
          <div className="info-item">
            <label>발주번호</label>
            <span>{formatDocNumber(inbound.purchaseOrderCreatedAt, inbound.purchaseOrderId)}</span>
          </div>
          <div className="info-item">
            <label>상태</label>
            <span className="status-badge" style={{ backgroundColor: getStatusColor(inbound.status), color: '#fff' }}>
              {getStatusLabel(inbound.status)}
            </span>
          </div>
          <div className="info-item">
            <label>생성일시</label>
            <span>{new Date(inbound.createdAt).toLocaleString('ko-KR')}</span>
          </div>
        </div>
      </div>

      <div className="detail-section">
        <h3>입고 대상</h3>
        <div className="info-grid">
          <div className="info-item">
            <label>매장</label>
            <span>{storeCode ? `${storeName} (${storeCode})` : storeName}</span>
          </div>
          <div className="info-item">
            <label>창고</label>
            <span>{inbound.warehouseId}</span>
          </div>
        </div>
      </div>

      {inbound.shipment && (
        <div className="detail-section">
          <h3>배송 정보</h3>
          <div className="info-grid">
            <div className="info-item">
              <label>배송 상태</label>
              <span>{inbound.shipment.status}</span>
            </div>
            <div className="info-item">
              <label>택배사</label>
              <span>
                {inbound.shipment.carrier || '-'}
                {inbound.shipment.carrierCode ? ` (${inbound.shipment.carrierCode})` : ''}
              </span>
            </div>
            <div className="info-item">
              <label>송장번호</label>
              <span>{inbound.shipment.trackingNumber || '-'}</span>
            </div>
          </div>
        </div>
      )}

      <div className="detail-section">
        <h3>입고 상품</h3>
        <table className="erp-table">
          <thead>
            <tr>
              <th>No</th>
              <th>상품명(sku)</th>
              <th>수량</th>
            </tr>
          </thead>
          <tbody>
            {inbound.items && inbound.items.length > 0 ? (
              inbound.items.map((item, idx) => (
                <tr key={item.inboundItemId || idx}>
                  <td>{idx + 1}</td>
                  <td>{resolveProductDisplay(item)}</td>
                  <td>{item.qty}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={3}>입고 상품이 없습니다.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="form-actions">
        {isReadyForDepart && (
          <button className="btn-primary" onClick={() => setShowDepartModal(true)}>
            배송 출발
          </button>
        )}

        {canShowConfirmButton && (
          <button
            className="btn-success"
            onClick={() => {
              if (!isConfirmedInbound) {
                setShowConfirmModal(true);
              }
            }}
            disabled={isConfirmedInbound || submitting}
          >
            {isConfirmedInbound ? '입고 확정 완료' : '입고 확정'}
          </button>
        )}

        {isCreated && (
          <button className="btn-danger" onClick={() => setShowCancelModal(true)}>
            입고 취소
          </button>
        )}

        <button className="btn-secondary" onClick={() => navigate(-1)}>
          뒤로
        </button>
      </div>

      {showDepartModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>배송 출발 처리</h3>
            <form
              onSubmit={e => {
                e.preventDefault();
                handleDepart();
              }}
            >
              <div className="form-group">
                <label>택배사 *</label>
                <input
                  type="text"
                  placeholder="택배사를 입력해 주세요."
                  value={departForm.carrierInput}
                  list={carrierDatalistId}
                  onChange={e => {
                    handleCarrierInputChange(e.target.value);
                    loadCarrierOptions(e.target.value);
                  }}
                  onFocus={() => loadCarrierOptions()}
                  required
                />
                <datalist id={carrierDatalistId}>
                  {carrierOptions.map(option => (
                    <option key={option.carrierCode} value={`${option.carrierName} (${option.carrierCode})`} />
                  ))}
                </datalist>
              </div>
              <div className="form-group">
                <label>송장번호 *</label>
                <input
                  type="text"
                  placeholder="송장번호를 입력해 주세요."
                  value={departForm.trackingNumber}
                  onChange={e => setDepartForm(prev => ({ ...prev, trackingNumber: e.target.value }))}
                  required
                />
              </div>
              <div className="modal-actions">
                <button type="submit" disabled={submitting} className="btn-primary">
                  {submitting ? '처리 중...' : '출발 처리'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowDepartModal(false)}
                  className="btn-secondary"
                  disabled={submitting}
                >
                  닫기
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showConfirmModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>입고 확정</h3>
            <p>현재 입고 건을 확정하시겠습니까?</p>
            <div className="modal-actions">
              <button className="btn-success" onClick={handleConfirm} disabled={submitting}>
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
            <h3>입고 취소</h3>
            <p>현재 입고 건을 취소하시겠습니까?</p>
            <div className="modal-actions">
              <button className="btn-danger" onClick={handleCancel} disabled={submitting}>
                {submitting ? '처리 중...' : '입고 취소'}
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
