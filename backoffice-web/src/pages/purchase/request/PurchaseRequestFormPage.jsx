import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../../lib/api';
import './PurchaseRequestFormPage.css';
import './purchase.css';

export default function RequestFormPage() {
  const navigate = useNavigate();
  const { storeId } = useParams();
  const [store, setStore] = useState(null);
  const [items, setItems] = useState([]);
  const [memo, setMemo] = useState('');

  useEffect(() => {
    if (!storeId) return;
    api.get(`/api/stores/${storeId}`)
      .then(res => setStore(res.data))
      .catch(err => {
        console.error(err);
        alert('매장 정보를 불러오는데 실패했습니다.');
      });
  }, [storeId]);

  const addItem = () => setItems([...items, { productCode: '', productName: '', currentStock: 0, qty: 0 }]);
  const updateItem = (idx, field, val) => {
    const tmp = [...items];
    tmp[idx][field] = val;
    setItems(tmp);
  };
  const deleteItem = idx => setItems(items.filter((_, i) => i !== idx));

  const submit = async () => {
    if (!items.length) return alert('상품을 추가해주세요');
    try {
      await api.post('/api/purchase-requests', { storeId, memo, items });
      navigate('/purchases/requests');
    } catch (e) {
      console.error(e);
      alert('발주 요청 실패');
    }
  };

  if (!store) return <div>매장 정보 로딩 중...</div>;

  return (
    <div className="purchase-page">
      <h2>발주 요청서 작성</h2>
      <button className="back-btn" onClick={() => navigate(-1)}>목록으로</button>

      <div className="store-info-box">
        <h3>매장 정보</h3>
        <p><strong>매장명:</strong> {store.name}</p>
        <p><strong>주소:</strong> {store.address}</p>
        <p><strong>담당자:</strong> {store.manager}</p>
      </div>

      <table className="erp-table">
        <thead>
          <tr>
            <th>No</th>
            <th>상품 코드</th>
            <th>상품명</th>
            <th>현재 재고</th>
            <th>발주 수량</th>
            <th>삭제</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, i) => (
            <tr key={i}>
              <td>{i + 1}</td>
              <td><input value={item.productCode} onChange={e => updateItem(i, 'productCode', e.target.value)} /></td>
              <td><input value={item.productName} onChange={e => updateItem(i, 'productName', e.target.value)} /></td>
              <td><input type="number" value={item.currentStock} readOnly /></td>
              <td><input type="number" value={item.qty} onChange={e => updateItem(i, 'qty', Number(e.target.value))} /></td>
              <td><button onClick={() => deleteItem(i)}>삭제</button></td>
            </tr>
          ))}
        </tbody>
      </table>

      <button className="submit-btn" onClick={addItem}>상품 추가</button>

      <textarea className="memo" placeholder="메모를 입력하세요" value={memo} onChange={e => setMemo(e.target.value)} />

      <button className="submit-btn" onClick={submit}>발주 요청</button>
    </div>
  );
}
