import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import ListPagination from '../../components/list/ListPagination';
import ListSearchControls from '../../components/list/ListSearchControls';
import { fetchInventoryPage, updateInventorySaleStatus } from '../../api/inventoryApi';
import { subscribeAdminRealtime } from '../../lib/realtime';
import './InventoryList.css';

const INITIAL_FILTERS = {
  storeKeyword: '',
  warehouseKeyword: '',
  productKeyword: '',
  saleStatus: '',
};

const SALE_STATUS_META = {
  ON: { label: '판매중', color: '#16A34A' },
  OFF: { label: '판매중지', color: '#6B7280' },
};

const normalizeNumericId = value => {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
};

const resolveDisplayPrice = (salePrice, productPrice) => {
  const parsedSalePrice = Number(salePrice);
  const parsedProductPrice = Number(productPrice);

  if (Number.isFinite(parsedSalePrice) && parsedSalePrice > 0) {
    return parsedSalePrice;
  }

  if (Number.isFinite(parsedProductPrice) && parsedProductPrice > 0) {
    return parsedProductPrice;
  }

  if (Number.isFinite(parsedSalePrice) && parsedSalePrice >= 0) {
    return parsedSalePrice;
  }

  return null;
};

const formatPrice = (salePrice, productPrice) => {
  const displayPrice = resolveDisplayPrice(salePrice, productPrice);
  if (displayPrice == null) {
    return '-';
  }

  return `${displayPrice.toLocaleString('ko-KR')}원`;
};

const formatStoreProductDisplay = item => {
  const storeName = item?.storeName || '-';
  const storeCode = item?.storeCode || item?.storeId || '-';
  const productName = item?.productName || '-';
  const productCode = item?.sku || item?.productId || '-';

  return {
    storeLabel: `${storeName}(${storeCode})`,
    productLabel: `${productName}(${productCode})`,
  };
};

export default function InventoryList() {
  const navigate = useNavigate();
  const { storeId } = useParams();
  const routeStoreId = useMemo(() => normalizeNumericId(storeId), [storeId]);

  const [inventories, setInventories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [updatingStoreProductId, setUpdatingStoreProductId] = useState(null);
  const [error, setError] = useState(null);

  const [filters, setFilters] = useState(INITIAL_FILTERS);
  const [query, setQuery] = useState(INITIAL_FILTERS);

  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  useEffect(() => {
    setFilters(INITIAL_FILTERS);
    setQuery(INITIAL_FILTERS);
    setCurrentPage(0);
  }, [routeStoreId]);

  const loadInventory = useCallback(async (page, search, size) => {
    try {
      setLoading(true);
      setError(null);

      const data = await fetchInventoryPage({
        page,
        size,
        storeId: routeStoreId ?? '',
        storeKeyword: search.storeKeyword,
        warehouseKeyword: search.warehouseKeyword,
        productKeyword: search.productKeyword,
        saleStatus: search.saleStatus,
      });

      setInventories(data.content || []);
      setTotalPages(data.totalPages || 0);
      setTotalElements(data.totalElements || 0);
    } catch (err) {
      console.error(err);
      setError('재고 목록 조회에 실패했습니다.');
      setInventories([]);
      setTotalPages(0);
      setTotalElements(0);
    } finally {
      setLoading(false);
    }
  }, [routeStoreId]);

  useEffect(() => {
    loadInventory(currentPage, query, pageSize);
  }, [currentPage, query, pageSize, loadInventory]);

  useEffect(() => {
    const unsubscribe = subscribeAdminRealtime({
      storeId: routeStoreId,
      onEvent: ({ type }) => {
        if (type === 'inventory.changed' || type === 'connected') {
          loadInventory(currentPage, query, pageSize);
        }
      },
    });

    return unsubscribe;
  }, [routeStoreId, currentPage, pageSize, query, loadInventory]);

  const handleFilterChange = event => {
    const { name, value } = event.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const handleSearch = event => {
    event.preventDefault();
    setCurrentPage(0);
    setQuery({ ...filters });
  };

  const handleReset = () => {
    setFilters(INITIAL_FILTERS);
    setQuery(INITIAL_FILTERS);
    setCurrentPage(0);
  };

  const handlePageSizeChange = size => {
    setCurrentPage(0);
    setPageSize(size);
  };

  const handleRowClick = storeProductId => {
    if (!storeProductId) {
      return;
    }
    navigate(`/inventory/store-products/${storeProductId}`);
  };

  const handleToggleSaleStatus = async (event, item) => {
    event.stopPropagation();

    if (!item.storeProductId) {
      return;
    }

    const nextStatus = item.saleStatus === 'ON' ? 'OFF' : 'ON';

    const { storeLabel, productLabel } = formatStoreProductDisplay(item);
    const discontinueMessage = `'${storeLabel}'의 '${productLabel}'을(를) 판매 중지 처리하시겠습니까?`;

    if (nextStatus === 'OFF' && !window.confirm(discontinueMessage)) {
      return;
    }

    try {
      setUpdatingStoreProductId(item.storeProductId);
      const updated = await updateInventorySaleStatus(item.storeProductId, nextStatus);

      setInventories(prev =>
        prev.map(current =>
          current.storeProductId === item.storeProductId
            ? {
                ...current,
                saleStatus: updated.saleStatus,
              }
            : current,
        ),
      );
    } catch (err) {
      console.error(err);
      setError('매장상품 상태 변경에 실패했습니다.');
    } finally {
      setUpdatingStoreProductId(null);
    }
  };

  return (
    <div className="inventory-page">
      <div className="inventory-container">
        <div className="page-header">
          <h1 className="page-title">재고 조회</h1>
        </div>

        <div className="card filter-card">
          <ListSearchControls
            formClassName="inventory-filter-form"
            actionsClassName="inventory-filter-actions"
            fields={[
              {
                name: 'storeKeyword',
                label: '매장',
                type: 'text',
                value: filters.storeKeyword,
                onChange: handleFilterChange,
                placeholder: '매장명 또는 매장코드',
                className: 'inventory-filter-store',
              },
              {
                name: 'warehouseKeyword',
                label: '창고',
                type: 'text',
                value: filters.warehouseKeyword,
                onChange: handleFilterChange,
                placeholder: '창고명 또는 창고코드',
                className: 'inventory-filter-warehouse',
              },
              {
                name: 'productKeyword',
                label: '상품',
                type: 'text',
                value: filters.productKeyword,
                onChange: handleFilterChange,
                placeholder: '상품명 또는 SKU',
                className: 'inventory-filter-product',
              },
              {
                name: 'saleStatus',
                label: '상태',
                type: 'select',
                value: filters.saleStatus,
                onChange: handleFilterChange,
                className: 'inventory-filter-status',
                options: [
                  { value: '', label: '전체' },
                  { value: 'ON', label: '판매중' },
                  { value: 'OFF', label: '판매중지' },
                ],
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

          <table className="erp-table list-table inventory-list-table">
            <thead>
              <tr>
                <th>매장</th>
                <th>창고</th>
                <th>상품명</th>
                <th>재고</th>
                <th>판매가</th>
                <th>상태</th>
                <th className="actions-col">작업</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="empty-cell">
                    로딩 중...
                  </td>
                </tr>
              ) : inventories.length === 0 ? (
                <tr>
                  <td colSpan={7} className="empty-cell">
                    검색 결과가 없습니다.
                  </td>
                </tr>
              ) : (
                inventories.map(item => {
                  const saleStatus = SALE_STATUS_META[item.saleStatus] || {
                    label: item.saleStatus || '-',
                    color: '#6B7280',
                  };

                  const isUpdating = updatingStoreProductId === item.storeProductId;

                  return (
                    <tr
                      key={item.storeProductId || `${item.warehouseId}-${item.productId}`}
                      className="clickable-row"
                      onClick={() => handleRowClick(item.storeProductId)}
                    >
                      <td title={item.storeName || '-'}>{item.storeName || '-'}</td>
                      <td title={item.warehouseName || '-'}>
                        {item.warehouseName || '-'}
                      </td>
                      <td title={item.productName || '-'}>{item.productName || '-'}</td>
                      <td title={String(item.onHand ?? 0)}>{item.onHand ?? 0}</td>
                      <td title={formatPrice(item.salePrice, item.productPrice)}>
                        {formatPrice(item.salePrice, item.productPrice)}
                      </td>
                      <td>
                        <span
                          className="status-badge"
                          style={{
                            backgroundColor: saleStatus.color,
                            color: '#fff',
                          }}
                        >
                          {saleStatus.label}
                        </span>
                      </td>
                      <td className="actions-cell">
                        <button
                          type="button"
                          className="edit-btn"
                          disabled={item.storeProductId == null || isUpdating}
                          onClick={event => handleToggleSaleStatus(event, item)}
                        >
                          {isUpdating ? '처리중...' : item.saleStatus === 'ON' ? '판매 중지' : '재판매'}
                        </button>
                      </td>
                    </tr>
                  );
                })
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
    </div>
  );
}
