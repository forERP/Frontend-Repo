import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './StoreCreatePage.css';

export default function StoreCreatePage() {
    const navigate = useNavigate();
    const [form, setForm] = useState({
        name: '',
        type: '',
        address: '',
        phone: '',
        status: 'OPEN',
    });

    const handleChange = e => {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = e => {
        e.preventDefault();
        navigate(`/stores/123`);
    };

    return (
        <div className="store-create-page">
            <h1>매장 등록</h1>
            <form onSubmit={handleSubmit} className="store-form">
                <label>매장명
                    <input name="name" value={form.name} onChange={handleChange} required />
                </label>
                <label>매장 타입
                    <input name="type" value={form.type} onChange={handleChange} required />
                </label>
                <label>운영 상태
                    <select name="status" value={form.status} onChange={handleChange}>
                        <option value="OPEN">영업중</option>
                        <option value="CLOSED">휴무</option>
                    </select>
                </label>
                <label>주소
                    <input name="address" value={form.address} onChange={handleChange} required />
                </label>
                <label>전화번호
                    <input name="phone" value={form.phone} onChange={handleChange} required />
                </label>
                <button type="submit">등록</button>
            </form>
        </div>
    );
}
