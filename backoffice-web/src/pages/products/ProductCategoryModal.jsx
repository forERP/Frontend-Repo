import { useState } from 'react';
import { createCategory } from '../../api/categoryApi';
import './ProductCategoryModal.css';

export default function ProductCategoryModal({ onClose, onCategoryCreated }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    description: '',
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // 유효성 검사
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
      };

      const response = await createCategory(payload);
      
      // 부모 컴포넌트에 새로운 카테고리 추가 알림
      if (onCategoryCreated) {
        onCategoryCreated(response);
      }

      onClose();
    } catch (err) {
      console.error('카테고리 생성 실패:', err);
      setError(err.response?.data?.message || '카테고리 생성에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>새 카테고리 추가</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="category-form">
          <div className="form-group">
            <label htmlFor="code">카테고리 코드 *</label>
            <input
              type="text"
              id="code"
              name="code"
              value={formData.code}
              onChange={handleInputChange}
              placeholder="예: CLOTHING"
              disabled={loading}
              required
              maxLength="50"
            />
          </div>

          <div className="form-group">
            <label htmlFor="name">카테고리명 *</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              placeholder="예: 의류"
              disabled={loading}
              required
              maxLength="100"
            />
          </div>

          <div className="form-group">
            <label htmlFor="description">설명</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="카테고리 설명 (선택사항)"
              rows="3"
              disabled={loading}
              maxLength="255"
            />
          </div>

          <div className="form-actions">
            <button
              type="button"
              className="cancel-btn"
              onClick={onClose}
              disabled={loading}
            >
              취소
            </button>
            <button
              type="submit"
              className="submit-btn"
              disabled={loading}
            >
              {loading ? '생성 중...' : '카테고리 추가'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
