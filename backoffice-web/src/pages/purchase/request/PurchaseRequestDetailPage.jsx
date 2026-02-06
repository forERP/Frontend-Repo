import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../../lib/api';
import { STATUS_LABEL } from '../../../constants/status';
import './purchase.css';
import './PurchaseRequestDetailPage.css';

export default function RequestDetailPage() {
  const { purchaseRequestId } = useParams();
  const navigate = useNavigate();
  const [request, setRequest] = useState(null);

  useEffect(() => {
    api.get(`/api/purchase-requests/${purchaseRequestId}`).then(res => setRequest(res.data));
  }, [purchaseRequestId]);

  if (!request) return <div>로딩 중...</div>;

  return (
    <div className="purchase-page">
      <h2>발주 요청 상세</h2>
      <button className="back-btn" onClick={() => navigate(-1)}>목록으로</button>

      <div className="store-info-box">
        <h3>매장 정보</h3>
        <p><strong>매장명:</strong> {request.storeName}</p>
        <p><strong>요청일:</strong> {new Date(request.createdAt).toLocaleString()}</p>
        <p><strong>상태:</strong> {STATUS_LABEL[request.status]}</p>
      </div>

      <table className="erp-table">
        <thead>
          <tr>
            <th>No</th>
            <th>상품 코드</th>
            <th>상품명</th>
            <th>현재 재고</th>
            <th>발주 수량</th>
          </tr>
        </thead>
        <tbody>
          {request.items.map((i, idx) => (
            <tr key={i.purchaseRequestItemId}>
              <td>{idx + 1}</td>
              <td>{i.productCode}</td>
              <td>{i.productName}</td>
              <td>{i.currentStock}</td>
              <td>{i.qty}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="memo">메모: {request.memo}</div>
    </div>
  );
}