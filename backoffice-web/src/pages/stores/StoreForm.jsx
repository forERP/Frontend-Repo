import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../lib/api';
import './StoreForm.css';

export default function StoreForm() {
    const navigate = useNavigate();

    const [form, setForm] = useState({
        name: '',
        storeType: 'STORE',
        status: 'OPEN',
        address: '',
        phone: '',
    });

    const [loading, setLoading] = useState(false);

    const onChange = e => {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: value }));
    };

    const onSubmit = async e => {
        e.preventDefault();
        setLoading(true);

        try {
            const { data } = await api.post('/api/stores', form);

            navigate(`/stores/${data.id}`);
        } catch (e) {
            console.error(e);
            alert('매장 생성 실패');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="store-form">
            <h1>매장 등록</h1>

            <form onSubmit={onSubmit}>
                <div className="field">
                    <label>매장명</label>
                    <input
                        name="name"
                        value={form.name}
                        onChange={onChange}
                        required
                    />
                </div>

                <div className="field">
                    <label>매장 타입</label>
                    <select
                        name="storeType"
                        value={form.storeType}
                        onChange={onChange}
                    >
                        <option value="STORE">매장</option>
                        <option value="HQ">본사</option>
                    </select>
                </div>

                <div className="field">
                    <label>운영 상태</label>
                    <select
                        name="status"
                        value={form.status}
                        onChange={onChange}
                    >
                        <option value="OPEN">운영중</option>
                        <option value="INACTIVE">일시중단</option>
                    </select>
                </div>

                <div className="field">
                    <label>주소</label>
                    <input
                        name="address"
                        value={form.address}
                        onChange={onChange}
                        placeholder="예: 서울시 강남구 테헤란로 123"
                        required
                    />
                </div>

                <div className="field">
                    <label>전화번호</label>
                    <input
                        name="phone"
                        value={form.phone}
                        onChange={onChange}
                        placeholder="02-1234-5678"
                        required
                    />
                </div>

                <button type="submit" disabled={loading}>
                    {loading ? '생성중...' : '생성'}
                </button>
            </form>
        </div>
    );
}
