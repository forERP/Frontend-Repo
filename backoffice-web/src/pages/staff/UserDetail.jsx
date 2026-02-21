import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { fetchUserDetail } from '../../api/userApi';
import { USER_ROLE, USER_STATUS } from '../../constants/user';
import { getSessionUser, isStoreAdminUser } from '../../utils/auth';
import './UserDetail.css';

export default function UserDetail() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const sessionUser = getSessionUser();
  const isStoreAdmin = isStoreAdminUser(sessionUser);
  const scopedStoreId = isStoreAdmin && sessionUser?.storeId ? Number(sessionUser.storeId) : null;

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadUser();
  }, [scopedStoreId, userId]);

  const loadUser = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchUserDetail(userId);
      if (scopedStoreId != null && Number(data?.storeId) !== scopedStoreId) {
        setUser(null);
        setError('본인 매장 직원만 조회할 수 있습니다.');
        return;
      }
      setUser(data);
    } catch (err) {
      console.error(err);
      setError('직원 정보를 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  };

  if (loading && !user) {
    return (
      <div className="user-detail-page">
        <div className="user-detail-container">
          <h1>직원 상세</h1>
          <div className="detail-card loading-box">로딩 중...</div>
        </div>
      </div>
    );
  }

  if (error && !user) {
    return (
      <div className="user-detail-page">
        <div className="user-detail-container">
          <h1>직원 상세</h1>
          <div className="error-message">{error}</div>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="user-detail-page">
      <div className="user-detail-container">
        <h1>직원 상세</h1>
        {error && <div className="error-message">{error}</div>}

        <div className="detail-card">
          <table className="erp-table">
            <tbody>
              <tr>
                <th>직원명</th>
                <td>{user.name}</td>
              </tr>
              <tr>
                <th>로그인 ID</th>
                <td>{user.loginId}</td>
              </tr>
              <tr>
                <th>직원코드</th>
                <td>{user.employeeCode || '-'}</td>
              </tr>
              <tr>
                <th>전화번호</th>
                <td>{user.phoneNumber || '-'}</td>
              </tr>
              <tr>
                <th>매장명</th>
                <td>{user.storeName || '-'}</td>
              </tr>
              <tr>
                <th>매장코드</th>
                <td>{user.storeCode || '-'}</td>
              </tr>
              <tr>
                <th>역할</th>
                <td>{USER_ROLE[user.role]?.label || user.role || '-'}</td>
              </tr>
              <tr>
                <th>상태</th>
                <td>
                  <span
                    className="status-badge"
                    style={{ backgroundColor: USER_STATUS[user.status]?.color || '#6C757D', color: '#fff' }}
                  >
                    {USER_STATUS[user.status]?.label || user.status || '-'}
                  </span>
                </td>
              </tr>
              <tr>
                <th>등록일</th>
                <td>{user.createdAt ? new Date(user.createdAt).toLocaleString('ko-KR') : '-'}</td>
              </tr>
            </tbody>
          </table>

          <div className="form-buttons detail-form-buttons">
            <button
              type="button"
              className="primary-action"
              onClick={() => navigate(`/users/${user.id}/edit`)}
            >
              수정
            </button>
            <button type="button" onClick={() => navigate('/users')}>
              목록
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
