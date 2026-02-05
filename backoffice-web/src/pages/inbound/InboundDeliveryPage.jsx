import { useEffect, useState, useCallback } from 'react';
import { fetchInboundDeliveries, updateInboundDeliveryStatus } from '@/api/inbound';
import { InboundDeliveryRow } from './InboundDeliveryRow';

export default function InboundDeliveryPage() {
    const [deliveries, setDeliveries] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        load();
    }, []);

    const load = async () => {
        setLoading(true);
        const data = await fetchInboundDeliveries();
        setDeliveries(data);
        setLoading(false);
    };

    const handleStatusChange = useCallback(async (deliveryId, nextStatus) => {
        await updateInboundDeliveryStatus(deliveryId, nextStatus);
        setDeliveries(prev =>
            prev.map(d =>
                d.id === deliveryId ? { ...d, status: nextStatus } : d
            )
        );
    }, []);

    if (loading) return <div>loading...</div>;

    return (
        <table>
            <thead>
                <tr>
                    <th>배송번호</th>
                    <th>공급처</th>
                    <th>도착지</th>
                    <th>상태</th>
                </tr>
            </thead>
            <tbody>
                {deliveries.map(d => (
                    <InboundDeliveryRow
                        key={d.id}
                        delivery={d}
                        onStatusChange={handleStatusChange}
                    />
                ))}
            </tbody>
        </table>
    );
}
