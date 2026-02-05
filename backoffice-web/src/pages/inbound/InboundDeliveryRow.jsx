import { memo, useState } from 'react';
import { StatusButton } from './StatusButton';
import { StatusMenu } from './StatusMenu';

export const InboundDeliveryRow = memo(({ delivery, onStatusChange }) => {
    const [open, setOpen] = useState(false);

    return (
        <tr>
            <td>{delivery.deliveryNo}</td>
            <td>{delivery.vendorName}</td>
            <td>{delivery.destination}</td>
            <td>
                <StatusButton
                    status={delivery.status}
                    onClick={() => setOpen(v => !v)}
                />
                {open && (
                    <StatusMenu
                        currentStatus={delivery.status}
                        onChange={s => {
                            onStatusChange(delivery.id, s);
                            setOpen(false);
                        }}
                    />
                )}
            </td>
        </tr>
    );
});
