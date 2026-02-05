import { useState, useEffect } from 'react';
import api from '../../../lib/api';
import './PurchaseRequestFormPage.css';

export default function PurchaseRequestForm({ storeId, onClose }) {
  const [items, setItems] = useState([]);
  const [memo, setMemo] = useState('');

  const [productCode, setProductCode] = useState('');
  const [productName, setProductName] = useState('');
  const [currentStock, setCurrentStock] = useState(0);
  const [qty, setQty] = useState(1);

  const addItem = () => {
    if (!productCode || !qty) return;
    setItems(prev => [...prev, { productId: productCode, productName, currentStock, qty }]);
    setProductCode(''); setProductName(''); setCurrentStock(0); setQty(1);
  };

  const removeItem = index => {
    setItems(prev => prev.filter((_, i) => i !== index));
  };

  const submitRequest = async () => {
    if (!items.length) return alert('상품을 추가하세요');
    const payload = {
      storeId,
      memo,
      items: items.map(i => ({ productId: i.productId, qty: i.qty })),
    };
    await api.post('/api/purchase-requests', payload);
    onClose();
  };

  return (
    <div style={{ border: '1px solid black', padding: 16, background: '#fff' }}>
      <h2>발주 요청서</h2>
      <div>매장: {storeId}</div>

      <table border="1" width="100%">
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
          {items.map((i, idx) => (
            <tr key={idx}>
              <td>{idx + 1}</td>
              <td>{i.productId}</td>
              <td>{i.productName}</td>
              <td>{i.currentStock}</td>
              <td>{i.qty}</td>
              <td><button onClick={() => removeItem(idx)}>삭제</button></td>
            </tr>
          ))}
        </tbody>
      </table>

      <div style={{ marginTop: 8 }}>
        <input placeholder="상품 코드" value={productCode} onChange={e => setProductCode(e.target.value)} />
        <input placeholder="상품명" value={productName} onChange={e => setProductName(e.target.value)} />
        <input type="number" placeholder="현재 재고" value={currentStock} onChange={e => setCurrentStock(Number(e.target.value))} />
        <input type="number" placeholder="발주 수량" value={qty} onChange={e => setQty(Number(e.target.value))} />
        <button onClick={addItem}>추가</button>
      </div>

      <div style={{ marginTop: 8 }}>
        <textarea
          placeholder="요청 사항 메모"
          value={memo}
          onChange={e => setMemo(e.target.value)}
          style={{ width: '100%', height: 60 }}
        />
      </div>

      <div style={{ textAlign: 'right', marginTop: 8 }}>
        <button onClick={submitRequest}>발주 요청</button>
        <button onClick={onClose} style={{ marginLeft: 8 }}>닫기</button>
      </div>
    </div>
  );
}
