import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import './StoreDetailPage.css';

const STATUS_LABEL = {
    OPEN: '영업중',
    INACTIVE: '휴무',
    CLOSED: '폐점',
};

const STATUS_OPTIONS = ['OPEN', 'INACTIVE', 'CLOSED'];

export default function StoreDetailPage() {
    const { storeId } = useParams();
    const navigate = useNavigate();

    const [store, setStore] = useState({
        name: '강남점',
        type: '프랜차이즈',
        address: '서울 강남구 역삼동 123-45',
        phone: '010-1234-5678',
        createdAt: '2025-12-01T10:00:00Z',
        status: 'OPEN',
    });

    const [dropdownOpen, setDropdownOpen] = useState(false);

    const handleStatusSelect = (newStatus) => {
        setStore(prev => ({ ...prev, status: newStatus }));
        setDropdownOpen(false);
    };

    return (
        <div className="store-detail-page">
            <h1>매장 상세</h1>
            <table className="erp-table">
                <tbody>
                    <tr><th>매장명</th><td>{store.name}</td></tr>
                    <tr><th>매장 타입</th><td>{store.type}</td></tr>
                    <tr><th>매장 주소</th><td>{store.address}</td></tr>
                    <tr><th>전화번호</th><td>{store.phone}</td></tr>
                    <tr><th>생성일</th><td>{new Date(store.createdAt).toLocaleString()}</td></tr>
                    <tr>
                        <th>운영 상태</th>
                        <td>
                            <div className="status-dropdown">
                                <button
                                    onClick={() => setDropdownOpen(prev => !prev)}
                                    className={`status-button ${store.status.toLowerCase()}`}
                                >
                                    {STATUS_LABEL[store.status]}
                                </button>
                                {dropdownOpen && (
                                    <ul className="status-options">
                                        {STATUS_OPTIONS.map(s => (
                                            <li key={s}>
                                                <button
                                                    onClick={() => handleStatusSelect(s)}
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
                </tbody>
            </table>

            <div style={{ marginTop: '20px' }}>
                <button onClick={() => navigate(`/stores/${storeId}/sales`)}>매출 관리</button>
                <button onClick={() => navigate(`/stores/${storeId}/employees`)}>직원 관리</button>
            </div>
        </div>
    );
}
