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
      setLoading(true);
      setError(null);

      const data = await fetchShipmentTracking(id, { sync });
      setTracking(data);
    } catch (err) {
      console.error(err);
      setError('배송 추적 정보를 불러오지 못했습니다.');
      if (!tracking) {
        setTracking(null);
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading && !tracking) {
    return <div className="purchase-page">로딩 중...</div>;
  }

  if (!tracking) {
    return <div className="purchase-page">{error || '배송 추적 정보를 찾을 수 없습니다.'}</div>;
  }

  return (
    <div className="purchase-page">
      <div className="page-header">
        <h2>송장 추적</h2>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn-secondary" onClick={() => navigate('/shipments')}>
            목록으로
          </button>
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="info-box">
        <table className="info-table">
          <tbody>
            <tr>
              <th>배송ID</th>
              <td>{tracking.shipmentId}</td>
            </tr>
            <tr>
              <th>구분</th>
              <td>{tracking.flowType === 'INBOUND' ? '입고' : '출고'}</td>
            </tr>
            <tr>
              <th>내부 배송 상태</th>
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
              <th>택배사</th>
              <td>
                {tracking.carrier || '-'}
                {tracking.carrierCode ? ` (${tracking.carrierCode})` : ''}
              </td>
            </tr>
            <tr>
              <th>송장번호</th>
              <td>{tracking.trackingNumber || '-'}</td>
            </tr>
            <tr>
              <th>트래커 상태 코드</th>
              <td>{tracking.trackerStatusCode || '-'}</td>
            </tr>
            <tr>
              <th>트래커 상태명</th>
              <td>{tracking.trackerStatusName || '-'}</td>
            </tr>
            <tr>
              <th>최근 이벤트 시각</th>
              <td>{tracking.trackerEventTime || '-'}</td>
            </tr>
            <tr>
              <th>최근 이벤트 위치</th>
              <td>{tracking.trackerEventLocation || '-'}</td>
            </tr>
            <tr>
              <th>최근 이벤트 내용</th>
              <td>{tracking.trackerEventDescription || '-'}</td>
            </tr>
            <tr>
              <th>내부 상태 반영 여부</th>
              <td>{tracking.localStatusChanged ? '반영됨' : '변경 없음'}</td>
            </tr>
            {tracking.message && (
              <tr>
                <th>메시지</th>
                <td>{tracking.message}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="info-box">
        <h3>배송 이벤트</h3>
        <table className="erp-table list-table">
          <thead>
            <tr>
              <th>No</th>
              <th>상태 코드</th>
              <th>상태명</th>
              <th>시각</th>
              <th>위치</th>
              <th>설명</th>
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
                <td colSpan={6} className="empty-cell">배송 이벤트가 없습니다.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
