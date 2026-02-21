import { useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { fetchCategoryDetail, updateCategory } from '../../api/categoryApi';
import { getSessionUser, isStoreAdminUser } from '../../utils/auth';
import './ProductCategoryDetail.css';

export default function ProductCategoryDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isStoreAdmin = isStoreAdminUser(getSessionUser());

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [category, setCategory] = useState(null);
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    description: '',
    imageUrl: '',
    active: 'ACTIVE',
  });

  useEffect(() => {
    loadCategory();
  }, [id]);

  useEffect(() => {
    if (!isStoreAdmin && searchParams.get('edit') === '1') {
      setIsEditing(true);
    }
  }, [isStoreAdmin, searchParams]);

  const loadCategory = async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await fetchCategoryDetail(id);
      setCategory(data);
      setFormData({
        code: data.code || '',
        name: data.name || '',
        description: data.description || '',
        imageUrl: data.imageUrl || '',
        active: data.active ? 'ACTIVE' : 'INACTIVE',
      });
    } catch (err) {
      console.error('카테고리 상세 조회 실패:', err);
      setError('카테고리 정보를 불러올 수 없습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = event => {
    const { name, value } = event.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSave = async event => {
    event.preventDefault();

    if (!formData.code.trim()) {
      setError('카테고리 코드는 필수입니다.');
      return;
    }
    if (!formData.name.trim()) {
      setError('카테고리명은 필수입니다.');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const updated = await updateCategory(id, {
        code: formData.code.trim(),
        name: formData.name.trim(),
        description: formData.description.trim(),
        imageUrl: formData.imageUrl.trim(),
        active: formData.active === 'ACTIVE',
      });

      setCategory(updated);
      setIsEditing(false);
    } catch (err) {
      console.error('카테고리 수정 실패:', err);
      setError(err.response?.data?.message || '카테고리 수정에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    if (!category) {
      return;
    }
    setFormData({
      code: category.code || '',
      name: category.name || '',
      description: category.description || '',
      imageUrl: category.imageUrl || '',
      active: category.active ? 'ACTIVE' : 'INACTIVE',
    });
  };

  if (loading && !category) {
    return (
      <div className="category-detail-page">
        <div className="category-detail-container">
          <div className="loading">로딩 중...</div>
        </div>
      </div>
    );
  }

  if (!category) {
    return (
      <div className="category-detail-page">
        <div className="category-detail-container">
          <div className="error-message">{error || '카테고리를 찾을 수 없습니다.'}</div>
          <button onClick={() => navigate('/product-categories')} className="back-btn">
            목록으로
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="category-detail-page">
      <div className="category-detail-container">
        <div className="detail-header">
          <h1 className="page-title">카테고리 상세</h1>
        </div>

        {error && <div className="error-message">{error}</div>}

        <div className="card detail-card">
          {isEditing ? (
            <form onSubmit={handleSave} className="category-form">
              <div className="form-group">
                <label htmlFor="code">카테고리 코드 *</label>
                <input
                  id="code"
                  name="code"
                  value={formData.code}
                  onChange={handleInputChange}
                  disabled={loading}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="name">카테고리명 *</label>
                <input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
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
                  rows={5}
                  disabled={loading}
                />
              </div>

              <div className="form-group">
                <label htmlFor="imageUrl">이미지 URL</label>
                <input
                  id="imageUrl"
                  name="imageUrl"
                  value={formData.imageUrl}
                  onChange={handleInputChange}
                  disabled={loading}
                />
              </div>

              <div className="form-group">
                <label htmlFor="active">상태</label>
                <select
                  id="active"
                  name="active"
                  value={formData.active}
                  onChange={handleInputChange}
                  disabled={loading}
                >
                  <option value="ACTIVE">활성</option>
                  <option value="INACTIVE">비활성</option>
                </select>
              </div>

              <div className="form-buttons">
                <button type="submit" disabled={loading}>
                  {loading ? '저장 중...' : '저장'}
                </button>
                <button type="button" onClick={handleCancel} disabled={loading}>
                  취소
                </button>
              </div>
            </form>
          ) : (
            <>
              <div className="detail-view detail-view-split">
                <div className="detail-image-panel">
                  {category.imageUrl ? (
                    <img
                      src={category.imageUrl}
                      alt={category.name}
                      className="category-image-preview"
                    />
                  ) : (
                    <div className="image-placeholder">이미지가 없습니다.</div>
                  )}
                </div>

                <div className="detail-info-panel">
                  <table className="category-detail-table">
                    <tbody>
                      <tr>
                        <th>카테고리 코드</th>
                        <td>{category.code || '-'}</td>
                      </tr>
                      <tr>
                        <th>카테고리명</th>
                        <td>{category.name || '-'}</td>
                      </tr>
                      <tr>
                        <th>설명</th>
                        <td>{category.description || '-'}</td>
                      </tr>
                      <tr>
                        <th>상태</th>
                        <td>{category.active ? '활성' : '비활성'}</td>
                      </tr>
                      <tr>
                        <th>생성일</th>
                        <td>{category.createdAt ? new Date(category.createdAt).toLocaleString('ko-KR') : '-'}</td>
                      </tr>
                      <tr>
                        <th>수정일</th>
                        <td>{category.updatedAt ? new Date(category.updatedAt).toLocaleString('ko-KR') : '-'}</td>
                      </tr>
                      <tr>
                        <th>상품 수</th>
                        <td>{category.products?.length || 0}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="category-products-box">
                <h3>카테고리 상품 목록</h3>
                {category.products && category.products.length > 0 ? (
                  <ul className="category-product-list">
                    {category.products.map(product => (
                      <li key={product.productId}>
                        <button
                          type="button"
                          className="product-link-btn"
                          onClick={() => navigate(`/products/${product.productId}`)}
                        >
                          {product.name}({product.sku})
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="empty-products">해당 카테고리에 속한 상품이 없습니다.</div>
                )}
              </div>

              <div className="form-buttons detail-form-buttons">
                {!isStoreAdmin && (
                  <button
                    type="button"
                    className="primary-action"
                    onClick={() => setIsEditing(true)}
                    disabled={loading}
                  >
                    수정
                  </button>
                )}
                <button type="button" onClick={() => navigate('/product-categories')}>
                  목록
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}



