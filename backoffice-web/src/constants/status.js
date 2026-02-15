// 발주 요청 상태
export const PURCHASE_REQUEST_STATUS = {
  REQUESTED: { label: '요청중', color: '#F59E0B' },
  APPROVED: { label: '승인 완료', color: '#16A34A' },
  REJECTED: { label: '반려', color: '#DC2626' },
};

// 발주 상태
export const PURCHASE_ORDER_STATUS = {
  CREATED: { label: '생성됨', color: '#6C757D' },
  ORDERED: { label: '발주 완료', color: '#F59E0B' },
  RECEIVED: { label: '입고 완료', color: '#16A34A' },
  CANCELLED: { label: '취소됨', color: '#DC2626' },
};

// 입고 상태
export const INBOUND_STATUS = {
  CREATED: { label: '생성됨', color: '#6C757D' },
  CONFIRMED: { label: '확정됨', color: '#16A34A' },
  CANCELED: { label: '취소됨', color: '#DC2626' },
};

// 배송 상태
export const SHIPMENT_STATUS = {
  READY: { label: '준비완료', color: '#6C757D' },
  SHIPPING: { label: '배송중', color: '#F59E0B' },
  ARRIVED: { label: '배송완료', color: '#16A34A' },
};

// 주문 상태
export const ORDER_STATUS = {
  PLACED: { label: '주문 접수', color: '#2563EB' },
  PREPARED: { label: '준비 완료', color: '#7C3AED' },
  SHIPPED: { label: '출고 완료', color: '#F59E0B' },
  ARRIVED: { label: '수취 완료', color: '#16A34A' },
  CANCELED: { label: '취소', color: '#DC2626' },
};

// 출고 상태
export const OUTBOUND_STATUS = {
  CREATED: { label: '생성됨', color: '#6C757D' },
  CONFIRMED: { label: '확정됨', color: '#3B82F6' },
  ARRIVED: { label: '완료됨', color: '#16A34A' },
  CANCELED: { label: '취소', color: '#DC2626' },
};

// 상태 라벨 (단순 텍스트 표시용)
export const STATUS_LABEL = {
  REQUESTED: '요청중',
  APPROVED: '승인 완료',
  REJECTED: '반려',
  CREATED: '생성됨',
  ORDERED: '발주 완료',
  RECEIVED: '입고 완료',
  CANCELLED: '취소됨',
  CONFIRMED: '확정됨',
  READY: '준비완료',
  SHIPPING: '배송중',
  ARRIVED: '배송완료',
  PLACED: '주문 접수',
  PREPARED: '준비 완료',
  SHIPPED: '출고 완료',
  CANCELED: '취소',
};

// 매장 상태
export const STORE_STATUS = {
  OPEN: { label: '영업중', color: '#16A34A' },
  INACTIVE: { label: '휴무', color: '#F59E0B' },
  CLOSED: { label: '폐점', color: '#6C757D' },
};

// 거래처 상태
export const SUPPLIER_STATUS = {
  ACTIVE: { label: '활성', color: '#16A34A' },
  INACTIVE: { label: '비활성', color: '#6C757D' },
};
