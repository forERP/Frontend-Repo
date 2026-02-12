import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../lib/api';
import './UserDetail.css';

export default function UserDetail() {


  const { userId } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  useEffect(() => {
    fetchUser();
  }, [userId]);

  const fetchUser = async () => {
    try {
      const response = await api.get(`/api/users/${userId}`);
      setUser(response.data);
    } catch (error) {
      alert('사용자 정보를 불러올 수 없습니다.');
      navigate('/users');
    }
  };

  const handleDelete = async () => {
    if (window.confirm('정말 이 직원을 퇴사 처리하시겠습니까?')) {
      try {
        await api.delete(`/api/users/${userId}`);
        alert('퇴사 처리 되었습니다.');
        navigate('/users');
      } catch (error) {
        alert('삭제 실패');
      }
    }
  };

  if (!user) return null;

  return (
    <div className="detail-container">
      <div className="detail-card">
        <div className="card-header">
          <h2>{user.name} 님의 인사 정보</h2>
          <span className={`status-tag ${user.status}`}>{user.status}</span>
        </div>

        <div className="info-grid">
          <div className="info-item"><strong>로그인 ID</strong> <span>{user.loginId}</span></div>
          <div className="info-item"><strong>직원 코드</strong> <span>{user.employeeCode}</span></div>
          <div className="info-item"><strong>매장 ID</strong> <span>{user.storeId}</span></div>
          <div className="info-item"><strong>부여 권한</strong> <span>{user.role}</span></div>
          <div className="info-item"><strong>등록 일시</strong> <span>{new Date(user.createdAt).toLocaleString()}</span></div>
        </div>

        <div className="action-row">
          <button onClick={() => navigate(`/users/update/${userId}`)} className="update-btn">정보 수정</button>
          <button onClick={handleDelete} className="delete-btn">퇴사 처리</button>
        </div>

        <hr />

        <div className="nav-row">
          <button onClick={() => navigate(`/attendance/${userId}`)}>근태 기록 보기</button>
          <button onClick={() => navigate(`/salary/${userId}`)}>급여 내역 보기</button>
        </div>
      </div>
    </div>
  );
}