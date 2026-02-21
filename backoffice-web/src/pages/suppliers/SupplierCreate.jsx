import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createSupplier } from '../../api/supplierApi';
import AddressSearchMapField from '../../components/map/AddressSearchMapField';
import './SupplierCreate.css';

export default function SupplierCreatePage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: '',
    contactName: '',
    contactPhone: '',
    contactEmail: '',
    address: '',
    latitude: null,
    longitude: null,
    active: true,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!form.name.trim()) {
      setError('거래처명을 입력해 주세요.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const result = await createSupplier({
        ...form,
        name: form.name.trim(),
        address: form.address?.trim() || null,
      });
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
              <input name="name" value={form.name} onChange={handleChange} required placeholder="거래처명을 입력하세요" />
            </div>

            <div className="form-group">
              <label>담당자명</label>
              <input name="contactName" value={form.contactName} onChange={handleChange} placeholder="담당자명을 입력하세요" />
            </div>

            <div className="form-group">
              <label>연락처</label>
              <input name="contactPhone" value={form.contactPhone} onChange={handleChange} placeholder="연락처를 입력하세요" />
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
              <AddressSearchMapField
                address={form.address}
                latitude={form.latitude}
                longitude={form.longitude}
                onAddressChange={(nextAddress) => setForm((prev) => ({ ...prev, address: nextAddress }))}
                onLocationChange={({ address, latitude, longitude }) =>
                  setForm((prev) => ({
                    ...prev,
                    address: address ?? prev.address,
                    latitude,
                    longitude,
                  }))
                }
                placeholder="거래처 주소를 입력해 검색하세요"
              />
            </div>

            <div className="form-group">
              <label>상태</label>
              <select
                name="active"
                value={String(form.active)}
                onChange={(event) => setForm((prev) => ({ ...prev, active: event.target.value === 'true' }))}
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
