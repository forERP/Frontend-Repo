import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../../lib/api';
import { getSessionUser, isStoreAdminUser } from '../../../utils/auth';
import './PurchaseApprovalListPage.css';

export default function PurchaseApprovalListPage() {
  const navigate = useNavigate();
  const isStoreAdmin = isStoreAdminUser(getSessionUser());

  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchApprovalNo, setSearchApprovalNo] = useState('');

  const fetchList = async () => {
    setLoading(true);
    try {
      const params = {
        status: 'REQUESTED',
        page: 0,
        size: 20,
      };

      if (searchApprovalNo) {
        params.purchaseRequestId = searchApprovalNo;
      }

      const { data } = await api.get('/api/purchase-requests', { params });
      setList(data.content || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchList();
  }, []);

  const approve = async id => {
    await api.post(`/api/purchase-requests/${id}/approve`, {
      supplierId: 1,
      warehouseId: 1,
      memo: '자동 승인',
    });
    fetchList();
  };

  const reject = async id => {
    await api.post(`/api/purchase-requests/${id}/reject`, {
      reason: '반려',
    });
    fetchList();
  };

  return (
    <div className="purchase-page">
      <h1>발주 요청 승인</h1>

      <div className="filter-bar">
        <input
          placeholder="요청번호 검색"
          value={searchApprovalNo}
          onChange={event => setSearchApprovalNo(event.target.value)}
        />
        <button onClick={fetchList}>검색</button>
      </div>

      <table className="erp-table">
        <thead>
          <tr>
            <th>요청번호</th>
            <th>매장명</th>
            <th>총금액</th>
            <th>상세보기</th>
            <th>상태버튼</th>
          </tr>
        </thead>

        <tbody>
          {loading ? (
            <tr>
              <td colSpan={5}>로딩 중...</td>
            </tr>
          ) : list.length === 0 ? (
            <tr>
              <td colSpan={5}>데이터가 없습니다.</td>
            </tr>
          ) : (
            list.map(item => (
              <tr key={item.purchaseRequestId}>
                <td>{item.purchaseRequestId}</td>
                <td>{item.storeName}</td>
                <td>{item.totalAmount?.toLocaleString() || 0}</td>

                <td>
                  <button onClick={() => navigate(`/purchase-approvals/${item.purchaseRequestId}`)}>
                    보기
                  </button>
                </td>

                <td>
                  <div className="status-action">
                    <span className="status-label">요청중</span>
                    {!isStoreAdmin && (
                      <div className="action-buttons">
                        <button className="approve" onClick={() => approve(item.purchaseRequestId)}>
                          승인
                        </button>
                        <button className="reject" onClick={() => reject(item.purchaseRequestId)}>
                          반려
                        </button>
                      </div>
                    )}
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}