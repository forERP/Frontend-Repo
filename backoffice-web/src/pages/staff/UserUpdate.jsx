import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../lib/api';

export default function UserUpdate() {

    const { userId } = useParams();
    const navigate = useNavigate();
    const [formData, setFormData] = useState({ name: '', role: '', storeId: '' });

    useEffect(() => {
        api.get(`/api/users/${userId}`).then(res => {
            setFormData({
                name: res.data.name,
                role: res.data.role,
                storeId: res.data.storeId
            });
        });
    }, [userId]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await api.put(`/api/users/${userId}`, {
                ...formData,
                storeId: parseInt(formData.storeId)
            });
            alert('수정되었습니다.');
            navigate(`/users/${userId}`);
        } catch (error) {
            alert('수정 실패');
        }
    };

    return (
        <div className="form-container">
            <h2>직원 정보 수정</h2>
            <form onSubmit={handleSubmit} className="erp-form">
                <div className="form-group">
                    <label>이름</label>
                    <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
                </div>
                <div className="form-group">
                    <label>매장 ID</label>
                    <input type="number" value={formData.storeId} onChange={(e) => setFormData({ ...formData, storeId: e.target.value })} required />
                </div>
                <div className="form-group">
                    <label>역할</label>
                    <select value={formData.role} onChange={(e) => setFormData({ ...formData, role: e.target.value })}>
                        <option value="STORE_HALL_STAFF">홀 스태프</option>
                        <option value="STORE_KITCHEN_STAFF">주방 스태프</option>
                        <option value="STORE_ADMIN">매장 관리자</option>
                        <option value="HQ_ADMIN">본사 관리자</option>
                    </select>
                </div>
                <div className="form-actions">
                    <button type="submit" className="submit-btn">수정 완료</button>
                </div>
            </form>
        </div>
    );
}
