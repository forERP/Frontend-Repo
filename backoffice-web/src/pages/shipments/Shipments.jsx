import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ListPagination from '../../components/list/ListPagination';
import ListSearchControls from '../../components/list/ListSearchControls';
import { SHIPMENT_STATUS } from '../../constants/status';
import { getAllStores, getWarehouses } from '../../lib/dataApi';
import { subscribeAdminRealtime } from '../../lib/realtime';
import { fetchShipmentPage } from '../../api/shipmentApi';
import { getSessionUser, isStoreAdminUser } from '../../utils/auth';
import '../purchase/request/purchase.css';
import './Shipments.css';

const createInitialFilters = storeId => ({
  flowType: '',
  storeId: storeId ? String(storeId) : '',
  warehouseId: '',
  shipmentStatus: '',
  from: '',
  to: '',
});

export default function Shipments() {
  const navigate = useNavigate();
  const sessionUser = getSessionUser();
  const isStoreAdmin = isStoreAdminUser(sessionUser);
  const scopedStoreId = isStoreAdmin && sessionUser?.storeId ? sessionUser.storeId : null;
  const initialFilters = useMemo(() => createInitialFilters(scopedStoreId), [scopedStoreId]);

  const [shipments, setShipments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [stores, setStores] = useState([]);
  const [warehouses, setWarehouses] = useState([]);

  const [filters, setFilters] = useState(initialFilters);
  const [query, setQuery] = useState(initialFilters);

  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(20);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  useEffect(() => {
    loadStores();
  }, [isStoreAdmin, scopedStoreId]);

  useEffect(() => {
    loadWarehouses(query.storeId || scopedStoreId || null);
  }, [query.storeId, scopedStoreId]);

  useEffect(() => {
    loadShipments(currentPage, query, pageSize);
  }, [currentPage, query, pageSize]);

  useEffect(() => {
    setFilters(initialFilters);
    setQuery(initialFilters);
    setCurrentPage(0);
  }, [initialFilters]);

  useEffect(() => {
    const unsubscribe = subscribeAdminRealtime({
      storeId: scopedStoreId,
      onEvent: event => {
        if (event.type === 'shipment.changed') {
          loadShipments(currentPage, query, pageSize);
        }
      },
    });

    return () => unsubscribe();
  }, [currentPage, query, pageSize, scopedStoreId]);

  const loadStores = async () => {
    try {
      const data = await getAllStores();
      const list = Array.isArray(data) ? data : [];

      if (isStoreAdmin && scopedStoreId) {
        const scoped = list.filter(store => Number(store.id) === Number(scopedStoreId));
        if (scoped.length > 0) {
          setStores(scoped);
          return;
        }

        setStores([
          {
            id: scopedStoreId,
            name: sessionUser?.storeName || `매장 ${scopedStoreId}`,
            code: sessionUser?.storeCode || '',
          },
        ]);
        return;
      }

      setStores(list);
    } catch (err) {
      console.warn('매장 목록 조회 실패:', err);
      if (isStoreAdmin && scopedStoreId) {
        setStores([
          {
            id: scopedStoreId,
            name: sessionUser?.storeName || `매장 ${scopedStoreId}`,
            code: sessionUser?.storeCode || '',
          },
        ]);
      } else {
        setStores([]);
      }
    }
  };

  const loadWarehouses = async storeId => {
    try {
      const data = await getWarehouses(storeId || null);
      setWarehouses(Array.isArray(data) ? data : []);
    } catch (err) {
      console.warn('창고 목록 조회 실패:', err);
      setWarehouses([]);
    }
  };

  const loadShipments = async (page, search, size) => {
    try {
      setLoading(true);
      setError(null);

      const data = await fetchShipmentPage({
        page,
        size,
        flowType: search.flowType || '',
        storeId: search.storeId ? Number(search.storeId) : null,
        warehouseId: search.warehouseId ? Number(search.warehouseId) : null,
        shipmentStatus: search.shipmentStatus || '',
        from: search.from || '',
        to: search.to || '',
      });

      setShipments(data.content || []);
      setTotalPages(data.totalPages || 0);
      setTotalElements(data.totalElements || 0);
    } catch (err) {
      console.error(err);
      setError('배송 목록을 조회하지 못했습니다.');
      setShipments([]);
      setTotalPages(0);
      setTotalElements(0);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = event => {
    const { name, value } = event.target;
    if (isStoreAdmin && name === 'storeId') {
      return;
    }

    setFilters(prev => {
      if (name === 'storeId') {
        return { ...prev, storeId: value, warehouseId: '' };
      }
      return { ...prev, [name]: value };
    });

    if (name === 'storeId') {
      loadWarehouses(value ? Number(value) : null);
    }
  };

  const handleSearch = event => {
    event.preventDefault();
    setCurrentPage(0);
    setQuery(isStoreAdmin ? { ...filters, storeId: String(scopedStoreId || '') } : { ...filters });
  };

  const handleReset = () => {
    setFilters(initialFilters);
    setQuery(initialFilters);
    setCurrentPage(0);
    loadWarehouses(isStoreAdmin ? scopedStoreId : null);
  };

  const handlePageSizeChange = size => {
    setCurrentPage(0);
    setPageSize(size);
  };

  const storeOptions = useMemo(
    () => [
      { value: '', label: '전체' },
      ...stores.map(store => ({
        value: String(store.id),
        label: store.code ? `${store.name} (${store.code})` : store.name,
      })),
    ],
    [stores],
  );

  const warehouseOptions = useMemo(
    () => [
      { value: '', label: '전체' },
      ...warehouses.map(warehouse => ({
        value: String(warehouse.id ?? warehouse.warehouseId),
        label: warehouse.code ? `${warehouse.name} (${warehouse.code})` : warehouse.name,
      })),
    ],
    [warehouses],
  );

  return (
    <div className="purchase-page">
      <div className="page-header">
        <h2>배송 조회</h2>
      </div>

      <div className="card list-filter-card">
        <ListSearchControls
          formClassName="outbound-list-search-form"
          fields={[
            {
              name: 'flowType',
              label: '구분',
              type: 'select',
              value: filters.flowType,
              onChange: handleFilterChange,
              options: [
                { value: '', label: '전체' },
                { value: 'INBOUND', label: '입고' },
                { value: 'OUTBOUND', label: '출고' },
              ],
            },
            {
              name: 'storeId',
              label: '매장',
              type: 'select',
              value: filters.storeId,
              onChange: handleFilterChange,
              options: storeOptions,
              disabled: isStoreAdmin,
            },
            {
              name: 'warehouseId',
              label: '창고',
              type: 'select',
              value: filters.warehouseId,
              onChange: handleFilterChange,
              options: warehouseOptions,
            },
            {
              name: 'shipmentStatus',
              label: '배송 상태',
              type: 'select',
              value: filters.shipmentStatus,
              onChange: handleFilterChange,
              options: [
                { value: '', label: '전체' },
                ...Object.entries(SHIPMENT_STATUS).map(([key, value]) => ({ value: key, label: value.label })),
              ],
            },
            {
              name: 'createdRange',
              label: '생성일',
              type: 'date-range',
              fromName: 'from',
              toName: 'to',
              fromValue: filters.from,
              toValue: filters.to,
              onChange: handleFilterChange,
              className: 'date-range-field',
            },
          ]}
          onSearch={handleSearch}
          onReset={handleReset}
        />
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="card list-card">
        <div className="table-toolbar">
          <span className="total-count">총 {totalElements.toLocaleString('ko-KR')}건</span>
        </div>

        <table className="erp-table list-table shipment-list-table">
          <thead>
            <tr>
              <th>구분</th>
              <th>매장</th>
              <th>창고</th>
              <th>상태</th>
              <th>택배사</th>
              <th>송장번호</th>
              <th>생성일시</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="empty-cell">
                  로딩 중...
                </td>
              </tr>
            ) : shipments.length === 0 ? (
              <tr>
                <td colSpan={7} className="empty-cell">
                  조회 결과가 없습니다.
                </td>
              </tr>
            ) : (
              shipments.map(shipment => (
                <tr
                  key={shipment.shipmentId}
                  className="clickable-row"
                  onClick={() => navigate(`/shipments/${shipment.shipmentId}/tracking`)}
                >
                  <td>{shipment.flowType === 'INBOUND' ? '입고' : '출고'}</td>
                  <td>
                    {shipment.storeName || '-'}
                    {shipment.storeCode ? ` (${shipment.storeCode})` : ''}
                  </td>
                  <td>
                    {shipment.warehouseName || '-'}
                    {shipment.warehouseCode ? ` (${shipment.warehouseCode})` : ''}
                  </td>
                  <td>
                    <span
                      className="status-badge"
                      style={{
                        backgroundColor: SHIPMENT_STATUS[shipment.status]?.color || '#6C757D',
                        color: '#fff',
                      }}
                    >
                      {SHIPMENT_STATUS[shipment.status]?.label || shipment.status}
                    </span>
                  </td>
                  <td>{shipment.carrier || '-'}</td>
                  <td>{shipment.trackingNumber || '-'}</td>
                  <td>{shipment.createdAt ? new Date(shipment.createdAt).toLocaleString('ko-KR') : '-'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        <ListPagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          pageSize={pageSize}
          onPageSizeChange={handlePageSizeChange}
        />
      </div>
    </div>
  );
}