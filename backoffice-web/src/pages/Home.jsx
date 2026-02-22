import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
// import {fetchDashboardAlerts, fetchDashboardRecentOrders,fetchDashboardSummary,} from '../api/dashboardApi';
import { ORDER_STATUS } from '../constants/status';
import { subscribeAdminRealtime } from '../lib/realtime';
import './Home.css';


const LOG_TYPE_LABEL = {
  'order.changed': '주문',
  'inventory.changed': '재고',
  'payment.changed': '결제',
  connected: '연결',
};

function formatCurrency(amount) {
  return amount != null ? `${Number(amount).toLocaleString('ko-KR')}원` : '-';
}

function formatCount(count, unit = '건') {
  return count != null ? `${Number(count).toLocaleString('ko-KR')}${unit}` : '-';
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
  const d = new Date(isoString);
  return d.toLocaleString('ko-KR', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function KpiCard({ label, value, icon, color, loading }) {
  return (
    <div className={`kpi-card kpi-card--${color}`}>
      <div className="kpi-icon">{icon}</div>
      <div className="kpi-body">
        <div className="kpi-label">{label}</div>
        <div className="kpi-value">
          {loading ? <span className="kpi-skeleton" /> : value}
        </div>
      </div>
    </div>
  );
}

function AlertCard({ label, count, countUnit, description, actionLabel, onAction, urgency, loading }) {
  return (
    <div className={`alert-card alert-card--${urgency}`}>
      <div className="alert-card-header">
        <span className="alert-label">{label}</span>
        <span className="alert-count">
          {loading ? '-' : count != null ? `${count}${countUnit}` : '-'}
        </span>
      </div>
      <p className="alert-description">{description}</p>
      <button
        className={`alert-action-btn alert-action-btn--${urgency}`}
        onClick={onAction}
        disabled={loading}
      >
        {actionLabel} →
      </button>
    </div>
  );
}

export default function Home() {
  const navigate = useNavigate();

  const [summary, setSummary] = useState(null);
  const [alerts, setAlerts] = useState(null);
  const [recentOrders, setRecentOrders] = useState([]);
  const [realtimeLogs, setRealtimeLogs] = useState([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastRefreshedAt, setLastRefreshedAt] = useState(null);

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
        recentOrdersResult.status === 'fulfilled' ? (recentOrdersResult.value || []) : []
      );

      if (
        summaryResult.status === 'rejected' &&
        alertsResult.status === 'rejected' &&
        recentOrdersResult.status === 'rejected'
      ) {
        console.error('대시보드 전체 로드 실패:', summaryResult.reason);
        setError('대시보드 데이터를 불러올 수 없습니다.');
      }

      setLastRefreshedAt(new Date());
    } catch (err) {
      console.error('대시보드 로드 실패:', err);
      setError('대시보드 데이터를 불러올 수 없습니다.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  useEffect(() => {
    const unsubscribe = subscribeAdminRealtime({
      onEvent: event => {
        if (event.type === 'connected') return;

        setRealtimeLogs(prev => {
          const newLog = {
            id: Date.now() + Math.random(),
            type: event.type,
            data: event.data,
            receivedAt: new Date(),
          };
          return [newLog, ...prev].slice(0, 20);
        });
      },
      onError: err => {
        console.warn('실시간 이벤트 연결 오류:', err);
      },
    });

    return unsubscribe;
  }, []);

  const todayLabel = new Date().toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const lowStockCount = summary?.lowStockSkuCount;

  return (
    <div className="home-page">
      <div className="home-container">
        <div className="home-header">
          <div>
            <h1 className="home-title">대시보드</h1>
            <p className="home-subtitle">오늘 {todayLabel} 현황</p>
          </div>
          <div className="home-header-actions">
            {lastRefreshedAt && (
              <span className="home-refresh-time">
                마지막 업데이트: {formatTime(lastRefreshedAt)}
              </span>
            )}
            <button
              className="refresh-btn"
              onClick={loadDashboard}
              disabled={loading}
            >
              {loading ? '로딩 중...' : '새로고침'}
            </button>
          </div>
        </div>

        {error && <div className="home-error">{error}</div>}

        <section className="home-section">
          <h2 className="section-title">오늘의 현황</h2>
          <div className="kpi-grid">
            <KpiCard
              label="총 주문 수"
              value={formatCount(summary?.todayOrderCount)}
              icon="📦"
              color="blue"
              loading={loading}
            />
            <KpiCard
              label="매출액"
              value={formatCurrency(summary?.todaySalesAmount)}
              icon="💰"
              color="green"
              loading={loading}
            />
            <KpiCard
              label="출고 완료"
              value={formatCount(summary?.todayOutboundCount)}
              icon="🚚"
              color="purple"
              loading={loading}
            />
            <KpiCard
              label="입고 완료"
              value={formatCount(summary?.todayInboundCount)}
              icon="📥"
              color="teal"
              loading={loading}
            />
            <KpiCard
              label="폐기 금액"
              value={formatCurrency(summary?.todayDiscardAmount)}
              icon="🗑️"
              color="orange"
              loading={loading}
            />
            <KpiCard
              label="재고 부족 SKU"
              value={lowStockCount != null ? formatCount(lowStockCount, '개') : '-'}
              icon="⚠️"
              color={lowStockCount > 0 ? 'red' : 'gray'}
              loading={loading}
            />
          </div>
        </section>

        <section className="home-section">
          <h2 className="section-title">처리 필요 항목</h2>
          <div className="alert-grid">
            <AlertCard
              label="발주 승인 대기"
              count={alerts?.pendingPurchaseApprovalCount}
              countUnit="건"
              description="승인 대기 중인 발주 요청이 있습니다."
              actionLabel="발주 승인하러 가기"
              onAction={() => navigate('/purchase-requests')}
              urgency={alerts?.pendingPurchaseApprovalCount > 0 ? 'warning' : 'normal'}
              loading={loading}
            />
            <AlertCard
              label="재고 부족 SKU"
              count={alerts?.lowStockSkuCount}
              countUnit="개"
              description="안전재고 이하로 떨어진 SKU가 있습니다."
              actionLabel="재고 조정하러 가기"
              onAction={() => navigate('/inventory')}
              urgency={alerts?.lowStockSkuCount > 0 ? 'danger' : 'normal'}
              loading={loading}
            />
            <AlertCard
              label="지연 주문"
              count={alerts?.delayedOrderCount}
              countUnit="건"
              description="처리가 지연된 주문을 확인하세요."
              actionLabel="지연 주문 보기"
              onAction={() => navigate('/orders')}
              urgency={alerts?.delayedOrderCount > 0 ? 'warning' : 'normal'}
              loading={loading}
            />
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
                      <th>주문시간</th>
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
                  서버 이벤트를 기다리는 중...
                </div>
              ) : (
                <ul className="realtime-log-list">
                  {realtimeLogs.map(log => (
                    <li key={log.id} className="realtime-log-item">
                      <span className={`realtime-log-type type-${log.type.replace('.', '-')}`}>
                        {LOG_TYPE_LABEL[log.type] || log.type}
                      </span>
                      <span className="realtime-log-desc">
                        {log.data?.message || JSON.stringify(log.data || {})}
                      </span>
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
