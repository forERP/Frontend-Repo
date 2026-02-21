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
      setError('Failed to load outbound detail.');
    } finally {
      setLoading(false);
    }
  };

  const loadCarriers = async searchText => {
    try {
      const carriers = await fetchShipmentCarriers({ searchText, size: 100 });
      setCarrierOptions(Array.isArray(carriers) ? carriers : []);
    } catch (err) {
      console.warn('Failed to load carriers:', err);
      setCarrierOptions([]);
    }
  };

  const handleCarrierInputChange = value => {
    const raw = value || '';
    const parsed = raw.match(/^(.*)\s\(([^()]+)\)$/);
    const parsedName = parsed ? parsed[1].trim() : raw.trim();
    const parsedCode = parsed ? parsed[2].trim() : '';

    const matched = carrierOptions.find(option =>
      option.carrierCode === parsedCode || option.carrierName === parsedName,
    );

    setConfirmForm(prev => ({
      ...prev,
      carrierInput: raw,
      carrier: parsedName,
      carrierCode: matched?.carrierCode || parsedCode || '',
    }));
  };

  const handleConfirm = async () => {
    if (!confirmForm.carrier || !confirmForm.trackingNumber) {
      alert('Please enter carrier and tracking number.');
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
      alert('Outbound confirmed.');
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Failed to confirm outbound.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleArrive = async () => {
    try {
      setSubmitting(true);
      const updated = await arriveOutboundShipment(id);
      setOutbound(updated);
      alert('Shipment marked as arrived.');
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Failed to mark arrival.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading && !outbound) {
    return <div className="purchase-page">Loading...</div>;
  }

  if (!outbound) {
    return <div className="purchase-page">{error || 'Outbound not found.'}</div>;
  }

  const canConfirm = outbound.status === 'CREATED';
  const canArrive = outbound.status === 'CONFIRMED';
  const carrierDatalistId = `outbound-carrier-options-${id}`;

  return (
    <div className="purchase-page">
      <div className="page-header">
        <h2>Outbound Detail</h2>
        <button className="btn-secondary" onClick={() => navigate('/outbounds')}>
          Back to List
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="info-box">
        <table className="info-table">
          <tbody>
            <tr>
              <th>Outbound ID</th>
              <td>{outbound.outboundId}</td>
            </tr>
            <tr>
              <th>Order ID</th>
              <td>{outbound.orderId}</td>
            </tr>
            <tr>
              <th>Store</th>
              <td>
                {outbound.storeName || `Store ${outbound.storeId}`}
                {outbound.storeCode ? ` (${outbound.storeCode})` : ''}
              </td>
            </tr>
            <tr>
              <th>Warehouse</th>
              <td>
                {outbound.warehouseName || '-'}
                {outbound.warehouseCode ? ` (${outbound.warehouseCode})` : ''}
              </td>
            </tr>
            <tr>
              <th>Outbound Status</th>
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
              <th>Shipment Status</th>
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
              <th>Created At</th>
              <td>{outbound.createdAt ? new Date(outbound.createdAt).toLocaleString('ko-KR') : '-'}</td>
            </tr>
            <tr>
              <th>Carrier</th>
              <td>{outbound.shipment?.carrier || '-'}</td>
            </tr>
            <tr>
              <th>Tracking Number</th>
              <td>{outbound.shipment?.trackingNumber || '-'}</td>
            </tr>
            <tr>
              <th>Departed At</th>
              <td>{outbound.shipment?.departedAt ? new Date(outbound.shipment.departedAt).toLocaleString('ko-KR') : '-'}</td>
            </tr>
            <tr>
              <th>Arrived At</th>
              <td>{outbound.shipment?.arrivedAt ? new Date(outbound.shipment.arrivedAt).toLocaleString('ko-KR') : '-'}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="form-actions">
        {canConfirm && (
          <button className="btn-primary" onClick={() => setShowConfirmModal(true)} disabled={submitting}>
            Confirm Outbound
          </button>
        )}
        {canArrive && (
          <button className="btn-success" onClick={handleArrive} disabled={submitting}>
            Mark Arrived
          </button>
        )}
        {outbound.shipment?.shipmentId && (
          <button
            className="btn-secondary"
            onClick={() => navigate(`/shipments/${outbound.shipment.shipmentId}/tracking`)}
          >
            Track Shipment
          </button>
        )}
      </div>

      <div className="info-box">
        <h3>Outbound Items</h3>
        <table className="erp-table list-table outbound-detail-items-table">
          <thead>
            <tr>
              <th>No</th>
              <th>Product ID</th>
              <th>Qty</th>
              <th>Unit Price</th>
              <th>Amount</th>
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
                  <td>
                    {item.unitPrice != null
                      ? Number(item.unitPrice * item.qty).toLocaleString('ko-KR')
                      : '-'}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="empty-cell">
                  No outbound items.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showConfirmModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>Confirm Outbound</h3>
            <form
              onSubmit={e => {
                e.preventDefault();
                handleConfirm();
              }}
            >
              <div className="form-group">
                <label>Carrier *</label>
                <input
                  type="text"
                  placeholder="Type carrier"
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
                    <option
                      key={option.carrierCode}
                      value={`${option.carrierName} (${option.carrierCode})`}
                    />
                  ))}
                </datalist>
              </div>
              <div className="form-group">
                <label>Tracking Number *</label>
                <input
                  type="text"
                  placeholder="Type tracking number"
                  value={confirmForm.trackingNumber}
                  onChange={e => setConfirmForm(prev => ({ ...prev, trackingNumber: e.target.value }))}
                  required
                />
              </div>
              <div className="modal-actions">
                <button type="submit" disabled={submitting} className="btn-primary">
                  {submitting ? 'Processing...' : 'Confirm'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowConfirmModal(false)}
                  className="btn-secondary"
                  disabled={submitting}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
