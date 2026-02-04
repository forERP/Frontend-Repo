import { memo } from 'react';
import { StatusButton } from './StatusButton';
import { getMenuOptions } from '../../../constants/status';

export const StatusMenu = memo(({ currentStatus, onChange }) => {
    const options = getMenuOptions(currentStatus);
    if (!options.length) return null;

    return (
        <div className="status-menu">
            {options.map(s => (
                <StatusButton key={s} status={s} onClick={() => onChange(s)} />
            ))}
        </div>
    );
});
