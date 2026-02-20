import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { createCategory } from '../../api/categoryApi';
import './ProductCategoryForm.css';

export default function ProductCategoryForm() {
  const navigate = useNavigate();
  const location = useLocation();

  const returnTo = location.state?.returnTo || null;
  const returnState = location.state?.returnState || null;
  const openEditOnReturn = Boolean(location.state?.openEdit);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    description: '',
    imageUrl: '',
    active: 'ACTIVE',
  });

  const handleInputChange = event => {
    const { name, value } = event.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async event => {
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

      const payload = {
        code: formData.code.trim(),
        name: formData.name.trim(),
        description: formData.description.trim(),
        imageUrl: formData.imageUrl.trim(),
        active: formData.active === 'ACTIVE',
      };

      const created = await createCategory(payload);

      if (returnTo) {
        navigate(returnTo, {
          state: {
            ...(returnState || {}),
            selectedCategoryId: created.id,
            openEdit: openEditOnReturn,
          },
        });
        return;
      }

      navigate('/product-categories');
    } catch (err) {
      console.error('카테고리 등록 실패:', err);
      setError(err.response?.data?.message || '카테고리 등록에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (returnTo) {
      navigate(returnTo, {
        state: returnState || undefined,
      });
      return;
    }
    navigate('/product-categories');
  };

  return (
    <div className="category-form-page">
      <div className="category-form-container">
        <h1 className="page-title">카테고리 등록</h1>

        <div className="card form-card">
          {error && <div className="error-message">{error}</div>}

          <form onSubmit={handleSubmit} className="category-form">
            <div className="form-group">
              <label htmlFor="code">카테고리 코드 *</label>
              <input
                id="code"
                name="code"
                value={formData.code}
                onChange={handleInputChange}
                placeholder="예: FOOD"
                disabled={loading}
                required
                maxLength={50}
              />
            </div>

            <div className="form-group">
              <label htmlFor="name">카테고리명 *</label>
              <input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="카테고리명을 입력하세요"
                disabled={loading}
                required
                maxLength={100}
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
                placeholder="카테고리 설명을 입력하세요"
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="imageUrl">이미지 URL</label>
              <input
                id="imageUrl"
                name="imageUrl"
                type="url"
                value={formData.imageUrl}
                onChange={handleInputChange}
                placeholder="https://example.com/category.jpg"
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
                {loading ? '등록 중...' : '카테고리 등록'}
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
