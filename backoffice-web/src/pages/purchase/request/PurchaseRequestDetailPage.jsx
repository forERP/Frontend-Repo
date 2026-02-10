import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../../lib/api';
import { STATUS_LABEL } from '../../../constants/status';
import './purchase.css';
import './PurchaseRequestDetailPage.css';

export default function RequestDetailPage() {
  const { id: purchaseRequestId } = useParams();
  const navigate = useNavigate();
  const [request, setRequest] = useState(null);

  useEffect(() => {
    if (!purchaseRequestId) return;
    api.get(`/api/purchase-requests/${purchaseRequestId}`).then(res => setRequest(res.data));
  }, [purchaseRequestId]);

  if (!request) return <div className="purchase-page">로딩 중...</div>;

  return (
    <div className="purchase-page">
      <h2>발주 요청 상세</h2>
      <button className="back-btn" onClick={() => navigate(-1)}>목록으로</button>

      <div className="store-info-box">
        <h3>요청 정보</h3>
        <p><strong>요청 ID:</strong> {request.purchaseRequestId}</p>
        <p><strong>지점 ID:</strong> {request.storeId}</p>
        <p><strong>요청자 ID:</strong> {request.requestedByUserId}</p>
        <p><strong>요청일:</strong> {request.createdAt ? new Date(request.createdAt).toLocaleString() : '-'}</p>
        <p><strong>상태:</strong> {STATUS_LABEL[request.status] ?? request.status}</p>
        {request.memo && <p><strong>메모:</strong> {request.memo}</p>}
      </div>

      <table className="erp-table">
        <thead>
          <tr>
            <th>No</th>
            <th>품목 ID</th>
            <th>상품 ID</th>
            <th>수량</th>
          </tr>
        </thead>
        <tbody>
          {(request.items || []).map((i, idx) => (
            <tr key={i.purchaseRequestItemId}>
              <td>{idx + 1}</td>
              <td>{i.purchaseRequestItemId}</td>
              <td>{i.productId}</td>
              <td>{i.qty}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}