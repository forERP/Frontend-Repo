import api from '../lib/api';

/**
 * 대시보드 오늘 KPI 요약
 * GET /api/dashboard/summary
 * Response: {
 *   todayOrderCount: number,
 *   todaySalesAmount: number,
 *   todayOutboundCount: number,
 *   todayInboundCount: number,
 *   todayDiscardAmount: number,
 *   lowStockSkuCount: number,
 * }
 */
export const fetchDashboardSummary = async () => {
  try {
    const response = await api.get('/api/dashboard/summary');
    return response.data;
  } catch (error) {
    console.error('대시보드 요약 조회 실패:', error);
    throw error;
  }
};

/**
 * 대시보드 처리 필요 알림 항목
 * GET /api/dashboard/alerts
 * Response: {
 *   pendingPurchaseApprovalCount: number,  // 발주 승인 대기 건수
 *   lowStockSkuCount: number,              // 재고 부족 SKU 수
 *   delayedOrderCount: number,             // 지연 주문 건수
 * }
 */
export const fetchDashboardAlerts = async () => {
  try {
    const response = await api.get('/api/dashboard/alerts');
    return response.data;
  } catch (error) {
    console.error('대시보드 알림 조회 실패:', error);
    throw error;
  }
};

/**
 * 최근 주문 목록 (최대 10건)
 * GET /api/dashboard/recent-orders
 * Response: Array<{
 *   id: number,
 *   storeName: string,
 *   status: string,
 *   totalAmount: number,
 *   createdAt: string,
 * }>
 */
export const fetchDashboardRecentOrders = async () => {
  try {
    const response = await api.get('/api/dashboard/recent-orders');
    return response.data;
  } catch (error) {
    console.error('최근 주문 조회 실패:', error);
    throw error;
  }
};
