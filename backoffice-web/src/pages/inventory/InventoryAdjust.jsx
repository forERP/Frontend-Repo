import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  adjustInventoryQuantity,
  fetchInventoryByStoreWarehouseProduct,
} from '../../api/inventoryApi';
import { getAllProducts, getAllStores, getWarehouses } from '../../lib/dataApi';
import '../purchase/request/purchase.css';
import './InventoryAdjust.css';

const INITIAL_FORM = {
  storeId: '',
  warehouseId: '',
  productId: '',
  adjustmentType: 'IN',
  quantity: 1,
  memo: '',
};

const parseProductList = payload => {
  if (!payload) return [];
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload.content)) return payload.content;
  return [];
};

export default function InventoryAdjust() {
  const navigate = useNavigate();
  const location = useLocation();

  const [stores, setStores] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [products, setProducts] = useState([]);

  const [form, setForm] = useState(INITIAL_FORM);
  const [currentStock, setCurrentStock] = useState(null);
  const [stockLoading, setStockLoading] = useState(false);

  const [loadingOptions, setLoadingOptions] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const prefilledParams = useMemo(() => {
    const params = new URLSearchParams(location.search);
    return {
      storeId: params.get('storeId') || '',
      warehouseId: params.get('warehouseId') || '',
      productId: params.get('productId') || '',
    };
  }, [location.search]);

  useEffect(() => {
    let isMounted = true;

    const loadOptions = async () => {
      try {
        setLoadingOptions(true);
        const [storeResult, productResult] = await Promise.all([
          getAllStores(),
          getAllProducts(0, 500),
        ]);

        if (!isMounted) return;

        setStores(Array.isArray(storeResult) ? storeResult : []);
        setProducts(parseProductList(productResult));
        setForm(prev => ({
          ...prev,
          storeId: prefilledParams.storeId || prev.storeId,
          warehouseId: prefilledParams.warehouseId || prev.warehouseId,
          productId: prefilledParams.productId || prev.productId,
        }));
      } catch (err) {
        console.error(err);
        if (isMounted) {
          setError('기초 데이터 조회에 실패했습니다.');
        }
      } finally {
        if (isMounted) {
          setLoadingOptions(false);
        }
      }
    };

    loadOptions();
    return () => {
      isMounted = false;
    };
  }, [prefilledParams.productId, prefilledParams.storeId, prefilledParams.warehouseId]);

  useEffect(() => {
    let isMounted = true;

    const loadWarehouses = async () => {
      if (!form.storeId) {
        setWarehouses([]);
        setForm(prev => ({ ...prev, warehouseId: '' }));
        return;
      }

      try {
        const result = await getWarehouses(Number(form.storeId));
        if (!isMounted) return;

        const list = Array.isArray(result) ? result : [];
        setWarehouses(list);

        const exists = list.some(warehouse => String(warehouse.warehouseId) === String(form.warehouseId));
        if (!exists) {
          setForm(prev => ({ ...prev, warehouseId: '' }));
        }
      } catch (err) {
        console.error(err);
        if (isMounted) {
          setError('창고 목록 조회에 실패했습니다.');
          setWarehouses([]);
        }
      }
    };

    loadWarehouses();
    return () => {
      isMounted = false;
    };
  }, [form.storeId]);

  useEffect(() => {
    let isMounted = true;

    const loadCurrentStock = async () => {
      if (!form.storeId || !form.warehouseId || !form.productId) {
        setCurrentStock(null);
        return;
      }

      try {
        setStockLoading(true);
        const data = await fetchInventoryByStoreWarehouseProduct({
          storeId: Number(form.storeId),
          warehouseId: Number(form.warehouseId),
          productId: Number(form.productId),
        });
        if (!isMounted) return;
        setCurrentStock(data);
      } catch (err) {
        console.error(err);
        if (isMounted) {
          setCurrentStock(null);
          setError('현재 재고 조회에 실패했습니다.');
        }
      } finally {
        if (isMounted) {
          setStockLoading(false);
        }
      }
    };

    loadCurrentStock();
    return () => {
      isMounted = false;
    };
  }, [form.storeId, form.warehouseId, form.productId]);

  const handleFieldChange = event => {
    const { name, value } = event.target;
    setSuccessMessage('');
    setError('');
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const validateForm = () => {
    if (!form.storeId) return '매장을 선택해주세요.';
    if (!form.warehouseId) return '창고를 선택해주세요.';
    if (!form.productId) return '상품을 선택해주세요.';

    const quantity = Number(form.quantity);
    if (!Number.isInteger(quantity) || quantity <= 0) {
      return '조정 수량은 1 이상의 정수여야 합니다.';
    }

    if (form.adjustmentType === 'OUT' && currentStock && quantity > currentStock.onHand) {
      return '현재 재고보다 많은 수량은 차감할 수 없습니다.';
    }

    return '';
  };

  const handleSubmit = async event => {
    event.preventDefault();
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setSubmitting(true);
      setError('');
      setSuccessMessage('');

      const result = await adjustInventoryQuantity({
        storeId: Number(form.storeId),
        warehouseId: Number(form.warehouseId),
        productId: Number(form.productId),
        adjustmentType: form.adjustmentType,
        quantity: Number(form.quantity),
        memo: form.memo?.trim() || null,
      });

      setSuccessMessage(
        `재고가 조정되었습니다. (${result.beforeQty} -> ${result.afterQty})`,
      );

      setCurrentStock(prev => {
        if (!prev) return prev;
        return { ...prev, onHand: result.afterQty, updatedAt: result.adjustedAt };
      });

      setForm(prev => ({ ...prev, quantity: 1, memo: '' }));
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || '재고 조정에 실패했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="purchase-page inventory-adjust-page">
      <div className="page-header">
        <h2>재고 조정</h2>
      </div>

      <form className="purchase-form inventory-adjust-form" onSubmit={handleSubmit}>
        <div className="inventory-adjust-grid">
          <div className="form-group">
            <label htmlFor="storeId">매장</label>
            <select
              id="storeId"
              name="storeId"
              value={form.storeId}
              onChange={handleFieldChange}
              disabled={loadingOptions || submitting}
            >
              <option value="">매장을 선택하세요</option>
              {stores.map(store => (
                <option key={store.id} value={store.id}>
                  {store.name} ({store.code})
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="warehouseId">창고</label>
            <select
              id="warehouseId"
              name="warehouseId"
              value={form.warehouseId}
              onChange={handleFieldChange}
              disabled={!form.storeId || loadingOptions || submitting}
            >
              <option value="">창고를 선택하세요</option>
              {warehouses.map(warehouse => (
                <option key={warehouse.warehouseId} value={warehouse.warehouseId}>
                  {warehouse.name} ({warehouse.code})
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="productId">상품</label>
            <select
              id="productId"
              name="productId"
              value={form.productId}
              onChange={handleFieldChange}
              disabled={loadingOptions || submitting}
            >
              <option value="">상품을 선택하세요</option>
              {products.map(product => (
                <option key={product.id} value={product.id}>
                  {product.name} ({product.sku})
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="adjustmentType">조정 유형</label>
            <select
              id="adjustmentType"
              name="adjustmentType"
              value={form.adjustmentType}
              onChange={handleFieldChange}
              disabled={submitting}
            >
              <option value="IN">재고 증가</option>
              <option value="OUT">재고 차감</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="quantity">조정 수량</label>
            <input
              id="quantity"
              name="quantity"
              type="number"
              min={1}
              value={form.quantity}
              onChange={handleFieldChange}
              disabled={submitting}
            />
          </div>

          <div className="form-group inventory-current-stock">
            <label>현재 재고</label>
            <div className="stock-value">
              {stockLoading ? '조회 중...' : currentStock ? `${currentStock.onHand}` : '-'}
            </div>
          </div>

          <div className="form-group inventory-memo">
            <label htmlFor="memo">조정 사유 메모</label>
            <textarea
              id="memo"
              name="memo"
              rows={3}
              value={form.memo}
              onChange={handleFieldChange}
              placeholder="재고 조정 사유를 입력하세요."
              disabled={submitting}
            />
          </div>
        </div>

        {error && <div className="error-message">{error}</div>}
        {successMessage && <div className="success-message">{successMessage}</div>}

        <div className="form-buttons">
          <button type="submit" disabled={loadingOptions || submitting || stockLoading}>
            {submitting ? '처리 중...' : '재고 조정'}
          </button>
          <button type="button" onClick={() => navigate('/inventory')} disabled={submitting}>
            목록으로
          </button>
          {currentStock?.storeProductId && (
            <button
              type="button"
              onClick={() => navigate(`/inventory/store-products/${currentStock.storeProductId}`)}
              disabled={submitting}
            >
              상세 보기
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
