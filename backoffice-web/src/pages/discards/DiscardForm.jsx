import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createDiscard } from '../../api/discardApi';
import { getAllProducts, getAllStores, getWarehouses } from '../../lib/dataApi';
import '../purchase/request/purchase.css';
import './DiscardForm.css';

const EMPTY_ITEM = { productId: '', qty: 1 };
const INITIAL_FORM = {
  storeId: '',
  warehouseId: '',
  reason: '',
  items: [{ ...EMPTY_ITEM }],
};

const parseProductList = payload => {
  if (!payload) return [];
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload.content)) return payload.content;
  return [];
};

export default function DiscardForm() {
  const navigate = useNavigate();
  const [stores, setStores] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [products, setProducts] = useState([]);

  const [form, setForm] = useState(INITIAL_FORM);
  const [loadingOptions, setLoadingOptions] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let isMounted = true;

    const loadOptions = async () => {
      try {
        setLoadingOptions(true);
        const [storeResult, productResult] = await Promise.all([
          getAllStores(),
          getAllProducts(0, 300),
        ]);

        if (!isMounted) return;
        setStores(Array.isArray(storeResult) ? storeResult : []);
        setProducts(parseProductList(productResult));
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
  }, []);

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
  }, [form.storeId, form.warehouseId]);

  const handleFieldChange = event => {
    const { name, value } = event.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleItemChange = (index, key, value) => {
    setForm(prev => ({
      ...prev,
      items: prev.items.map((item, itemIndex) =>
        itemIndex === index ? { ...item, [key]: value } : item,
      ),
    }));
  };

  const handleAddItem = () => {
    setForm(prev => ({ ...prev, items: [...prev.items, { ...EMPTY_ITEM }] }));
  };

  const handleRemoveItem = index => {
    setForm(prev => {
      if (prev.items.length === 1) return prev;
      return {
        ...prev,
        items: prev.items.filter((_, itemIndex) => itemIndex !== index),
      };
    });
  };

  const validateForm = () => {
    if (!form.storeId) return '매장을 선택해주세요.';
    if (!form.warehouseId) return '창고를 선택해주세요.';
    if (!form.items.length) return '폐기 상품을 한 개 이상 추가해주세요.';

    const selectedProducts = new Set();
    for (const item of form.items) {
      if (!item.productId) return '상품을 선택해주세요.';

      const qty = Number(item.qty);
      if (!Number.isInteger(qty) || qty <= 0) {
        return '수량은 1 이상의 정수여야 합니다.';
      }

      if (selectedProducts.has(item.productId)) {
        return '동일한 상품을 중복으로 선택할 수 없습니다.';
      }
      selectedProducts.add(item.productId);
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

      const payload = {
        storeId: Number(form.storeId),
        warehouseId: Number(form.warehouseId),
        reason: form.reason.trim() || null,
        items: form.items.map(item => ({
          productId: Number(item.productId),
          qty: Number(item.qty),
        })),
      };

      const created = await createDiscard(payload);
      navigate(`/discards/${created.discardId}`);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || '폐기 등록에 실패했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = () => {
    setForm(INITIAL_FORM);
    setError('');
  };

  return (
    <div className="purchase-page">
      <div className="page-header">
        <h2>폐기 등록</h2>
      </div>

      <form className="purchase-form discard-form" onSubmit={handleSubmit}>
        {loadingOptions ? (
          <p>로딩 중...</p>
        ) : (
          <>
            <div className="discard-form-grid">
              <div className="form-group">
                <label htmlFor="storeId">매장</label>
                <select
                  id="storeId"
                  name="storeId"
                  value={form.storeId}
                  onChange={handleFieldChange}
                  disabled={submitting}
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
                  disabled={!form.storeId || submitting}
                >
                  <option value="">창고를 선택하세요</option>
                  {warehouses.map(warehouse => (
                    <option key={warehouse.warehouseId} value={warehouse.warehouseId}>
                      {warehouse.name} ({warehouse.code})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group discard-reason">
                <label htmlFor="reason">폐기 사유</label>
                <input
                  id="reason"
                  name="reason"
                  value={form.reason}
                  onChange={handleFieldChange}
                  placeholder="폐기 사유를 입력하세요"
                  disabled={submitting}
                />
              </div>
            </div>

            <div className="discard-items-section">
              <div className="discard-items-header">
                <h3>폐기 상품</h3>
                <button type="button" className="btn-primary btn-sm" onClick={handleAddItem} disabled={submitting}>
                  상품 추가
                </button>
              </div>

              <table className="erp-table discard-items-table">
                <thead>
                  <tr>
                    <th>상품</th>
                    <th>수량</th>
                    <th className="actions-col">작업</th>
                  </tr>
                </thead>
                <tbody>
                  {form.items.map((item, index) => (
                    <tr key={`discard-item-${index}`}>
                      <td>
                        <select
                          value={item.productId}
                          onChange={event => handleItemChange(index, 'productId', event.target.value)}
                          disabled={submitting}
                        >
                          <option value="">상품을 선택하세요</option>
                          {products.map(product => (
                            <option key={product.id} value={product.id}>
                              {product.name} ({product.sku})
                            </option>
                          ))}
                        </select>
                      </td>
                      <td>
                        <input
                          type="number"
                          min={1}
                          value={item.qty}
                          onChange={event => handleItemChange(index, 'qty', event.target.value)}
                          disabled={submitting}
                        />
                      </td>
                      <td className="actions-cell">
                        <button
                          type="button"
                          className="btn-danger btn-sm"
                          onClick={() => handleRemoveItem(index)}
                          disabled={submitting || form.items.length === 1}
                        >
                          삭제
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {error && <div className="error-message">{error}</div>}

        <div className="form-buttons">
          <button type="submit" disabled={loadingOptions || submitting}>
            {submitting ? '처리 중...' : '폐기 등록'}
          </button>
          <button type="button" onClick={handleReset} disabled={submitting}>
            입력 초기화
          </button>
          <button type="button" onClick={() => navigate('/discards')} disabled={submitting}>
            목록으로
          </button>
        </div>
      </form>
    </div>
  );
}
