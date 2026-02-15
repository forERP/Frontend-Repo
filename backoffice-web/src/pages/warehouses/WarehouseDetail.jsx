import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { fetchWarehouse, updateWarehouse } from '../../api/warehouseApi';
import './WarehouseDetail.css';

export default function WarehouseDetailPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    const [warehouse, setWarehouse] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [editForm, setEditForm] = useState({ code: '', name: '', active: true });

    useEffect(() => {
        load();
    }, [id]);

    useEffect(() => {
        if (searchParams.get('edit') === '1') {
            setIsEditing(true);
        }
    }, [searchParams]);

    const load = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await fetchWarehouse(id);
            setWarehouse(data);
            setEditForm({ code: data.code || '', name: data.name || '', active: !!data.active });
        } catch (err) {
            setError('창고 정보를 불러오지 못했습니다.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleEditChange = (e) => {
        const { name, value, type, checked } = e.target;
        setEditForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    };

    const handleSaveEdit = async () => {
        try {
            setLoading(true);
            setError(null);
            const result = await updateWarehouse(id, { code: editForm.code, name: editForm.name, active: editForm.active });
            setWarehouse(result);
            setIsEditing(false);
        } catch (err) {
            setError('창고 수정에 실패했습니다.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = () => {
        setIsEditing(false);
        if (warehouse) setEditForm({ code: warehouse.code || '', name: warehouse.name || '', active: !!warehouse.active });
    };

    if (loading && !warehouse) {
        return (
            <div className="warehouse-detail-page">
                <div className="warehouse-detail-container">
                    <h1>창고 상세</h1>
                    <div className="detail-card" style={{ minHeight: '240px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        로딩 중...
                    </div>
                </div>
            </div>
        );
    }

    if (error && !warehouse) {
        return (
            <div className="warehouse-detail-page">
                <div className="warehouse-detail-container">
                    <h1>창고 상세</h1>
                    <div className="error-message">{error}</div>
                </div>
            </div>
        );
    }

    if (!warehouse) return null;

    return (
        <div className="warehouse-detail-page">
            <div className="warehouse-detail-container">
                <h1>창고 상세</h1>
                {error && <div className="error-message">{error}</div>}

                <div className="detail-card">
                    {isEditing ? (
                        <form onSubmit={(e) => { e.preventDefault(); handleSaveEdit(); }}>
                            <table className="erp-table">
                                <tbody>
                                    <tr>
                                        <th>매장</th>
                                        <td>{warehouse.storeName || '-'}{warehouse.storeId ? ` (${warehouse.storeId})` : ''}</td>
                                    </tr>
                                    <tr>
                                        <th>창고 코드</th>
                                        <td>
                                            <input name="code" value={editForm.code} onChange={handleEditChange} required placeholder="코드" />
                                        </td>
                                    </tr>
                                    <tr>
                                        <th>창고 이름</th>
                                        <td>
                                            <input name="name" value={editForm.name} onChange={handleEditChange} required placeholder="이름" />
                                        </td>
                                    </tr>
                                    <tr>
                                        <th>생성일</th>
                                        <td>{warehouse.createdAt ? new Date(warehouse.createdAt).toLocaleString() : '-'}</td>
                                    </tr>
                                    <tr>
                                        <th>상태</th>
                                        <td>
                                            <label style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                                                <input type="checkbox" name="active" checked={editForm.active} onChange={handleEditChange} /> 활성
                                            </label>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>

                            <div className="action-buttons">
                                <button type="submit" disabled={loading}>{loading ? '저장 중...' : '저장'}</button>
                                <button type="button" onClick={handleCancel} disabled={loading}>취소</button>
                            </div>
                        </form>
                    ) : (
                        <>
                            <table className="erp-table">
                                <tbody>
                                    <tr>
                                        <th>매장</th>
                                        <td>{warehouse.storeName || '-'}</td>
                                    </tr>
                                    <tr>
                                        <th>창고 코드</th>
                                        <td>{warehouse.code}</td>
                                    </tr>
                                    <tr>
                                        <th>창고 이름</th>
                                        <td>{warehouse.name}</td>
                                    </tr>
                                    <tr>
                                        <th>생성일</th>
                                        <td>{warehouse.createdAt ? new Date(warehouse.createdAt).toLocaleString() : '-'}</td>
                                    </tr>
                                    <tr>
                                        <th>상태</th>
                                        <td><span className={`status-badge ${warehouse.active ? 'active' : 'inactive'}`}>{warehouse.active ? '활성' : '비활성'}</span></td>
                                    </tr>
                                </tbody>
                            </table>

                            <div className="action-buttons">
                                <button onClick={() => setIsEditing(true)}>수정</button>
                                <button onClick={() => navigate('/warehouses')}>목록</button>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
