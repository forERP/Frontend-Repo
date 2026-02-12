import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../lib/api';
import './Users.css';

export default function Users() {

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await api.get('/api/users');
      setUsers(response.data);
    } catch (error) {
      console.error('직원 목록 로드 실패:', error);
      alert('데이터를 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="loading">데이터 로딩 중...</div>;

  return (
    <div className="users-container">
      <div className="header-section">
        <h2>직원 계정 관리</h2>
        <button className="create-btn" onClick={() => navigate('/users/new')}>
          신규 직원 등록
        </button>
      </div>

      <table className="erp-table">
        <thead>
          <tr>
            <th>매장 ID</th>
            <th>직원 이름</th>
            <th>역할</th>
            <th>상태</th>
            <th>상세</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.id}>
              <td>{user.storeId}</td>
              <td>{user.name} ({user.loginId})</td>
              <td><span className={`role-badge ${user.role}`}>{user.role}</span></td>
              <td>{user.status}</td>
              <td>
                <button className="detail-btn" onClick={() => navigate(`/users/${user.id}`)}>
                  상세보기
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
