import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  fetchInventoryDetail,
  updateInventoryDetail,
  updateInventorySaleStatus,
} from '../../api/inventoryApi';
import { fetchProductDetail } from '../../api/productApi';
import { subscribeAdminRealtime } from '../../lib/realtime';
import './InventoryItem.css';

const SALE_STATUS_META = {
  ON: { label: '판매중', color: '#16A34A' },
  OFF: { label: '판매중지', color: '#6B7280' },
};

const parsePrice = value => {
  if (value == null || value === '') {
    return null;
  }

  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return null;
  }

  return parsed;
};

const resolveSalePrice = (salePrice, productPrice) => {
  const parsedSalePrice = parsePrice(salePrice);
  const parsedProductPrice = parsePrice(productPrice);

  if (parsedSalePrice == null || parsedSalePrice <= 0) {
    return parsedProductPrice ?? parsedSalePrice ?? '';
  }

  return parsedSalePrice;
};

const formatPrice = value => {
  const parsed = parsePrice(value);
  if (parsed == null) {
    return '-';
  }

  return `${parsed.toLocaleString('ko-KR')}원`;
};

const formatDateTime = value => {
  if (!value) {
    return '-';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '-';
  }

  return date.toLocaleString('ko-KR');
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

export default function InventoryItem() {
  const navigate = useNavigate();
  const { storeProductId } = useParams();

  const [item, setItem] = useState(null);
  const [productInfo, setProductInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [statusChanging, setStatusChanging] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    salePrice: '',
  });

  const syncForm = useCallback((inventoryData, productData) => {
    setFormData({
      salePrice: resolveSalePrice(inventoryData?.salePrice, productData?.msrpPrice),
    });
  }, []);

  const loadDetail = useCallback(async () => {
    if (!storeProductId) {
      setError('매장상품 식별자가 없습니다.');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const inventoryData = await fetchInventoryDetail(storeProductId);
      setItem(inventoryData);

      let productData = null;
      if (inventoryData?.productId) {
        try {
          productData = await fetchProductDetail(inventoryData.productId);
        } catch (productError) {
          console.error(productError);
        }
      }

      setProductInfo(productData);
      syncForm(inventoryData, productData);
    } catch (err) {
      console.error(err);
      setError('매장상품 상세 조회에 실패했습니다.');
      setItem(null);
      setProductInfo(null);
    } finally {
      setLoading(false);
    }
  }, [storeProductId, syncForm]);

  useEffect(() => {
    loadDetail();
  }, [loadDetail]);

  useEffect(() => {
    const unsubscribe = subscribeAdminRealtime({
      storeId: item?.storeId,
      onEvent: ({ type }) => {
        if (type === 'inventory.changed' || type === 'connected') {
          loadDetail();
        }
      },
    });

    return unsubscribe;
  }, [item?.storeId, loadDetail]);

  const effectiveSalePrice = useMemo(
    () => resolveSalePrice(item?.salePrice, productInfo?.msrpPrice),
    [item?.salePrice, productInfo?.msrpPrice],
  );

  const handleMoveToPurchaseRequest = () => {
    if (!item) {
      return;
    }

    const params = new URLSearchParams({
      storeId: String(item.storeId ?? ''),
      productId: String(item.productId ?? ''),
      storeProductId: String(item.storeProductId ?? ''),
    });

    navigate(`/purchase-requests/new?${params.toString()}`);
  };

  const handleMoveToInventoryAdjust = () => {
    if (!item) {
      return;
    }

    const params = new URLSearchParams({
      storeProductId: String(item.storeProductId ?? ''),
      storeId: String(item.storeId ?? ''),
      warehouseId: String(item.warehouseId ?? ''),
      productId: String(item.productId ?? ''),
    });

    navigate(`/inventory/adjust?${params.toString()}`);
  };

  const handleMoveToList = () => {
    if (item?.storeId) {
      navigate(`/stores/${item.storeId}/inventory`);
      return;
    }
    navigate('/inventory');
  };

  const handleStartPriceEdit = () => {
    setError(null);
    setFormData({
      salePrice: resolveSalePrice(item?.salePrice, productInfo?.msrpPrice),
    });
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    syncForm(item, productInfo);
    setIsEditing(false);
    setError(null);
  };

  const handleInputChange = event => {
    const { name, value } = event.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSavePrice = async () => {
    if (!isEditing) {
      return;
    }

    const salePrice = parsePrice(formData.salePrice);
    if (salePrice == null || salePrice < 0) {
      setError('판매가는 0 이상의 숫자여야 합니다.');
      return;
    }

    try {
      setSaving(true);
      setError(null);

      const updated = await updateInventoryDetail(storeProductId, {
        salePrice,
      });

      setItem(updated);
      syncForm(updated, productInfo);
      setIsEditing(false);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || '판매가 수정에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleSaleStatus = async () => {
    if (!item?.storeProductId) {
      return;
    }

    const nextStatus = item.saleStatus === 'ON' ? 'OFF' : 'ON';
    const { storeLabel, productLabel } = formatStoreProductDisplay(item);
    const confirmMessage = nextStatus === 'OFF'
      ? `'${storeLabel}'의 '${productLabel}'을(를) 판매 중지 처리하시겠습니까?`
      : '이 매장상품을 재판매 처리하시겠습니까?';

    if (!window.confirm(confirmMessage)) {
      return;
    }

    try {
      setStatusChanging(true);
      setError(null);

      const updated = await updateInventorySaleStatus(item.storeProductId, nextStatus);
      setItem(prev => (prev ? { ...prev, ...updated } : updated));
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || '매장상품 상태 변경에 실패했습니다.');
    } finally {
      setStatusChanging(false);
    }
  };

  if (loading && !item) {
    return (
      <div className="inventory-item-page">
        <div className="inventory-item-container">
          <div className="loading">로드 중...</div>
        </div>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="inventory-item-page">
        <div className="inventory-item-container">
          {error && <div className="error-message">{error}</div>}
          <button type="button" className="back-btn" onClick={handleMoveToList}>
            목록
          </button>
        </div>
      </div>
    );
  }

  const saleStatus = SALE_STATUS_META[item.saleStatus] || {
    label: item.saleStatus || '-',
    color: '#6B7280',
  };

  const statusActionLabel = item.saleStatus === 'ON' ? '판매 중지' : '재판매';
  const isActionDisabled = loading || saving || statusChanging;

  return (
    <div className="inventory-item-page">
      <div className="inventory-item-container">
        <div className="detail-header">
          <h1 className="page-title">재고 상세</h1>
        </div>

        {error && <div className="error-message">{error}</div>}

        <div className="card detail-card">
          <div className="inventory-item-form">
            <div className="detail-view-split">
              <div className="detail-image-panel">
                {productInfo?.imageUrl ? (
                  <img
                    src={productInfo.imageUrl}
                    alt={item.productName || '상품 이미지'}
                    className="product-image-preview"
                  />
                ) : (
                  <div className="image-placeholder">이미지가 없습니다.</div>
                )}
              </div>

              <div className="detail-info-panel">
                <table className="inventory-detail-table">
                  <tbody>
                    <tr>
                      <th>매장</th>
                      <td>{item.storeName || '-'}</td>
                    </tr>
                    <tr>
                      <th>창고</th>
                      <td>
                        {item.warehouseCode || '-'} ({item.warehouseName || '-'})
                      </td>
                    </tr>
                    <tr>
                      <th>SKU</th>
                      <td>{item.sku || '-'}</td>
                    </tr>
                    <tr>
                      <th>상품명</th>
                      <td>{item.productName || '-'}</td>
                    </tr>
                    <tr>
                      <th>재고</th>
                      <td>{item.onHand ?? 0}</td>
                    </tr>
                    <tr>
                      <th>상태</th>
                      <td>
                        <span
                          className="status-badge"
                          style={{ backgroundColor: saleStatus.color, color: '#fff' }}
                        >
                          {saleStatus.label}
                        </span>
                      </td>
                    </tr>
                    <tr>
                      <th>판매가</th>
                      <td>
                        {isEditing ? (
                          <input
                            type="number"
                            name="salePrice"
                            value={formData.salePrice}
                            onChange={handleInputChange}
                            min="0"
                            step="1"
                            disabled={saving}
                          />
                        ) : (
                          formatPrice(effectiveSalePrice)
                        )}
                      </td>
                    </tr>
                    <tr>
                      <th>최종 수정</th>
                      <td>{formatDateTime(item.updatedAt)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div className="form-buttons detail-form-buttons">
              <button
                type="button"
                onClick={handleMoveToList}
                disabled={isActionDisabled}
              >
                목록
              </button>
              <button
                type="button"
                onClick={handleMoveToPurchaseRequest}
                disabled={isActionDisabled}
              >
                발주 요청
              </button>
              <button
                type="button"
                onClick={handleMoveToInventoryAdjust}
                disabled={isActionDisabled}
              >
                재고 조정
              </button>

              {isEditing ? (
                <>
                  <button
                    type="button"
                    className="primary-btn"
                    onClick={handleSavePrice}
                    disabled={saving}
                  >
                    {saving ? '저장 중...' : '저장'}
                  </button>
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    disabled={saving}
                  >
                    취소
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    className="primary-btn"
                    onClick={handleStartPriceEdit}
                    disabled={isActionDisabled}
                  >
                    판매가 수정
                  </button>
                  <button
                    type="button"
                    className="status-btn"
                    onClick={handleToggleSaleStatus}
                    disabled={isActionDisabled}
                  >
                    {statusChanging ? '처리 중...' : statusActionLabel}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
