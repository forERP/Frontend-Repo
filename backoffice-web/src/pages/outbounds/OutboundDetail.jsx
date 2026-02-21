import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { arriveOutboundShipment, confirmOutbound, fetchOutboundDetail } from '../../api/outboundApi';
import { fetchShipmentCarriers } from '../../api/shipmentApi';
import { OUTBOUND_STATUS, SHIPMENT_STATUS } from '../../constants/status';
import '../purchase/request/purchase.css';
import './OutboundDetail.css';

const INITIAL_CONFIRM_FORM = {
  carrierInput: '',
  carrierCode: '',
  carrier: '',
  trackingNumber: '',
};
const DUMMY_CARRIER_CODE = 'dev.track.dummy';
const DUMMY_CARRIER_NAME = 'Dummy (테스트)';

const toTwoDigits = value => String(value).padStart(2, '0');

const buildDummyTrackingNumber = () => {
  const now = new Date();
  const flooredUtcHour = now.getUTCHours() - (now.getUTCHours() % 3);
  const target = new Date(Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate(),
    flooredUtcHour,
    0,
    0,
    0,
  ));

  // Dummy tracker가 안정적으로 조회되도록 현재보다 충분히 과거(6시간 전) 슬롯을 기본값으로 사용한다.
  target.setUTCHours(target.getUTCHours() - 6);

  return `${target.getUTCFullYear()}-${toTwoDigits(target.getUTCMonth() + 1)}-${toTwoDigits(target.getUTCDate())}T${toTwoDigits(target.getUTCHours())}:00:00Z`;
};

const normalizeCarrierOptions = carriers => {
  const list = Array.isArray(carriers) ? carriers : [];
  const filtered = list.filter(
    carrier => carrier?.carrierCode && carrier?.carrierName && carrier.carrierCode.toLowerCase() !== DUMMY_CARRIER_CODE,
  );
  return [{ carrierCode: DUMMY_CARRIER_CODE, carrierName: DUMMY_CARRIER_NAME }, ...filtered];
};

export default function OutboundDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [outbound, setOutbound] = useState(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmForm, setConfirmForm] = useState(INITIAL_CONFIRM_FORM);
  const [carrierOptions, setCarrierOptions] = useState([]);

  useEffect(() => {
    loadOutboundDetail();
  }, [id]);

  useEffect(() => {
    if (!showConfirmModal) {
      return;
    }
    loadCarriers();
  }, [showConfirmModal]);

  const loadOutboundDetail = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchOutboundDetail(id);
      setOutbound(data);
    } catch (err) {
      console.error(err);
      setError('출고 상세 정보를 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const loadCarriers = async searchText => {
    try {
      const carriers = await fetchShipmentCarriers({ searchText, size: 100 });
      setCarrierOptions(normalizeCarrierOptions(carriers));
    } catch (err) {
      console.warn('택배사 목록 조회 실패:', err);
      setCarrierOptions(normalizeCarrierOptions([]));
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
    const resolvedCode = matched?.carrierCode || parsedCode || '';
    const resolvedName = matched?.carrierName || parsedName;

    setConfirmForm(prev => ({
      ...prev,
      carrierInput: raw,
      carrier: resolvedName,
      carrierCode: resolvedCode,
      trackingNumber:
        resolvedCode === DUMMY_CARRIER_CODE
          ? buildDummyTrackingNumber()
          : prev.carrierCode === DUMMY_CARRIER_CODE
            ? ''
            : prev.trackingNumber,
    }));
  };

  const handleConfirm = async () => {
    if (!confirmForm.carrier || !confirmForm.trackingNumber) {
      alert('택배사와 송장번호를 입력해 주세요.');
      return;
    }

    try {
      setSubmitting(true);
      const updated = await confirmOutbound(id, {
        carrierCode: confirmForm.carrierCode || null,
        carrier: confirmForm.carrier,
        trackingNumber: confirmForm.trackingNumber,
      });
      setOutbound(updated);
      setShowConfirmModal(false);
      setConfirmForm(INITIAL_CONFIRM_FORM);
      alert('출고 확정이 완료되었습니다.');
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || '출고 확정에 실패했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleArrive = async () => {
    try {
      setSubmitting(true);
      const updated = await arriveOutboundShipment(id);
      setOutbound(updated);
      alert('배송 완료 처리가 완료되었습니다.');
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || '배송 완료 처리에 실패했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading && !outbound) {
    return <div className="purchase-page">로딩 중...</div>;
  }

  if (!outbound) {
    return <div className="purchase-page">{error || '출고 정보를 찾을 수 없습니다.'}</div>;
  }

  const canConfirm = outbound.status === 'CREATED';
  const canArrive = outbound.status === 'CONFIRMED';
  const carrierDatalistId = `outbound-carrier-options-${id}`;

  return (
    <div className="purchase-page">
      <div className="page-header">
        <h2>출고 상세</h2>
        <button className="btn-secondary" onClick={() => navigate('/outbounds')}>
          목록으로
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="info-box">
        <table className="info-table">
          <tbody>
            <tr>
              <th>출고번호</th>
              <td>{outbound.outboundId}</td>
            </tr>
            <tr>
              <th>주문번호</th>
              <td>{outbound.orderId}</td>
            </tr>
            <tr>
              <th>매장</th>
              <td>
                {outbound.storeName || `매장 ${outbound.storeId}`}
                {outbound.storeCode ? ` (${outbound.storeCode})` : ''}
              </td>
            </tr>
            <tr>
              <th>창고</th>
              <td>
                {outbound.warehouseName || '-'}
                {outbound.warehouseCode ? ` (${outbound.warehouseCode})` : ''}
              </td>
            </tr>
            <tr>
              <th>출고 상태</th>
              <td>
                <span
                  className="status-badge"
                  style={{ backgroundColor: OUTBOUND_STATUS[outbound.status]?.color || '#6C757D', color: '#fff' }}
                >
                  {OUTBOUND_STATUS[outbound.status]?.label || outbound.status}
                </span>
              </td>
            </tr>
            <tr>
              <th>배송 상태</th>
              <td>
                <span
                  className="status-badge"
                  style={{
                    backgroundColor: SHIPMENT_STATUS[outbound.shipment?.status]?.color || '#6C757D',
                    color: '#fff',
                  }}
                >
                  {SHIPMENT_STATUS[outbound.shipment?.status]?.label || outbound.shipment?.status || '-'}
                </span>
              </td>
            </tr>
            <tr>
              <th>생성일시</th>
              <td>{outbound.createdAt ? new Date(outbound.createdAt).toLocaleString('ko-KR') : '-'}</td>
            </tr>
            <tr>
              <th>택배사</th>
              <td>{outbound.shipment?.carrier || '-'}</td>
            </tr>
            <tr>
              <th>송장번호</th>
              <td>{outbound.shipment?.trackingNumber || '-'}</td>
            </tr>
            <tr>
              <th>출발일시</th>
              <td>{outbound.shipment?.departedAt ? new Date(outbound.shipment.departedAt).toLocaleString('ko-KR') : '-'}</td>
            </tr>
            <tr>
              <th>도착일시</th>
              <td>{outbound.shipment?.arrivedAt ? new Date(outbound.shipment.arrivedAt).toLocaleString('ko-KR') : '-'}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="form-actions">
        {canConfirm && (
          <button className="btn-primary" onClick={() => setShowConfirmModal(true)} disabled={submitting}>
            출고 확정
          </button>
        )}
        {canArrive && (
          <button className="btn-success" onClick={handleArrive} disabled={submitting}>
            배송 완료
          </button>
        )}
        {outbound.shipment?.shipmentId && (
          <button
            className="btn-secondary"
            onClick={() => navigate(`/shipments/${outbound.shipment.shipmentId}/tracking`)}
          >
            배송 추적
          </button>
        )}
      </div>

      <div className="info-box">
        <h3>출고 상품</h3>
        <table className="erp-table list-table outbound-detail-items-table">
          <thead>
            <tr>
              <th>No</th>
              <th>상품ID</th>
              <th>수량</th>
              <th>단가</th>
              <th>금액</th>
            </tr>
          </thead>
          <tbody>
            {outbound.items && outbound.items.length > 0 ? (
              outbound.items.map((item, index) => (
                <tr key={item.outboundItemId || `${item.productId}-${index}`}>
                  <td>{index + 1}</td>
                  <td title={String(item.productId)}>{item.productId}</td>
                  <td>{item.qty}</td>
                  <td>{item.unitPrice != null ? Number(item.unitPrice).toLocaleString('ko-KR') : '-'}</td>
                  <td>{item.unitPrice != null ? Number(item.unitPrice * item.qty).toLocaleString('ko-KR') : '-'}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="empty-cell">
                  출고 상품이 없습니다.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showConfirmModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>출고 확정</h3>
            <form
              onSubmit={e => {
                e.preventDefault();
                handleConfirm();
              }}
            >
              <div className="form-group">
                <label>택배사 *</label>
                <input
                  type="text"
                  placeholder="택배사를 입력해 주세요."
                  value={confirmForm.carrierInput}
                  list={carrierDatalistId}
                  onChange={e => {
                    handleCarrierInputChange(e.target.value);
                    loadCarriers(e.target.value);
                  }}
                  onFocus={() => loadCarriers()}
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
                  placeholder={confirmForm.carrierCode === DUMMY_CARRIER_CODE ? '더미 송장번호가 자동 생성됩니다.' : '송장번호를 입력해 주세요.'}
                  value={confirmForm.trackingNumber}
                  readOnly={confirmForm.carrierCode === DUMMY_CARRIER_CODE}
                  onChange={e => setConfirmForm(prev => ({ ...prev, trackingNumber: e.target.value }))}
                  required
                />
                {confirmForm.carrierCode === DUMMY_CARRIER_CODE && (
                  <div style={{ marginTop: 8, display: 'flex', gap: 8, alignItems: 'center' }}>
                    <button
                      type="button"
                      className="btn-secondary"
                      onClick={() => setConfirmForm(prev => ({ ...prev, trackingNumber: buildDummyTrackingNumber() }))}
                      disabled={submitting}
                    >
                      더미 송장 재생성
                    </button>
                    <span style={{ fontSize: 12, color: '#6b7280' }}>
                      UTC 기준 3시간 단위 더미 송장번호 형식입니다.
                    </span>
                  </div>
                )}
              </div>
              <div className="modal-actions">
                <button type="submit" disabled={submitting} className="btn-primary">
                  {submitting ? '처리 중...' : '확정'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowConfirmModal(false)}
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
    </div>
  );
}
