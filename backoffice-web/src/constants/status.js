export const STATUS_LABEL = {
    REQUESTED: '요청중',
    APPROVED: '승인 완료',
    REJECTED: '반려',
};

export const getMenuOptions = (currentStatus) => {
    if (currentStatus === 'REQUESTED') return ['APPROVED', 'REJECTED'];
    return [];
};
