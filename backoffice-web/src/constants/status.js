// 발주 요청 상태
export const PURCHASE_REQUEST_STATUS = {
    REQUESTED: { label: '요청중', color: '#FFA500' },
    APPROVED: { label: '승인 완료', color: '#28A745' },
    REJECTED: { label: '반려', color: '#DC3545' },
};

// 발주 상태
export const PURCHASE_ORDER_STATUS = {
    CREATED: { label: '생성됨', color: '#6C757D' },
    ORDERED: { label: '발주 완료', color: '#FFC107' },
    RECEIVED: { label: '입고 완료', color: '#28A745' },
    CANCELLED: { label: '취소됨', color: '#DC3545' },
};

// 입고 상태
export const INBOUND_STATUS = {
    CREATED: { label: '생성됨', color: '#6C757D' },
    CONFIRMED: { label: '확정됨', color: '#28A745' },
    CANCELED: { label: '취소됨', color: '#DC3545' },
};

// 배송 상태
export const SHIPMENT_STATUS = {
    READY: { label: '준비완료', color: '#6C757D' },
    SHIPPING: { label: '배송중', color: '#FFC107' },
    ARRIVED: { label: '배송완료', color: '#28A745' },
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
    CANCELLED: '취소됨',
    
    // 입고
    CONFIRMED: '확정됨',
    
    // 배송
    READY: '준비완료',
    SHIPPING: '배송중',
    ARRIVED: '배송완료',
};

// 매장 상태
export const STORE_STATUS = {
    OPEN: { label: '영업중', color: '#28A745' },
    INACTIVE: { label: '휴무', color: '#FFC107' },
    CLOSED: { label: '폐점', color: '#6C757D' },
};

