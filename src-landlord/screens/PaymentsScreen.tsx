import { useEffect, useMemo, useState } from 'react';
import type { Payment, PaymentStatus, Unit } from '../data';
import { formatPeso } from '../data';
import Header from '../components/Header';
import type { HeaderNotification } from '../components/Header';
import ProfilePeekModal from '../../src/components/ProfilePeekModal';

interface Props {
  payments: Payment[];
  units: Unit[];
  onMarkPaid: (id: number) => void;
  onRemind: (id: number) => void;
  onOpenProfile: () => void;
  notifications: HeaderNotification[];
  onOpenNotification: (notification: HeaderNotification) => void;
  onShowToast: (msg: string) => void;
}

type Filter = 'All' | PaymentStatus;
const FILTERS: Filter[] = ['All', 'Paid', 'Due', 'Overdue'];

function StatusBadge({ status }: { status: PaymentStatus }) {
  const cls = status === 'Paid' ? 'st-paid' : status === 'Due' ? 'st-due' : 'st-overdue';
  return <span className={`status-badge ${cls}`}>{status}</span>;
}

function TooltipBubble({ title, lines }: { title: string; lines: string[] }) {
  return (
    <div className="payment-hover-tooltip" role="tooltip">
      <div className="payment-hover-tooltip-title">{title}</div>
      {lines.map((line) => (
        <div key={line} className="payment-hover-tooltip-line">{line}</div>
      ))}
    </div>
  );
}

function buildMonthlyTrendSeries(baseTotals: number[]) {
  const endMonth = new Date(2026, 6, 1);
  const totalMonths = 18;
  const actualWindowStart = totalMonths - baseTotals.length;

  return Array.from({ length: totalMonths }, (_, index) => {
    const monthDate = new Date(endMonth.getFullYear(), endMonth.getMonth() - (totalMonths - 1 - index), 1);
    const label = monthDate.toLocaleDateString('en-US', { month: 'short' });
    const value = index >= actualWindowStart
      ? baseTotals[index - actualWindowStart]
      : Math.max(
          1800,
          Math.round(
            baseTotals[index % baseTotals.length]
            - (actualWindowStart - index) * 120
            + (((index + 2) % 5) - 2) * 140,
          ),
        );

    return {
      label,
      date: monthDate,
      value,
    };
  });
}

function buildCollectionSummarySeries(monthlySeries: ReturnType<typeof buildMonthlyTrendSeries>, paymentCount: number, currentSnapshot: {
  collected: number;
  expected: number;
  dueSoonTotal: number;
  overdueTotal: number;
  paidCount: number;
}) {
  return monthlySeries.map((item, index) => {
    if (index === monthlySeries.length - 1) {
      return {
        ...item,
        collected: currentSnapshot.collected,
        expected: currentSnapshot.expected,
        dueSoonTotal: currentSnapshot.dueSoonTotal,
        overdueTotal: currentSnapshot.overdueTotal,
        paidCount: currentSnapshot.paidCount,
      };
    }

    const ratio = 0.72 + ((index % 6) * 0.045);
    const expected = Math.max(item.value, Math.round(item.value / Math.min(ratio, 0.96)));
    const gap = Math.max(expected - item.value, 0);
    const overdueShare = 0.38 + ((index + 1) % 3) * 0.12;
    const overdueTotal = Math.round(gap * overdueShare);
    const dueSoonTotal = Math.max(gap - overdueTotal, 0);
    const paidCount = Math.min(paymentCount, Math.max(1, Math.round(paymentCount * Math.min((item.value / Math.max(expected, 1)) + 0.08, 1))));

    return {
      ...item,
      collected: item.value,
      expected,
      dueSoonTotal,
      overdueTotal,
      paidCount,
    };
  });
}

export default function PaymentsScreen({ payments, units, onMarkPaid, onRemind, onOpenProfile, notifications, onOpenNotification, onShowToast }: Props) {
  const [filter, setFilter] = useState<Filter>('All');
  const [selectedPaymentId, setSelectedPaymentId] = useState<number | null>(null);
  const [profilePeekPaymentId, setProfilePeekPaymentId] = useState<number | null>(null);
  const [collectionMonthIndex, setCollectionMonthIndex] = useState(0);
  const [paymentTrendWindowStart, setPaymentTrendWindowStart] = useState(0);

  const filtered = filter === 'All' ? payments : payments.filter(p => p.status === filter);
  const unitTitle = (id: number) => units.find(u => u.id === id)?.title ?? '';
  const selectedPayment = payments.find(payment => payment.id === selectedPaymentId) ?? null;
  const profilePeekPayment = payments.find(payment => payment.id === profilePeekPaymentId) ?? null;

  const collected = payments.filter(p => p.status === 'Paid').reduce((s, p) => s + p.amount, 0);
  const expected = payments.reduce((s, p) => s + p.amount, 0);
  const overdueTotal = payments.filter(p => p.status === 'Overdue').reduce((s, p) => s + p.amount, 0);
  const dueSoonTotal = payments.filter(p => p.status === 'Due').reduce((s, p) => s + p.amount, 0);
  const paidCount = payments.filter(p => p.status === 'Paid').length;
  const baseMonthlyTotals = Array.from({ length: 6 }, (_, index) => payments.reduce((sum, payment) => sum + (payment.monthlyTrend[index] ?? 0), 0));
  const monthlyTrendSeries = useMemo(() => buildMonthlyTrendSeries(baseMonthlyTotals), [baseMonthlyTotals]);
  const collectionSummarySeries = useMemo(
    () => buildCollectionSummarySeries(monthlyTrendSeries, payments.length, { collected, expected, dueSoonTotal, overdueTotal, paidCount }),
    [collected, dueSoonTotal, expected, monthlyTrendSeries, overdueTotal, paidCount, payments.length],
  );
  useEffect(() => {
    setCollectionMonthIndex(Math.max(collectionSummarySeries.length - 1, 0));
  }, [collectionSummarySeries.length]);
  const [trendWindowStart, setTrendWindowStart] = useState(() => Math.max(monthlyTrendSeries.length - 6, 0));
  const visibleMonthlyTrend = monthlyTrendSeries.slice(trendWindowStart, trendWindowStart + 6);
  const maxMonthlyTotal = Math.max(...visibleMonthlyTrend.map((item) => item.value), 1);
  const canViewOlderTrend = trendWindowStart > 0;
  const canViewNewerTrend = trendWindowStart + 6 < monthlyTrendSeries.length;
  const methodBreakdown = [
    { label: 'Bank', value: payments.filter(p => p.method === 'Bank transfer').reduce((sum, payment) => sum + payment.amount, 0) },
    { label: 'GCash', value: payments.filter(p => p.method === 'GCash').reduce((sum, payment) => sum + payment.amount, 0) },
    { label: 'Cash', value: payments.filter(p => p.method === 'Cash deposit').reduce((sum, payment) => sum + payment.amount, 0) },
  ];
  const maxMethodValue = Math.max(...methodBreakdown.map(item => item.value), 1);
  const collectionSeries = payments.map(payment => ({
    id: payment.id,
    label: payment.tenant.split(' ')[0],
    tenant: payment.tenant,
    value: payment.amount,
    status: payment.status,
    method: payment.method,
  }));
  const maxCollectionValue = Math.max(...collectionSeries.map(item => item.value), 1);
  const largestMethod = methodBreakdown.reduce((top, item) => (item.value > top.value ? item : top), methodBreakdown[0]);
  const activeCollectionMonth = collectionSummarySeries[collectionMonthIndex] ?? collectionSummarySeries[collectionSummarySeries.length - 1];
  const collectionGap = Math.max((activeCollectionMonth?.expected ?? expected) - (activeCollectionMonth?.collected ?? collected), 0);
  const activeCollected = activeCollectionMonth?.collected ?? collected;
  const activeExpected = activeCollectionMonth?.expected ?? expected;
  const activeDueSoonTotal = activeCollectionMonth?.dueSoonTotal ?? dueSoonTotal;
  const activeOverdueTotal = activeCollectionMonth?.overdueTotal ?? overdueTotal;
  const activePaidCount = activeCollectionMonth?.paidCount ?? paidCount;
  const pct = activeExpected > 0 ? Math.round((activeCollected / activeExpected) * 100) : 0;
  const paidRate = payments.length > 0 ? Math.round((activePaidCount / payments.length) * 100) : 0;
  const selectedPaymentTrendSeries = useMemo(
    () => (selectedPayment ? buildMonthlyTrendSeries(selectedPayment.monthlyTrend) : []),
    [selectedPayment],
  );
  useEffect(() => {
    if (!selectedPaymentTrendSeries.length) return;
    setPaymentTrendWindowStart(Math.max(selectedPaymentTrendSeries.length - 6, 0));
  }, [selectedPayment?.id, selectedPaymentTrendSeries]);
  const visibleSelectedPaymentTrend = selectedPaymentTrendSeries.slice(paymentTrendWindowStart, paymentTrendWindowStart + 6);
  const selectedPaymentTrendMax = Math.max(...visibleSelectedPaymentTrend.map((item) => item.value), 1);
  const canViewOlderPaymentTrend = paymentTrendWindowStart > 0;
  const canViewNewerPaymentTrend = paymentTrendWindowStart + 6 < selectedPaymentTrendSeries.length;

  return (
    <>
      <Header onOpenProfile={onOpenProfile} notifications={notifications} onOpenNotification={onOpenNotification} />

      <div className="scroll-area">
        {/* Month summary */}
        <div className="ll-card payment-summary-card" style={{ marginTop: 12 }}>
          <div className="payment-summary-head">
            <div className="payment-summary-copy">
              <span className="ll-card-title">{activeCollectionMonth ? `${activeCollectionMonth.date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })} collection` : 'Collection'}</span>
              <span className="payment-summary-value">{formatPeso(activeCollected)} <small>of {formatPeso(activeExpected)}</small></span>
            </div>
            <div className="calendar-nav payment-summary-nav">
              <div className="calendar-nav-group" aria-label="Collection month navigation">
                <button
                  type="button"
                  className="calendar-arrow-btn"
                  aria-label="Previous collection month"
                  disabled={collectionMonthIndex === 0}
                  onClick={() => setCollectionMonthIndex((current) => Math.max(current - 1, 0))}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="15 18 9 12 15 6" />
                  </svg>
                </button>
                <strong>{activeCollectionMonth?.date.toLocaleDateString('en-US', { month: 'long' })}</strong>
                <button
                  type="button"
                  className="calendar-arrow-btn"
                  aria-label="Next collection month"
                  disabled={collectionMonthIndex === collectionSummarySeries.length - 1}
                  onClick={() => setCollectionMonthIndex((current) => Math.min(current + 1, collectionSummarySeries.length - 1))}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </button>
              </div>
              <div className="calendar-nav-group" aria-label="Collection year navigation">
                <button
                  type="button"
                  className="calendar-arrow-btn"
                  aria-label="Previous collection year"
                  disabled={collectionSummarySeries.findIndex((item) => item.date.getFullYear() === (activeCollectionMonth?.date.getFullYear() ?? 0) - 1) === -1}
                  onClick={() => {
                    const targetYear = (activeCollectionMonth?.date.getFullYear() ?? 0) - 1;
                    const targetIndex = collectionSummarySeries.findIndex((item) => item.date.getFullYear() === targetYear && item.date.getMonth() === (activeCollectionMonth?.date.getMonth() ?? 0));
                    if (targetIndex >= 0) setCollectionMonthIndex(targetIndex);
                  }}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="15 18 9 12 15 6" />
                  </svg>
                </button>
                <strong>{activeCollectionMonth?.date.getFullYear()}</strong>
                <button
                  type="button"
                  className="calendar-arrow-btn"
                  aria-label="Next collection year"
                  disabled={collectionSummarySeries.findIndex((item) => item.date.getFullYear() === (activeCollectionMonth?.date.getFullYear() ?? 0) + 1) === -1}
                  onClick={() => {
                    const targetYear = (activeCollectionMonth?.date.getFullYear() ?? 0) + 1;
                    const targetIndex = collectionSummarySeries.findIndex((item) => item.date.getFullYear() === targetYear && item.date.getMonth() === (activeCollectionMonth?.date.getMonth() ?? 0));
                    if (targetIndex >= 0) setCollectionMonthIndex(targetIndex);
                  }}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
          <div className="progress-track">
            <div className="progress-fill" style={{ width: `${pct}%` }} />
          </div>
          <div className="progress-label">{pct}% collected</div>
          <div className="payment-kpi-grid">
            <div className="payment-kpi-card payment-tooltip-anchor" tabIndex={0}>
              <strong>{formatPeso(activeDueSoonTotal)}</strong>
              <span>Due this week</span>
              <TooltipBubble
                title="Due this week"
                lines={[
                  `${Math.max(payments.filter(p => p.status === 'Due').length - (collectionSummarySeries.length - 1 - collectionMonthIndex), 0)} unsettled log${Math.max(payments.filter(p => p.status === 'Due').length - (collectionSummarySeries.length - 1 - collectionMonthIndex), 0) === 1 ? '' : 's'}`,
                  `Collection gap remaining: ${formatPeso(collectionGap)}`,
                ]}
              />
            </div>
            <div className="payment-kpi-card payment-kpi-alert payment-tooltip-anchor" tabIndex={0}>
              <strong>{formatPeso(activeOverdueTotal)}</strong>
              <span>Overdue balance</span>
              <TooltipBubble
                title="Overdue balance"
                lines={[
                  `${Math.max(payments.filter(p => p.status === 'Overdue').length - Math.floor((collectionSummarySeries.length - 1 - collectionMonthIndex) / 2), 0)} overdue account${Math.max(payments.filter(p => p.status === 'Overdue').length - Math.floor((collectionSummarySeries.length - 1 - collectionMonthIndex) / 2), 0) === 1 ? '' : 's'}`,
                  `Largest overdue exposure: ${formatPeso(Math.max(Math.round(activeOverdueTotal * 0.68), 0))}`,
                ]}
              />
            </div>
            <div className="payment-kpi-card payment-tooltip-anchor" tabIndex={0}>
              <strong>{activePaidCount}</strong>
              <span>Paid logs posted</span>
              <TooltipBubble
                title="Paid logs"
                lines={[
                  `${paidRate}% of this cycle already settled`,
                  `${formatPeso(collected)} cleared into landlord accounts`,
                ]}
              />
            </div>
          </div>
          <div className="payment-analytics-grid">
            <div className="payment-analytics-card">
              <div className="payment-analytics-title-row">
                <div className="payment-analytics-title">Monthly trend</div>
                <div className="payment-tooltip-anchor payment-info-trigger" tabIndex={0} aria-label="Monthly trend details">
                  i
                  <TooltipBubble
                    title="Monthly trend"
                    lines={[
                      `Tracks a rolling 6-month mock collection window`,
                      `${visibleMonthlyTrend[0]?.label} to ${visibleMonthlyTrend[visibleMonthlyTrend.length - 1]?.label} ${visibleMonthlyTrend[visibleMonthlyTrend.length - 1]?.date.getFullYear() ?? ''}`,
                    ]}
                  />
                </div>
              </div>
              <div className="payment-trend-shell">
                <button
                  type="button"
                  className="bar-nav-btn payment-trend-nav"
                  aria-label="Show previous 6-month payment trend window"
                  disabled={!canViewOlderTrend}
                  onClick={() => setTrendWindowStart((current) => Math.max(current - 1, 0))}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="15 18 9 12 15 6" />
                  </svg>
                </button>
                <div className="payment-mini-chart">
                {visibleMonthlyTrend.map((item, index) => (
                  <button
                    key={`${item.label}-${item.date.getFullYear()}-${index}`}
                    type="button"
                    className="payment-mini-col payment-mini-col-button"
                    onClick={() => onShowToast(`${item.label} ${item.date.getFullYear()} · ${formatPeso(item.value)} collected`)}
                  >
                    <div className="payment-mini-tip">{formatPeso(item.value)}</div>
                    <div className="payment-mini-bar-wrap">
                      <div
                        className={`payment-mini-bar ${index === visibleMonthlyTrend.length - 1 ? 'is-current' : ''}`}
                        style={{ height: `${Math.max((item.value / maxMonthlyTotal) * 100, 12)}%` }}
                      />
                    </div>
                    <div className="payment-mini-label">{item.label}</div>
                    <TooltipBubble
                      title={`${item.label} ${item.date.getFullYear()} collections`}
                      lines={[
                        `${formatPeso(item.value)} total posted`,
                        `${index === 0 ? 'Start of this visible trend window' : `${formatPeso(item.value - visibleMonthlyTrend[index - 1].value)} vs previous month`}`,
                      ]}
                    />
                  </button>
                ))}
                </div>
                <button
                  type="button"
                  className="bar-nav-btn payment-trend-nav"
                  aria-label="Show next 6-month payment trend window"
                  disabled={!canViewNewerTrend}
                  onClick={() => setTrendWindowStart((current) => Math.min(current + 1, monthlyTrendSeries.length - 6))}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </button>
              </div>
            </div>
            <div className="payment-analytics-card">
              <div className="payment-analytics-title-row">
                <div className="payment-analytics-title">Collection by method</div>
                <div className="payment-tooltip-anchor payment-info-trigger" tabIndex={0} aria-label="Collection by method details">
                  i
                  <TooltipBubble
                    title="Collection by method"
                    lines={[
                      `Largest payment rail: ${largestMethod.label}`,
                      `${formatPeso(largestMethod.value)} routed through that channel`,
                    ]}
                  />
                </div>
              </div>
              <div className="payment-method-list">
                {methodBreakdown.map(item => (
                  <div key={item.label} className="payment-method-row payment-tooltip-anchor" tabIndex={0}>
                    <div className="payment-method-label">{item.label}</div>
                    <div className="payment-method-bar">
                      <div className="payment-method-fill" style={{ width: `${(item.value / maxMethodValue) * 100}%` }} />
                    </div>
                    <div className="payment-method-value">{formatPeso(item.value)}</div>
                    <TooltipBubble
                      title={`${item.label} channel`}
                      lines={[
                        `${formatPeso(item.value)} assigned to this method`,
                        `${Math.round((item.value / expected) * 100)}% of total expected collections`,
                      ]}
                    />
                  </div>
                ))}
              </div>
            </div>
            <div className="payment-analytics-card payment-analytics-card-wide">
              <div className="payment-analytics-title-row">
                <div className="payment-analytics-title">Per-listing collection snapshot</div>
                <div className="payment-tooltip-anchor payment-info-trigger" tabIndex={0} aria-label="Per-listing collection details">
                  i
                  <TooltipBubble
                    title="Per-listing snapshot"
                    lines={[
                      `Compares current cycle payment logs by tenant`,
                      `Color indicates paid, due, or overdue state`,
                    ]}
                  />
                </div>
              </div>
              <div className="payment-mini-chart payment-mini-chart-tight">
                {collectionSeries.map(item => (
                  <button
                    key={item.id}
                    type="button"
                    className="payment-mini-col payment-mini-col-button"
                    onClick={() => setSelectedPaymentId(item.id)}
                  >
                    <div className="payment-mini-tip">{formatPeso(item.value)}</div>
                    <div className="payment-mini-bar-wrap">
                      <div
                        className={`payment-mini-bar payment-status-${item.status.toLowerCase()}`}
                        style={{ height: `${Math.max((item.value / maxCollectionValue) * 100, 12)}%` }}
                      />
                    </div>
                    <div className="payment-mini-label">{item.label}</div>
                    <TooltipBubble
                      title={item.tenant}
                      lines={[
                        `${item.method} · ${item.status}`,
                        `${formatPeso(item.value)} booked for this cycle`,
                      ]}
                    />
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="search-filter-chips payment-filter-chips">
          {FILTERS.map(f => (
            <button key={f} className={`filter-chip ${filter === f ? 'active' : ''}`} onClick={() => setFilter(f)}>
              {f}
            </button>
          ))}
        </div>

        <div className="payment-list">
          {filtered.map(p => (
            <div
              key={p.id}
              className="payment-row payment-row-clickable"
              role="button"
              tabIndex={0}
              onClick={() => setSelectedPaymentId(p.id)}
              onKeyDown={event => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  setSelectedPaymentId(p.id);
                }
              }}
            >
              <button
                type="button"
                className="inbox-avatar inbox-avatar-button"
                onClick={event => {
                  event.stopPropagation();
                  setProfilePeekPaymentId(p.id);
                }}
                aria-label={`View ${p.tenant} profile`}
              >
                <img src={p.avatar ?? ''} alt={p.tenant} />
              </button>
              <div className="payment-info">
                <div className="payment-name">{p.tenant}</div>
                <div className="listing-id-row">
                  <span className="entity-id-tag">{p.tenantId}</span>
                  <span className={`roomie-score-chip is-${p.trust.roomieTemperature.toLowerCase()}`}>{p.trust.roomieTemperature === 'Cool' ? '❄️' : p.trust.roomieTemperature === 'Warm' ? '🌤️' : '🔥'} Roomie {p.trust.roomieScore}</span>
                </div>
                <div className="payment-unit">{unitTitle(p.unitId)} · {p.dueLabel} · {p.method}</div>
              </div>
              <div className="payment-right">
                <div className="payment-amount">{formatPeso(p.amount)}</div>
                <StatusBadge status={p.status} />
              </div>
              {p.status !== 'Paid' && (
                <div className="payment-actions">
                  <button
                    className="unit-btn unit-btn-primary"
                    onClick={event => {
                      event.stopPropagation();
                      onMarkPaid(p.id);
                      onShowToast(`✅ ${formatPeso(p.amount)} recorded from ${p.tenant}`);
                    }}
                  >
                    Mark paid
                  </button>
                  <button
                    className="unit-btn"
                    disabled={p.reminded}
                    onClick={event => {
                      event.stopPropagation();
                      onRemind(p.id);
                      onShowToast(`🔔 Reminder sent to ${p.tenant}`);
                    }}
                  >
                    {p.reminded ? 'Reminded ✓' : 'Remind'}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>

        <div style={{ height: 16 }} />
      </div>

      {selectedPayment && (
        <div className="listing-modal-overlay" onClick={() => setSelectedPaymentId(null)}>
          <div className="listing-modal payment-modal" onClick={event => event.stopPropagation()}>
            <div className="listing-modal-head">
              <div className="payment-modal-identity">
                <div className="inbox-avatar payment-modal-avatar">
                  <img src={selectedPayment.avatar ?? ''} alt={selectedPayment.tenant} />
                </div>
                <div>
                <div className="listing-modal-topline">Payment log</div>
                <h3>{selectedPayment.tenant}</h3>
                <div className="listing-id-row listing-id-row-modal">
                  <span className="entity-id-tag">{selectedPayment.tenantId}</span>
                  <span className={`roomie-score-chip is-${selectedPayment.trust.roomieTemperature.toLowerCase()}`}>{selectedPayment.trust.roomieTemperature === 'Cool' ? '❄️' : selectedPayment.trust.roomieTemperature === 'Warm' ? '🌤️' : '🔥'} Roomie {selectedPayment.trust.roomieScore}</span>
                </div>
                <p>{unitTitle(selectedPayment.unitId)}</p>
                </div>
              </div>
              <button className="listing-modal-close" onClick={() => setSelectedPaymentId(null)} aria-label="Close payment log">
                ×
              </button>
            </div>
            <div className="listing-modal-body">
              <div className="listing-modal-price-row">
                <span className="listing-modal-price">{formatPeso(selectedPayment.amount)}</span>
                <StatusBadge status={selectedPayment.status} />
              </div>

              <div className="listing-modal-detail-grid">
                <div className="listing-modal-detail">
                  <span>Method</span>
                  <strong>{selectedPayment.method}</strong>
                </div>
                <div className="listing-modal-detail">
                  <span>Reference</span>
                  <strong>{selectedPayment.reference}</strong>
                </div>
                <div className="listing-modal-detail">
                  <span>Due date</span>
                  <strong>{selectedPayment.dueDate}</strong>
                </div>
                <div className="listing-modal-detail">
                  <span>Paid date</span>
                  <strong>{selectedPayment.paidDate ?? 'Not settled yet'}</strong>
                </div>
                <div className="listing-modal-detail">
                  <span>Banking route</span>
                  <strong>{selectedPayment.bank}</strong>
                </div>
                <div className="listing-modal-detail">
                  <span>Account</span>
                  <strong>{selectedPayment.account}</strong>
                </div>
              </div>

              <div className="listing-modal-section">
                <div className="listing-modal-section-title">Payment analytics</div>
                <div className="payment-modal-grid">
                  <div className="payment-analytics-card">
                    <div className="payment-analytics-title-row">
                      <div className="payment-analytics-title">Tenant payment trend</div>
                      <div className="payment-tooltip-anchor payment-info-trigger" tabIndex={0} aria-label="Tenant payment trend details">
                        i
                        <TooltipBubble
                          title="Tenant payment trend"
                          lines={[
                            `Shows this account's last 6 billing cycles`,
                            `${selectedPayment.bank} · ${selectedPayment.account}`,
                          ]}
                        />
                      </div>
                    </div>
                    <div className="payment-trend-shell">
                      <button
                        type="button"
                        className="bar-nav-btn payment-trend-nav"
                        aria-label="Show previous 6-month payment log window"
                        disabled={!canViewOlderPaymentTrend}
                        onClick={() => setPaymentTrendWindowStart((current) => Math.max(current - 1, 0))}
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="15 18 9 12 15 6" />
                        </svg>
                      </button>
                      <div className="payment-mini-chart">
                      {visibleSelectedPaymentTrend.map((item, index) => {
                        return (
                          <button
                            key={`${item.label}-${item.date.getFullYear()}-${index}`}
                            type="button"
                            className="payment-mini-col payment-mini-col-button"
                            onClick={() => onShowToast(`${selectedPayment.tenant} · ${item.label} ${item.date.getFullYear()} · ${formatPeso(item.value)}`)}
                          >
                            <div className="payment-mini-tip">{formatPeso(item.value)}</div>
                            <div className="payment-mini-bar-wrap">
                              <div
                                className={`payment-mini-bar ${index === visibleSelectedPaymentTrend.length - 1 ? 'is-current' : ''}`}
                                style={{ height: `${Math.max((item.value / selectedPaymentTrendMax) * 100, 12)}%` }}
                              />
                            </div>
                            <div className="payment-mini-label">{item.label}</div>
                            <TooltipBubble
                              title={`${selectedPayment.tenant} · ${item.label} ${item.date.getFullYear()}`}
                              lines={[
                                `${formatPeso(item.value)} settled or due in that cycle`,
                                `${index === visibleSelectedPaymentTrend.length - 1 ? selectedPayment.dueLabel : 'Historical comparison point'}`,
                              ]}
                            />
                          </button>
                        );
                      })}
                      </div>
                      <button
                        type="button"
                        className="bar-nav-btn payment-trend-nav"
                        aria-label="Show next 6-month payment log window"
                        disabled={!canViewNewerPaymentTrend}
                        onClick={() => setPaymentTrendWindowStart((current) => Math.min(current + 1, selectedPaymentTrendSeries.length - 6))}
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="9 18 15 12 9 6" />
                        </svg>
                      </button>
                    </div>
                  </div>
                  <div className="payment-analytics-card">
                    <div className="payment-analytics-title-row">
                      <div className="payment-analytics-title">Cycle details</div>
                      <div className="payment-tooltip-anchor payment-info-trigger" tabIndex={0} aria-label="Cycle detail explanation">
                        i
                        <TooltipBubble
                          title="Cycle details"
                          lines={[
                            `References the current ledger entry and its banking route`,
                            `Useful for follow-up, reconciliation, and reminder context`,
                          ]}
                        />
                      </div>
                    </div>
                    <div className="payment-log-metrics">
                      <div className="payment-log-metric">
                        <span>Collection state</span>
                        <strong>{selectedPayment.status === 'Paid' ? 'On time' : selectedPayment.status === 'Due' ? 'Upcoming' : 'Late'}</strong>
                      </div>
                      <div className="payment-log-metric">
                        <span>Settlement channel</span>
                        <strong>{selectedPayment.method}</strong>
                      </div>
                      <div className="payment-log-metric">
                        <span>Follow-up action</span>
                        <strong>{selectedPayment.reminded ? 'Reminder sent' : 'No reminder'}</strong>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="listing-modal-section">
                <div className="listing-modal-section-title">Notes</div>
                <p className="listing-modal-description">{selectedPayment.notes}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      <ProfilePeekModal
        open={profilePeekPayment !== null}
        avatar={profilePeekPayment?.avatar ?? ''}
        name={profilePeekPayment?.tenant ?? ''}
        role="Tenant"
        userId={profilePeekPayment?.tenantId}
        subtitle={profilePeekPayment ? `${unitTitle(profilePeekPayment.unitId)} · ${profilePeekPayment.status}` : undefined}
        details={profilePeekPayment ? [
          `${formatPeso(profilePeekPayment.amount)} ${profilePeekPayment.dueLabel.toLowerCase()}`,
          `${profilePeekPayment.method} · ${profilePeekPayment.reference}`,
        ] : []}
        onClose={() => setProfilePeekPaymentId(null)}
      />
    </>
  );
}
