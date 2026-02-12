import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../lib/api';
import './UserForm.css';

export default function UserForm() {

    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        loginId: '',
        password: '',
        name: '',
        storeId: '',
        role: ''
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await api.post('/api/users', {
                ...formData,
                storeId: parseInt(formData.storeId)
            });
            alert('직원이 등록되었습니다.');
            navigate('/users');
        } catch (error) {
            alert('등록 실패: ' + (error.response?.data?.message || '서버 에러'));
        }
    };

    return (
        <div className="form-container">
            <h2>신규 직원 등록</h2>
            <form onSubmit={handleSubmit} className="erp-form">
                <div className="form-group">
                    <label>아이디</label>
                    <input type="text" name="loginId" value={formData.loginId} onChange={handleChange} required />
                </div>
                <div className="form-group">
                    <label>비밀번호</label>
                    <input type="password" name="password" value={formData.password} onChange={handleChange} required />
                </div>
                <div className="form-group">
                    <label>이름</label>
                    <input type="text" name="name" value={formData.name} onChange={handleChange} required />
                </div>
                <div className="form-group">
                    <label>매장 ID</label>
                    <input type="number" name="storeId" value={formData.storeId} onChange={handleChange} required />
                </div>
                <div className="form-group">
                    <label>역할</label>
                    <select name="role" value={formData.role} onChange={handleChange} required>
                        <option value="" disabled>역할을 선택하세요</option>
                        <option value="STORE_HALL_STAFF">홀 스태프</option>
                        <option value="STORE_KITCHEN_STAFF">주방 스태프</option>
                        <option value="STORE_ADMIN">매장 관리자</option>
                        <option value="HQ_ADMIN">본사 관리자</option>
                    </select>
                </div>
                <div className="form-actions">
                    <button type="button" onClick={() => navigate(-1)} className="cancel-btn">취소</button>
                    <button type="submit" className="submit-btn">등록</button>
                </div>
            </form>
        </div>
    );
}
