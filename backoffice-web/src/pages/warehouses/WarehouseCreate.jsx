import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchStores } from '../../api/storeApi';
import { createWarehouse } from '../../api/warehouseApi';
import AddressSearchMapField from '../../components/map/AddressSearchMapField';
import './WarehouseCreate.css';

export default function WarehouseCreatePage() {
  const navigate = useNavigate();
  const [stores, setStores] = useState([]);
  const [form, setForm] = useState({
    storeId: '',
    code: '',
    name: '',
    address: '',
    latitude: null,
    longitude: null,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadStores = async () => {
      try {
        const data = await fetchStores();
        setStores(data);
      } catch (err) {
        console.error(err);
        setError('매장 목록을 불러오지 못했습니다.');
      }
    };

    loadStores();
  }, []);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!form.storeId) {
      setError('매장을 선택해 주세요.');
      return;
    }
    if (!form.code.trim()) {
      setError('창고 코드를 입력해 주세요.');
      return;
    }
    if (!form.name.trim()) {
      setError('창고명을 입력해 주세요.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await createWarehouse({
        storeId: Number(form.storeId),
        code: form.code,
        name: form.name,
        address: form.address?.trim() || null,
        latitude: form.latitude,
        longitude: form.longitude,
      });
      navigate('/warehouses');
    } catch (err) {
      setError('창고 생성에 실패했습니다.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="warehouse-create-page">
      <div className="warehouse-form-container">
        <h1>창고 등록</h1>
        <div className="form-card">
          {error && <div className="error-message">{error}</div>}
          <form onSubmit={handleSubmit} className="warehouse-form">
            <div className="form-group">
              <label>매장 *</label>
              <select name="storeId" value={form.storeId} onChange={handleChange} required>
                <option value="">-- 매장 선택 --</option>
                {stores.map((store) => (
                  <option key={store.id} value={store.id}>
                    {store.name}
                    {store.storeCode ? ` (${store.storeCode})` : ''}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>창고 코드 *</label>
              <input name="code" value={form.code} onChange={handleChange} required placeholder="예: SUB_001" />
            </div>

            <div className="form-group">
              <label>창고명 *</label>
              <input name="name" value={form.name} onChange={handleChange} required placeholder="창고명을 입력하세요" />
            </div>

            <div className="form-group">
              <label>창고 주소</label>
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
                placeholder="창고 주소를 입력해 검색하세요"
              />
            </div>

            <div className="form-buttons">
              <button type="submit" disabled={loading}>
                {loading ? '등록 중...' : '등록'}
              </button>
              <button type="button" onClick={() => navigate('/warehouses')}>
                취소
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
