import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../../lib/api';
import { ORDER_STATUS_LABEL } from '../../../constants/status';
import '../request/purchase.css';

export default function PurchaseHistoryListPage() {
    const navigate = useNavigate();
    const [list, setList] = useState([]);
    const [loading, setLoading] = useState(false);
    const [stores, setStores] = useState({});

    const [storeId, setStoreId] = useState('');
    const [warehouseId, setWarehouseId] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [from, setFrom] = useState('');
    const [to, setTo] = useState('');

    useEffect(() => {
        api.get('/api/stores', { params: { page: 0, size: 500 } })
            .then(({ data }) => {
                const map = {};
                (data.content || data || []).forEach(s => {
                    const id = s.storeId ?? s.id;
                    const name = s.name ?? s.storeName;
                    if (id != null) map[id] = name;
                });
                setStores(map);
            })
            .catch(() => setStores({}));
    }, []);

    const fetchList = async () => {
        setLoading(true);
        try {
            const params = { page: 0, size: 100 };
            if (storeId) params.storeId = storeId;
            if (warehouseId) params.warehouseId = warehouseId;
            if (statusFilter) params.status = statusFilter;
            if (from) params.from = from;
            if (to) params.to = to;
            const { data } = await api.get('/api/purchase-orders', { params });
            setList(data.content ?? []);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchList();
    }, [storeId, warehouseId, statusFilter, from, to]);

    return (
        <div className="purchase-page">
            <h1>발주 이력</h1>

            <div className="filter-bar">
                <input
                    type="number"
                    placeholder="창고 ID"
                    value={warehouseId}
                    onChange={e => setWarehouseId(e.target.value)}
                />
                <input type="date" value={from} onChange={e => setFrom(e.target.value)} />
                <input type="date" value={to} onChange={e => setTo(e.target.value)} />
                <button onClick={fetchList}>검색</button>
            </div>

            <table className="erp-table">
                <thead>
                    <tr>
                        <th>발주번호</th>
                        <th>요청번호</th>
                        <th>지점</th>
                        <th>창고ID</th>
                        <th>상태</th>
                        <th>생성일</th>
                        <th>발주일</th>
                        <th>상세보기</th>
                    </tr>
                </thead>
                <tbody>
                    {loading ? (
                        <tr><td colSpan={8}>로딩 중...</td></tr>
                    ) : list.length === 0 ? (
                        <tr><td colSpan={8}>발주 내역이 없습니다.</td></tr>
                    ) : (
                        list.map(row => (
                            <tr key={row.purchaseOrderId}>
                                <td>{row.purchaseOrderId}</td>
                                <td>{row.purchaseRequestId}</td>
                                <td>{stores[row.storeId] ?? `매장 ${row.storeId}`}</td>
                                <td>{row.warehouseId ?? '-'}</td>
                                <td>{ORDER_STATUS_LABEL[row.status] ?? row.status}</td>
                                <td>{row.createdAt ? new Date(row.createdAt).toLocaleString() : '-'}</td>
                                <td>{row.orderedAt ? new Date(row.orderedAt).toLocaleString() : '-'}</td>
                                <td>
                                    <button
                                        type="button"
                                        onClick={() => navigate(`/purchases/history/${row.purchaseOrderId}`)}
                                    >
                                        상세보기
                                    </button>
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
    );
}
