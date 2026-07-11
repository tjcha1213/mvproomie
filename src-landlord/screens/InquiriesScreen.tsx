import { useState } from 'react';
import type { Inquiry, InquiryStatus, Unit } from '../data';
import Header from '../components/Header';

interface Props {
  inquiries: Inquiry[];
  units: Unit[];
  onSetStatus: (id: number, status: InquiryStatus) => void;
  onOpenProfile: () => void;
  onShowToast: (msg: string) => void;
}

type Filter = 'All' | InquiryStatus;
const FILTERS: Filter[] = ['All', 'New', 'Replied', 'Viewing'];

function StatusBadge({ status }: { status: InquiryStatus }) {
  const cls = status === 'New' ? 'st-new' : status === 'Viewing' ? 'st-viewing' : 'st-replied';
  return <span className={`status-badge ${cls}`}>{status}</span>;
}

export default function InquiriesScreen({ inquiries, units, onSetStatus, onOpenProfile, onShowToast }: Props) {
  const [filter, setFilter] = useState<Filter>('All');
  const [openId, setOpenId] = useState<number | null>(null);

  const filtered = filter === 'All' ? inquiries : inquiries.filter(i => i.status === filter);
  const unitTitle = (id: number) => units.find(u => u.id === id)?.title ?? '';

  return (
    <>
      <Header onOpenProfile={onOpenProfile} onShowToast={onShowToast} />

      <div className="search-filter-chips">
        {FILTERS.map(f => (
          <button key={f} className={`filter-chip ${filter === f ? 'active' : ''}`} onClick={() => setFilter(f)}>
            {f}
          </button>
        ))}
      </div>

      <div className="scroll-area">
        <div className="section-header">
          <span className="section-title">Inquiries ({filtered.length})</span>
        </div>

        {filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
              </svg>
            </div>
            <div className="empty-title">Nothing here</div>
            <div className="empty-sub">No inquiries match this filter.</div>
          </div>
        ) : (
          <div className="inbox-list">
            {filtered.map(i => (
              <div key={i.id} className="inquiry-item">
                <button className="inquiry-main" onClick={() => setOpenId(openId === i.id ? null : i.id)}>
                  <div className="inbox-avatar">{i.name[0]}</div>
                  <div className="inbox-info">
                    <div className="inquiry-name-row">
                      <span className="inbox-name">{i.name}</span>
                      <StatusBadge status={i.status} />
                    </div>
                    <div className="inquiry-unit">{unitTitle(i.unitId)}</div>
                    <div className="inbox-preview">{i.message}</div>
                  </div>
                  <div className="inbox-meta">
                    <div className="inbox-time">{i.time}</div>
                  </div>
                </button>

                {openId === i.id && (
                  <div className="inquiry-actions">
                    <button
                      className="unit-btn unit-btn-primary"
                      onClick={() => { onSetStatus(i.id, 'Replied'); onShowToast(`✉️ Reply sent to ${i.name}`); setOpenId(null); }}
                    >
                      Reply
                    </button>
                    <button
                      className="unit-btn"
                      onClick={() => { onSetStatus(i.id, 'Viewing'); onShowToast(`📅 Viewing scheduled with ${i.name}`); setOpenId(null); }}
                    >
                      Schedule viewing
                    </button>
                    <button
                      className="unit-btn"
                      onClick={() => { onShowToast('Opening chat…'); setOpenId(null); }}
                    >
                      Open chat
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        <div style={{ height: 16 }} />
      </div>
    </>
  );
}
