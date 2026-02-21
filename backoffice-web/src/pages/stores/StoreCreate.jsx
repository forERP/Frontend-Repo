import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createStore } from '../../api/storeApi';
import AddressSearchMapField from '../../components/map/AddressSearchMapField';
import './StoreCreate.css';

export default function StoreCreatePage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: '',
    address: '',
    latitude: null,
    longitude: null,
    phone: '',
    type: 'STORE',
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
      setError('매장명을 입력해 주세요.');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const result = await createStore({
        name: form.name.trim(),
        address: form.address?.trim() || null,
        phone: form.phone?.trim() || null,
        type: form.type,
        latitude: form.latitude,
        longitude: form.longitude,
      });

      navigate(`/stores/${result.id}`);
    } catch (err) {
      setError('매장 등록에 실패했습니다.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="store-create-page">
      <div className="store-form-container">
        <h1>매장 등록</h1>

        <div className="form-card">
          {error && <div className="error-message">{error}</div>}

          <form onSubmit={handleSubmit} className="store-form">
            <div className="form-group">
              <label>매장명 *</label>
              <input
                name="name"
                value={form.name}
                onChange={handleChange}
                required
                placeholder="매장 이름을 입력하세요"
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
                placeholder="매장 주소를 입력해 검색하세요"
              />
            </div>

            <div className="form-group">
              <label>전화번호</label>
              <input
                name="phone"
                value={form.phone}
                onChange={handleChange}
                type="tel"
                placeholder="연락처를 입력하세요"
              />
            </div>

            <div className="form-group">
              <label>매장 타입</label>
              <select name="type" value={form.type} onChange={handleChange}>
                <option value="STORE">지점 (STORE)</option>
                <option value="HQ">본사 (HQ)</option>
              </select>
            </div>

            <div className="form-buttons">
              <button type="submit" disabled={loading}>
                {loading ? '등록 중...' : '등록'}
              </button>
              <button type="button" onClick={() => navigate('/stores')}>
                취소
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
