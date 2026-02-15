import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../../lib/api';
import { getAllStores, getAllProducts } from '../../../lib/dataApi';
import './PurchaseRequestFormPage.css';
import './purchase.css';

export default function PurchaseRequestFormPage() {
    const navigate = useNavigate();
    const [stores, setStores] = useState([]);
    const [products, setProducts] = useState([]);
    const [storeId, setStoreId] = useState('');
    const [memo, setMemo] = useState('');
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    // 매장 및 상품 목록 조회
    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const [storesData, productsData] = await Promise.all([
                    getAllStores(),
                    getAllProducts()
                ]);
                setStores(Array.isArray(storesData) ? storesData : storesData.content || []);
                setProducts(Array.isArray(productsData) ? productsData : productsData.content || []);
            } catch (err) {
                console.error('데이터 로드 실패:', err);
                alert('매장/상품 정보를 불러오는데 실패했습니다.');
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const addItem = () => {
        setItems([...items, { productId: '', qty: 0, productName: '' }]);
    };

    const removeItem = idx => {
        setItems(items.filter((_, i) => i !== idx));
    };

    const updateItem = (idx, field, value) => {
        const newItems = [...items];
        newItems[idx][field] = value;
        setItems(newItems);
    };

    const handleProductChange = (idx, productId) => {
        const product = products.find(p => String(p.id) === String(productId) || String(p.productId) === String(productId));
        const newItems = [...items];
        newItems[idx].productId = productId;
        newItems[idx].productName = product?.name || product?.productName || '';
        setItems(newItems);
    };

    const validate = () => {
        if (!storeId) {
            alert('매장을 선택해주세요');
            return false;
        }
        if (items.length === 0) {
            alert('최소 1개 이상의 상품을 입력해주세요');
            return false;
        }
        for (let item of items) {
            if (!item.productId || item.qty <= 0) {
                alert('모든 상품과 수량을 정확히 입력해주세요');
                return false;
            }
        }
        return true;
    };

    const handleSubmit = async e => {
        e.preventDefault();
        if (!validate()) return;

        setSubmitting(true);
        try {
            const request = {
                storeId: parseInt(storeId),
                memo,
                items: items.map(i => ({
                    productId: parseInt(i.productId),
                    qty: parseInt(i.qty)
                }))
            };
            const response = await api.post('/api/purchase-requests', request);
            alert('발주 요청이 생성되었습니다.');
            navigate(`/purchase-requests/${response.data.purchaseRequestId}`);
        } catch (err) {
            console.error('발주 요청 생성 실패:', err);
            alert(err.response?.data?.message || '발주 요청 생성에 실패했습니다.');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <div className="purchase-page">로딩 중...</div>;

    return (
        <div className="purchase-page">
            <div className="page-header">
                <h2>발주 요청 생성</h2>
                <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => navigate('/purchase-requests')}
                >
                    목록으로
                </button>
            </div>

            <form onSubmit={handleSubmit} className="purchase-form">
                <div className="form-group">
                    <label>매장 *</label>
                    <select value={storeId} onChange={e => setStoreId(e.target.value)} required>
                        <option value="">매장 선택</option>
                        {stores.map(s => (
                            <option key={s.storeId || s.id} value={s.storeId || s.id}>
                                {s.storeName || s.name} {s.code ? `(${s.code})` : ''}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="form-group">
                    <label>메모</label>
                    <textarea
                        value={memo}
                        onChange={e => setMemo(e.target.value)}
                        placeholder="발주 요청에 대한 메모를 입력하세요"
                        maxLength={100}
                    />
                    <small>{memo.length}/100</small>
                </div>

                <div className="form-group">
                    <label>상품 목록 *</label>
                    <table className="erp-table">
                        <thead>
                            <tr>
                                <th>No</th>
                                <th>상품</th>
                                <th>수량</th>
                                <th>삭제</th>
                            </tr>
                        </thead>
                        <tbody>
                            {items.length === 0 ? (
                                <tr><td colSpan={4}>상품을 추가해주세요</td></tr>
                            ) : items.map((item, idx) => (
                                <tr key={idx}>
                                    <td>{idx + 1}</td>
                                    <td>
                                        <select
                                            value={item.productId}
                                            onChange={e => handleProductChange(idx, e.target.value)}
                                            required
                                        >
                                            <option value="">상품 선택</option>
                                            {products.map(p => (
                                                <option key={p.id || p.productId} value={p.id || p.productId}>
                                                    {p.name || p.productName}
                                                </option>
                                            ))}
                                        </select>
                                    </td>
                                    <td>
                                        <input
                                            type="number"
                                            min={1}
                                            value={item.qty}
                                            onChange={e => updateItem(idx, 'qty', e.target.value)}
                                            required
                                        />
                                    </td>
                                    <td>
                                        <button
                                            type="button"
                                            onClick={() => removeItem(idx)}
                                            className="btn-danger"
                                        >
                                            삭제
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <button type="button" onClick={addItem} className="btn-secondary">
                    상품 추가
                </button>

                <div className="form-buttons">
                    <button type="submit" disabled={submitting}>
                        {submitting ? '생성 중...' : '발주 요청 생성'}
                    </button>
                    <button type="button" onClick={() => navigate(-1)}>
                        취소
                    </button>
                </div>
            </form>
        </div>
    );
}
