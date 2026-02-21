import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createBundleProduct, fetchBundleCandidates } from '../../api/productApi';
import './ProductBundleForm.css';

const toNumber = value => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const INITIAL_FORM = {
  name: '',
  setPrice: '',
  discountRate: '',
  description: '',
  imageUrl: '',
};

export default function ProductBundleForm() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [keyword, setKeyword] = useState('');
  const [candidates, setCandidates] = useState([]);
  const [selectedItems, setSelectedItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadCandidates = async () => {
      try {
        setLoading(true);
        setError(null);
        const result = await fetchBundleCandidates();
        setCandidates(result);
      } catch (err) {
        console.error(err);
        setError('활성 상품 목록을 불러오지 못했습니다.');
      } finally {
        setLoading(false);
      }
    };

    loadCandidates();
  }, []);

  const selectedIdSet = useMemo(
    () => new Set(selectedItems.map(item => item.productId)),
    [selectedItems],
  );

  const filteredCandidates = useMemo(() => {
    const normalizedKeyword = keyword.trim().toLowerCase();
    if (!normalizedKeyword) {
      return candidates;
    }

    return candidates.filter(candidate => {
      const name = String(candidate.name || '').toLowerCase();
      const sku = String(candidate.sku || '').toLowerCase();
      const categoryName = String(candidate.categoryName || '').toLowerCase();
      return (
        name.includes(normalizedKeyword) ||
        sku.includes(normalizedKeyword) ||
        categoryName.includes(normalizedKeyword)
      );
    });
  }, [candidates, keyword]);

  const originalTotalPrice = useMemo(
    () =>
      selectedItems.reduce(
        (sum, item) => sum + toNumber(item.price) * Math.max(1, toNumber(item.quantity)),
        0,
      ),
    [selectedItems],
  );

  const expectedSetPriceByDiscount = useMemo(() => {
    const discountRate = toNumber(formData.discountRate);
    if (discountRate <= 0) {
      return originalTotalPrice;
    }

    const ratio = Math.max(0, Math.min(100, discountRate));
    return Math.round(originalTotalPrice * ((100 - ratio) / 100));
  }, [formData.discountRate, originalTotalPrice]);

  const handleFormInput = event => {
    const { name, value } = event.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAddItem = candidate => {
    if (!candidate || selectedIdSet.has(candidate.productId)) {
      return;
    }

    setSelectedItems(prev => [
      ...prev,
      {
        productId: candidate.productId,
        sku: candidate.sku,
        name: candidate.name,
        categoryName: candidate.categoryName,
        price: toNumber(candidate.price),
        quantity: 1,
      },
    ]);
  };

  const handleRemoveItem = productId => {
    setSelectedItems(prev => prev.filter(item => item.productId !== productId));
  };

  const handleQuantityChange = (productId, nextQuantity) => {
    const normalizedQuantity = Math.max(1, Number.parseInt(nextQuantity, 10) || 1);
    setSelectedItems(prev =>
      prev.map(item =>
        item.productId === productId ? { ...item, quantity: normalizedQuantity } : item,
      ),
    );
  };

  const applyDiscountRatePrice = () => {
    if (expectedSetPriceByDiscount <= 0) {
      return;
    }
    setFormData(prev => ({ ...prev, setPrice: String(expectedSetPriceByDiscount) }));
  };

  const validate = () => {
    if (!formData.name.trim()) {
      return '묶음상품명은 필수입니다.';
    }
    if (selectedItems.length === 0) {
      return '구성 상품을 1개 이상 선택해 주세요.';
    }

    const invalidQuantityItem = selectedItems.find(item => toNumber(item.quantity) <= 0);
    if (invalidQuantityItem) {
      return '구성 수량은 1 이상이어야 합니다.';
    }

    if (toNumber(formData.setPrice) <= 0) {
      return '세트 판매가는 0보다 커야 합니다.';
    }

    const discountRate = formData.discountRate.trim();
    if (discountRate) {
      const numericRate = toNumber(discountRate);
      if (numericRate < 0 || numericRate > 100) {
        return '할인율은 0~100 사이 값이어야 합니다.';
      }
    }

    return null;
  };

  const handleSubmit = async event => {
    event.preventDefault();

    const validationMessage = validate();
    if (validationMessage) {
      setError(validationMessage);
      return;
    }

    try {
      setSaving(true);
      setError(null);

      const payload = {
        name: formData.name.trim(),
        setPrice: toNumber(formData.setPrice),
        discountRate: formData.discountRate.trim() === '' ? null : toNumber(formData.discountRate),
        description: formData.description.trim(),
        imageUrl: formData.imageUrl.trim(),
        items: selectedItems.map(item => ({
          productId: item.productId,
          quantity: toNumber(item.quantity),
        })),
      };

      await createBundleProduct(payload);
      navigate('/products', { state: { message: '묶음상품이 정상적으로 등록되었습니다.' } });
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || '묶음상품 등록에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="product-form-page bundle-form-page">
      <div className="product-form-container bundle-form-container">
        <h1 className="page-title">묶음상품 등록</h1>

        <div className="card form-card">
          {error && <div className="error-message">{error}</div>}

          <form className="product-form bundle-form" onSubmit={handleSubmit}>
            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="name">묶음상품명 *</label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  value={formData.name}
                  onChange={handleFormInput}
                  placeholder="예: 런치 세트 A"
                  disabled={saving}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="setPrice">세트 판매가(원) *</label>
                <input
                  id="setPrice"
                  name="setPrice"
                  type="number"
                  min="1"
                  step="1"
                  value={formData.setPrice}
                  onChange={handleFormInput}
                  placeholder="0"
                  disabled={saving}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="discountRate">할인율(%)</label>
                <div className="inline-field">
                  <input
                    id="discountRate"
                    name="discountRate"
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={formData.discountRate}
                    onChange={handleFormInput}
                    placeholder="0"
                    disabled={saving}
                  />
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={applyDiscountRatePrice}
                    disabled={saving || originalTotalPrice <= 0}
                  >
                    할인율 가격 적용
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="imageUrl">이미지 URL</label>
                <input
                  id="imageUrl"
                  name="imageUrl"
                  type="url"
                  value={formData.imageUrl}
                  onChange={handleFormInput}
                  placeholder="https://example.com/set-image.jpg"
                  disabled={saving}
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="description">설명</label>
              <textarea
                id="description"
                name="description"
                rows="4"
                value={formData.description}
                onChange={handleFormInput}
                placeholder="묶음상품 설명"
                disabled={saving}
              />
            </div>

            <div className="bundle-summary card">
              <h2>가격 요약</h2>
              <div className="bundle-summary-row">
                <span>구성 상품 합계</span>
                <strong>{originalTotalPrice.toLocaleString('ko-KR')}원</strong>
              </div>
              <div className="bundle-summary-row">
                <span>할인율 기준 예상가</span>
                <strong>{expectedSetPriceByDiscount.toLocaleString('ko-KR')}원</strong>
              </div>
              <div className="bundle-summary-row highlight">
                <span>세트 판매가</span>
                <strong>{toNumber(formData.setPrice).toLocaleString('ko-KR')}원</strong>
              </div>
            </div>

            <div className="bundle-panel-grid">
              <section className="bundle-panel card">
                <div className="bundle-panel-header">
                  <h2>활성 상품 목록</h2>
                  <input
                    type="text"
                    placeholder="상품명/SKU/카테고리 검색"
                    value={keyword}
                    onChange={event => setKeyword(event.target.value)}
                    disabled={saving}
                  />
                </div>

                {loading ? (
                  <div className="bundle-empty">로딩 중...</div>
                ) : filteredCandidates.length === 0 ? (
                  <div className="bundle-empty">표시할 활성 상품이 없습니다.</div>
                ) : (
                  <div className="bundle-list">
                    {filteredCandidates.map(candidate => (
                      <div key={candidate.productId} className="bundle-candidate-item">
                        <div>
                          <div className="bundle-item-title">
                            {candidate.name} ({candidate.sku})
                          </div>
                          <div className="bundle-item-meta">
                            {candidate.categoryName || '-'} |{' '}
                            {toNumber(candidate.price).toLocaleString('ko-KR')}원
                          </div>
                        </div>
                        <button
                          type="button"
                          className="create-btn"
                          disabled={saving || selectedIdSet.has(candidate.productId)}
                          onClick={() => handleAddItem(candidate)}
                        >
                          {selectedIdSet.has(candidate.productId) ? '추가됨' : '추가'}
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              <section className="bundle-panel card">
                <div className="bundle-panel-header">
                  <h2>선택된 구성 상품</h2>
                </div>

                {selectedItems.length === 0 ? (
                  <div className="bundle-empty">구성 상품을 선택해 주세요.</div>
                ) : (
                  <table className="erp-table bundle-selected-table">
                    <thead>
                      <tr>
                        <th>상품</th>
                        <th>단가</th>
                        <th>수량</th>
                        <th>금액</th>
                        <th>작업</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedItems.map(item => (
                        <tr key={item.productId}>
                          <td>
                            {item.name} ({item.sku})
                          </td>
                          <td>{toNumber(item.price).toLocaleString('ko-KR')}원</td>
                          <td>
                            <input
                              type="number"
                              min="1"
                              value={item.quantity}
                              disabled={saving}
                              onChange={event =>
                                handleQuantityChange(item.productId, event.target.value)
                              }
                            />
                          </td>
                          <td>
                            {(toNumber(item.price) * toNumber(item.quantity)).toLocaleString('ko-KR')}
                            원
                          </td>
                          <td>
                            <button
                              type="button"
                              className="discontinue-btn"
                              disabled={saving}
                              onClick={() => handleRemoveItem(item.productId)}
                            >
                              제거
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </section>
            </div>

            <div className="form-buttons">
              <button type="submit" disabled={saving}>
                {saving ? '등록 중...' : '묶음상품 등록'}
              </button>
              <button type="button" onClick={() => navigate('/products')} disabled={saving}>
                취소
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
