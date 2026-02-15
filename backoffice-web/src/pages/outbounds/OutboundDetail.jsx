import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { fetchOutboundDetail } from '../../api/outboundApi';
import { OUTBOUND_STATUS, SHIPMENT_STATUS } from '../../constants/status';
import '../purchase/request/purchase.css';
import './OutboundDetail.css';

export default function OutboundDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [outbound, setOutbound] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadOutboundDetail();
  }, [id]);

  const loadOutboundDetail = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchOutboundDetail(id);
      setOutbound(data);
    } catch (err) {
      console.error(err);
      setError('출고 정보를 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  };

  if (loading && !outbound) {
    return <div className="purchase-page">로딩 중...</div>;
  }

  if (!outbound) {
    return <div className="purchase-page">{error || '출고 정보를 찾을 수 없습니다.'}</div>;
  }

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
              <th>출고상태</th>
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
              <th>배송상태</th>
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
              <th>배송사</th>
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

      <div className="info-box">
        <h3>출고 항목</h3>
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
                  출고 항목이 없습니다.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
