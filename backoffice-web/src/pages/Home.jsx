import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BsBagCheck,
  BsBarChartLine,
  BsBoxArrowInDown,
  BsBoxSeam,
  BsClockHistory,
  BsClipboardCheck,
  BsExclamationTriangle,
  BsTruck,
} from 'react-icons/bs';
import {
  fetchDashboardAlerts,
  fetchDashboardRecentOrders,
  fetchDashboardSummary,
} from '../api/dashboardApi';
import { ORDER_STATUS } from '../constants/status';
import { subscribeAdminRealtime } from '../lib/realtime';
import { getSessionUser, isStoreAdminRole } from '../utils/auth';
import './Home.css';

const LOG_TYPE_LABEL = {
  'order.changed': '주문',
  'inventory.changed': '재고',
  'payment.changed': '결제',
  'shipment.changed': '배송',
  connected: '연결',
};

const HQ_KPI_ITEMS = [
  { key: 'todayOrderCount', label: '오늘 주문 수', Icon: BsBagCheck, color: 'blue', type: 'count', unit: '건' },
  { key: 'todaySalesAmount', label: '오늘 매출', Icon: BsBarChartLine, color: 'green', type: 'currency' },
  { key: 'todayOutboundCount', label: '오늘 출고 완료', Icon: BsTruck, color: 'purple', type: 'count', unit: '건' },
  { key: 'todayInboundCount', label: '오늘 입고 완료', Icon: BsBoxArrowInDown, color: 'teal', type: 'count', unit: '건' },
  { key: 'pendingPurchaseApprovalCount', label: '발주 승인 대기', Icon: BsClipboardCheck, color: 'orange', type: 'count', unit: '건' },
  { key: 'delayedOrderCount', label: '지연 주문', Icon: BsClockHistory, color: 'red', type: 'count', unit: '건' },
];

const STORE_KPI_ITEMS = [
  { key: 'todayOrderCount', label: '오늘 주문 수', Icon: BsBagCheck, color: 'blue', type: 'count', unit: '건' },
  { key: 'todaySalesAmount', label: '오늘 매출', Icon: BsBarChartLine, color: 'green', type: 'currency' },
  { key: 'todayOutboundCount', label: '오늘 출고 완료', Icon: BsTruck, color: 'purple', type: 'count', unit: '건' },
  { key: 'todayInboundCount', label: '오늘 입고 완료', Icon: BsBoxArrowInDown, color: 'teal', type: 'count', unit: '건' },
  { key: 'lowStockSkuCount', label: '재고 부족 SKU', Icon: BsExclamationTriangle, color: 'orange', type: 'count', unit: '개' },
  { key: 'pendingOutboundConfirmCount', label: '출고 확정 대기', Icon: BsBoxSeam, color: 'red', type: 'count', unit: '건' },
];

function formatCurrency(amount) {
  if (amount == null) return '-';
  return `${Number(amount).toLocaleString('ko-KR')}원`;
}

function formatCount(count, unit = '건') {
  if (count == null) return '-';
  return `${Number(count).toLocaleString('ko-KR')}${unit}`;
}

function formatTime(date) {
  if (!date) return '-';
  return date.toLocaleTimeString('ko-KR', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

function formatDateTime(isoString) {
  if (!isoString) return '-';
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleString('ko-KR', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function stringifyRealtimeData(data) {
  if (!data) return '-';
  if (typeof data.message === 'string' && data.message.trim()) {
    return data.message;
  }
  if (typeof data.reason === 'string' && data.reason.trim()) {
    return data.reason;
  }

  const raw = JSON.stringify(data);
  if (!raw) return '-';
  return raw.length > 80 ? `${raw.slice(0, 80)}...` : raw;
}

function KpiCard({ label, value, Icon, color, loading }) {
  return (
    <div className={`kpi-card kpi-card--${color}`}>
      <div className="kpi-icon">{Icon ? <Icon /> : null}</div>
      <div className="kpi-body">
        <div className="kpi-label">{label}</div>
        <div className="kpi-value">{loading ? <span className="kpi-skeleton" /> : value}</div>
      </div>
    </div>
  );
}

function AlertCard({
  label,
  count,
  countUnit,
  description,
  actionLabel,
  onAction,
  urgency,
  loading,
}) {
  return (
    <div className={`alert-card alert-card--${urgency}`}>
      <div className="alert-card-header">
        <span className="alert-label">{label}</span>
        <span className="alert-count">
          {loading ? '-' : count != null ? `${Number(count).toLocaleString('ko-KR')}${countUnit}` : '-'}
        </span>
      </div>
      <p className="alert-description">{description}</p>
      <button className={`alert-action-btn alert-action-btn--${urgency}`} onClick={onAction} disabled={loading}>
        {actionLabel}
      </button>
    </div>
  );
}

export default function Home() {
  const navigate = useNavigate();
  const sessionUser = useMemo(() => getSessionUser(), []);
  const isStoreAdmin = isStoreAdminRole(sessionUser?.role);

  const [summary, setSummary] = useState(null);
  const [alerts, setAlerts] = useState(null);
  const [recentOrders, setRecentOrders] = useState([]);
  const [realtimeLogs, setRealtimeLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastRefreshedAt, setLastRefreshedAt] = useState(null);

  const refreshTimerRef = useRef(null);

  const loadDashboard = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [summaryResult, alertsResult, recentOrdersResult] = await Promise.allSettled([
        fetchDashboardSummary(),
        fetchDashboardAlerts(),
        fetchDashboardRecentOrders(),
      ]);

      setSummary(summaryResult.status === 'fulfilled' ? summaryResult.value : null);
      setAlerts(alertsResult.status === 'fulfilled' ? alertsResult.value : null);
      setRecentOrders(
        recentOrdersResult.status === 'fulfilled' ? (recentOrdersResult.value || []) : [],
      );

      if (
        summaryResult.status === 'rejected'
        && alertsResult.status === 'rejected'
        && recentOrdersResult.status === 'rejected'
      ) {
        setError('대시보드 데이터를 불러오지 못했습니다.');
      }

      setLastRefreshedAt(new Date());
    } catch (loadError) {
      console.error('대시보드 로드 실패:', loadError);
      setError('대시보드 데이터를 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  }, []);

  const scheduleRefresh = useCallback(() => {
    if (refreshTimerRef.current) {
      clearTimeout(refreshTimerRef.current);
    }
    refreshTimerRef.current = setTimeout(() => {
      loadDashboard();
    }, 700);
  }, [loadDashboard]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  useEffect(() => () => {
    if (refreshTimerRef.current) {
      clearTimeout(refreshTimerRef.current);
    }
  }, []);

  useEffect(() => {
    const unsubscribe = subscribeAdminRealtime({
      storeId: isStoreAdmin ? sessionUser?.storeId : undefined,
      onEvent: event => {
        if (event.type === 'connected') {
          return;
        }

        setRealtimeLogs(prev => {
          const nextLog = {
            id: `${Date.now()}-${Math.random()}`,
            type: event.type,
            data: event.data,
            receivedAt: new Date(),
          };
          return [nextLog, ...prev].slice(0, 20);
        });

        scheduleRefresh();
      },
      onError: streamError => {
        console.warn('실시간 이벤트 연결 오류:', streamError);
      },
    });

    return unsubscribe;
  }, [isStoreAdmin, scheduleRefresh, sessionUser?.storeId]);

  const kpiItems = useMemo(() => {
    const configs = isStoreAdmin ? STORE_KPI_ITEMS : HQ_KPI_ITEMS;
    return configs.map(config => {
      const rawValue = summary?.[config.key];
      const value = config.type === 'currency'
        ? formatCurrency(rawValue)
        : formatCount(rawValue, config.unit || '건');
      return {
        ...config,
        value,
      };
    });
  }, [isStoreAdmin, summary]);

  const alertItems = useMemo(() => {
    if (isStoreAdmin) {
      return [
        {
          key: 'lowStockSkuCount',
          label: '재고 부족 SKU',
          count: alerts?.lowStockSkuCount,
          countUnit: '개',
          description: '안전재고 이하 SKU를 확인하고 재고 조정 또는 발주 요청을 진행하세요.',
          actionLabel: '재고 페이지로 이동',
          actionPath: '/inventory',
          urgency: (alerts?.lowStockSkuCount || 0) > 0 ? 'danger' : 'normal',
        },
        {
          key: 'pendingOutboundConfirmCount',
          label: '출고 확정 대기',
          count: alerts?.pendingOutboundConfirmCount,
          countUnit: '건',
          description: '생성된 출고 문서 중 확정 처리가 필요한 건입니다.',
          actionLabel: '출고 페이지로 이동',
          actionPath: '/outbounds',
          urgency: (alerts?.pendingOutboundConfirmCount || 0) > 0 ? 'warning' : 'normal',
        },
        {
          key: 'delayedOrderCount',
          label: '지연 주문',
          count: alerts?.delayedOrderCount,
          countUnit: '건',
          description: '접수 후 오래된 주문을 확인해 빠르게 처리하세요.',
          actionLabel: '주문 페이지로 이동',
          actionPath: '/orders',
          urgency: (alerts?.delayedOrderCount || 0) > 0 ? 'warning' : 'normal',
        },
      ];
    }

    return [
      {
        key: 'pendingPurchaseApprovalCount',
        label: '발주 요청 승인 대기',
        count: alerts?.pendingPurchaseApprovalCount,
        countUnit: '건',
        description: '승인 또는 반려 처리가 필요한 발주 요청 건수입니다.',
        actionLabel: '발주 승인 페이지로 이동',
        actionPath: '/purchase-approvals',
        urgency: (alerts?.pendingPurchaseApprovalCount || 0) > 0 ? 'warning' : 'normal',
      },
      {
        key: 'pendingInboundConfirmCount',
        label: '입고 확정 대기',
        count: alerts?.pendingInboundConfirmCount,
        countUnit: '건',
        description: '입고 문서 중 아직 확정되지 않은 건입니다.',
        actionLabel: '입고 페이지로 이동',
        actionPath: '/inbounds',
        urgency: (alerts?.pendingInboundConfirmCount || 0) > 0 ? 'warning' : 'normal',
      },
      {
        key: 'delayedOrderCount',
        label: '지연 주문',
        count: alerts?.delayedOrderCount,
        countUnit: '건',
        description: '접수 후 오래된 주문을 확인해 처리 지연을 줄이세요.',
        actionLabel: '주문 페이지로 이동',
        actionPath: '/orders',
        urgency: (alerts?.delayedOrderCount || 0) > 0 ? 'warning' : 'normal',
      },
    ];
  }, [alerts, isStoreAdmin]);

  const todayLabel = useMemo(
    () => new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' }),
    [],
  );

  return (
    <div className="home-page">
      <div className="home-container">
        <div className="home-header">
          <div className="home-header-intro">
            <h1 className="home-title">대시보드</h1>
            <p className="home-subtitle">
              {todayLabel} 기준 {isStoreAdmin ? '매장 운영 현황' : '전체 운영 현황'}
            </p>
          </div>

          <div className="home-header-actions">
            {lastRefreshedAt && (
              <span className="home-refresh-time">
                마지막 업데이트: {formatTime(lastRefreshedAt)}
              </span>
            )}
          </div>
        </div>

        {error && <div className="home-error">{error}</div>}

        <section className="home-section">
          <h2 className="section-title">오늘의 KPI</h2>
          <div className="kpi-grid">
            {kpiItems.map(item => (
              <KpiCard
                key={item.key}
                label={item.label}
                value={item.value}
                Icon={item.Icon}
                color={item.color}
                loading={loading}
              />
            ))}
          </div>
        </section>

        <section className="home-section">
          <h2 className="section-title">처리 필요 항목</h2>
          <div className="alert-grid">
            {alertItems.map(item => (
              <AlertCard
                key={item.key}
                label={item.label}
                count={item.count}
                countUnit={item.countUnit}
                description={item.description}
                actionLabel={item.actionLabel}
                onAction={() => navigate(item.actionPath)}
                urgency={item.urgency}
                loading={loading}
              />
            ))}
          </div>
        </section>

        <div className="home-bottom-grid">
          <section className="home-section">
            <h2 className="section-title">최근 주문</h2>
            <div className="home-card recent-orders-card">
              {loading && recentOrders.length === 0 ? (
                <div className="home-placeholder">로딩 중...</div>
              ) : recentOrders.length === 0 ? (
                <div className="home-placeholder">최근 주문이 없습니다.</div>
              ) : (
                <table className="erp-table home-table">
                  <thead>
                    <tr>
                      <th>주문번호</th>
                      <th>매장</th>
                      <th>상태</th>
                      <th>금액</th>
                      <th>주문시각</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentOrders.map(order => {
                      const statusMeta = ORDER_STATUS[order.status] || {
                        label: order.status,
                        color: '#6b7280',
                      };
                      return (
                        <tr
                          key={order.id}
                          className="clickable-row"
                          onClick={() => navigate(`/orders/${order.id}`)}
                        >
                          <td>#{order.id}</td>
                          <td>{order.storeName || '-'}</td>
                          <td>
                            <span
                              className="status-badge"
                              style={{
                                backgroundColor: `${statusMeta.color}20`,
                                color: statusMeta.color,
                              }}
                            >
                              {statusMeta.label}
                            </span>
                          </td>
                          <td>{formatCurrency(order.totalAmount)}</td>
                          <td>{formatDateTime(order.createdAt)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}

              <div className="card-footer">
                <button className="btn-secondary" onClick={() => navigate('/orders')}>
                  전체 주문 보기
                </button>
              </div>
            </div>
          </section>

          <section className="home-section">
            <h2 className="section-title">
              실시간 이벤트
              <span className="realtime-badge">LIVE</span>
            </h2>
            <div className="home-card realtime-card">
              {realtimeLogs.length === 0 ? (
                <div className="realtime-empty">
                  <span className="realtime-dot" />
                  이벤트를 수신 대기 중입니다.
                </div>
              ) : (
                <ul className="realtime-log-list">
                  {realtimeLogs.map(log => (
                    <li key={log.id} className="realtime-log-item">
                      <span className={`realtime-log-type type-${log.type.replace('.', '-')}`}>
                        {LOG_TYPE_LABEL[log.type] || log.type}
                      </span>
                      <span className="realtime-log-desc">{stringifyRealtimeData(log.data)}</span>
                      <span className="realtime-log-time">{formatTime(log.receivedAt)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
