import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchStores } from '../../api/storeApi';
import './StoreList.css';

const STATUS_LABEL = {
    OPEN: '영업중',
    INACTIVE: '휴무',
    CLOSED: '폐점',
};

export default function StoreListPage() {
    const navigate = useNavigate();
    const [stores, setStores] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        loadStores();
    }, []);

    const loadStores = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await fetchStores();
            setStores(data);
        } catch (err) {
            setError('매장 목록 조회에 실패했습니다.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="store-page"><h1>매장 목록</h1><p>로딩 중...</p></div>;
    if (error) return <div className="store-page"><h1>매장 목록</h1><p style={{ color: 'red' }}>{error}</p></div>;

    return (
        <div className="store-page">
            <div className="store-container">
                <div className="page-header">
                    <h1 className="page-title">매장 목록</h1>
                    <button className="create-btn" onClick={() => navigate('/stores/create')}>
                        매장 등록
                    </button>
                </div>
                <p className="page-subtitle">전체 매장 수: {stores.length}</p>

                {loading && <div className="loading">로딩 중...</div>}
                {error && <div className="error-message">{error}</div>}

                {!loading && !error && (
                    <div className="card">
                        <table className="erp-table">
                            <thead>
                                <tr>
                                    <th>매장명</th>
                                    <th>주소</th>
                                    <th>전화번호</th>
                                    <th>운영 상태</th>
                                    <th>상세보기</th>
                                </tr>
                            </thead>
                            <tbody>
                                {stores.length === 0 ? (
                                    <tr><td colSpan={5} style={{ textAlign: 'center' }}>등록된 매장이 없습니다.</td></tr>
                                ) : stores.map(store => (
                                    <tr key={store.id}>
                                        <td>{store.code ? `${store.name} (${store.code})` : store.name}</td>
                                        <td>{store.address || '-'}</td>
                                        <td>{store.phone || '-'}</td>
                                        <td>{STATUS_LABEL[store.status] || store.status}</td>
                                        <td>
                                            <button onClick={() => navigate(`/stores/${store.id}`)}>
                                                보기
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
