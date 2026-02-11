import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../lib/api';
import './StoreList.css';

export default function StoreList() {
  const navigate = useNavigate();
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(false);
  const [onlyHQ, setOnlyHQ] = useState(false);

  useEffect(() => {
    fetchStores();
  }, []);

  const fetchStores = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/api/stores');
      setStores(data);
    } catch (e) {
      console.error(e);
      alert('매장 목록 조회 실패');
    } finally {
      setLoading(false);
    }
  };

  const filteredStores = onlyHQ
    ? stores.filter(s => s.storeType === 'HQ')
    : stores;

  return (
    <div className="store-page">
      <h1>매장 목록</h1>
      <div className="store-toolbar">
        <span>전체 매장 수: {filteredStores.length}</span>

        <label className="hq-filter">
          <input
            type="checkbox"
            checked={onlyHQ}
            onChange={() => setOnlyHQ(v => !v)}
          />
          HQ만 보기
        </label>
      </div>

      <table className="erp-table">
        <thead>
          <tr>
            <th>매장 코드</th>
            <th>매장명</th>
            <th>유형</th>
            <th>운영 상태</th>
            <th>상세</th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr><td colSpan={5}>로딩 중...</td></tr>
          ) : filteredStores.length === 0 ? (
            <tr><td colSpan={5}>등록된 매장이 없습니다.</td></tr>
          ) : filteredStores.map(store => (
            <tr key={store.id}>
              <td>{store.storeCode}</td>
              <td>{store.name}</td>
              <td>{store.storeType}</td>
              <td>
                <span className={`status ${store.status.toLowerCase()}`}>
                  {store.status}
                </span>
              </td>
              <td>
                <button
                  onClick={() => navigate(`/stores/${store.id}`)}
                >
                  보기
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <button onClick={() => navigate('/stores/new')}>
        매장 등록
      </button>
    </div>
  );
}
