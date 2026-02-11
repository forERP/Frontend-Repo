import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../lib/api';
import './StoreDetail.css';

const STATUS_LABEL = {
  OPEN: '영업중',
  INACTIVE: '휴무',
  CLOSED: '폐점',
};

const STATUS_OPTIONS = ['OPEN', 'INACTIVE', 'CLOSED'];

export default function StoreDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [store, setStore] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  useEffect(() => {
    fetchStore();
  }, [id]);

  const fetchStore = async () => {
    try {
      const { data } = await api.get(`/api/stores/${id}`);
      setStore(data);
    } catch (e) {
      console.error(e);
      alert('매장 조회 실패');
    } finally {
      setLoading(false);
    }
  };

  const changeStatus = async newStatus => {
    if (newStatus === store.status) return;

    try {
      const { data } = await api.patch(
        `/api/stores/${id}/status`,
        { status: newStatus }
      );
      setStore(data);
      setDropdownOpen(false);
    } catch (e) {
      console.error(e);
      alert('상태 변경 실패');
    }
  };

  if (loading) {
    return <div className="store-detail-page">로딩 중...</div>;
  }

  if (!store) {
    return <div className="store-detail-page">데이터 없음</div>;
  }

  return (
    <div className="store-detail-page">
      <h1>매장 상세</h1>

      <table className="erp-table">
        <tbody>
          <tr>
            <th>매장 코드</th>
            <td>{store.storeCode}</td>
          </tr>
          <tr>
            <th>매장명</th>
            <td>{store.name}</td>
          </tr>
          <tr>
            <th>매장 타입</th>
            <td>{store.storeType}</td>
          </tr>
          <tr>
            <th>주소</th>
            <td>{store.address}</td>
          </tr>
          <tr>
            <th>전화번호</th>
            <td>{store.phone}</td>
          </tr>
          <tr>
            <th>운영 상태</th>
            <td>
              <div className="status-dropdown">
                <button
                  className={`status-button ${store.status.toLowerCase()}`}
                  onClick={() => setDropdownOpen(v => !v)}
                >
                  {STATUS_LABEL[store.status]}
                </button>

                {dropdownOpen && (
                  <ul className="status-options">
                    {STATUS_OPTIONS.map(s => (
                      <li key={s}>
                        <button
                          onClick={() => changeStatus(s)}
                          className={s === store.status ? 'active' : ''}
                        >
                          {STATUS_LABEL[s]}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </td>
          </tr>
          <tr>
            <th>생성일</th>
            <td>{new Date(store.createdAt).toLocaleString()}</td>
          </tr>
        </tbody>
      </table>

      <div className="store-actions">
        <button onClick={() => navigate(`/stores/${id}/edit`)}>
          정보 수정
        </button>
        <button onClick={() => navigate(`/reports/sales`)}>
          매출 관리
        </button>
        <button onClick={() => navigate(`/stores/${id}/employees`)}>
          직원 관리
        </button>
      </div>
    </div>
  );
}
