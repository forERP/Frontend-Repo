import { useEffect, useState } from 'react';
import api from '../../lib/api';
import './InboundShipmentPage.css';

export default function InboundShipmentPage() {
    const [inbounds, setInbounds] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchInbounds();
    }, []);

    const fetchInbounds = async () => {
        try {
            setLoading(true);
            const { data } = await api.get('/api/inbounds?status=CREATED'); 
            setInbounds(data.content ?? []);
        } catch (err) {
            console.error('입고 목록 조회 실패', err);
        } finally {
            setLoading(false);
        }
    };

    const handleDepart = async (inboundId) => {
        const carrier = prompt('택배사 입력:');
        const trackingNumber = prompt('송장번호 입력:');
        if (!carrier || !trackingNumber) return;

        try {
            await api.post(`/api/inbounds/${inboundId}/shipment/depart`, { carrier, trackingNumber });
            fetchInbounds();
        } catch (err) {
            console.error('배송 출발 실패', err);
        }
    };

    const handleCancel = async (inboundId) => {
        if (!confirm('정말 입고를 취소하시겠습니까? 배송 출발 전만 가능합니다.')) return;

        try {
            await api.post(`/api/inbounds/${inboundId}/cancel`);
            fetchInbounds();
        } catch (err) {
            console.error('입고 취소 실패', err);
        }
    };

    return (
        <div className="shipment-page">
            <h1>입고 배송 현황</h1>

            {loading && <div>로딩 중...</div>}
            {!loading && inbounds.length === 0 && <div>진행 중인 입고가 없습니다.</div>}

            <table className="shipment-table">
                <thead>
                    <tr>
                        <th>입고번호</th>
                        <th>상태</th>
                        <th>배송 상태</th>
                        <th>택배사</th>
                        <th>송장번호</th>
                        <th>출발일</th>
                        <th>도착일</th>
                        <th>액션</th>
                    </tr>
                </thead>
                <tbody>
                    {inbounds.map(i => (
                        <tr key={i.inboundId}>
                            <td>{i.inboundId}</td>
                            <td>{i.status}</td>
                            <td>{i.shipment?.status}</td>
                            <td>{i.shipment?.carrier ?? '-'}</td>
                            <td>{i.shipment?.trackingNumber ?? '-'}</td>
                            <td>{i.shipment?.departedAt ?? '-'}</td>
                            <td>{i.shipment?.arrivedAt ?? '-'}</td>
                            <td>
                                {i.shipment?.status === 'READY' && (
                                    <>
                                        <button onClick={() => handleDepart(i.inboundId)}>출발</button>
                                        <button onClick={() => handleCancel(i.inboundId)}>취소</button>
                                    </>
                                )}
                                {i.shipment?.status === 'SHIPPING' && <span>배송중</span>}
                                {i.shipment?.status === 'ARRIVED' && <span>도착</span>}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
