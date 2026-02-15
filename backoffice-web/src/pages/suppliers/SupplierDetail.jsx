import { useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { fetchSupplierDetail, updateSupplier } from '../../api/supplierApi';
import './SupplierDetail.css';

export default function SupplierDetailPage() {
  const { id: supplierId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [supplier, setSupplier] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    contactName: '',
    contactPhone: '',
    contactEmail: '',
    address: '',
    active: true,
  });

  useEffect(() => {
    loadSupplierDetail();
  }, [supplierId]);

  useEffect(() => {
    if (searchParams.get('edit') === '1') {
      setIsEditing(true);
    }
  }, [searchParams]);

  const loadSupplierDetail = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchSupplierDetail(supplierId);
      setSupplier(data);
      setEditForm({
        name: data.name,
        contactName: data.contactName || '',
        contactPhone: data.contactPhone || '',
        contactEmail: data.contactEmail || '',
        address: data.address || '',
        active: data.active,
      });
    } catch (err) {
      setError('거래처 상세 조회에 실패했습니다.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleEditChange = e => {
    const { name, value } = e.target;
    setEditForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSaveEdit = async () => {
    if (!editForm.name.trim()) {
      setError('거래처명은 필수입니다.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const result = await updateSupplier(supplierId, editForm);
      setSupplier(result);
      setIsEditing(false);
    } catch (err) {
      setError('거래처 수정에 실패했습니다.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    if (supplier) {
      setEditForm({
        name: supplier.name,
        contactName: supplier.contactName || '',
        contactPhone: supplier.contactPhone || '',
        contactEmail: supplier.contactEmail || '',
        address: supplier.address || '',
        active: supplier.active,
      });
    }
  };

  if (loading && !supplier) {
    return (
      <div className="supplier-detail-page">
        <div className="supplier-detail-container">
          <h1>거래처 상세</h1>
          <div className="detail-card" style={{ minHeight: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            로딩 중...
          </div>
        </div>
      </div>
    );
  }

  if (error && !supplier) {
    return (
      <div className="supplier-detail-page">
        <div className="supplier-detail-container">
          <h1>거래처 상세</h1>
          <div className="error-message">{error}</div>
        </div>
      </div>
    );
  }

  if (!supplier) return null;

  return (
    <div className="supplier-detail-page">
      <div className="supplier-detail-container">
        <h1>거래처 상세</h1>
        {error && <div className="error-message">{error}</div>}

        <div className="detail-card">
          {isEditing ? (
            <form
              onSubmit={e => {
                e.preventDefault();
                handleSaveEdit();
              }}
            >
              <table className="erp-table">
                <tbody>
                  <tr>
                    <th>거래처명</th>
                    <td>
                      <input
                        name="name"
                        value={editForm.name}
                        onChange={handleEditChange}
                        required
                        placeholder="거래처명"
                      />
                    </td>
                  </tr>
                  <tr>
                    <th>담당자명</th>
                    <td>
                      <input
                        name="contactName"
                        value={editForm.contactName}
                        onChange={handleEditChange}
                        placeholder="담당자명"
                      />
                    </td>
                  </tr>
                  <tr>
                    <th>연락처</th>
                    <td>
                      <input
                        name="contactPhone"
                        value={editForm.contactPhone}
                        onChange={handleEditChange}
                        placeholder="연락처"
                      />
                    </td>
                  </tr>
                  <tr>
                    <th>이메일</th>
                    <td>
                      <input
                        name="contactEmail"
                        type="email"
                        value={editForm.contactEmail}
                        onChange={handleEditChange}
                        placeholder="이메일"
                      />
                    </td>
                  </tr>
                  <tr>
                    <th>주소</th>
                    <td>
                      <input
                        name="address"
                        value={editForm.address}
                        onChange={handleEditChange}
                        placeholder="주소"
                      />
                    </td>
                  </tr>
                  <tr>
                    <th>상태</th>
                    <td>
                      <select
                        name="active"
                        value={String(editForm.active)}
                        onChange={e => setEditForm(prev => ({ ...prev, active: e.target.value === 'true' }))}
                      >
                        <option value="true">활성</option>
                        <option value="false">비활성</option>
                      </select>
                    </td>
                  </tr>
                  <tr>
                    <th>생성일</th>
                    <td>{supplier.createdAt ? new Date(supplier.createdAt).toLocaleString('ko-KR') : '-'}</td>
                  </tr>
                </tbody>
              </table>

              <div className="action-buttons">
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
              <table className="erp-table">
                <tbody>
                  <tr>
                    <th>거래처명</th>
                    <td>{supplier.name}</td>
                  </tr>
                  <tr>
                    <th>담당자명</th>
                    <td>{supplier.contactName || '-'}</td>
                  </tr>
                  <tr>
                    <th>연락처</th>
                    <td>{supplier.contactPhone || '-'}</td>
                  </tr>
                  <tr>
                    <th>이메일</th>
                    <td>{supplier.contactEmail || '-'}</td>
                  </tr>
                  <tr>
                    <th>주소</th>
                    <td>{supplier.address || '-'}</td>
                  </tr>
                  <tr>
                    <th>상태</th>
                    <td>
                      <span className={`status-badge ${supplier.active ? 'active' : 'inactive'}`}>
                        {supplier.active ? '활성' : '비활성'}
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <th>생성일</th>
                    <td>{supplier.createdAt ? new Date(supplier.createdAt).toLocaleString('ko-KR') : '-'}</td>
                  </tr>
                </tbody>
              </table>

              <div className="action-buttons">
                <button onClick={() => setIsEditing(true)}>수정</button>
                <button onClick={() => navigate('/suppliers')}>목록</button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
