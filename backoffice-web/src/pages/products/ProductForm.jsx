import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { createProduct } from '../../api/productApi';
import { fetchCategories } from '../../api/categoryApi';
import './ProductForm.css';

export default function ProductForm() {
  const navigate = useNavigate();
  const location = useLocation();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [categories, setCategories] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    categoryId: '',
    description: '',
    imageUrl: '',
    price: '',
  });

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    const draftForm = location.state?.draftProductForm;
    const selectedCategoryId = location.state?.selectedCategoryId;

    if (!draftForm && !selectedCategoryId) {
      return;
    }

    if (draftForm) {
      setFormData(draftForm);
    }

    if (selectedCategoryId) {
      loadCategories(String(selectedCategoryId));
    }

    navigate(location.pathname, { replace: true, state: null });
  }, [location.pathname, location.state, navigate]);

  const loadCategories = async preferredCategoryId => {
    try {
      const data = await fetchCategories();
      setCategories(data || []);

      if (preferredCategoryId) {
        setFormData(prev => ({
          ...prev,
          categoryId: String(preferredCategoryId),
        }));
        return;
      }

      if (data && data.length > 0) {
        setFormData(prev => ({
          ...prev,
          categoryId: prev.categoryId || String(data[0].id),
        }));
      }
    } catch (err) {
      console.error('카테고리 로드 실패:', err);
    }
  };

  const handleInputChange = event => {
    const { name, value } = event.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleMoveCategoryCreate = () => {
    navigate('/product-categories/new', {
      state: {
        returnTo: '/products/new',
        returnState: {
          draftProductForm: formData,
        },
      },
    });
  };

  const handleSubmit = async event => {
    event.preventDefault();

    if (!formData.name.trim()) {
      setError('상품명은 필수입니다.');
      return;
    }
    if (!formData.categoryId) {
      setError('카테고리를 선택하세요.');
      return;
    }
    if (!formData.price || Number(formData.price) <= 0) {
      setError('가격은 0보다 큰 숫자여야 합니다.');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const payload = {
        name: formData.name.trim(),
        categoryId: parseInt(formData.categoryId, 10),
        description: formData.description.trim(),
        imageUrl: formData.imageUrl.trim(),
        price: parseFloat(formData.price),
      };

      await createProduct(payload);
      navigate('/products', { state: { message: '상품이 정상적으로 등록되었습니다.' } });
    } catch (err) {
      console.error('상품 등록 실패:', err);
      setError(err.response?.data?.message || '상품 등록에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('/products');
  };

  return (
    <div className="product-form-page">
      <div className="product-form-container">
        <h1 className="page-title">상품 등록</h1>

        <div className="card form-card">
          {error && <div className="error-message">{error}</div>}

          <form onSubmit={handleSubmit} className="product-form">
            <div className="form-group">
              <label htmlFor="name">상품명 *</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="상품명을 입력하세요"
                disabled={loading}
                required
              />
            </div>

            <div className="form-group">
              <div className="category-header">
                <label htmlFor="categoryId">카테고리 *</label>
                <button
                  type="button"
                  className="add-category-btn"
                  onClick={handleMoveCategoryCreate}
                  disabled={loading}
                >
                  + 카테고리 등록
                </button>
              </div>
              <select
                id="categoryId"
                name="categoryId"
                value={formData.categoryId}
                onChange={handleInputChange}
                disabled={loading}
                required
              >
                <option value="">카테고리를 선택하세요</option>
                {categories.map(category => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="price">가격 (원) *</label>
              <input
                type="number"
                id="price"
                name="price"
                value={formData.price}
                onChange={handleInputChange}
                placeholder="0"
                min="0"
                step="1"
                disabled={loading}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="description">설명</label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="상품 설명을 입력하세요"
                rows="5"
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="imageUrl">이미지 URL</label>
              <input
                type="url"
                id="imageUrl"
                name="imageUrl"
                value={formData.imageUrl}
                onChange={handleInputChange}
                placeholder="https://example.com/image.jpg"
                disabled={loading}
              />
            </div>

            <div className="form-buttons">
              <button type="submit" disabled={loading}>
                {loading ? '등록 중...' : '상품 등록'}
              </button>
              <button type="button" onClick={handleCancel} disabled={loading}>
                취소
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
