export const STATUS_LABEL = {
    REQUESTED: '요청중',
    APPROVED: '승인 완료',
    REJECTED: '반려',
};

export const getMenuOptions = (currentStatus) => {
    if (currentStatus === 'REQUESTED') return ['APPROVED', 'REJECTED'];
    return [];
};

export const ORDER_STATUS_LABEL = {
    CREATED: "생성됨",
    ORDERED: "발주 완료",
    RECEIVED: "입고 완료",
    CANCELED: "취소됨",
}