import { useState, memo } from 'react';
import { StatusButton } from './StatusButton';
import { StatusMenu } from './StatusMenu';

export const PurchaseRequestRow = memo(({ request, onStatusChange }) => {
    const [menuOpen, setMenuOpen] = useState(false);
    const toggleMenu = () => setMenuOpen(prev => !prev);

    return (
        <tr>
            <td>{request.requestNo}</td>
            <td>{request.storeName}</td>
            <td>{request.productName}</td>
            <td>{request.qty}</td>
            <td>{request.expectedDate}</td>
            <td>
                <div className="status-wrapper">
                    <StatusButton
                        status={request.status}
                        disabled={!(request.status === 'REQUESTED' || request.status === 'REVIEWING')}
                        onClick={toggleMenu}
                    />
                    {menuOpen && (
                        <StatusMenu currentStatus={request.status} onChange={s => { onStatusChange(request.id, s); setMenuOpen(false); }} />
                    )}
                </div>
            </td>
        </tr>
    );
});
