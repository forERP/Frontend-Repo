import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { fetchStores } from '../../api/storeApi';
import { fetchUserDetail, updateUser } from '../../api/userApi';
import { USER_ROLE_FORM_OPTIONS, USER_STATUS_OPTIONS } from '../../constants/user';
import './UserUpdate.css';

export default function UserUpdate() {
  const { userId } = useParams();
  const navigate = useNavigate();

  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [loaded, setLoaded] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    password: '',
    storeId: '',
    role: 'STORE_HALL_STAFF',
    status: 'ACTIVE',
  });

  const [displayInfo, setDisplayInfo] = useState({
    loginId: '',
    employeeCode: '',
  });

  useEffect(() => {
    loadPageData();
  }, [userId]);

  const loadPageData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [user, storeList] = await Promise.all([
        fetchUserDetail(userId),
        fetchStores(),
      ]);

      setStores(storeList || []);
      setDisplayInfo({
        loginId: user.loginId || '',
        employeeCode: user.employeeCode || '',
      });
      setFormData({
        name: user.name || '',
        password: '',
        storeId: user.storeId ? String(user.storeId) : '',
        role: user.role || 'STORE_HALL_STAFF',
        status: user.status || 'ACTIVE',
      });
      setLoaded(true);
    } catch (err) {
      console.error(err);
      setError('직원 정보를 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = e => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async e => {
    e.preventDefault();

    if (!formData.name.trim()) {
      setError('직원명을 입력해주세요.');
      return;
    }

    if (!formData.storeId) {
      setError('매장을 선택해주세요.');
      return;
    }

    if (formData.password && formData.password.length < 8) {
      setError('비밀번호를 변경하려면 8자 이상 입력해주세요.');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const payload = {
        name: formData.name.trim(),
        storeId: Number(formData.storeId),
        role: formData.role,
        status: formData.status,
      };

      if (formData.password) {
        payload.password = formData.password;
      }

      await updateUser(userId, payload);
      navigate(`/users/${userId}`);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || '직원 수정에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  if (!loaded && loading) {
    return (
      <div className="user-update-page">
        <div className="user-update-container">
          <h1>직원 수정</h1>
          <div className="form-card loading-box">로딩 중...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="user-update-page">
      <div className="user-update-container">
        <h1>직원 수정</h1>

        <div className="form-card">
          {error && <div className="error-message">{error}</div>}

          <form onSubmit={handleSubmit} className="user-update-form">
            <div className="form-group">
              <label>로그인 ID</label>
              <input value={displayInfo.loginId} disabled />
            </div>

            <div className="form-group">
              <label>직원코드</label>
              <input value={displayInfo.employeeCode} disabled />
            </div>

            <div className="form-group">
              <label>직원명 *</label>
              <input
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="직원명을 입력하세요"
                required
              />
            </div>

            <div className="form-group">
              <label>비밀번호 (변경 시 입력)</label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="8자 이상 입력 시 비밀번호가 변경됩니다"
                minLength={8}
              />
            </div>

            <div className="form-group">
              <label>매장 *</label>
              <select name="storeId" value={formData.storeId} onChange={handleChange} required>
                <option value="">매장 선택</option>
                {stores.map(store => (
                  <option key={store.id} value={store.id}>
                    {store.name} ({store.code})
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>역할 *</label>
              <select name="role" value={formData.role} onChange={handleChange} required>
                {USER_ROLE_FORM_OPTIONS.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>상태 *</label>
              <select name="status" value={formData.status} onChange={handleChange} required>
                {USER_STATUS_OPTIONS.filter(option => option.value).map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-buttons">
              <button type="submit" disabled={loading}>
                {loading ? '저장 중...' : '저장'}
              </button>
              <button type="button" onClick={() => navigate(`/users/${userId}`)} disabled={loading}>
                취소
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
