import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../../../lib/api';
import { getAllProducts, getAllStores } from '../../../lib/dataApi';
import './PurchaseRequestFormPage.css';
import './purchase.css';

const parsePositiveInt = value => {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
};

const findStoreById = (storeList, targetId) =>
  storeList.find(store => String(store.storeId ?? store.id) === String(targetId));

const findProductById = (productList, targetId) =>
  productList.find(product => String(product.id ?? product.productId) === String(targetId));

export default function PurchaseRequestFormPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const prefill = useMemo(() => {
    const params = new URLSearchParams(location.search);
    return {
      storeId: parsePositiveInt(params.get('storeId')),
      productId: parsePositiveInt(params.get('productId')),
    };
  }, [location.search]);

  const [stores, setStores] = useState([]);
  const [products, setProducts] = useState([]);
  const [storeId, setStoreId] = useState(prefill.storeId ? String(prefill.storeId) : '');
  const [memo, setMemo] = useState('');
  const [items, setItems] = useState(
    prefill.productId
      ? [{ productId: String(prefill.productId), qty: 1, productName: '' }]
      : [],
  );
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setStoreId(prefill.storeId ? String(prefill.storeId) : '');
    setItems(
      prefill.productId
        ? [{ productId: String(prefill.productId), qty: 1, productName: '' }]
        : [],
    );
  }, [prefill.storeId, prefill.productId]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        const [storesData, productsData] = await Promise.all([
          getAllStores(),
          getAllProducts(),
        ]);

        const normalizedStores = Array.isArray(storesData) ? storesData : storesData.content || [];
        const normalizedProducts = Array.isArray(productsData) ? productsData : productsData.content || [];

        setStores(normalizedStores);
        setProducts(normalizedProducts);

        if (prefill.storeId && !findStoreById(normalizedStores, prefill.storeId)) {
          setStoreId('');
        }

        if (prefill.productId) {
          const matchedProduct = findProductById(normalizedProducts, prefill.productId);
          if (matchedProduct) {
            setItems([{
              productId: String(prefill.productId),
              qty: 1,
              productName: matchedProduct.name || matchedProduct.productName || '',
            }]);
          } else {
            setItems([]);
          }
        }
      } catch (err) {
        console.error('데이터 로드 실패:', err);
        alert('매장/상품 정보를 불러오는데 실패했습니다.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [prefill.storeId, prefill.productId]);

  const addItem = () => {
    setItems(prev => [...prev, { productId: '', qty: 0, productName: '' }]);
  };

  const removeItem = idx => {
    setItems(prev => prev.filter((_, index) => index !== idx));
  };

  const updateItem = (idx, field, value) => {
    setItems(prev => {
      const next = [...prev];
      next[idx] = { ...next[idx], [field]: value };
      return next;
    });
  };

  const handleProductChange = (idx, productId) => {
    const product = findProductById(products, productId);
    setItems(prev => {
      const next = [...prev];
      next[idx] = {
        ...next[idx],
        productId,
        productName: product?.name || product?.productName || '',
      };
      return next;
    });
  };

  const validate = () => {
    if (!storeId) {
      alert('매장을 선택해주세요');
      return false;
    }

    if (items.length === 0) {
      alert('최소 1개 이상의 상품을 입력해주세요');
      return false;
    }

    for (const item of items) {
      if (!item.productId || Number(item.qty) <= 0) {
        alert('모든 상품과 수량을 정확히 입력해주세요');
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async event => {
    event.preventDefault();
    if (!validate()) {
      return;
    }

    setSubmitting(true);
    try {
      const request = {
        storeId: parseInt(storeId, 10),
        memo,
        items: items.map(item => ({
          productId: parseInt(item.productId, 10),
          qty: parseInt(item.qty, 10),
        })),
      };

      const response = await api.post('/api/purchase-requests', request);
      alert('발주 요청이 생성되었습니다.');
      navigate(`/purchase-requests/${response.data.purchaseRequestId}`);
    } catch (err) {
      console.error('발주 요청 생성 실패:', err);
      alert(err.response?.data?.message || '발주 요청 생성에 실패했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="purchase-page">로딩 중...</div>;
  }

  return (
    <div className="purchase-page">
      <div className="page-header">
        <h2>발주 요청 생성</h2>
        <button
          type="button"
          className="btn-secondary"
          onClick={() => navigate('/purchase-requests')}
        >
          목록으로
        </button>
      </div>

      <form onSubmit={handleSubmit} className="purchase-form">
        <div className="form-group">
          <label>매장 *</label>
          <select value={storeId} onChange={event => setStoreId(event.target.value)} required>
            <option value="">매장 선택</option>
            {stores.map(store => (
              <option key={store.storeId || store.id} value={store.storeId || store.id}>
                {store.storeName || store.name} {store.code ? `(${store.code})` : ''}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>메모</label>
          <textarea
            value={memo}
            onChange={event => setMemo(event.target.value)}
            placeholder="발주 요청에 대한 메모를 입력하세요"
            maxLength={100}
          />
          <small>{memo.length}/100</small>
        </div>

        <div className="form-group">
          <label>상품 목록 *</label>
          <table className="erp-table">
            <thead>
              <tr>
                <th>No</th>
                <th>상품</th>
                <th>수량</th>
                <th>삭제</th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr>
                  <td colSpan={4}>상품을 추가해주세요</td>
                </tr>
              ) : (
                items.map((item, idx) => (
                  <tr key={idx}>
                    <td>{idx + 1}</td>
                    <td>
                      <select
                        value={item.productId}
                        onChange={event => handleProductChange(idx, event.target.value)}
                        required
                      >
                        <option value="">상품 선택</option>
                        {products.map(product => (
                          <option key={product.id || product.productId} value={product.id || product.productId}>
                            {product.name || product.productName}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <input
                        type="number"
                        min={1}
                        value={item.qty}
                        onChange={event => updateItem(idx, 'qty', event.target.value)}
                        required
                      />
                    </td>
                    <td>
                      <button
                        type="button"
                        onClick={() => removeItem(idx)}
                        className="btn-danger"
                      >
                        삭제
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <button type="button" onClick={addItem} className="btn-secondary">
          상품 추가
        </button>

        <div className="form-buttons">
          <button type="submit" disabled={submitting}>
            {submitting ? '생성 중...' : '발주 요청 생성'}
          </button>
          <button type="button" onClick={() => navigate(-1)}>
            취소
          </button>
        </div>
      </form>
    </div>
  );
}
