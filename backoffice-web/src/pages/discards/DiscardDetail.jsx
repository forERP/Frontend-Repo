import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { cancelDiscard, confirmDiscard, fetchDiscardDetail } from '../../api/discardApi';
import { getSessionUser, isStoreAdminUser } from '../../utils/auth';
import '../purchase/request/purchase.css';
import './DiscardDetail.css';

const DISCARD_STATUS = {
  CREATED: { label: '생성됨', color: '#6C757D' },
  CONFIRMED: { label: '확정됨', color: '#16A34A' },
  CANCELED: { label: '취소됨', color: '#DC2626' },
};

const formatDateTime = value => {
  if (!value) {
    return '-';
  }
  return new Date(value).toLocaleString('ko-KR');
};

const toStoreLabel = discard => {
  if (!discard) {
    return '-';
  }
  const name = discard.storeName || `매장 ${discard.storeId ?? '-'}`;
  return discard.storeCode ? `${name} (${discard.storeCode})` : name;
};

const toWarehouseLabel = discard => {
  if (!discard) {
    return '-';
  }
  const name = discard.warehouseName || '-';
  return discard.warehouseCode ? `${name} (${discard.warehouseCode})` : name;
};

export default function DiscardDetail() {
  const navigate = useNavigate();
  const { id } = useParams();
  const sessionUser = getSessionUser();
  const isStoreAdmin = isStoreAdminUser(sessionUser);
  const scopedStoreId = isStoreAdmin && sessionUser?.storeId ? Number(sessionUser.storeId) : null;

  const [discard, setDiscard] = useState(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadDetail();
  }, [id, scopedStoreId]);

  const loadDetail = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await fetchDiscardDetail(id);
      if (scopedStoreId != null && Number(data?.storeId) !== scopedStoreId) {
        setDiscard(null);
        setError('본인 매장 폐기만 조회할 수 있습니다.');
        return;
      }
      setDiscard(data);
    } catch (err) {
      console.error(err);
      setError('폐기 상세 조회에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async () => {
    if (!discard || discard.status !== 'CREATED') {
      return;
    }
    if (!window.confirm('폐기를 확정하시겠습니까?')) {
      return;
    }

    try {
      setSubmitting(true);
      const updated = await confirmDiscard(discard.discardId);
      setDiscard(updated);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || '폐기 확정에 실패했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = async () => {
    if (!discard || discard.status !== 'CREATED') {
      return;
    }
    if (!window.confirm('폐기를 취소하시겠습니까?')) {
      return;
    }

    try {
      setSubmitting(true);
      const updated = await cancelDiscard(discard.discardId);
      setDiscard(updated);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || '폐기 취소에 실패했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="purchase-page">
      <div className="page-header">
        <h2>폐기 상세</h2>
      </div>

      {error && <div className="error-message">{error}</div>}

      {loading ? (
        <div className="card list-card">로딩 중...</div>
      ) : !discard ? (
        <div className="card list-card">데이터가 없습니다.</div>
      ) : (
        <>
          <div className="card discard-detail-card">
            <table className="erp-table discard-info-table">
              <tbody>
                <tr>
                  <th>폐기번호</th>
                  <td>{discard.discardId}</td>
                  <th>상태</th>
                  <td>
                    <span
                      className="status-badge"
                      style={{
                        backgroundColor: DISCARD_STATUS[discard.status]?.color || '#6C757D',
                        color: '#fff',
                      }}
                    >
                      {DISCARD_STATUS[discard.status]?.label || discard.status || '-'}
                    </span>
                  </td>
                </tr>
                <tr>
                  <th>매장</th>
                  <td>{toStoreLabel(discard)}</td>
                  <th>창고</th>
                  <td>{toWarehouseLabel(discard)}</td>
                </tr>
                <tr>
                  <th>생성자</th>
                  <td>{discard.createdByName || '-'}</td>
                  <th>폐기사유</th>
                  <td>{discard.reason || '-'}</td>
                </tr>
                <tr>
                  <th>생성일</th>
                  <td>{formatDateTime(discard.createdAt)}</td>
                  <th>확정일</th>
                  <td>{formatDateTime(discard.discardedAt)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="card list-card">
            <h3 className="discard-items-title">폐기 상품</h3>
            <table className="erp-table list-table discard-detail-items-table">
              <thead>
                <tr>
                  <th>상품코드</th>
                  <th>상품명</th>
                  <th>수량</th>
                </tr>
              </thead>
              <tbody>
                {(discard.items || []).length === 0 ? (
                  <tr>
                    <td colSpan={3} className="empty-cell">
                      등록된 상품이 없습니다.
                    </td>
                  </tr>
                ) : (
                  discard.items.map(item => (
                    <tr key={item.discardItemId}>
                      <td title={item.productSku || '-'}>{item.productSku || '-'}</td>
                      <td title={item.productName || '-'}>{item.productName || '-'}</td>
                      <td title={String(item.qty ?? 0)}>{item.qty ?? 0}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="discard-detail-actions">
            {discard.status === 'CREATED' && (
              <>
                <button className="btn-primary" onClick={handleConfirm} disabled={submitting}>
                  {submitting ? '처리 중...' : '폐기 확정'}
                </button>
                <button className="btn-danger" onClick={handleCancel} disabled={submitting}>
                  {submitting ? '처리 중...' : '폐기 취소'}
                </button>
              </>
            )}
            <button className="btn-secondary" onClick={() => navigate('/discards')} disabled={submitting}>
              목록으로
            </button>
          </div>
        </>
      )}
    </div>
  );
}
