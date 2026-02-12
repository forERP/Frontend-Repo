import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchWarehouses } from '../../api/warehouseApi';
import './WarehouseList.css';

export default function WarehouseListPage() {
    const navigate = useNavigate();
    const [warehouses, setWarehouses] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        loadWarehouses();
    }, []);

    const loadWarehouses = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await fetchWarehouses();
            setWarehouses(data);
        } catch (err) {
            setError('창고 목록 조회에 실패했습니다.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="warehouse-page"><h1>창고 목록</h1><p>로딩 중...</p></div>;
    if (error) return <div className="warehouse-page"><h1>창고 목록</h1><p style={{ color: 'red' }}>{error}</p></div>;

    return (
        <div className="warehouse-page">
            <div className="warehouse-container">
                <div className="page-header">
                    <h1 className="page-title">창고 목록</h1>
                    <button className="create-btn" onClick={() => navigate('/warehouses/create')}>
                        창고 생성
                    </button>
                </div>
                <p className="page-subtitle">총 창고 수: {warehouses.length}</p>

                {!loading && !error && (
                    <div className="card">
                        <table className="erp-table">
                            <thead>
                                <tr>
                                    <th>코드</th>
                                    <th>이름</th>
                                    <th>매장</th>
                                    <th>상태</th>
                                    <th>상세보기</th>
                                </tr>
                            </thead>
                            <tbody>
                                {warehouses.length === 0 ? (
                                    <tr><td colSpan={5} style={{ textAlign: 'center' }}>등록된 창고가 없습니다.</td></tr>
                                ) : warehouses.map(w => (
                                    <tr key={w.warehouseId}>
                                        <td>{w.code}</td>
                                        <td>{w.name}</td>
                                        <td>{w.storeName || '-'}</td>
                                        <td>
                                            <span className={`status-badge ${w.active ? 'active' : 'inactive'}`}>
                                                {w.active ? '활성' : '비활성'}
                                            </span>
                                        </td>
                                        <td>
                                            <button onClick={() => navigate(`/warehouses/${w.warehouseId}`)}>보기</button>
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