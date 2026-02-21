import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { fetchStoreDetail, fetchStores, updateStore, updateStoreStatus } from '../../api/storeApi';
import { fetchWarehouses } from '../../api/warehouseApi';
import AddressSearchMapField from '../../components/map/AddressSearchMapField';
import SingleLocationMap from '../../components/map/SingleLocationMap';
import StoreGroupMap from '../../components/map/StoreGroupMap';
import './StoreDetail.css';

const STATUS_LABEL = {
  OPEN: '운영중',
  INACTIVE: '휴무',
  CLOSED: '폐점',
};

const STATUS_OPTIONS = ['OPEN', 'INACTIVE', 'CLOSED'];

const TYPE_LABEL = {
  STORE: '지점',
  HQ: '본사',
};

export default function StoreDetailPage() {
  const { id: storeId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [store, setStore] = useState(null);
  const [allStores, setAllStores] = useState([]);
  const [allWarehouses, setAllWarehouses] = useState([]);
  const [showWarehouses, setShowWarehouses] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [mapLoadError, setMapLoadError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    address: '',
    latitude: null,
    longitude: null,
    phone: '',
    status: 'OPEN',
  });

  useEffect(() => {
    loadStoreDetail();
  }, [storeId]);

  useEffect(() => {
    loadMapData();
  }, [storeId]);

  useEffect(() => {
    if (searchParams.get('edit') === '1') {
      setIsEditing(true);
    }
  }, [searchParams]);

  const loadStoreDetail = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchStoreDetail(storeId);
      setStore(data);
      setEditForm({
        name: data.name,
        address: data.address || '',
        latitude: data.latitude ?? null,
        longitude: data.longitude ?? null,
        phone: data.phone || '',
        status: data.status || 'OPEN',
      });
    } catch (err) {
      setError('매장 상세 조회에 실패했습니다.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadMapData = async () => {
    try {
      setMapLoadError(null);
      const [stores, warehouses] = await Promise.all([fetchStores(), fetchWarehouses()]);
      setAllStores(stores || []);
      setAllWarehouses(warehouses || []);
    } catch (err) {
      setMapLoadError('지도 데이터 조회에 실패했습니다.');
      console.error(err);
    }
  };

  const handleEditChange = (event) => {
    const { name, value } = event.target;
    setEditForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSaveEdit = async () => {
    try {
      setLoading(true);
      setError(null);

      let updatedStore = await updateStore(storeId, {
        name: editForm.name,
        address: editForm.address,
        phone: editForm.phone,
        latitude: editForm.latitude,
        longitude: editForm.longitude,
      });

      if (editForm.status && editForm.status !== updatedStore.status) {
        updatedStore = await updateStoreStatus(storeId, editForm.status);
      }

      setStore(updatedStore);
      setIsEditing(false);
      loadMapData();
    } catch (err) {
      setError('매장 정보 수정에 실패했습니다.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    if (store) {
      setEditForm({
        name: store.name,
        address: store.address || '',
        latitude: store.latitude ?? null,
        longitude: store.longitude ?? null,
        phone: store.phone || '',
        status: store.status || 'OPEN',
      });
    }
  };

  const handleWarehouseManage = async () => {
    try {
      const list = await fetchWarehouses(storeId);
      if (list && list.length > 0) {
        navigate(`/warehouses/${list[0].warehouseId}`);
        return;
      }
      navigate(`/warehouses/create?storeId=${storeId}`);
    } catch (err) {
      console.error('창고 조회 실패', err);
      setError('창고 조회 중 오류가 발생했습니다.');
    }
  };

  const storesForMap = useMemo(() => {
    if (!store) {
      return allStores;
    }

    const hasCurrentStore = (allStores || []).some((item) => Number(item.id) === Number(store.id));
    return hasCurrentStore ? allStores : [...(allStores || []), store];
  }, [allStores, store]);

  const warehousesForCurrentStore = useMemo(() => {
    if (!store) {
      return [];
    }
    return (allWarehouses || []).filter((warehouse) => Number(warehouse.storeId) === Number(store.id));
  }, [allWarehouses, store]);

  if (loading && !store) {
    return (
      <div className="store-detail-page">
        <div className="store-detail-container">
          <h1>매장 상세</h1>
          <div
            className="detail-card"
            style={{ minHeight: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            로딩 중...
          </div>
        </div>
      </div>
    );
  }

  if (error && !store) {
    return (
      <div className="store-detail-page">
        <div className="store-detail-container">
          <h1>매장 상세</h1>
          <div className="error-message">{error}</div>
        </div>
      </div>
    );
  }

  if (!store) {
    return null;
  }

  return (
    <div className="store-detail-page">
      <div className="store-detail-container">
        <h1>매장 상세</h1>
        {error && <div className="error-message">{error}</div>}
        {mapLoadError && <div className="error-message">{mapLoadError}</div>}

        <div className="detail-card">
          {isEditing ? (
            <form
              onSubmit={(event) => {
                event.preventDefault();
                handleSaveEdit();
              }}
            >
              <table className="erp-table">
                <tbody>
                  <tr>
                    <th>매장 코드</th>
                    <td>{store.code || '-'}</td>
                  </tr>
                  <tr>
                    <th>매장 타입</th>
                    <td>{TYPE_LABEL[store.type] || store.type}</td>
                  </tr>
                  <tr>
                    <th>매장명</th>
                    <td>
                      <input name="name" value={editForm.name} onChange={handleEditChange} required placeholder="매장 이름" />
                    </td>
                  </tr>
                  <tr>
                    <th>주소</th>
                    <td>
                      <AddressSearchMapField
                        address={editForm.address}
                        latitude={editForm.latitude}
                        longitude={editForm.longitude}
                        onAddressChange={(nextAddress) =>
                          setEditForm((prev) => ({
                            ...prev,
                            address: nextAddress,
                          }))
                        }
                        onLocationChange={({ address, latitude, longitude }) =>
                          setEditForm((prev) => ({
                            ...prev,
                            address: address ?? prev.address,
                            latitude,
                            longitude,
                          }))
                        }
                        placeholder="매장 주소를 입력해 검색하세요"
                      />
                    </td>
                  </tr>
                  <tr>
                    <th>전화번호</th>
                    <td>
                      <input
                        name="phone"
                        value={editForm.phone}
                        onChange={handleEditChange}
                        type="tel"
                        placeholder="연락처"
                      />
                    </td>
                  </tr>
                  <tr>
                    <th>생성일</th>
                    <td>{store.createdAt ? new Date(store.createdAt).toLocaleString('ko-KR') : '-'}</td>
                  </tr>
                  <tr>
                    <th>운영 상태</th>
                    <td>
                      <select name="status" value={editForm.status} onChange={handleEditChange}>
                        {STATUS_OPTIONS.map((status) => (
                          <option key={status} value={status}>
                            {STATUS_LABEL[status]}
                          </option>
                        ))}
                      </select>
                    </td>
                  </tr>
                </tbody>
              </table>

              <div className="form-buttons detail-form-buttons">
                <button type="submit" disabled={loading}>
                  {loading ? '저장 중...' : '저장'}
                </button>
                <button type="button" onClick={handleCancel} disabled={loading}>
                  취소
                </button>
                <button type="button" onClick={() => console.log('매출관리')}>
                  매출관리
                </button>
                <button type="button" onClick={() => console.log('직원관리')}>
                  직원관리
                </button>
                <button type="button" onClick={handleWarehouseManage}>
                  창고관리
                </button>
              </div>
            </form>
          ) : (
            <>
              <table className="erp-table">
                <tbody>
                  <tr>
                    <th>매장 코드</th>
                    <td>{store.code || '-'}</td>
                  </tr>
                  <tr>
                    <th>매장 타입</th>
                    <td>{TYPE_LABEL[store.type] || store.type}</td>
                  </tr>
                  <tr>
                    <th>매장명</th>
                    <td>{store.name}</td>
                  </tr>
                  <tr>
                    <th>주소</th>
                    <td>{store.address || '-'}</td>
                  </tr>
                  <tr>
                    <th>전화번호</th>
                    <td>{store.phone || '-'}</td>
                  </tr>
                  <tr>
                    <th>생성일</th>
                    <td>{store.createdAt ? new Date(store.createdAt).toLocaleString('ko-KR') : '-'}</td>
                  </tr>
                  <tr>
                    <th>운영 상태</th>
                    <td>{STATUS_LABEL[store.status] || store.status}</td>
                  </tr>
                </tbody>
              </table>

              <SingleLocationMap
                latitude={store.latitude}
                longitude={store.longitude}
                title="현재 매장 위치"
                emptyMessage="해당 매장의 위치 정보가 아직 저장되지 않았습니다."
              />

              <StoreGroupMap
                currentStoreId={store.id}
                stores={storesForMap}
                warehouses={warehousesForCurrentStore}
                showWarehouses={showWarehouses}
                onToggleWarehouses={setShowWarehouses}
                title="매장/본사/창고 위치 현황"
              />

              <div className="form-buttons detail-form-buttons">
                <button type="button" className="primary-action" onClick={() => setIsEditing(true)}>
                  수정
                </button>
                <button type="button" onClick={() => navigate('/stores')}>
                  목록
                </button>
                <button type="button" onClick={() => console.log('매출관리')}>
                  매출관리
                </button>
                <button type="button" onClick={() => console.log('직원관리')}>
                  직원관리
                </button>
                <button type="button" onClick={handleWarehouseManage}>
                  창고관리
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
