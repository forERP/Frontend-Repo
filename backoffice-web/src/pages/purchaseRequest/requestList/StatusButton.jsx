import { memo } from 'react';
import { STATUS_LABEL } from '../../../constants/status';
import './PurchaseRequestListPage.css';

export const StatusButton = memo(({ status, onClick, disabled }) => (
  <button
    className={`status-btn ${status}`}
    disabled={disabled}
    onClick={onClick}
  >
    {STATUS_LABEL[status]}
  </button>
));
