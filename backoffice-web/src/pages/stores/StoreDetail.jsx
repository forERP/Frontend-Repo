import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { fetchStoreDetail, updateStore, updateStoreStatus } from '../../api/storeApi';
import './StoreDetail.css';

const STATUS_LABEL = {
    OPEN: '영업중',
    INACTIVE: '휴무',
    CLOSED: '폐점',
};

const STATUS_OPTIONS = ['OPEN', 'INACTIVE', 'CLOSED'];

export default function StoreDetailPage() {
    const { id: storeId } = useParams();
    const navigate = useNavigate();

    const [store, setStore] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [editForm, setEditForm] = useState({
        name: '',
        address: '',
        phone: '',
    });

    useEffect(() => {
        loadStoreDetail();
    }, [storeId]);

    const loadStoreDetail = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await fetchStoreDetail(storeId);
            setStore(data);
            setEditForm({
                name: data.name,
                address: data.address || '',
                phone: data.phone || '',
            });
        } catch (err) {
            setError('매장 상세 조회에 실패했습니다.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleStatusSelect = async (newStatus) => {
        try {
            const result = await updateStoreStatus(storeId, newStatus);
            setStore(result);
            setDropdownOpen(false);
        } catch (err) {
            setError('상태 변경에 실패했습니다.');
            console.error(err);
        }
    };

    const handleEditChange = (e) => {
        const { name, value } = e.target;
        setEditForm(prev => ({ ...prev, [name]: value }));
    };

    const handleSaveEdit = async () => {
        try {
            setLoading(true);
            setError(null);
            const result = await updateStore(storeId, editForm);
            setStore(result);
            setIsEditing(false);
        } catch (err) {
            setError('정보 수정에 실패했습니다.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = () => {
        setIsEditing(false);
        if (store) {
            setEditForm({
                name: store.name,
                address: store.address || '',
                phone: store.phone || '',
            });
        }
    };

    if (loading && !store) {
        return (
            <div className="store-detail-page">
                <div className="store-detail-container">
                    <h1>매장 상세</h1>
                    <div className="detail-card" style={{ minHeight: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        로딩 중...
                    </div>
                </div>
            </div>
        );
    }

    if (error && !store) {
        return (
            <div className="store-detail-page">
                <div className="store-detail-container">
                    <h1>매장 상세</h1>
                    <div className="error-message">{error}</div>
                </div>
            </div>
        );
    }

    if (!store) return null;

    return (
        <div className="store-detail-page">
            <div className="store-detail-container">
                <h1>매장 상세</h1>
                {error && <div className="error-message">{error}</div>}

                <div className="detail-card">
                    {isEditing ? (
                        <form onSubmit={(e) => { e.preventDefault(); handleSaveEdit(); }}>
                            <table className="erp-table">
                                <tbody>
                                    <tr>
                                        <th>매장명</th>
                                        <td>
                                            <input
                                                name="name"
                                                value={editForm.name}
                                                onChange={handleEditChange}
                                                required
                                                placeholder="매장 이름"
                                            />
                                        </td>
                                    </tr>
                                    <tr>
                                        <th>주소</th>
                                        <td>
                                            <input
                                                name="address"
                                                value={editForm.address}
                                                onChange={handleEditChange}
                                                placeholder="매장 주소"
                                            />
                                        </td>
                                    </tr>
                                    <tr>
                                        <th>전화번호</th>
                                        <td>
                                            <input
                                                name="phone"
                                                value={editForm.phone}
                                                onChange={handleEditChange}
                                                type="tel"
                                                placeholder="연락처"
                                            />
                                        </td>
                                    </tr>
                                    <tr>
                                        <th>생성일</th>
                                        <td>{new Date(store.createdAt).toLocaleString()}</td>
                                    </tr>
                                    <tr>
                                        <th>운영 상태</th>
                                        <td>
                                            <div className="status-dropdown">
                                                <button
                                                    type="button"
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
                                                                    type="button"
                                                                    onClick={() => handleStatusSelect(s)}
                                                                    className={s === store.status ? 'active' : s.toLowerCase()}
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

                            <div className="action-buttons">
                                <button type="submit" disabled={loading}>
                                    {loading ? '저장 중...' : '저장'}
                                </button>
                                <button type="button" onClick={handleCancel} disabled={loading}>
                                    취소
                                </button>
                            </div>
                        </form>
                    ) : (
                        <>
                            <table className="erp-table">
                                <tbody>
                                    <tr>
                                        <th>매장명</th>
                                        <td>{store.name}</td>
                                    </tr>
                                    <tr>
                                        <th>주소</th>
                                        <td>{store.address || '-'}</td>
                                    </tr>
                                    <tr>
                                        <th>전화번호</th>
                                        <td>{store.phone || '-'}</td>
                                    </tr>
                                    <tr>
                                        <th>생성일</th>
                                        <td>{new Date(store.createdAt).toLocaleString()}</td>
                                    </tr>
                                    <tr>
                                        <th>운영 상태</th>
                                        <td>{STATUS_LABEL[store.status]}</td>
                                    </tr>
                                </tbody>
                            </table>

                            <div className="action-buttons">
                                <button onClick={() => setIsEditing(true)}>
                                    수정
                                </button>
                                <button onClick={() => navigate('/stores')}>
                                    목록
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
