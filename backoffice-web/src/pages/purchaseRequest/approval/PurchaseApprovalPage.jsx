import { useEffect, useState } from 'react';
import './PurchaseApprovalPage.css';

const mockPurchaseApprovals = [
    { approvalId: 201, storeName: '서울 강남점', supplierName: 'ABC 공급업체', totalQty: 150, totalAmount: 250000, dueDate: '2026-02-15', status: '승인대기' },
    { approvalId: 202, storeName: '부산 해운대점', supplierName: 'XYZ 공급업체', totalQty: 200, totalAmount: 400000, dueDate: '2026-02-18', status: '승인완료' },
];

export default function PurchaseRequestDetailPage() {
    const [approvals, setApprovals] = useState([]);
    const [selectedApprovals, setSelectedApprovals] = useState({});
    const [filters, setFilters] = useState({ status: '', supplierName: '', dueDate: '' });
    const [menuOpen, setMenuOpen] = useState({});
    const [batchMenuOpen, setBatchMenuOpen] = useState(false);

    useEffect(() => setApprovals(mockPurchaseApprovals), []);

    const handleSelect = (approvalId) => {
        setSelectedApprovals(prev => ({ ...prev, [approvalId]: !prev[approvalId] }));
    };

    const handleFilterChange = (field, value) => setFilters(prev => ({ ...prev, [field]: value }));

    const filteredApprovals = approvals.filter(a =>
        (!filters.status || a.status === filters.status) &&
        (!filters.supplierName || a.supplierName.includes(filters.supplierName)) &&
        (!filters.dueDate || a.dueDate === filters.dueDate)
    );

    const handleStatusChange = (approvalId, newStatus) => {
        setApprovals(prev =>
            prev.map(a => a.approvalId === approvalId ? { ...a, status: newStatus } : a)
        );
        setMenuOpen(prev => ({ ...prev, [approvalId]: false }));
        setSelectedApprovals(prev => ({ ...prev, [approvalId]: false }));
    };

    const toggleAllSelection = (checked) => {
        const newSelection = {};
        filteredApprovals.forEach(a => { newSelection[a.approvalId] = checked; });
        setSelectedApprovals(newSelection);
    };

    const handleBatchStatusChange = (newStatus) => {
        setApprovals(prev =>
            prev.map(a => selectedApprovals[a.approvalId] ? { ...a, status: newStatus } : a)
        );
        setSelectedApprovals({});
        setBatchMenuOpen(false);
        alert(`${newStatus} 일괄 처리 완료 (mock)`);
    };

    return (
        <div className="purchase-detail-page">
            <h1>발주 승인</h1>

            <section className="filters">
                <input placeholder="업체명" value={filters.supplierName} onChange={e => handleFilterChange('supplierName', e.target.value)} />
                <select value={filters.status} onChange={e => handleFilterChange('status', e.target.value)}>
                    <option value="">전체 상태</option>
                    <option value="승인대기">승인대기</option>
                    <option value="승인완료">승인완료</option>
                    <option value="반려">반려</option>
                </select>
                <input type="date" value={filters.dueDate} onChange={e => handleFilterChange('dueDate', e.target.value)} />

                <div className="status-change-wrapper">
                    <button
                        className="status-btn pending"
                        disabled={!Object.values(selectedApprovals).some(Boolean)}
                        onClick={() => setBatchMenuOpen(prev => !prev)}
                    >
                        상태 변경
                    </button>
                    {batchMenuOpen && (
                        <div className="status-menu">
                            <button onClick={() => handleBatchStatusChange('승인완료')}>승인</button>
                            <button onClick={() => handleBatchStatusChange('반려')}>반려</button>
                        </div>
                    )}
                </div>
            </section>

            <table className="approval-table">
                <thead>
                    <tr>
                        <th>
                            <input
                                type="checkbox"
                                checked={filteredApprovals.length > 0 && filteredApprovals.every(a => selectedApprovals[a.approvalId])}
                                onChange={e => toggleAllSelection(e.target.checked)}
                            />
                        </th>
                        <th>승인번호</th>
                        <th>매장</th>
                        <th>업체</th>
                        <th>총수량</th>
                        <th>총금액</th>
                        <th>납기일</th>
                        <th>상태</th>
                    </tr>
                </thead>
                <tbody>
                    {filteredApprovals.map(a => (
                        <tr key={a.approvalId}>
                            <td>
                                <input
                                    type="checkbox"
                                    checked={!!selectedApprovals[a.approvalId]}
                                    onChange={() => handleSelect(a.approvalId)}
                                    disabled={a.status !== '승인대기'}
                                />
                            </td>
                            <td>{a.approvalId}</td>
                            <td>{a.storeName}</td>
                            <td>{a.supplierName}</td>
                            <td>{a.totalQty}</td>
                            <td>{a.totalAmount.toLocaleString()}원</td>
                            <td>{a.dueDate}</td>
                            <td>
                                <div className="status-wrapper">
                                    <button
                                        className={`status-btn ${a.status === '승인완료' ? 'approved' :
                                            a.status === '반려' ? 'rejected' : 'pending'
                                            }`}
                                        disabled={a.status !== '승인대기'}
                                        onClick={() => setMenuOpen(prev => ({ ...prev, [a.approvalId]: !prev[a.approvalId] }))}
                                    >
                                        {a.status}
                                    </button>
                                    {menuOpen[a.approvalId] && a.status === '승인대기' && (
                                        <div className="status-menu">
                                            <button
                                                className="status-btn approved"
                                                onClick={() => handleStatusChange(a.approvalId, '승인완료')}
                                            >
                                                승인
                                            </button>
                                            <button
                                                className="status-btn rejected"
                                                onClick={() => handleStatusChange(a.approvalId, '반려')}
                                            >
                                                반려
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
