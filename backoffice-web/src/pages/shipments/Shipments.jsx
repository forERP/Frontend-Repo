import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ListPagination from '../../components/list/ListPagination';
import ListSearchControls from '../../components/list/ListSearchControls';
import { SHIPMENT_STATUS } from '../../constants/status';
import { getAllStores, getWarehouses } from '../../lib/dataApi';
import { subscribeAdminRealtime } from '../../lib/realtime';
import { fetchShipmentPage } from '../../api/shipmentApi';
import '../purchase/request/purchase.css';

const INITIAL_FILTERS = {
  flowType: '',
  storeId: '',
  warehouseId: '',
  shipmentStatus: '',
  from: '',
  to: '',
};

export default function Shipments() {
  const navigate = useNavigate();

  const [shipments, setShipments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [stores, setStores] = useState([]);
  const [warehouses, setWarehouses] = useState([]);

  const [filters, setFilters] = useState(INITIAL_FILTERS);
  const [query, setQuery] = useState(INITIAL_FILTERS);

  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(20);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  useEffect(() => {
    loadStores();
  }, []);

  useEffect(() => {
    loadWarehouses(query.storeId || null);
  }, [query.storeId]);

  useEffect(() => {
    loadShipments(currentPage, query, pageSize);
  }, [currentPage, query, pageSize]);

  useEffect(() => {
    const unsubscribe = subscribeAdminRealtime({
      onEvent: event => {
        if (event.type === 'shipment.changed') {
          loadShipments(currentPage, query, pageSize);
        }
      },
    });

    return () => unsubscribe();
  }, [currentPage, query, pageSize]);

  const loadStores = async () => {
    try {
      const data = await getAllStores();
      setStores(Array.isArray(data) ? data : []);
    } catch (err) {
      console.warn('Failed to load stores:', err);
      setStores([]);
    }
  };

  const loadWarehouses = async storeId => {
    try {
      const data = await getWarehouses(storeId || null);
      setWarehouses(Array.isArray(data) ? data : []);
    } catch (err) {
      console.warn('Failed to load warehouses:', err);
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
      setError('Failed to fetch shipments.');
      setShipments([]);
      setTotalPages(0);
      setTotalElements(0);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = e => {
    const { name, value } = e.target;
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

  const handleSearch = e => {
    e.preventDefault();
    setCurrentPage(0);
    setQuery({ ...filters });
  };

  const handleReset = () => {
    setFilters(INITIAL_FILTERS);
    setQuery(INITIAL_FILTERS);
    setCurrentPage(0);
    loadWarehouses(null);
  };

  const handlePageSizeChange = size => {
    setCurrentPage(0);
    setPageSize(size);
  };

  const storeOptions = useMemo(
    () => [
      { value: '', label: 'All' },
      ...stores.map(store => ({
        value: String(store.id),
        label: store.code ? `${store.name} (${store.code})` : store.name,
      })),
    ],
    [stores],
  );

  const warehouseOptions = useMemo(
    () => [
      { value: '', label: 'All' },
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
        <h2>Shipment List</h2>
      </div>

      <div className="card list-filter-card">
        <ListSearchControls
          formClassName="outbound-list-search-form"
          fields={[
            {
              name: 'flowType',
              label: 'Type',
              type: 'select',
              value: filters.flowType,
              onChange: handleFilterChange,
              options: [
                { value: '', label: 'All' },
                { value: 'INBOUND', label: 'Inbound' },
                { value: 'OUTBOUND', label: 'Outbound' },
              ],
            },
            {
              name: 'storeId',
              label: 'Store',
              type: 'select',
              value: filters.storeId,
              onChange: handleFilterChange,
              options: storeOptions,
            },
            {
              name: 'warehouseId',
              label: 'Warehouse',
              type: 'select',
              value: filters.warehouseId,
              onChange: handleFilterChange,
              options: warehouseOptions,
            },
            {
              name: 'shipmentStatus',
              label: 'Shipment Status',
              type: 'select',
              value: filters.shipmentStatus,
              onChange: handleFilterChange,
              options: [
                { value: '', label: 'All' },
                ...Object.entries(SHIPMENT_STATUS).map(([key, value]) => ({ value: key, label: value.label })),
              ],
            },
            {
              name: 'createdRange',
              label: 'Created Date',
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
          <span className="total-count">Total {totalElements.toLocaleString('ko-KR')} rows</span>
        </div>

        <table className="erp-table list-table outbound-list-table">
          <thead>
            <tr>
              <th>Shipment ID</th>
              <th>Type</th>
              <th>Ref ID</th>
              <th>Store</th>
              <th>Warehouse</th>
              <th>Status</th>
              <th>Carrier</th>
              <th>Tracking No.</th>
              <th>Created At</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={9} className="empty-cell">Loading...</td>
              </tr>
            ) : shipments.length === 0 ? (
              <tr>
                <td colSpan={9} className="empty-cell">No results.</td>
              </tr>
            ) : (
              shipments.map(shipment => (
                <tr
                  key={shipment.shipmentId}
                  className="clickable-row"
                  onClick={() => navigate(`/shipments/${shipment.shipmentId}/tracking`)}
                >
                  <td>{shipment.shipmentId}</td>
                  <td>{shipment.flowType === 'INBOUND' ? 'Inbound' : 'Outbound'}</td>
                  <td>{shipment.referenceId || '-'}</td>
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
