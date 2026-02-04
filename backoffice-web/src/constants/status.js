export const STATUS_LABEL = {
    REQUESTED: '요청중',
    REVIEWING: '검토중',
    APPROVAL_PENDING: '승인 대기',
    REJECTED: '반려',
};

export const getMenuOptions = (currentStatus) => {
    if (currentStatus === 'REQUESTED') return ['REVIEWING', 'APPROVAL_PENDING', 'REJECTED'];
    if (currentStatus === 'REVIEWING') return ['APPROVAL_PENDING', 'REJECTED'];
    return [];
};
