import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createBundleProduct, fetchBundleCandidates } from '../../api/productApi';
import './ProductBundleForm.css';

const ITEMS_PER_PAGE = 5;

const INITIAL_FORM = {
  name: '',
  setPrice: '',
  discountRate: '',
  description: '',
  imageUrl: '',
};

const toNumber = value => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const toPriceText = value => `${toNumber(value).toLocaleString('ko-KR')}원`;

const compareBySku = (left, right) => {
  const leftSku = String(left?.sku || '');
  const rightSku = String(right?.sku || '');
  const skuCompare = leftSku.localeCompare(rightSku, 'ko-KR', {
    numeric: true,
    sensitivity: 'base',
  });

  if (skuCompare !== 0) {
    return skuCompare;
  }

  return String(left?.name || '').localeCompare(String(right?.name || ''), 'ko-KR');
};

const slicePageItems = (items, page) => {
  const start = (page - 1) * ITEMS_PER_PAGE;
  return items.slice(start, start + ITEMS_PER_PAGE);
};

const getVisiblePages = (currentPage, totalPages) => {
  if (totalPages <= 5) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  if (currentPage <= 3) {
    return [1, 2, 3, 4, 5];
  }

  if (currentPage >= totalPages - 2) {
    return [totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
  }

  return [currentPage - 2, currentPage - 1, currentPage, currentPage + 1, currentPage + 2];
};

function BundlePager({ currentPage, totalPages, onPageChange, disabled = false }) {
  if (totalPages <= 1) {
    return null;
  }

  const pages = getVisiblePages(currentPage, totalPages);

  return (
    <div className="bundle-pagination">
      <button
        type="button"
        className="bundle-pagination-btn"
        disabled={disabled || currentPage <= 1}
        onClick={() => onPageChange(currentPage - 1)}
        aria-label="이전 페이지"
      >
        &lt;
      </button>

      {pages.map(pageNumber => (
        <button
          type="button"
          key={pageNumber}
          className={`bundle-pagination-btn ${pageNumber === currentPage ? 'is-active' : ''}`}
          disabled={disabled || pageNumber === currentPage}
          onClick={() => onPageChange(pageNumber)}
        >
          {pageNumber}
        </button>
      ))}

      <button
        type="button"
        className="bundle-pagination-btn"
        disabled={disabled || currentPage >= totalPages}
        onClick={() => onPageChange(currentPage + 1)}
        aria-label="다음 페이지"
      >
        &gt;
      </button>
    </div>
  );
}

export default function ProductBundleForm() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState(INITIAL_FORM);
  const [keyword, setKeyword] = useState('');
  const [candidates, setCandidates] = useState([]);
  const [selectedItems, setSelectedItems] = useState([]);
  const [candidatePage, setCandidatePage] = useState(1);
  const [selectedPage, setSelectedPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadCandidates = async () => {
      try {
        setLoading(true);
        setError(null);
        const result = await fetchBundleCandidates();
        setCandidates(Array.isArray(result) ? result : []);
      } catch (loadError) {
        console.error(loadError);
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

  const sortedCandidates = useMemo(
    () => [...candidates].sort(compareBySku),
    [candidates],
  );

  const filteredCandidates = useMemo(() => {
    const normalizedKeyword = keyword.trim().toLowerCase();
    if (!normalizedKeyword) {
      return sortedCandidates;
    }

    return sortedCandidates.filter(candidate => {
      const name = String(candidate.name || '').toLowerCase();
      const sku = String(candidate.sku || '').toLowerCase();
      const categoryName = String(candidate.categoryName || '').toLowerCase();

      return (
        name.includes(normalizedKeyword) ||
        sku.includes(normalizedKeyword) ||
        categoryName.includes(normalizedKeyword)
      );
    });
  }, [keyword, sortedCandidates]);

  const candidateTotalPages = Math.max(1, Math.ceil(filteredCandidates.length / ITEMS_PER_PAGE));
  const safeCandidatePage = Math.min(candidatePage, candidateTotalPages);
  const visibleCandidates = useMemo(
    () => slicePageItems(filteredCandidates, safeCandidatePage),
    [filteredCandidates, safeCandidatePage],
  );

  const selectedTotalPages = Math.max(1, Math.ceil(selectedItems.length / ITEMS_PER_PAGE));
  const safeSelectedPage = Math.min(selectedPage, selectedTotalPages);
  const visibleSelectedItems = useMemo(
    () => slicePageItems(selectedItems, safeSelectedPage),
    [selectedItems, safeSelectedPage],
  );

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

  const handleKeywordChange = event => {
    setKeyword(event.target.value);
    setCandidatePage(1);
  };

  const handleAddItem = candidate => {
    if (!candidate || selectedIdSet.has(candidate.productId)) {
      return;
    }

    setSelectedItems(prev => {
      const next = [
        ...prev,
        {
          productId: candidate.productId,
          sku: candidate.sku,
          name: candidate.name,
          categoryName: candidate.categoryName,
          price: toNumber(candidate.price),
          quantity: 1,
        },
      ];

      const nextTotalPages = Math.max(1, Math.ceil(next.length / ITEMS_PER_PAGE));
      setSelectedPage(nextTotalPages);
      return next;
    });
  };

  const handleRemoveItem = productId => {
    setSelectedItems(prev => {
      const next = prev.filter(item => item.productId !== productId);
      const nextTotalPages = Math.max(1, Math.ceil(next.length / ITEMS_PER_PAGE));
      setSelectedPage(currentPage => Math.min(currentPage, nextTotalPages));
      return next;
    });
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
    } catch (submitError) {
      console.error(submitError);
      setError(submitError.response?.data?.message || '묶음상품 등록에 실패했습니다.');
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
            <div className="bundle-form-row bundle-form-row--two">
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

            <div className="form-group bundle-description-group">
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

            <div className="bundle-form-row bundle-form-row--two bundle-form-row--pricing">
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
            </div>

            <div className="bundle-summary card">
              <h2>가격 요약</h2>
              <div className="bundle-summary-row">
                <span>구성 상품 합계</span>
                <strong>{toPriceText(originalTotalPrice)}</strong>
              </div>
              <div className="bundle-summary-row">
                <span>할인율 기준 예상가</span>
                <strong>{toPriceText(expectedSetPriceByDiscount)}</strong>
              </div>
              <div className="bundle-summary-row highlight">
                <span>세트 판매가</span>
                <strong>{toPriceText(formData.setPrice)}</strong>
              </div>
            </div>

            <div className="bundle-panel-grid">
              <section className="bundle-panel card">
                <div className="bundle-panel-header">
                  <h2>활성 상품 목록</h2>
                  <input
                    type="text"
                    className="bundle-search-input"
                    placeholder="상품명 / SKU / 카테고리"
                    value={keyword}
                    onChange={handleKeywordChange}
                    disabled={saving}
                  />
                </div>

                {loading ? (
                  <div className="bundle-empty">로딩 중...</div>
                ) : filteredCandidates.length === 0 ? (
                  <div className="bundle-empty">표시할 활성 상품이 없습니다.</div>
                ) : (
                  <>
                    <div className="bundle-list">
                      {visibleCandidates.map(candidate => (
                        <article key={candidate.productId} className="bundle-item-card">
                          <div className="bundle-item-body">
                            <div className="bundle-item-title-row">
                              <p className="bundle-item-title">{candidate.name || '-'}</p>
                              <span className="bundle-item-sku">{candidate.sku || '-'}</span>
                            </div>
                            <div className="bundle-item-meta">
                              <span className="bundle-item-meta-category">
                                {candidate.categoryName || '-'}
                              </span>
                              <span className="bundle-item-meta-divider">|</span>
                              <span className="bundle-item-meta-price">{toPriceText(candidate.price)}</span>
                            </div>
                          </div>

                          <div className="bundle-item-actions">
                            <button
                              type="button"
                              className="create-btn"
                              disabled={saving || selectedIdSet.has(candidate.productId)}
                              onClick={() => handleAddItem(candidate)}
                            >
                              {selectedIdSet.has(candidate.productId) ? '추가됨' : '추가'}
                            </button>
                          </div>
                        </article>
                      ))}
                    </div>

                    <BundlePager
                      currentPage={safeCandidatePage}
                      totalPages={candidateTotalPages}
                      onPageChange={setCandidatePage}
                      disabled={saving || loading}
                    />
                  </>
                )}
              </section>

              <section className="bundle-panel card">
                <div className="bundle-panel-header">
                  <h2>선택된 구성 상품</h2>
                </div>

                {selectedItems.length === 0 ? (
                  <div className="bundle-empty">구성 상품을 선택해 주세요.</div>
                ) : (
                  <>
                    <div className="bundle-list">
                      {visibleSelectedItems.map(item => (
                        <article key={item.productId} className="bundle-item-card">
                          <div className="bundle-item-body">
                            <div className="bundle-item-title-row">
                              <p className="bundle-item-title">{item.name || '-'}</p>
                              <span className="bundle-item-sku">{item.sku || '-'}</span>
                            </div>
                            <div className="bundle-item-meta">
                              <span className="bundle-item-meta-category">{item.categoryName || '-'}</span>
                              <span className="bundle-item-meta-divider">|</span>
                              <span className="bundle-item-meta-price">{toPriceText(item.price)}</span>
                            </div>
                          </div>

                          <div className="bundle-item-actions bundle-item-actions--selected">
                            <label className="bundle-quantity-field">
                              <span>수량</span>
                              <input
                                type="number"
                                min="1"
                                value={item.quantity}
                                disabled={saving}
                                onChange={event =>
                                  handleQuantityChange(item.productId, event.target.value)
                                }
                              />
                            </label>

                            <div className="bundle-selected-subtotal">
                              {toPriceText(toNumber(item.price) * toNumber(item.quantity))}
                            </div>

                            <button
                              type="button"
                              className="discontinue-btn"
                              disabled={saving}
                              onClick={() => handleRemoveItem(item.productId)}
                            >
                              제거
                            </button>
                          </div>
                        </article>
                      ))}
                    </div>

                    <BundlePager
                      currentPage={safeSelectedPage}
                      totalPages={selectedTotalPages}
                      onPageChange={setSelectedPage}
                      disabled={saving}
                    />
                  </>
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
