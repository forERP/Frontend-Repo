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
          setStoreName(storeData.storeName || storeData.name || `Store ${inboundData.storeId}`);
          setStoreCode(storeData.code || '');
        } catch (storeErr) {
          console.warn('Failed to load store info:', storeErr);
          setStoreName(`Store ${inboundData.storeId}`);
          setStoreCode('');
        }
      }
    } catch (err) {
      console.error('Failed to fetch inbound:', err);
      alert('Failed to load inbound data.');
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
      console.warn('Failed to load product details:', err);
    }
  };

  const loadCarrierOptions = async searchText => {
    try {
      const carriers = await getShipmentCarriers({ searchText, size: 100 });
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
      alert('Inbound confirmed.');
    } catch (err) {
      console.error('Inbound confirm failed:', err);
      alert(err.response?.data?.message || 'Failed to confirm inbound.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDepart = async () => {
    if (!departForm.carrier || !departForm.trackingNumber) {
      alert('Please enter carrier and tracking number.');
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
      alert('Shipment departed.');
    } catch (err) {
      console.error('Depart failed:', err);
      alert(err.response?.data?.message || 'Failed to depart shipment.');
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
      alert('Inbound canceled.');
    } catch (err) {
      console.error('Inbound cancel failed:', err);
      alert(err.response?.data?.message || 'Failed to cancel inbound.');
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

  if (loading) return <div className="purchase-page">Loading...</div>;
  if (!inbound) return <div className="purchase-page">Inbound not found.</div>;

  const isCreated = inbound.status === 'CREATED';
  const isReadyForDepart = inbound.shipment?.status === 'READY';
  const canShowConfirmButton = inbound.shipment?.status === 'SHIPPING' || inbound.shipment?.status === 'ARRIVED';
  const isConfirmedInbound = inbound.status === 'CONFIRMED';
  const carrierDatalistId = `carrier-options-${inboundId}`;

  return (
    <div className="purchase-page">
      <div className="page-header">
        <h2>Inbound Detail</h2>
        <button className="btn-secondary" onClick={() => navigate(-1)}>
          Back
        </button>
      </div>

      <div className="detail-section">
        <h3>Basic Info</h3>
        <div className="info-grid">
          <div className="info-item">
            <label>Inbound No.</label>
            <span>{formatDocNumber(inbound.createdAt, inbound.inboundId)}</span>
          </div>
          <div className="info-item">
            <label>Purchase Order No.</label>
            <span>{formatDocNumber(inbound.purchaseOrderCreatedAt, inbound.purchaseOrderId)}</span>
          </div>
          <div className="info-item">
            <label>Status</label>
            <span className="status-badge" style={{ backgroundColor: getStatusColor(inbound.status), color: '#fff' }}>
              {getStatusLabel(inbound.status)}
            </span>
          </div>
          <div className="info-item">
            <label>Created At</label>
            <span>{new Date(inbound.createdAt).toLocaleString('ko-KR')}</span>
          </div>
        </div>
      </div>

      <div className="detail-section">
        <h3>Destination</h3>
        <div className="info-grid">
          <div className="info-item">
            <label>Store</label>
            <span>{storeCode ? `${storeName} (${storeCode})` : storeName}</span>
          </div>
          <div className="info-item">
            <label>Warehouse</label>
            <span>{inbound.warehouseId}</span>
          </div>
        </div>
      </div>

      {inbound.shipment && (
        <div className="detail-section">
          <h3>Shipment</h3>
          <div className="info-grid">
            <div className="info-item">
              <label>Shipment Status</label>
              <span>{inbound.shipment.status}</span>
            </div>
            <div className="info-item">
              <label>Carrier</label>
              <span>
                {inbound.shipment.carrier || '-'}
                {inbound.shipment.carrierCode ? ` (${inbound.shipment.carrierCode})` : ''}
              </span>
            </div>
            <div className="info-item">
              <label>Tracking Number</label>
              <span>{inbound.shipment.trackingNumber || '-'}</span>
            </div>
          </div>
        </div>
      )}

      <div className="detail-section">
        <h3>Inbound Items</h3>
        <table className="erp-table">
          <thead>
            <tr>
              <th>No</th>
              <th>Product (SKU)</th>
              <th>Qty</th>
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
                <td colSpan={3}>No items.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="form-actions">
        {isReadyForDepart && (
          <button className="btn-primary" onClick={() => setShowDepartModal(true)}>
            Depart Shipment
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
            {isConfirmedInbound ? 'Confirmed' : 'Confirm Inbound'}
          </button>
        )}

        {isCreated && (
          <button className="btn-danger" onClick={() => setShowCancelModal(true)}>
            Cancel Inbound
          </button>
        )}

        <button className="btn-secondary" onClick={() => navigate(-1)}>
          Go Back
        </button>
      </div>

      {showDepartModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>Depart Shipment</h3>
            <form
              onSubmit={e => {
                e.preventDefault();
                handleDepart();
              }}
            >
              <div className="form-group">
                <label>Carrier *</label>
                <input
                  type="text"
                  placeholder="Type carrier"
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
                <label>Tracking Number *</label>
                <input
                  type="text"
                  placeholder="Type tracking number"
                  value={departForm.trackingNumber}
                  onChange={e => setDepartForm(prev => ({ ...prev, trackingNumber: e.target.value }))}
                  required
                />
              </div>
              <div className="modal-actions">
                <button type="submit" disabled={submitting} className="btn-primary">
                  {submitting ? 'Processing...' : 'Depart'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowDepartModal(false)}
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

      {showConfirmModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>Confirm Inbound</h3>
            <p>Do you want to confirm inbound receipt now?</p>
            <div className="modal-actions">
              <button className="btn-success" onClick={handleConfirm} disabled={submitting}>
                {submitting ? 'Processing...' : 'Confirm'}
              </button>
              <button className="btn-secondary" onClick={() => setShowConfirmModal(false)} disabled={submitting}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {showCancelModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>Cancel Inbound</h3>
            <p>Do you want to cancel this inbound?</p>
            <div className="modal-actions">
              <button className="btn-danger" onClick={handleCancel} disabled={submitting}>
                {submitting ? 'Processing...' : 'Cancel'}
              </button>
              <button className="btn-secondary" onClick={() => setShowCancelModal(false)} disabled={submitting}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
