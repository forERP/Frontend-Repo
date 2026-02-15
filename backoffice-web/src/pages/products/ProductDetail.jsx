import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchProductDetail, updateProduct, discontinueProduct, reactivateProduct } from '../../api/productApi';
import { fetchCategories } from '../../api/categoryApi';
import ProductCategoryModal from './ProductCategoryModal';
import './ProductDetail.css';

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [categories, setCategories] = useState([]);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [product, setProduct] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    categoryId: '',
    description: '',
    imageUrl: '',
    price: '',
  });

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [productData, categoriesData] = await Promise.all([
        fetchProductDetail(id),
        fetchCategories(),
      ]);
      
      setProduct(productData);
      setCategories(categoriesData || []);
      setFormData({
        name: productData.name,
        categoryId: productData.category?.id || '',
        description: productData.description || '',
        imageUrl: productData.imageUrl || '',
        price: productData.msrpPrice || '',
      });
    } catch (err) {
      console.error('데이터 로드 실패:', err);
      setError('상품 정보를 불러올 수 없습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleCategoryCreated = async () => {
    await loadData();
  };

  const handleSave = async (e) => {
    e.preventDefault();
    
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
        categoryId: parseInt(formData.categoryId),
        description: formData.description.trim(),
        imageUrl: formData.imageUrl.trim(),
        msrpPrice: parseFloat(formData.price),
      };

      await updateProduct(id, payload);
      await loadData();
      setIsEditing(false);
    } catch (err) {
      console.error('상품 수정 실패:', err);
      setError(err.response?.data?.message || '상품 수정에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleDiscontinue = async () => {
    if (!window.confirm('이 상품을 단종 처리하시겠습니까?')) {
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await discontinueProduct(id);
      navigate('/products', { state: { message: '상품이 단종 처리되었습니다.' } });
    } catch (err) {
      console.error('상품 단종 처리 실패:', err);
      setError(err.response?.data?.message || '상품 단종 처리에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleReactivate = async () => {
    if (!window.confirm('이 상품을 재등록(단종 취소)하시겠습니까?')) {
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await reactivateProduct(id);
      await loadData();
    } catch (err) {
      console.error('상품 재등록 실패:', err);
      setError(err.response?.data?.message || '상품 재등록에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    loadData();
  };

  if (loading && !product) {
    return (
      <div className="product-detail-page">
        <div className="product-detail-container">
          <div className="loading">로드 중...</div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="product-detail-page">
        <div className="product-detail-container">
          <div className="error-message">상품을 찾을 수 없습니다.</div>
          <button onClick={() => navigate('/products')} className="back-btn">
            목록으로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="product-detail-page">
      <div className="product-detail-container">
        <div className="detail-header">
          <h1 className="page-title">상품 상세</h1>
          <div className="detail-actions">
            {!isEditing && (
              <>
                <button
                  className="edit-btn"
                  onClick={() => setIsEditing(true)}
                  disabled={loading || product.status === 'DISCONTINUED'}
                >
                  편집
                </button>
                {product.status !== 'DISCONTINUED' && (
                  <button
                    className="discontinue-btn"
                    onClick={handleDiscontinue}
                    disabled={loading}
                  >
                    단종 처리
                  </button>
                )}
                {product.status === 'DISCONTINUED' && (
                  <button
                    className="reactivate-btn"
                    onClick={handleReactivate}
                    disabled={loading}
                  >
                    재등록
                  </button>
                )}
              </>
            )}
          </div>
        </div>

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        <div className="card detail-card">
          {isEditing ? (
            <form onSubmit={handleSave} className="product-form">
              <div className="form-group">
                <label htmlFor="name">상품명 *</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
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
                    onClick={() => setShowCategoryModal(true)}
                    disabled={loading}
                  >
                    + 새 카테고리
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
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
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
                  disabled={loading}
                />
              </div>

              <div className="form-buttons">
                <button
                  type="submit"
                  disabled={loading}
                >
                  {loading ? '저장 중...' : '저장'}
                </button>
                <button
                  type="button"
                  onClick={handleCancel}
                  disabled={loading}
                >
                  취소
                </button>
              </div>
            </form>
          ) : (
            <div className="detail-view detail-view-split">
              <div className="detail-image-panel">
                {product.imageUrl ? (
                  <img
                    src={product.imageUrl}
                    alt={product.name}
                    className="product-image-preview"
                  />
                ) : (
                  <div className="image-placeholder">이미지가 없습니다.</div>
                )}
              </div>

              <div className="detail-info-panel">
                <table className="product-detail-table">
                  <tbody>
                    <tr>
                      <th>SKU</th>
                      <td>{product.sku || '-'}</td>
                    </tr>
                    <tr>
                      <th>상품명</th>
                      <td>{product.name}</td>
                    </tr>
                    <tr>
                      <th>카테고리</th>
                      <td>{product.category?.name || '-'}</td>
                    </tr>
                    <tr>
                      <th>가격</th>
                      <td>{Number(product.msrpPrice).toLocaleString('ko-KR')}원</td>
                    </tr>
                    <tr>
                      <th>상태</th>
                      <td>
                        <span className={`status-badge ${product.status?.toLowerCase() || 'active'}`}>
                          {product.status === 'ACTIVE' ? '활성' : '단종'}
                        </span>
                      </td>
                    </tr>
                    <tr>
                      <th>설명</th>
                      <td>{product.description || '-'}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {showCategoryModal && (
        <ProductCategoryModal
          onClose={() => setShowCategoryModal(false)}
          onCategoryCreated={handleCategoryCreated}
        />
      )}
    </div>
  );
}

