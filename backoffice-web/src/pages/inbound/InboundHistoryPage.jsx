import { useEffect, useState } from 'react';
import api from '../../lib/api';
import './InboundHistoryPage.css';

export default function InboundHistoryPage() {
    const [inbounds, setInbounds] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchInboundHistory();
    }, []);

    const fetchInboundHistory = async () => {
        try {
            setLoading(true);
            const { data } = await api.get('/api/inbounds?status=CONFIRMED');
            setInbounds(data.content ?? []);
        } catch (err) {
            console.error('입고 이력 조회 실패', err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="history-page">
            <h1>입고 완료 이력</h1>

            {loading && <div>로딩 중...</div>}
            {!loading && inbounds.length === 0 && <div>완료된 입고 내역이 없습니다.</div>}

            <table className="history-table">
                <thead>
                    <tr>
                        <th>입고번호</th>
                        <th>발주번호</th>
                        <th>상태</th>
                        <th>창고ID</th>
                        <th>입고일</th>
                        <th>상품목록</th>
                    </tr>
                </thead>
                <tbody>
                    {inbounds.map(i => (
                        <tr key={i.inboundId}>
                            <td>{i.inboundId}</td>
                            <td>{i.purchaseOrderId}</td>
                            <td>{i.status}</td>
                            <td>{i.warehouseId}</td>
                            <td>{i.createdAt}</td>
                            <td>
                                {i.items.map(it => (
                                    <div key={it.inboundItemId}>
                                        {it.productId} : {it.qty}
                                    </div>
                                ))}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
