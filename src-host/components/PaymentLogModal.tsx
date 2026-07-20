import type { Payment } from '../data';
import { formatPeso } from '../data';

type TrendPoint = {
  label: string;
  date: Date;
  value: number;
};

interface Props {
  open: boolean;
  payment: Payment | null;
  unitTitle: string;
  visibleSelectedPaymentTrend: TrendPoint[];
  selectedPaymentTrendMax: number;
  canViewOlderPaymentTrend: boolean;
  canViewNewerPaymentTrend: boolean;
  onClose: () => void;
  onPrevTrendWindow: () => void;
  onNextTrendWindow: () => void;
  onShowToast: (msg: string) => void;
}

function StatusBadge({ status }: { status: Payment['status'] }) {
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

export default function PaymentLogModal({
  open,
  payment,
  unitTitle,
  visibleSelectedPaymentTrend,
  selectedPaymentTrendMax,
  canViewOlderPaymentTrend,
  canViewNewerPaymentTrend,
  onClose,
  onPrevTrendWindow,
  onNextTrendWindow,
  onShowToast,
}: Props) {
  if (!open || !payment) return null;

  return (
    <div className="listing-modal-overlay" onClick={onClose}>
      <div className="listing-modal payment-modal" onClick={(event) => event.stopPropagation()}>
        <div className="listing-modal-head">
          <div className="payment-modal-identity">
            <div className="inbox-avatar payment-modal-avatar">
              <img src={payment.avatar ?? ''} alt={payment.tenant} />
            </div>
            <div>
              <div className="listing-modal-topline">Payment log</div>
              <h3>{payment.tenant}</h3>
              <div className="listing-id-row listing-id-row-modal">
                <span className="entity-id-tag">{payment.tenantId}</span>
                <span className={`roomie-score-chip is-${payment.trust.roomieTemperature.toLowerCase()}`}>Roomie {payment.trust.roomieScore}</span>
              </div>
              <p>{unitTitle}</p>
            </div>
          </div>
          <button className="listing-modal-close" onClick={onClose} aria-label="Close payment log">
            ×
          </button>
        </div>

        <div className="listing-modal-body">
          <div className="listing-modal-price-row">
            <span className="listing-modal-price">{formatPeso(payment.amount)}</span>
            <StatusBadge status={payment.status} />
          </div>

          <div className="listing-modal-detail-grid">
            <div className="listing-modal-detail">
              <span>Method</span>
              <strong>{payment.method}</strong>
            </div>
            <div className="listing-modal-detail">
              <span>Reference</span>
              <strong>{payment.reference}</strong>
            </div>
            <div className="listing-modal-detail">
              <span>Due date</span>
              <strong>{payment.dueDate}</strong>
            </div>
            <div className="listing-modal-detail">
              <span>Paid date</span>
              <strong>{payment.paidDate ?? 'Not settled yet'}</strong>
            </div>
            <div className="listing-modal-detail">
              <span>Banking route</span>
              <strong>{payment.bank}</strong>
            </div>
            <div className="listing-modal-detail">
              <span>Account</span>
              <strong>{payment.account}</strong>
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
                        `${payment.bank} · ${payment.account}`,
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
                    onClick={onPrevTrendWindow}
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="15 18 9 12 15 6" />
                    </svg>
                  </button>
                  <div className="payment-mini-chart">
                    {visibleSelectedPaymentTrend.map((item, index) => (
                      <button
                        key={`${item.label}-${item.date.getFullYear()}-${index}`}
                        type="button"
                        className="payment-mini-col payment-mini-col-button"
                        onClick={() => onShowToast(`${payment.tenant} · ${item.label} ${item.date.getFullYear()} · ${formatPeso(item.value)}`)}
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
                          title={`${payment.tenant} · ${item.label} ${item.date.getFullYear()}`}
                          lines={[
                            `${formatPeso(item.value)} settled or due in that cycle`,
                            `${index === visibleSelectedPaymentTrend.length - 1 ? payment.dueLabel : 'Historical comparison point'}`,
                          ]}
                        />
                      </button>
                    ))}
                  </div>
                  <button
                    type="button"
                    className="bar-nav-btn payment-trend-nav"
                    aria-label="Show next 6-month payment log window"
                    disabled={!canViewNewerPaymentTrend}
                    onClick={onNextTrendWindow}
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
                    <strong>{payment.status === 'Paid' ? 'On time' : payment.status === 'Due' ? 'Upcoming' : 'Late'}</strong>
                  </div>
                  <div className="payment-log-metric">
                    <span>Settlement channel</span>
                    <strong>{payment.method}</strong>
                  </div>
                  <div className="payment-log-metric">
                    <span>Follow-up action</span>
                    <strong>{payment.reminded ? 'Reminder sent' : 'No reminder'}</strong>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="listing-modal-section">
            <div className="listing-modal-section-title">Notes</div>
            <p className="listing-modal-description">{payment.notes}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
