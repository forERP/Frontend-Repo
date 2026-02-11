// 발주 요청 상태
export const PURCHASE_REQUEST_STATUS = {
    REQUESTED: 'REQUESTED',  // 요청중
    APPROVED: 'APPROVED',    // 승인 완료
    REJECTED: 'REJECTED',    // 반려
};

// 발주 상태
export const PURCHASE_ORDER_STATUS = {
    CREATED: 'CREATED',      // 생성됨
    ORDERED: 'ORDERED',      // 발주 완료
    RECEIVED: 'RECEIVED',    // 입고 완료
    CANCELED: 'CANCELED',    // 취소됨
};

// 입고 상태
export const INBOUND_STATUS = {
    CREATED: 'CREATED',      // 생성됨
    CONFIRMED: 'CONFIRMED',  // 확정됨
    CANCELED: 'CANCELED',    // 취소됨
};

// 배송 상태
export const SHIPMENT_STATUS = {
    READY: 'READY',          // 준비완료
    SHIPPING: 'SHIPPING',    // 배송중
    ARRIVED: 'ARRIVED',      // 배송완료
};

// 상태 라벨 (UI 표시용)
export const STATUS_LABEL = {
    // 발주 요청
    REQUESTED: '요청중',
    APPROVED: '승인 완료',
    REJECTED: '반려',
    
    // 발주
    CREATED: '생성됨',
    ORDERED: '발주 완료',
    RECEIVED: '입고 완료',
    CANCELED: '취소됨',
    
    // 입고
    CONFIRMED: '확정됨',
    
    // 배송
    READY: '준비완료',
    SHIPPING: '배송중',
    ARRIVED: '배송완료',
};

// 레거시 상태 (이전 코드 호환용)
export const ORDER_STATUS_LABEL = {
    CREATED: "생성됨",
    ORDERED: "발주 완료",
    RECEIVED: "입고 완료",
    CANCELED: "취소됨",
};