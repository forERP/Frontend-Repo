import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './StoreList.css';

export default function StoreListPage() {
    const navigate = useNavigate();
    const [stores, setStores] = useState([
        { id: 1, name: '강남점', phone: '010-1234-5678', status: 'OPEN' },
        { id: 2, name: '홍대점', phone: '010-8765-4321', status: 'CLOSED' },
    ]); 

    return (
        <div className="store-page">
            <h1>매장 목록</h1>
            <p>전체 매장 수: {stores.length}</p>

            <table className="erp-table">
                <thead>
                    <tr>
                        <th>매장명</th>
                        <th>전화번호</th>
                        <th>운영 상태</th>
                        <th>상세보기</th>
                    </tr>
                </thead>
                <tbody>
                    {stores.length === 0 ? (
                        <tr><td colSpan={4}>등록된 매장이 없습니다.</td></tr>
                    ) : stores.map(store => (
                        <tr key={store.id}>
                            <td>{store.name}</td>
                            <td>{store.phone}</td>
                            <td>{store.status}</td>
                            <td>
                                <button onClick={() => navigate(`/stores/${store.id}`)}>
                                    보기
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            <button onClick={() => navigate('/stores/create')}>매장 등록</button>
        </div>
    );
}
