import { useState } from 'react';
import type { Payment, PaymentStatus, Unit } from '../data';
import { formatPeso } from '../data';
import Header from '../components/Header';
import type { HeaderNotification } from '../components/Header';

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

export default function PaymentsScreen({ payments, units, onMarkPaid, onRemind, onOpenProfile, notifications, onOpenNotification, onShowToast }: Props) {
  const [filter, setFilter] = useState<Filter>('All');
  const [selectedPaymentId, setSelectedPaymentId] = useState<number | null>(null);

  const filtered = filter === 'All' ? payments : payments.filter(p => p.status === filter);
  const unitTitle = (id: number) => units.find(u => u.id === id)?.title ?? '';
  const selectedPayment = payments.find(payment => payment.id === selectedPaymentId) ?? null;

  const collected = payments.filter(p => p.status === 'Paid').reduce((s, p) => s + p.amount, 0);
  const expected = payments.reduce((s, p) => s + p.amount, 0);
  const pct = expected > 0 ? Math.round((collected / expected) * 100) : 0;
  const overdueTotal = payments.filter(p => p.status === 'Overdue').reduce((s, p) => s + p.amount, 0);
  const dueSoonTotal = payments.filter(p => p.status === 'Due').reduce((s, p) => s + p.amount, 0);
  const paidCount = payments.filter(p => p.status === 'Paid').length;
  const monthLabels = ['Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'];
  const monthlyTotals = monthLabels.map((_, index) => payments.reduce((sum, payment) => sum + (payment.monthlyTrend[index] ?? 0), 0));
  const maxMonthlyTotal = Math.max(...monthlyTotals, 1);
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
  const collectionGap = expected - collected;
  const paidRate = payments.length > 0 ? Math.round((paidCount / payments.length) * 100) : 0;

  return (
    <>
      <Header onOpenProfile={onOpenProfile} notifications={notifications} onOpenNotification={onOpenNotification} />

      <div className="scroll-area">
        {/* Month summary */}
        <div className="ll-card" style={{ marginTop: 12 }}>
          <div className="ll-card-head">
            <span className="ll-card-title">July collection</span>
            <span className="ll-card-meta"><b>{formatPeso(collected)}</b> of {formatPeso(expected)}</span>
          </div>
          <div className="progress-track">
            <div className="progress-fill" style={{ width: `${pct}%` }} />
          </div>
          <div className="progress-label">{pct}% collected</div>
          <div className="payment-kpi-grid">
            <div className="payment-kpi-card payment-tooltip-anchor" tabIndex={0}>
              <strong>{formatPeso(dueSoonTotal)}</strong>
              <span>Due this week</span>
              <TooltipBubble
                title="Due this week"
                lines={[
                  `${payments.filter(p => p.status === 'Due').length} unsettled log${payments.filter(p => p.status === 'Due').length === 1 ? '' : 's'}`,
                  `Collection gap remaining: ${formatPeso(collectionGap)}`,
                ]}
              />
            </div>
            <div className="payment-kpi-card payment-kpi-alert payment-tooltip-anchor" tabIndex={0}>
              <strong>{formatPeso(overdueTotal)}</strong>
              <span>Overdue balance</span>
              <TooltipBubble
                title="Overdue balance"
                lines={[
                  `${payments.filter(p => p.status === 'Overdue').length} overdue account${payments.filter(p => p.status === 'Overdue').length === 1 ? '' : 's'}`,
                  `Largest overdue exposure: ${formatPeso(Math.max(...payments.filter(p => p.status === 'Overdue').map(p => p.amount), 0))}`,
                ]}
              />
            </div>
            <div className="payment-kpi-card payment-tooltip-anchor" tabIndex={0}>
              <strong>{paidCount}</strong>
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
                      `Tracks 6 months of mock landlord collections`,
                      `Current month total: ${formatPeso(monthlyTotals[monthlyTotals.length - 1])}`,
                    ]}
                  />
                </div>
              </div>
              <div className="payment-mini-chart">
                {monthlyTotals.map((value, index) => (
                  <button
                    key={monthLabels[index]}
                    type="button"
                    className="payment-mini-col payment-mini-col-button"
                    onClick={() => onShowToast(`${monthLabels[index]} · ${formatPeso(value)} collected`)}
                  >
                    <div className="payment-mini-tip">{formatPeso(value)}</div>
                    <div className="payment-mini-bar-wrap">
                      <div
                        className={`payment-mini-bar ${index === monthlyTotals.length - 1 ? 'is-current' : ''}`}
                        style={{ height: `${Math.max((value / maxMonthlyTotal) * 100, 12)}%` }}
                      />
                    </div>
                    <div className="payment-mini-label">{monthLabels[index]}</div>
                    <TooltipBubble
                      title={`${monthLabels[index]} collections`}
                      lines={[
                        `${formatPeso(value)} total posted`,
                        `${index === 0 ? 'Baseline month in the demo series' : `${formatPeso(value - monthlyTotals[index - 1])} vs previous month`}`,
                      ]}
                    />
                  </button>
                ))}
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
              <div className="inbox-avatar">{p.tenant[0]}</div>
              <div className="payment-info">
                <div className="payment-name">{p.tenant}</div>
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
              <div>
                <div className="listing-modal-topline">Payment log</div>
                <h3>{selectedPayment.tenant}</h3>
                <p>{unitTitle(selectedPayment.unitId)}</p>
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
                    <div className="payment-mini-chart">
                      {selectedPayment.monthlyTrend.map((value, index) => {
                        const maxValue = Math.max(...selectedPayment.monthlyTrend, 1);
                        return (
                          <button
                            key={monthLabels[index]}
                            type="button"
                            className="payment-mini-col payment-mini-col-button"
                            onClick={() => onShowToast(`${selectedPayment.tenant} · ${monthLabels[index]} · ${formatPeso(value)}`)}
                          >
                            <div className="payment-mini-tip">{formatPeso(value)}</div>
                            <div className="payment-mini-bar-wrap">
                              <div
                                className={`payment-mini-bar ${index === selectedPayment.monthlyTrend.length - 1 ? 'is-current' : ''}`}
                                style={{ height: `${Math.max((value / maxValue) * 100, 12)}%` }}
                              />
                            </div>
                            <div className="payment-mini-label">{monthLabels[index]}</div>
                            <TooltipBubble
                              title={`${selectedPayment.tenant} · ${monthLabels[index]}`}
                              lines={[
                                `${formatPeso(value)} settled or due in that cycle`,
                                `${index === selectedPayment.monthlyTrend.length - 1 ? selectedPayment.dueLabel : 'Historical comparison point'}`,
                              ]}
                            />
                          </button>
                        );
                      })}
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
    </>
  );
}
