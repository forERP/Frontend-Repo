import { useState, useEffect, useMemo, useCallback } from 'react';
import { STATUS_LABEL } from '../../../constants/status';
import { PurchaseRequestRow } from './PurchaseRequestRow';
import './PurchaseRequestListPage.css';

export default function PurchaseRequestPage() {

  const mockRequests = [
    { id: 1, requestNo: 'PR-001', storeName: '강남점', productName: '원두 A', qty: 100, expectedDate: '2026-02-15', status: 'REQUESTED' },
    { id: 2, requestNo: 'PR-002', storeName: '홍대점', productName: '우유 B', qty: 50, expectedDate: '2026-02-12', status: 'REVIEWING' },
  ];
  const [requests, setRequests] = useState([]);
  const [keyword, setKeyword] = useState('');
  const [status, setStatus] = useState('');

  useEffect(() => setRequests(mockRequests), []);

  const filtered = useMemo(() => {
    return requests.filter(r => {
      if (keyword && !r.productName.includes(keyword)) return false;
      if (status && r.status !== status) return false;
      return true;
    });
  }, [requests, keyword, status]);

  const handleStatusChange = useCallback((id, newStatus) => {
    setRequests(prev =>
      prev.map(r => (r.id === id ? { ...r, status: newStatus } : r))
    );
  }, []);

  return (
    <div className="purchase-request-page">
      <h1>발주 요청</h1>
      <div className="filter-bar">
        <input placeholder="상품명 검색" value={keyword} onChange={e => setKeyword(e.target.value)} />
        <select value={status} onChange={e => setStatus(e.target.value)}>
          <option value="">전체 상태</option>
          {Object.keys(STATUS_LABEL).map(s => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
        </select>
      </div>

      <table className="request-table">
        <thead>
          <tr>
            <th>요청번호</th>
            <th>매장명</th>
            <th>상품명</th>
            <th>요청 수량</th>
            <th>희망 납기일</th>
            <th>상태</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map(r => (
            <PurchaseRequestRow key={r.id} request={r} onStatusChange={handleStatusChange} />
          ))}
        </tbody>
      </table>
    </div>
  );
}
