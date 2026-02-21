import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { fetchOrderDetail } from '../../api/orderApi';
import { fetchProductDetail } from '../../api/productApi';
import { ORDER_STATUS } from '../../constants/status';
import { getSessionUser, isStoreAdminUser } from '../../utils/auth';
import '../purchase/request/purchase.css';
import './OrderDetail.css';

export default function OrderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const sessionUser = getSessionUser();
  const isStoreAdmin = isStoreAdminUser(sessionUser);
  const scopedStoreId = isStoreAdmin && sessionUser?.storeId ? Number(sessionUser.storeId) : null;

  const [order, setOrder] = useState(null);
  const [productSkuMap, setProductSkuMap] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadOrderDetail();
  }, [id, scopedStoreId]);

  useEffect(() => {
    loadItemProducts();
  }, [order]);

  const loadOrderDetail = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchOrderDetail(id);
      if (scopedStoreId != null && Number(data?.storeId) !== scopedStoreId) {
        setOrder(null);
        setError('본인 매장 주문만 조회할 수 있습니다.');
        return;
      }
      setOrder(data);
    } catch (err) {
      console.error(err);
      setError('주문 정보를 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const loadItemProducts = async () => {
    if (!order?.items?.length) {
      setProductSkuMap({});
      return;
    }

    const productIds = [...new Set(order.items.map(item => item.productId).filter(Boolean))];
    if (productIds.length === 0) {
      setProductSkuMap({});
      return;
    }

    try {
      const products = await Promise.all(
        productIds.map(async productId => {
          try {
            return await fetchProductDetail(productId);
          } catch (err) {
            console.warn('상품 조회 실패:', productId, err);
            return null;
          }
        }),
      );

      const nextMap = products.filter(Boolean).reduce((acc, product) => {
        acc[product.id] = product.sku || '';
        return acc;
      }, {});

      setProductSkuMap(nextMap);
    } catch (err) {
      console.warn('주문 상품 상세 조회 실패:', err);
      setProductSkuMap({});
    }
  };

  const resolveProductDisplay = item => {
    const name = item.productName || (item.productId ? `상품 ${item.productId}` : '-');
    const sku = productSkuMap[item.productId];
    return sku ? `${name} (${sku})` : name;
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
        <h3>주문 상품</h3>
        <table className="erp-table list-table order-detail-items-table">
          <thead>
            <tr>
              <th>No</th>
              <th>상품명(sku)</th>
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
                  <td>{resolveProductDisplay(item)}</td>
                  <td>{item.qty}</td>
                  <td>{item.unitPrice != null ? Number(item.unitPrice).toLocaleString('ko-KR') : '-'}</td>
                  <td>{item.amount != null ? Number(item.amount).toLocaleString('ko-KR') : '-'}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="empty-cell">
                  주문 상품이 없습니다.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
