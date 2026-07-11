import { useState } from 'react';
import type { Unit, UnitStatus } from '../data';
import { formatPeso } from '../data';
import Header from '../components/Header';

interface Props {
  units: Unit[];
  onSetStatus: (id: number, status: UnitStatus) => void;
  onOpenProfile: () => void;
  onShowToast: (msg: string) => void;
}

type Filter = 'All' | UnitStatus;
const FILTERS: Filter[] = ['All', 'Active', 'Occupied', 'Draft'];

function StatusBadge({ status }: { status: UnitStatus }) {
  const cls = status === 'Active' ? 'st-active' : status === 'Occupied' ? 'st-occupied' : 'st-draft';
  return <span className={`status-badge ${cls}`}>{status}</span>;
}

export default function ListingsScreen({ units, onSetStatus, onOpenProfile, onShowToast }: Props) {
  const [filter, setFilter] = useState<Filter>('All');

  const filtered = filter === 'All' ? units : units.filter(u => u.status === filter);

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
          <span className="section-title">My Listings ({filtered.length})</span>
        </div>

        <div className="unit-list">
          {filtered.map(u => (
            <div key={u.id} className="unit-card">
              <div className="unit-card-top">
                <div className="unit-thumb">
                  <img src={u.image} alt={u.title} loading="lazy" />
                </div>
                <div className="unit-info">
                  <div className="unit-title-row">
                    <span className="unit-title">{u.title}</span>
                    <StatusBadge status={u.status} />
                  </div>
                  <div className="unit-location">{u.location}</div>
                  <div className="unit-price">{formatPeso(u.price)} <span>/ month</span></div>
                  {!u.verified && u.status !== 'Draft' && (
                    <div className="unit-warning">⚠ Not verified</div>
                  )}
                </div>
              </div>
              <div className="unit-card-bottom">
                <div className="unit-stats">
                  <span className="unit-stat">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="13" height="13">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
                    </svg>
                    {u.views}
                  </span>
                  <span className="unit-stat">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="13" height="13">
                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                    </svg>
                    {u.inquiries}
                  </span>
                </div>
                <div className="unit-actions">
                  {u.status === 'Active' && (
                    <button className="unit-btn" onClick={() => { onSetStatus(u.id, 'Occupied'); onShowToast('🏠 Marked as occupied'); }}>
                      Mark occupied
                    </button>
                  )}
                  {u.status === 'Occupied' && (
                    <button className="unit-btn" onClick={() => { onSetStatus(u.id, 'Active'); onShowToast('📢 Listing is live again'); }}>
                      Relist
                    </button>
                  )}
                  {u.status === 'Draft' && (
                    <button className="unit-btn unit-btn-primary" onClick={() => { onSetStatus(u.id, 'Active'); onShowToast('🚀 Listing published!'); }}>
                      Publish
                    </button>
                  )}
                  <button className="unit-btn" onClick={() => onShowToast('Edit listing — coming soon')}>
                    Edit
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div style={{ height: 16 }} />
      </div>
    </>
  );
}
