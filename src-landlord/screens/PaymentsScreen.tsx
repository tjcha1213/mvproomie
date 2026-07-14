import { useState } from 'react';
import type { Payment, PaymentStatus, Unit } from '../data';
import { formatPeso } from '../data';
import Header from '../components/Header';

interface Props {
  payments: Payment[];
  units: Unit[];
  onMarkPaid: (id: number) => void;
  onRemind: (id: number) => void;
  onOpenProfile: () => void;
  onShowToast: (msg: string) => void;
}

type Filter = 'All' | PaymentStatus;
const FILTERS: Filter[] = ['All', 'Paid', 'Due', 'Overdue'];

function StatusBadge({ status }: { status: PaymentStatus }) {
  const cls = status === 'Paid' ? 'st-paid' : status === 'Due' ? 'st-due' : 'st-overdue';
  return <span className={`status-badge ${cls}`}>{status}</span>;
}

export default function PaymentsScreen({ payments, units, onMarkPaid, onRemind, onOpenProfile, onShowToast }: Props) {
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
    value: payment.amount,
    status: payment.status,
  }));
  const maxCollectionValue = Math.max(...collectionSeries.map(item => item.value), 1);

  return (
    <>
      <Header onOpenProfile={onOpenProfile} onShowToast={onShowToast} />

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
            <div className="payment-kpi-card">
              <strong>{formatPeso(dueSoonTotal)}</strong>
              <span>Due this week</span>
            </div>
            <div className="payment-kpi-card payment-kpi-alert">
              <strong>{formatPeso(overdueTotal)}</strong>
              <span>Overdue balance</span>
            </div>
            <div className="payment-kpi-card">
              <strong>{paidCount}</strong>
              <span>Paid logs posted</span>
            </div>
          </div>
          <div className="payment-analytics-grid">
            <div className="payment-analytics-card">
              <div className="payment-analytics-title">Monthly trend</div>
              <div className="payment-mini-chart">
                {monthlyTotals.map((value, index) => (
                  <div key={monthLabels[index]} className="payment-mini-col">
                    <div className="payment-mini-tip">{formatPeso(value)}</div>
                    <div className="payment-mini-bar-wrap">
                      <div
                        className={`payment-mini-bar ${index === monthlyTotals.length - 1 ? 'is-current' : ''}`}
                        style={{ height: `${Math.max((value / maxMonthlyTotal) * 100, 12)}%` }}
                      />
                    </div>
                    <div className="payment-mini-label">{monthLabels[index]}</div>
                  </div>
                ))}
              </div>
            </div>
            <div className="payment-analytics-card">
              <div className="payment-analytics-title">Collection by method</div>
              <div className="payment-method-list">
                {methodBreakdown.map(item => (
                  <div key={item.label} className="payment-method-row">
                    <div className="payment-method-label">{item.label}</div>
                    <div className="payment-method-bar">
                      <div className="payment-method-fill" style={{ width: `${(item.value / maxMethodValue) * 100}%` }} />
                    </div>
                    <div className="payment-method-value">{formatPeso(item.value)}</div>
                  </div>
                ))}
              </div>
            </div>
            <div className="payment-analytics-card payment-analytics-card-wide">
              <div className="payment-analytics-title">Per-listing collection snapshot</div>
              <div className="payment-mini-chart payment-mini-chart-tight">
                {collectionSeries.map(item => (
                  <div key={item.id} className="payment-mini-col">
                    <div className="payment-mini-tip">{formatPeso(item.value)}</div>
                    <div className="payment-mini-bar-wrap">
                      <div
                        className={`payment-mini-bar payment-status-${item.status.toLowerCase()}`}
                        style={{ height: `${Math.max((item.value / maxCollectionValue) * 100, 12)}%` }}
                      />
                    </div>
                    <div className="payment-mini-label">{item.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="search-filter-chips" style={{ paddingTop: 4 }}>
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
                    <div className="payment-analytics-title">Tenant payment trend</div>
                    <div className="payment-mini-chart">
                      {selectedPayment.monthlyTrend.map((value, index) => {
                        const maxValue = Math.max(...selectedPayment.monthlyTrend, 1);
                        return (
                          <div key={monthLabels[index]} className="payment-mini-col">
                            <div className="payment-mini-tip">{formatPeso(value)}</div>
                            <div className="payment-mini-bar-wrap">
                              <div
                                className={`payment-mini-bar ${index === selectedPayment.monthlyTrend.length - 1 ? 'is-current' : ''}`}
                                style={{ height: `${Math.max((value / maxValue) * 100, 12)}%` }}
                              />
                            </div>
                            <div className="payment-mini-label">{monthLabels[index]}</div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  <div className="payment-analytics-card">
                    <div className="payment-analytics-title">Cycle details</div>
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
