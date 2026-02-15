import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createSupplier } from '../../api/supplierApi';
import './SupplierCreate.css';

export default function SupplierCreatePage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: '',
    contactName: '',
    contactPhone: '',
    contactEmail: '',
    address: '',
    active: true,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = e => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async e => {
    e.preventDefault();
    if (!form.name.trim()) {
      setError('거래처명을 입력해주세요.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const result = await createSupplier(form);
      navigate(`/suppliers/${result.supplierId}`);
    } catch (err) {
      setError('거래처 등록에 실패했습니다.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="supplier-create-page">
      <div className="supplier-form-container">
        <h1>거래처 등록</h1>

        <div className="form-card">
          {error && <div className="error-message">{error}</div>}

          <form onSubmit={handleSubmit} className="supplier-form">
            <div className="form-group">
              <label>거래처명 *</label>
              <input
                name="name"
                value={form.name}
                onChange={handleChange}
                required
                placeholder="거래처명을 입력하세요"
              />
            </div>

            <div className="form-group">
              <label>담당자명</label>
              <input
                name="contactName"
                value={form.contactName}
                onChange={handleChange}
                placeholder="담당자명을 입력하세요"
              />
            </div>

            <div className="form-group">
              <label>연락처</label>
              <input
                name="contactPhone"
                value={form.contactPhone}
                onChange={handleChange}
                placeholder="연락처를 입력하세요"
              />
            </div>

            <div className="form-group">
              <label>이메일</label>
              <input
                name="contactEmail"
                type="email"
                value={form.contactEmail}
                onChange={handleChange}
                placeholder="이메일을 입력하세요"
              />
            </div>

            <div className="form-group">
              <label>주소</label>
              <input
                name="address"
                value={form.address}
                onChange={handleChange}
                placeholder="주소를 입력하세요"
              />
            </div>

            <div className="form-group">
              <label>상태</label>
              <select
                name="active"
                value={String(form.active)}
                onChange={e => setForm(prev => ({ ...prev, active: e.target.value === 'true' }))}
              >
                <option value="true">활성</option>
                <option value="false">비활성</option>
              </select>
            </div>

            <div className="form-buttons">
              <button type="submit" disabled={loading}>
                {loading ? '등록 중...' : '등록'}
              </button>
              <button type="button" onClick={() => navigate('/suppliers')}>
                취소
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
