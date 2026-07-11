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

  const filtered = filter === 'All' ? payments : payments.filter(p => p.status === filter);
  const unitTitle = (id: number) => units.find(u => u.id === id)?.title ?? '';

  const collected = payments.filter(p => p.status === 'Paid').reduce((s, p) => s + p.amount, 0);
  const expected = payments.reduce((s, p) => s + p.amount, 0);
  const pct = expected > 0 ? Math.round((collected / expected) * 100) : 0;

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
            <div key={p.id} className="payment-row">
              <div className="inbox-avatar">{p.tenant[0]}</div>
              <div className="payment-info">
                <div className="payment-name">{p.tenant}</div>
                <div className="payment-unit">{unitTitle(p.unitId)} · {p.dueLabel}</div>
              </div>
              <div className="payment-right">
                <div className="payment-amount">{formatPeso(p.amount)}</div>
                <StatusBadge status={p.status} />
              </div>
              {p.status !== 'Paid' && (
                <div className="payment-actions">
                  <button
                    className="unit-btn unit-btn-primary"
                    onClick={() => { onMarkPaid(p.id); onShowToast(`✅ ${formatPeso(p.amount)} recorded from ${p.tenant}`); }}
                  >
                    Mark paid
                  </button>
                  <button
                    className="unit-btn"
                    disabled={p.reminded}
                    onClick={() => { onRemind(p.id); onShowToast(`🔔 Reminder sent to ${p.tenant}`); }}
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
    </>
  );
}
