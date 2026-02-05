import { useState, useEffect } from 'react';
import api from '../../../lib/api';
import './PurchaseRequestDetailPage.css';

export default function PurchaseRequestDetail({ purchaseRequestId, onClose }) {
  const [request, setRequest] = useState(null);

  const fetchDetail = async () => {
    const { data } = await api.get(`/api/purchase-requests/${purchaseRequestId}`);
    setRequest(data);
  };

  useEffect(() => { fetchDetail(); }, [purchaseRequestId]);

  if (!request) return <div>로딩 중...</div>;

  return (
    <div style={{ border: '1px solid black', padding: 16, background: '#fff' }}>
      <h2>발주 요청 상세</h2>
      <div>매장: {request.storeId}</div>
      <div>상태: {request.status}</div>
      <div>메모: {request.memo}</div>

      <table border="1" width="100%" style={{ marginTop: 8 }}>
        <thead>
          <tr>
            <th>No</th>
            <th>상품 코드</th>
            <th>발주 수량</th>
          </tr>
        </thead>
        <tbody>
          {request.items.map((i, idx) => (
            <tr key={idx}>
              <td>{idx + 1}</td>
              <td>{i.productId}</td>
              <td>{i.qty}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div style={{ textAlign: 'right', marginTop: 8 }}>
        <button onClick={onClose}>닫기</button>
      </div>
    </div>
  );
}
