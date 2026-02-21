import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { checkEmployeeCodeAvailable, createUser } from '../../api/userApi';
import { fetchStoreDetail, fetchStores } from '../../api/storeApi';
import { USER_ROLE_FORM_OPTIONS } from '../../constants/user';
import { getSessionUser, isStoreAdminUser } from '../../utils/auth';
import './UserForm.css';

export default function UserForm() {
  const navigate = useNavigate();
  const sessionUser = getSessionUser();
  const isStoreAdmin = isStoreAdminUser(sessionUser);

  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [employeeCodeCheck, setEmployeeCodeCheck] = useState({
    checking: false,
    checkedCode: '',
    available: false,
    message: '',
  });

  const [formData, setFormData] = useState({
    loginId: '',
    employeeCode: '',
    password: '',
    name: '',
    phoneNumber: '',
    storeId: isStoreAdmin && sessionUser?.storeId ? String(sessionUser.storeId) : '',
    role: 'STORE_HALL_STAFF',
  });

  useEffect(() => {
    loadStores();
  }, []);

  const loadStores = async () => {
    try {
      setError(null);

      if (isStoreAdmin && sessionUser?.storeId) {
        const store = await fetchStoreDetail(sessionUser.storeId);
        setStores(store ? [store] : []);
        setFormData(prev => ({ ...prev, storeId: String(sessionUser.storeId) }));
        return;
      }

      const data = await fetchStores();
      const normalized = data || [];
      setStores(normalized);
      if (!isStoreAdmin && normalized.length) {
        setFormData(prev => ({ ...prev, storeId: String(normalized[0].id) }));
      }
    } catch (err) {
      console.error(err);
      setError('매장 목록을 불러오지 못했습니다.');
    }
  };

  const resetEmployeeCodeCheck = () => {
    setEmployeeCodeCheck({
      checking: false,
      checkedCode: '',
      available: false,
      message: '',
    });
  };

  const handleChange = e => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    if (name === 'employeeCode') {
      resetEmployeeCodeCheck();
    }
  };

  const handleCheckEmployeeCode = async () => {
    const normalizedEmployeeCode = formData.employeeCode.trim();
    if (!normalizedEmployeeCode) {
      setError('직원 코드를 입력해주세요.');
      return;
    }

    try {
      setError(null);
      setEmployeeCodeCheck(prev => ({ ...prev, checking: true }));

      const available = await checkEmployeeCodeAvailable(normalizedEmployeeCode);
      setEmployeeCodeCheck({
        checking: false,
        checkedCode: normalizedEmployeeCode,
        available,
        message: available
          ? '사용 가능한 직원 코드입니다.'
          : '이미 사용 중인 직원 코드입니다.',
      });
    } catch (err) {
      console.error(err);
      setEmployeeCodeCheck({
        checking: false,
        checkedCode: '',
        available: false,
        message: '직원 코드 중복 확인에 실패했습니다.',
      });
    }
  };

  const handleSubmit = async e => {
    e.preventDefault();

    const normalizedLoginId = formData.loginId.trim();
    const normalizedEmployeeCode = formData.employeeCode.trim();

    if (!normalizedLoginId) {
      setError('로그인 ID를 입력해주세요.');
      return;
    }

    if (!normalizedEmployeeCode) {
      setError('직원 코드를 입력해주세요.');
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

    if (!formData.phoneNumber.trim()) {
      setError('전화번호를 입력해주세요.');
      return;
    }

    if (!formData.storeId) {
      setError('매장을 선택해주세요.');
      return;
    }

    const isEmployeeCodeVerified =
      employeeCodeCheck.checkedCode === normalizedEmployeeCode && employeeCodeCheck.available;

    if (!isEmployeeCodeVerified) {
      setError('직원 코드 중복 확인을 완료해주세요.');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const result = await createUser({
        loginId: normalizedLoginId,
        employeeCode: normalizedEmployeeCode,
        password: formData.password,
        name: formData.name.trim(),
        phoneNumber: formData.phoneNumber.trim(),
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
              <label>직원 코드 *</label>
              <div className="input-with-action">
                <input
                  name="employeeCode"
                  value={formData.employeeCode}
                  onChange={handleChange}
                  placeholder="직원 코드"
                  required
                />
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={handleCheckEmployeeCode}
                  disabled={employeeCodeCheck.checking || !formData.employeeCode.trim()}
                >
                  {employeeCodeCheck.checking ? '확인 중...' : '중복 확인'}
                </button>
              </div>
              {employeeCodeCheck.message && (
                <p className={employeeCodeCheck.available ? 'helper-text success' : 'helper-text error'}>
                  {employeeCodeCheck.message}
                </p>
              )}
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
              <label>전화번호 *</label>
              <input
                name="phoneNumber"
                value={formData.phoneNumber}
                onChange={handleChange}
                placeholder="010-1111-2222"
                required
              />
            </div>

            <div className="form-group">
              <label>매장 *</label>
              <select
                name="storeId"
                value={formData.storeId}
                onChange={handleChange}
                required
                disabled={isStoreAdmin}
              >
                <option value="">매장 선택</option>
                {stores.map(store => (
                  <option key={store.id} value={store.id}>
                    {store.name} ({store.code || store.storeCode || '-'})
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
