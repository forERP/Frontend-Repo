import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { fetchOrderDetail } from '../../api/orderApi';
import { ORDER_STATUS } from '../../constants/status';
import '../purchase/request/purchase.css';
import './OrderDetail.css';

export default function OrderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadOrderDetail();
  }, [id]);

  const loadOrderDetail = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchOrderDetail(id);
      setOrder(data);
    } catch (err) {
      console.error(err);
      setError('주문 정보를 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  };

  if (loading && !order) {
    return <div className="purchase-page">로딩 중...</div>;
  }

  if (!order) {
    return <div className="purchase-page">{error || '주문 정보를 찾을 수 없습니다.'}</div>;
  }

  return (
    <div className="purchase-page">
      <div className="page-header">
        <h2>주문 상세</h2>
        <button className="btn-secondary" onClick={() => navigate('/orders')}>
          목록으로
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="info-box">
        <table className="info-table">
          <tbody>
            <tr>
              <th>주문번호</th>
              <td>{order.orderId}</td>
            </tr>
            <tr>
              <th>매장</th>
              <td>
                {order.storeName || `매장 ${order.storeId}`}
                {order.storeCode ? ` (${order.storeCode})` : ''}
              </td>
            </tr>
            <tr>
              <th>상태</th>
              <td>
                <span
                  className="status-badge"
                  style={{ backgroundColor: ORDER_STATUS[order.status]?.color || '#6C757D', color: '#fff' }}
                >
                  {ORDER_STATUS[order.status]?.label || order.status}
                </span>
              </td>
            </tr>
            <tr>
              <th>주문금액</th>
              <td>{order.totalAmount != null ? `${Number(order.totalAmount).toLocaleString('ko-KR')}원` : '-'}</td>
            </tr>
            <tr>
              <th>주문일시</th>
              <td>{order.orderedAt ? new Date(order.orderedAt).toLocaleString('ko-KR') : '-'}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="info-box">
        <h3>주문 품목</h3>
        <table className="erp-table list-table order-detail-items-table">
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
            {order.items && order.items.length > 0 ? (
              order.items.map((item, index) => (
                <tr key={item.orderItemId || `${item.productId}-${index}`}>
                  <td>{index + 1}</td>
                  <td title={String(item.productId)}>{item.productId}</td>
                  <td>{item.qty}</td>
                  <td>{item.unitPrice != null ? Number(item.unitPrice).toLocaleString('ko-KR') : '-'}</td>
                  <td>{item.amount != null ? Number(item.amount).toLocaleString('ko-KR') : '-'}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="empty-cell">
                  주문 품목이 없습니다.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
