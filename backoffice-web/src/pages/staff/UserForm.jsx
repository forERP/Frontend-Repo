import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createUser } from '../../api/userApi';
import { fetchStores } from '../../api/storeApi';
import { USER_ROLE_FORM_OPTIONS } from '../../constants/user';
import './UserForm.css';

export default function UserForm() {
  const navigate = useNavigate();

  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [formData, setFormData] = useState({
    loginId: '',
    password: '',
    name: '',
    storeId: '',
    role: 'STORE_HALL_STAFF',
  });

  useEffect(() => {
    loadStores();
  }, []);

  const loadStores = async () => {
    try {
      const data = await fetchStores();
      setStores(data || []);
      if (data?.length) {
        setFormData(prev => ({ ...prev, storeId: String(data[0].id) }));
      }
    } catch (err) {
      console.error(err);
      setError('매장 목록을 불러오지 못했습니다.');
    }
  };

  const handleChange = e => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async e => {
    e.preventDefault();

    if (!formData.loginId.trim()) {
      setError('로그인 ID를 입력해주세요.');
      return;
    }

    if (!formData.password || formData.password.length < 8) {
      setError('비밀번호는 8자 이상이어야 합니다.');
      return;
    }

    if (!formData.name.trim()) {
      setError('직원명을 입력해주세요.');
      return;
    }

    if (!formData.storeId) {
      setError('매장을 선택해주세요.');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const result = await createUser({
        loginId: formData.loginId.trim(),
        password: formData.password,
        name: formData.name.trim(),
        storeId: Number(formData.storeId),
        role: formData.role,
      });

      navigate(`/users/${result.id}`);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || '직원 등록에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="user-form-page">
      <div className="user-form-container">
        <h1>직원 등록</h1>

        <div className="form-card">
          {error && <div className="error-message">{error}</div>}

          <form onSubmit={handleSubmit} className="user-form">
            <div className="form-group">
              <label>로그인 ID *</label>
              <input
                name="loginId"
                value={formData.loginId}
                onChange={handleChange}
                placeholder="로그인 ID를 입력하세요"
                required
              />
            </div>

            <div className="form-group">
              <label>비밀번호 *</label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="8자 이상 입력하세요"
                minLength={8}
                required
              />
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

            <div className="form-buttons">
              <button type="submit" disabled={loading}>
                {loading ? '등록 중...' : '등록'}
              </button>
              <button type="button" onClick={() => navigate('/users')} disabled={loading}>
                취소
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
