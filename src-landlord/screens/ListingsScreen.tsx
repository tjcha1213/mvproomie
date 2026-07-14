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
  const [selectedUnitId, setSelectedUnitId] = useState<number | null>(null);

  const filtered = filter === 'All' ? units : units.filter(u => u.status === filter);
  const selectedUnit = selectedUnitId === null ? null : units.find((u) => u.id === selectedUnitId) ?? null;

  const openUnitModal = (id: number) => setSelectedUnitId(id);
  const closeUnitModal = () => setSelectedUnitId(null);

  function handleStatusAction(unit: Unit) {
    if (unit.status === 'Active') {
      onSetStatus(unit.id, 'Occupied');
      onShowToast('🏠 Marked as occupied');
      return;
    }

    if (unit.status === 'Occupied') {
      onSetStatus(unit.id, 'Active');
      onShowToast('📢 Listing is live again');
      return;
    }

    onSetStatus(unit.id, 'Active');
    onShowToast('🚀 Listing published!');
  }

  function getPrimaryActionLabel(unit: Unit) {
    if (unit.status === 'Active') return 'Mark occupied';
    if (unit.status === 'Occupied') return 'Relist';
    return 'Publish';
  }

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
            <div
              key={u.id}
              className="unit-card unit-card-clickable"
              role="button"
              tabIndex={0}
              onClick={() => openUnitModal(u.id)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  openUnitModal(u.id);
                }
              }}
            >
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
                  <button
                    className={`unit-btn ${u.status === 'Draft' ? 'unit-btn-primary' : ''}`}
                    onClick={(event) => {
                      event.stopPropagation();
                      handleStatusAction(u);
                    }}
                  >
                    {getPrimaryActionLabel(u)}
                  </button>
                  <button
                    className="unit-btn"
                    onClick={(event) => {
                      event.stopPropagation();
                      onShowToast('Edit listing — coming soon');
                    }}
                  >
                    Edit
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div style={{ height: 16 }} />
      </div>

      {selectedUnit && (
        <div className="listing-modal-overlay" onClick={closeUnitModal}>
          <div
            className="listing-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="listing-modal-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="listing-modal-media">
              <img src={selectedUnit.image} alt={selectedUnit.title} />
              <button className="listing-modal-close" onClick={closeUnitModal} aria-label="Close listing details">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <div className="listing-modal-body">
              <div className="listing-modal-topline">
                <span className="listing-modal-type">{selectedUnit.type}</span>
                <StatusBadge status={selectedUnit.status} />
              </div>
              <h2 id="listing-modal-title" className="listing-modal-title">{selectedUnit.title}</h2>
              <div className="listing-modal-location">{selectedUnit.location}</div>
              <div className="listing-modal-price">{formatPeso(selectedUnit.price)} <span>/ month</span></div>

              <div className="listing-modal-stats">
                <div className="listing-modal-stat">
                  <strong>{selectedUnit.views}</strong>
                  <span>Views</span>
                </div>
                <div className="listing-modal-stat">
                  <strong>{selectedUnit.inquiries}</strong>
                  <span>Inquiries</span>
                </div>
                <div className="listing-modal-stat">
                  <strong>{selectedUnit.sqm}</strong>
                  <span>sqm</span>
                </div>
              </div>

              <div className="listing-modal-detail-grid">
                <div className="listing-modal-detail">
                  <span>Bedrooms</span>
                  <strong>{selectedUnit.bedrooms}</strong>
                </div>
                <div className="listing-modal-detail">
                  <span>Bathrooms</span>
                  <strong>{selectedUnit.bathrooms}</strong>
                </div>
                <div className="listing-modal-detail">
                  <span>Verification</span>
                  <strong>{selectedUnit.verified ? 'Verified' : 'Pending'}</strong>
                </div>
                <div className="listing-modal-detail">
                  <span>Last updated</span>
                  <strong>{selectedUnit.lastUpdated}</strong>
                </div>
              </div>

              <div className="listing-modal-section">
                <div className="listing-modal-section-title">Listing summary</div>
                <p className="listing-modal-copy">{selectedUnit.description}</p>
              </div>

              <div className="listing-modal-section">
                <div className="listing-modal-section-title">Amenities</div>
                <div className="listing-modal-tags">
                  {selectedUnit.amenities.map((amenity) => (
                    <span key={amenity} className="listing-modal-tag">{amenity}</span>
                  ))}
                </div>
              </div>

              <div className="listing-modal-actions">
                <button
                  className={`unit-btn ${selectedUnit.status === 'Draft' ? 'unit-btn-primary' : ''}`}
                  onClick={() => handleStatusAction(selectedUnit)}
                >
                  {getPrimaryActionLabel(selectedUnit)}
                </button>
                <button
                  className="unit-btn"
                  onClick={() => onShowToast('Edit listing — coming soon')}
                >
                  Edit
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
