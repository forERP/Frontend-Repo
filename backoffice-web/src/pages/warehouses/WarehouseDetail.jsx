import { useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { fetchWarehouse, updateWarehouse } from '../../api/warehouseApi';
import './WarehouseDetail.css';

export default function WarehouseDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [warehouse, setWarehouse] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ code: '', name: '', address: '', active: true });

  useEffect(() => {
    const loadWarehouse = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await fetchWarehouse(id);
        setWarehouse(data);
        setEditForm({
          code: data.code || '',
          name: data.name || '',
          address: data.address || '',
          active: Boolean(data.active),
        });
      } catch (err) {
        setError('창고 정보를 불러오지 못했습니다.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadWarehouse();
  }, [id]);

  useEffect(() => {
    if (searchParams.get('edit') === '1') {
      setIsEditing(true);
    }
  }, [searchParams]);

  const handleEditChange = e => {
    const { name, value } = e.target;
    setEditForm(prev => ({
      ...prev,
      [name]: name === 'active' ? value === 'true' : value,
    }));
  };

  const handleSaveEdit = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await updateWarehouse(id, {
        code: editForm.code,
        name: editForm.name,
        address: editForm.address?.trim() || null,
        active: editForm.active,
      });
      setWarehouse(result);
      setIsEditing(false);
    } catch (err) {
      setError('창고 수정에 실패했습니다.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    if (warehouse) {
      setEditForm({
        code: warehouse.code || '',
        name: warehouse.name || '',
        address: warehouse.address || '',
        active: Boolean(warehouse.active),
      });
    }
  };

  const handleMoveToInventory = () => {
    if (!warehouse?.storeId) {
      navigate('/inventory');
      return;
    }

    const params = new URLSearchParams();
    const storeKeyword = [warehouse.storeName].filter(Boolean).join(' ').trim();
    const warehouseKeyword = (warehouse.name || '').trim();

    if (storeKeyword) {
      params.set('storeKeyword', storeKeyword);
    }
    if (warehouseKeyword) {
      params.set('warehouseKeyword', warehouseKeyword);
    }

    const queryString = params.toString();
    navigate(`/stores/${warehouse.storeId}/inventory${queryString ? `?${queryString}` : ''}`);
  };

  if (loading && !warehouse) {
    return (
      <div className="warehouse-detail-page">
        <div className="warehouse-detail-container">
          <h1>창고 상세</h1>
          <div className="detail-card" style={{ minHeight: '240px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            로딩 중...
          </div>
        </div>
      </div>
    );
  }

  if (error && !warehouse) {
    return (
      <div className="warehouse-detail-page">
        <div className="warehouse-detail-container">
          <h1>창고 상세</h1>
          <div className="error-message">{error}</div>
        </div>
      </div>
    );
  }

  if (!warehouse) {
    return null;
  }

  return (
    <div className="warehouse-detail-page">
      <div className="warehouse-detail-container">
        <h1>창고 상세</h1>
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
                    <th>매장</th>
                    <td>{warehouse.storeName || '-'}</td>
                  </tr>
                  <tr>
                    <th>창고 코드</th>
                    <td>
                      <input name="code" value={editForm.code} onChange={handleEditChange} required placeholder="코드" />
                    </td>
                  </tr>
                  <tr>
                    <th>창고명</th>
                    <td>
                      <input name="name" value={editForm.name} onChange={handleEditChange} required placeholder="이름" />
                    </td>
                  </tr>
                  <tr>
                    <th>창고 주소</th>
                    <td>
                      <input name="address" value={editForm.address} onChange={handleEditChange} placeholder="주소" />
                    </td>
                  </tr>
                  <tr>
                    <th>생성일</th>
                    <td>{warehouse.createdAt ? new Date(warehouse.createdAt).toLocaleString('ko-KR') : '-'}</td>
                  </tr>
                  <tr>
                    <th>상태</th>
                    <td>
                      <select name="active" value={String(editForm.active)} onChange={handleEditChange}>
                        <option value="true">활성</option>
                        <option value="false">비활성</option>
                      </select>
                    </td>
                  </tr>
                </tbody>
              </table>

              <div className="form-buttons detail-form-buttons">
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
                    <th>매장</th>
                    <td>{warehouse.storeName || '-'}</td>
                  </tr>
                  <tr>
                    <th>창고 코드</th>
                    <td>{warehouse.code}</td>
                  </tr>
                  <tr>
                    <th>창고명</th>
                    <td>{warehouse.name}</td>
                  </tr>
                  <tr>
                    <th>창고 주소</th>
                    <td>{warehouse.address || '-'}</td>
                  </tr>
                  <tr>
                    <th>생성일</th>
                    <td>{warehouse.createdAt ? new Date(warehouse.createdAt).toLocaleString('ko-KR') : '-'}</td>
                  </tr>
                  <tr>
                    <th>상태</th>
                    <td>
                      <span className={`status-badge ${warehouse.active ? 'active' : 'inactive'}`}>
                        {warehouse.active ? '활성' : '비활성'}
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>

              <div className="form-buttons detail-form-buttons">
                <button type="button" className="primary-action" onClick={() => setIsEditing(true)}>
                  수정
                </button>
                <button type="button" onClick={handleMoveToInventory}>
                  재고관리
                </button>
                <button type="button" onClick={() => navigate('/warehouses')}>
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
