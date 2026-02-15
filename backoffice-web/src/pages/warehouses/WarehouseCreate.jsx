import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchStores } from '../../api/storeApi';
import { createWarehouse } from '../../api/warehouseApi';
import './WarehouseCreate.css';

export default function WarehouseCreatePage() {
    const navigate = useNavigate();
    const [stores, setStores] = useState([]);
    const [form, setForm] = useState({ storeId: '', code: '', name: '' });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        loadStores();
    }, []);

    const loadStores = async () => {
        try {
            const data = await fetchStores();
            setStores(data);
        } catch (err) {
            console.error(err);
            setError('매장 목록을 불러오지 못했습니다.');
        }
    };

    const handleChange = e => {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async e => {
        e.preventDefault();
        if (!form.storeId) {
            setError('매장을 선택해주세요.');
            return;
        }
        if (!form.code.trim()) {
            setError('창고 코드를 입력해주세요.');
            return;
        }
        if (!form.name.trim()) {
            setError('창고 이름을 입력해주세요.');
            return;
        }

        try {
            setLoading(true);
            setError(null);
            await createWarehouse({ storeId: Number(form.storeId), code: form.code, name: form.name });
            navigate('/warehouses');
        } catch (err) {
            setError('창고 생성에 실패했습니다.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="warehouse-create-page">
            <div className="warehouse-form-container">
                <h1>창고 등록</h1>
                <div className="form-card">
                    {error && <div className="error-message">{error}</div>}
                    <form onSubmit={handleSubmit} className="warehouse-form">
                        <div className="form-group">
                            <label>매장 *</label>
                            <select name="storeId" value={form.storeId} onChange={handleChange} required>
                                <option value="">-- 매장 선택 --</option>
                                {stores.map(s => (
                                    <option key={s.id} value={s.id}>{s.name}{s.storeCode ? ` (${s.storeCode})` : ''}</option>
                                ))}
                            </select>
                        </div>

                        <div className="form-group">
                            <label>창고 코드 *</label>
                            <input name="code" value={form.code} onChange={handleChange} required placeholder="예: SUB_001" />
                        </div>

                        <div className="form-group">
                            <label>창고 이름 *</label>
                            <input name="name" value={form.name} onChange={handleChange} required placeholder="창고 이름을 입력하세요" />
                        </div>

                        <div className="form-buttons">
                            <button type="submit" disabled={loading}>{loading ? '등록 중...' : '등록'}</button>
                            <button type="button" onClick={() => navigate('/warehouses')}>취소</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
