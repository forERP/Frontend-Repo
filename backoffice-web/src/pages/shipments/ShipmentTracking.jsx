import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { SHIPMENT_STATUS } from '../../constants/status';
import { fetchShipmentTracking } from '../../api/shipmentApi';
import { subscribeAdminRealtime } from '../../lib/realtime';
import '../purchase/request/purchase.css';

export default function ShipmentTracking() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [tracking, setTracking] = useState(null);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadTracking(true);
  }, [id]);

  useEffect(() => {
    const unsubscribe = subscribeAdminRealtime({
      onEvent: event => {
        if (event.type !== 'shipment.changed') {
          return;
        }

        const shipmentId = Number(event.data?.payload?.shipmentId);
        if (Number(id) === shipmentId) {
          loadTracking(false);
        }
      },
    });

    return () => unsubscribe();
  }, [id]);

  const loadTracking = async sync => {
    try {
      if (sync) {
        setSyncing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      const data = await fetchShipmentTracking(id, { sync });
      setTracking(data);
    } catch (err) {
      console.error(err);
      setError('Failed to load tracking details.');
      if (!tracking) {
        setTracking(null);
      }
    } finally {
      setLoading(false);
      setSyncing(false);
    }
  };

  if (loading && !tracking) {
    return <div className="purchase-page">Loading...</div>;
  }

  if (!tracking) {
    return <div className="purchase-page">{error || 'Tracking detail not found.'}</div>;
  }

  return (
    <div className="purchase-page">
      <div className="page-header">
        <h2>Shipment Tracking</h2>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn-primary" onClick={() => loadTracking(true)} disabled={syncing}>
            {syncing ? 'Syncing...' : 'Sync Status'}
          </button>
          <button className="btn-secondary" onClick={() => navigate('/shipments')}>
            Back to List
          </button>
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="info-box">
        <table className="info-table">
          <tbody>
            <tr>
              <th>Shipment ID</th>
              <td>{tracking.shipmentId}</td>
            </tr>
            <tr>
              <th>Flow Type</th>
              <td>{tracking.flowType === 'INBOUND' ? 'Inbound' : 'Outbound'}</td>
            </tr>
            <tr>
              <th>Local Status</th>
              <td>
                <span
                  className="status-badge"
                  style={{
                    backgroundColor: SHIPMENT_STATUS[tracking.localShipmentStatus]?.color || '#6C757D',
                    color: '#fff',
                  }}
                >
                  {SHIPMENT_STATUS[tracking.localShipmentStatus]?.label || tracking.localShipmentStatus || '-'}
                </span>
              </td>
            </tr>
            <tr>
              <th>Carrier</th>
              <td>
                {tracking.carrier || '-'}
                {tracking.carrierCode ? ` (${tracking.carrierCode})` : ''}
              </td>
            </tr>
            <tr>
              <th>Tracking Number</th>
              <td>{tracking.trackingNumber || '-'}</td>
            </tr>
            <tr>
              <th>Tracker Status Code</th>
              <td>{tracking.trackerStatusCode || '-'}</td>
            </tr>
            <tr>
              <th>Tracker Status Name</th>
              <td>{tracking.trackerStatusName || '-'}</td>
            </tr>
            <tr>
              <th>Last Event Time</th>
              <td>{tracking.trackerEventTime || '-'}</td>
            </tr>
            <tr>
              <th>Last Event Location</th>
              <td>{tracking.trackerEventLocation || '-'}</td>
            </tr>
            <tr>
              <th>Last Event Description</th>
              <td>{tracking.trackerEventDescription || '-'}</td>
            </tr>
            <tr>
              <th>Local Status Changed</th>
              <td>{tracking.localStatusChanged ? 'Yes' : 'No'}</td>
            </tr>
            {tracking.message && (
              <tr>
                <th>Message</th>
                <td>{tracking.message}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="info-box">
        <h3>Tracking Events</h3>
        <table className="erp-table list-table">
          <thead>
            <tr>
              <th>No</th>
              <th>Status Code</th>
              <th>Status Name</th>
              <th>Time</th>
              <th>Location</th>
              <th>Description</th>
            </tr>
          </thead>
          <tbody>
            {tracking.events && tracking.events.length > 0 ? (
              tracking.events.map((event, index) => (
                <tr key={`${event.time || 'time'}-${index}`}>
                  <td>{index + 1}</td>
                  <td>{event.statusCode || '-'}</td>
                  <td>{event.statusName || '-'}</td>
                  <td>{event.time || '-'}</td>
                  <td>{event.location || '-'}</td>
                  <td>{event.description || '-'}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="empty-cell">No tracking events.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
