import { useEffect, useState } from 'react';
import api from '../../lib/api';
import './InboundProcessPage.css';

export default function InboundProcessPage() {
    const [purchaseOrders, setPurchaseOrders] = useState([]);
    const [selectedPO, setSelectedPO] = useState(null);
    const [receivedItems, setReceivedItems] = useState({});
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchPurchaseOrders();
    }, []);

    const fetchPurchaseOrders = async () => {
        try {
            const { data } = await api.get('/api/purchase-orders?status=CREATED');
            setPurchaseOrders(data ?? []);
        } catch (err) {
            console.error('발주 목록 조회 실패', err);
        }
    };

    const handleSelectPO = (po) => {
        if (!po) return;

        setSelectedPO(po);

        const initial = {};
        (po.items ?? []).forEach(item => {
            initial[item.productId] = item.orderedQty ?? 0;
        });
        setReceivedItems(initial);
    };

    const handleQtyChange = (productId, value) => {
        setReceivedItems(prev => ({
            ...prev,
            [productId]: Math.max(0, Number(value) || 0),
        }));
    };

    const handleConfirmInbound = async () => {
        if (!selectedPO) return;

        const payload = {
            purchaseOrderId: selectedPO.id,
            storeId: selectedPO.storeId,
            warehouseId: selectedPO.warehouseId ?? 1,
            items: (selectedPO.items ?? []).map(item => ({
                productId: item.productId,
                qty: receivedItems[item.productId] ?? 0,
                unitCost: item.unitCost ?? 0,
            })),
        };

        try {
            setLoading(true);
            const { data } = await api.post('/api/inbounds', payload);
            console.log('입고 처리 완료', data);

            setSelectedPO(null);
            setReceivedItems({});
            fetchPurchaseOrders();
        } catch (err) {
            console.error('입고 처리 실패', err);
        } finally {
            setLoading(false);
        }
    };

    const handleCancelInbound = async () => {
        if (!selectedPO) return;

        try {
            setLoading(true);
            await api.post(`/api/inbounds/${selectedPO.id}/cancel`);
            console.log('입고 취소 완료');

            setSelectedPO(null);
            setReceivedItems({});
            fetchPurchaseOrders();
        } catch (err) {
            console.error('입고 취소 실패', err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="inbound-page">
            <div className="inbound-container">
                <h1 className="page-title">입고 처리</h1>

                <section className="card po-list">
                    <h2 className="section-title">승인된 발주 목록</h2>

                    {purchaseOrders.length === 0 && (
                        <div className="empty">승인된 발주가 없습니다.</div>
                    )}

                    <div className="po-grid">
                        {purchaseOrders.map(po => (
                            <div
                                key={po.id}
                                className={`po-card ${selectedPO?.id === po.id ? 'active' : ''}`}
                                onClick={() => handleSelectPO(po)}
                            >
                                <div className="po-id">발주번호 #{po.id}</div>
                                <div className="po-supplier">{po.supplierName}</div>
                                <div className="po-date">{po.expectedDate}</div>
                            </div>
                        ))}
                    </div>
                </section>

                {selectedPO && (
                    <section className="card inbound-form">
                        <h2 className="section-title">입고 수량 확정</h2>

                        <table className="inbound-table">
                            <thead>
                                <tr>
                                    <th>상품명</th>
                                    <th>발주 수량</th>
                                    <th>입고 수량</th>
                                </tr>
                            </thead>
                            <tbody>
                                {selectedPO.items.map(item => (
                                    <tr key={item.productId}>
                                        <td>{item.productName}</td>
                                        <td>{item.orderedQty}</td>
                                        <td>
                                            <input
                                                type="number"
                                                min="0"
                                                value={receivedItems[item.productId] ?? 0}
                                                onChange={(e) =>
                                                    handleQtyChange(item.productId, e.target.value)
                                                }
                                                disabled={loading}
                                            />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        <div className="actions">
                            <button
                                className="confirm-btn"
                                onClick={handleConfirmInbound}
                                disabled={loading}
                            >
                                {loading ? '처리중...' : '입고 확정'}
                            </button>

                            <button
                                className="cancel-btn"
                                onClick={handleCancelInbound}
                                disabled={loading}
                            >
                                입고 취소
                            </button>
                        </div>
                    </section>
                )}
            </div>
        </div>
    );
}
