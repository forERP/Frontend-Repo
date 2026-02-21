import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../lib/api';
import { getSessionUser, isStoreAdminUser } from '../../utils/auth';
import './Attendance.css';

export default function Attendance() {
  const sessionUser = getSessionUser();
  const isStoreAdmin = isStoreAdminUser(sessionUser);
  const scopedStoreId = isStoreAdmin && sessionUser?.storeId ? Number(sessionUser.storeId) : null;

  const [employees, setEmployees] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetchEmployees();
  }, [scopedStoreId]);

  const fetchEmployees = async () => {
    try {
      const res = await api.get('/api/users?role=STORE_HALL_STAFF');
      const list = Array.isArray(res.data) ? res.data : [];
      const scopedList = scopedStoreId == null
        ? list
        : list.filter(employee => Number(employee.storeId) === scopedStoreId);
      setEmployees(scopedList);
    } catch (err) {
      console.error(err);
    }
  };

  const getStatusLabel = status => {
    switch (status) {
      case 'WORK':
        return '근무중';
      case 'LEAVE':
        return '휴가';
      case 'ABSENT':
        return '결근';
      default:
        return '-';
    }
  };

  return (
    <div className="attendance-page">
      <div className="attendance-container">
        <h1 className="attendance-title">근태 관리</h1>

        <div className="attendance-card">
          <table className="attendance-table">
            <thead>
              <tr>
                <th>직원 ID</th>
                <th>직원 이름</th>
                <th>현재 상태</th>
                <th>상세보기</th>
              </tr>
            </thead>
            <tbody>
              {employees.length === 0 ? (
                <tr>
                  <td colSpan="4" style={{ textAlign: 'center', padding: '20px', color: '#888' }}>
                    등록된 직원이 없습니다.
                  </td>
                </tr>
              ) : (
                employees.map(employee => (
                  <tr key={employee.id}>
                    <td>{employee.id}</td>
                    <td>{employee.name}</td>
                    <td>
                      <span className={`status-badge status-${employee.attendanceStatus?.toLowerCase()}`}>
                        {getStatusLabel(employee.attendanceStatus)}
                      </span>
                    </td>
                    <td>
                      <button className="detail-btn" onClick={() => navigate(`/attendance/${employee.id}`)}>
                        상세보기
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}