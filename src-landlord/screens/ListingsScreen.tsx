import { useEffect, useMemo, useRef, useState } from 'react';
import type { Unit, UnitStatus } from '../data';
import { formatPeso } from '../data';
import Header from '../components/Header';
import type { HeaderNotification } from '../components/Header';

interface Props {
  units: Unit[];
  onSetStatus: (id: number, status: UnitStatus) => void;
  onUpdateUnit: (id: number, updates: Partial<Unit>) => void;
  onOpenProfile: () => void;
  notifications: HeaderNotification[];
  onOpenNotification: (notification: HeaderNotification) => void;
  onShowToast: (msg: string) => void;
}

type Filter = 'All' | UnitStatus;
const FILTERS: Filter[] = ['All', 'Active', 'Occupied', 'Draft'];

function StatusBadge({ status }: { status: UnitStatus }) {
  const cls = status === 'Active' ? 'st-active' : status === 'Occupied' ? 'st-occupied' : 'st-draft';
  return <span className={`status-badge ${cls}`}>{status}</span>;
}

function unitStatusClass(status: UnitStatus) {
  if (status === 'Active') return 'unit-card-active';
  if (status === 'Occupied') return 'unit-card-occupied';
  return 'unit-card-draft';
}

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const CALENDAR_WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function parseHistoryDate(label: string) {
  const [monthToken, dayToken] = label.split(' ');
  const monthIndex = MONTH_NAMES.findIndex((month) => month.toLowerCase() === monthToken.toLowerCase());
  const day = Number(dayToken);
  return new Date(2026, monthIndex >= 0 ? monthIndex : 6, Number.isFinite(day) ? day : 1);
}

function buildEditDraft(unit: Unit) {
  return {
    title: unit.title,
    location: unit.location,
    price: String(unit.price),
    status: unit.status,
    bedrooms: String(unit.bedrooms),
    bathrooms: String(unit.bathrooms),
    sqm: String(unit.sqm),
    description: unit.description,
    amenities: unit.amenities.join(', '),
  };
}

export default function ListingsScreen({ units, onSetStatus, onUpdateUnit, onOpenProfile, notifications, onOpenNotification, onShowToast }: Props) {
  const [filter, setFilter] = useState<Filter>('All');
  const [selectedUnitId, setSelectedUnitId] = useState<number | null>(null);
  const [editUnitId, setEditUnitId] = useState<number | null>(null);
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [historyView, setHistoryView] = useState<'log' | 'calendar'>('log');
  const [selectedHistoryDate, setSelectedHistoryDate] = useState<string | null>(null);
  const [historyMonthIndex, setHistoryMonthIndex] = useState(0);
  const [editDraft, setEditDraft] = useState({
    title: '',
    location: '',
    price: '',
    status: 'Draft' as UnitStatus,
    bedrooms: '',
    bathrooms: '',
    sqm: '',
    description: '',
    amenities: '',
  });
  const [editPhotos, setEditPhotos] = useState<string[]>([]);
  const carouselRef = useRef<HTMLDivElement>(null);
  const lightboxRef = useRef<HTMLDivElement>(null);

  const filtered = filter === 'All' ? units : units.filter(u => u.status === filter);
  const selectedUnit = selectedUnitId === null ? null : units.find((u) => u.id === selectedUnitId) ?? null;
  const selectedUnitGallery = selectedUnit ? (selectedUnit.gallery?.length ? selectedUnit.gallery : [selectedUnit.image]) : [];
  const editUnit = editUnitId === null ? null : units.find((u) => u.id === editUnitId) ?? null;

  const historyMonths = useMemo(() => {
    if (!selectedUnit) return [];
    const buckets = new Map<string, Date>();
    selectedUnit.history.forEach((entry) => {
      const date = parseHistoryDate(entry.date);
      const key = `${date.getFullYear()}-${date.getMonth()}`;
      if (!buckets.has(key)) buckets.set(key, new Date(date.getFullYear(), date.getMonth(), 1));
    });
    return Array.from(buckets.values()).sort((a, b) => a.getTime() - b.getTime());
  }, [selectedUnit]);

  const activeHistoryMonth = historyMonths[historyMonthIndex] ?? null;
  const historyEntriesForMonth = useMemo(() => {
    if (!selectedUnit || !activeHistoryMonth) return [];
    return selectedUnit.history.filter((entry) => {
      const date = parseHistoryDate(entry.date);
      const monthMatch = date.getMonth() === activeHistoryMonth.getMonth() && date.getFullYear() === activeHistoryMonth.getFullYear();
      const dayKey = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
      return monthMatch && (!selectedHistoryDate || selectedHistoryDate === dayKey);
    });
  }, [selectedUnit, activeHistoryMonth, selectedHistoryDate]);

  const historyCalendarCells = useMemo(() => {
    if (!selectedUnit || !activeHistoryMonth) return [];
    const month = activeHistoryMonth.getMonth();
    const year = activeHistoryMonth.getFullYear();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const eventCounts = new Map<string, number>();
    selectedUnit.history.forEach((entry) => {
      const date = parseHistoryDate(entry.date);
      if (date.getMonth() !== month || date.getFullYear() !== year) return;
      const key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
      eventCounts.set(key, (eventCounts.get(key) ?? 0) + 1);
    });
    return [
      ...Array.from({ length: firstDay }, (_, index) => ({ kind: 'blank' as const, id: `blank-${index}` })),
      ...Array.from({ length: daysInMonth }, (_, index) => {
        const day = index + 1;
        const key = `${year}-${month}-${day}`;
        return {
          kind: 'day' as const,
          key,
          day,
          count: eventCounts.get(key) ?? 0,
        };
      }),
    ];
  }, [activeHistoryMonth, selectedUnit]);

  const openUnitModal = (id: number) => setSelectedUnitId(id);
  const closeUnitModal = () => {
    setSelectedUnitId(null);
    setEditUnitId(null);
  };

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

  function openEditModal(unit: Unit) {
    setEditUnitId(unit.id);
    setEditDraft(buildEditDraft(unit));
    setEditPhotos(unit.gallery?.length ? unit.gallery : [unit.image]);
  }

  function saveUnitEdits() {
    if (!editUnit) return;
    onUpdateUnit(editUnit.id, {
      title: editDraft.title.trim(),
      location: editDraft.location.trim(),
      price: Number(editDraft.price),
      status: editDraft.status,
      bedrooms: Number(editDraft.bedrooms),
      bathrooms: Number(editDraft.bathrooms),
      sqm: Number(editDraft.sqm),
      description: editDraft.description.trim(),
      amenities: editDraft.amenities.split(',').map((item) => item.trim()).filter(Boolean),
      gallery: editPhotos,
    });
    onShowToast(`✏️ ${editDraft.title.trim()} updated`);
    setEditUnitId(null);
  }

  async function handleEditPhotoChange(event: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []).slice(0, 4);
    if (files.length === 0) return;
    const nextPhotos = await Promise.all(files.map((file) => new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : '');
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    })));
    setEditPhotos(nextPhotos.filter(Boolean));
    event.target.value = '';
  }

  useEffect(() => {
    setCarouselIndex(0);
    setLightboxIndex(null);
    setHistoryView('log');
    setSelectedHistoryDate(null);
    setHistoryMonthIndex(Math.max(historyMonths.length - 1, 0));
  }, [selectedUnitId, historyMonths.length]);

  useEffect(() => {
    const track = carouselRef.current;
    if (!track) return;
    track.scrollTo({ left: carouselIndex * track.clientWidth, behavior: 'smooth' });
  }, [carouselIndex]);

  useEffect(() => {
    const track = lightboxRef.current;
    if (!track || lightboxIndex === null) return;
    track.scrollTo({ left: lightboxIndex * track.clientWidth, behavior: 'smooth' });
  }, [lightboxIndex]);

  return (
    <>
      <Header onOpenProfile={onOpenProfile} notifications={notifications} onOpenNotification={onOpenNotification} />

      <div className="scroll-area">
        <div className="section-header">
          <span className="section-title">My Listings ({filtered.length})</span>
        </div>

        <div className="search-filter-chips">
          {FILTERS.map(f => (
            <button key={f} className={`filter-chip ${filter === f ? 'active' : ''}`} onClick={() => setFilter(f)}>
              {f}
            </button>
          ))}
        </div>

        <div className="unit-list">
          {filtered.map(u => (
            <div
              key={u.id}
              className={`unit-card unit-card-clickable ${unitStatusClass(u.status)}`}
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
                  <div className="listing-id-badge">{u.listingId}</div>
                </div>
                <div className="unit-info">
                  <div className="unit-title-row">
                    <span className="unit-title">{u.title}</span>
                    <StatusBadge status={u.status} />
                  </div>
                  <div className="listing-id-row">
                    <span className="entity-id-tag">{u.propertyId}</span>
                    <span className="entity-id-tag entity-id-tag-muted">{u.ownerUserId}</span>
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
                      openEditModal(u);
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
              <div
                className="listing-modal-carousel"
                ref={carouselRef}
                onScroll={(event) => {
                  const target = event.currentTarget;
                  const nextIndex = Math.round(target.scrollLeft / Math.max(target.clientWidth, 1));
                  if (nextIndex !== carouselIndex) setCarouselIndex(nextIndex);
                }}
              >
                {selectedUnitGallery.map((image, index) => (
                  <button
                    key={`${selectedUnit.id}-hero-${index}`}
                    type="button"
                    className="listing-modal-carousel-slide"
                    onClick={() => setLightboxIndex(index)}
                    aria-label={`Open photo ${index + 1} full size`}
                  >
                    <img src={image} alt={`${selectedUnit.title} photo ${index + 1}`} />
                  </button>
                ))}
              </div>
              <div className="listing-modal-carousel-dots">
                {selectedUnitGallery.map((_, index) => (
                  <button
                    key={`${selectedUnit.id}-dot-${index}`}
                    type="button"
                    className={`listing-modal-carousel-dot ${carouselIndex === index ? 'active' : ''}`}
                    onClick={() => setCarouselIndex(index)}
                    aria-label={`Go to photo ${index + 1}`}
                  />
                ))}
              </div>
              <button className="listing-modal-close" onClick={closeUnitModal} aria-label="Close listing details">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <div className="listing-modal-body">
              <div className="listing-modal-topline">
                <div className="listing-modal-topline-left">
                  <span className="listing-modal-type">{selectedUnit.type}</span>
                  <span className="entity-id-tag">{selectedUnit.listingId}</span>
                </div>
                <StatusBadge status={selectedUnit.status} />
              </div>
              <h2 id="listing-modal-title" className="listing-modal-title">{selectedUnit.title}</h2>
              <div className="listing-id-row listing-id-row-modal">
                <span className="entity-id-tag">{selectedUnit.propertyId}</span>
                <span className="entity-id-tag entity-id-tag-muted">{selectedUnit.ownerUserId}</span>
              </div>
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

              <div className="listing-modal-section">
                <div className="listing-history-head">
                  <div className="listing-modal-section-title">Transaction history</div>
                  <div className="listing-history-toggle" role="tablist" aria-label="Transaction history view">
                    <button type="button" className={`listing-history-toggle-btn ${historyView === 'log' ? 'active' : ''}`} onClick={() => setHistoryView('log')}>
                      Log
                    </button>
                    <button type="button" className={`listing-history-toggle-btn ${historyView === 'calendar' ? 'active' : ''}`} onClick={() => setHistoryView('calendar')}>
                      Calendar
                    </button>
                  </div>
                </div>
                {historyView === 'calendar' && activeHistoryMonth && (
                  <div className="listing-history-calendar-shell">
                    <div className="listing-history-calendar-head">
                      <button
                        type="button"
                        className="unit-btn"
                        onClick={() => setHistoryMonthIndex((index) => Math.max(index - 1, 0))}
                        disabled={historyMonthIndex === 0}
                      >
                        Prev
                      </button>
                      <strong>{MONTH_NAMES[activeHistoryMonth.getMonth()]} {activeHistoryMonth.getFullYear()}</strong>
                      <button
                        type="button"
                        className="unit-btn"
                        onClick={() => setHistoryMonthIndex((index) => Math.min(index + 1, historyMonths.length - 1))}
                        disabled={historyMonthIndex === historyMonths.length - 1}
                      >
                        Next
                      </button>
                    </div>
                    <div className="listing-history-calendar-weekdays">
                      {CALENDAR_WEEKDAYS.map((day) => (
                        <span key={day}>{day}</span>
                      ))}
                    </div>
                    <div className="listing-history-calendar-grid">
                      {historyCalendarCells.map((cell) => {
                        if (cell.kind === 'blank') {
                          return <div key={cell.id} className="listing-history-calendar-cell is-empty" aria-hidden="true" />;
                        }
                        return (
                          <button
                            key={cell.key}
                            type="button"
                            className={`listing-history-calendar-cell ${cell.count > 0 ? 'has-events' : ''} ${selectedHistoryDate === cell.key ? 'is-selected' : ''}`}
                            onClick={() => setSelectedHistoryDate((value) => (value === cell.key ? null : cell.key))}
                          >
                            <span>{cell.day}</span>
                            {cell.count > 0 && <small>{cell.count}</small>}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
                <div className="listing-history-list">
                  {(historyView === 'log' ? selectedUnit.history : historyEntriesForMonth).map((entry) => (
                    <div key={entry.id} className="listing-history-item">
                      <div className="listing-history-topline">
                        <span className="listing-history-date">{entry.date}</span>
                        <span className="listing-history-type">{entry.type}</span>
                      </div>
                      <div className="listing-history-summary">{entry.summary}</div>
                      <div className="listing-history-detail">{entry.detail}</div>
                      <div className="listing-history-footer">
                        <span className="listing-history-status">{entry.status}</span>
                        {typeof entry.amount === 'number' && (
                          <span className="listing-history-amount">{formatPeso(entry.amount)}</span>
                        )}
                      </div>
                    </div>
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
                  onClick={() => openEditModal(selectedUnit)}
                >
                  Edit
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {editUnit && (
        <div className="listing-modal-overlay" onClick={() => setEditUnitId(null)}>
          <div className="listing-modal listing-edit-modal" onClick={(event) => event.stopPropagation()}>
            <div className="listing-modal-head">
              <div>
                <div className="listing-modal-topline">Edit listing</div>
                <h3>{editUnit.title}</h3>
                <p>Update the mock listing details shown across the landlord demo.</p>
              </div>
              <button className="listing-modal-close" onClick={() => setEditUnitId(null)} aria-label="Close edit listing">
                ×
              </button>
            </div>
            <div className="listing-modal-body listing-edit-body">
              <div className="new-listing-grid">
                <label className="new-listing-field">
                  <span>Listing title</span>
                  <input value={editDraft.title} onChange={(event) => setEditDraft((prev) => ({ ...prev, title: event.target.value }))} />
                </label>
                <label className="new-listing-field">
                  <span>Location</span>
                  <input value={editDraft.location} onChange={(event) => setEditDraft((prev) => ({ ...prev, location: event.target.value }))} />
                </label>
                <label className="new-listing-field">
                  <span>Monthly rent</span>
                  <input type="number" value={editDraft.price} onChange={(event) => setEditDraft((prev) => ({ ...prev, price: event.target.value }))} />
                </label>
                <label className="new-listing-field">
                  <span>Status</span>
                  <select value={editDraft.status} onChange={(event) => setEditDraft((prev) => ({ ...prev, status: event.target.value as UnitStatus }))}>
                    <option value="Active">Active</option>
                    <option value="Occupied">Occupied</option>
                    <option value="Draft">Draft</option>
                  </select>
                </label>
                <label className="new-listing-field">
                  <span>Bedrooms</span>
                  <input type="number" value={editDraft.bedrooms} onChange={(event) => setEditDraft((prev) => ({ ...prev, bedrooms: event.target.value }))} />
                </label>
                <label className="new-listing-field">
                  <span>Bathrooms</span>
                  <input type="number" value={editDraft.bathrooms} onChange={(event) => setEditDraft((prev) => ({ ...prev, bathrooms: event.target.value }))} />
                </label>
                <label className="new-listing-field">
                  <span>Floor area</span>
                  <input type="number" value={editDraft.sqm} onChange={(event) => setEditDraft((prev) => ({ ...prev, sqm: event.target.value }))} />
                </label>
                <label className="new-listing-field">
                  <span>Amenities</span>
                  <input value={editDraft.amenities} onChange={(event) => setEditDraft((prev) => ({ ...prev, amenities: event.target.value }))} />
                </label>
              </div>
              <div className="new-listing-field">
                <span>Listing photos</span>
                <label className="new-listing-upload">
                  <input type="file" accept="image/*" multiple onChange={handleEditPhotoChange} />
                  <div className="new-listing-upload-copy">
                    <strong>Replace listing photos</strong>
                    <small>Upload up to 4 images. The first image becomes the cover photo.</small>
                  </div>
                </label>
                <div className="new-listing-photo-grid">
                  {editPhotos.slice(0, 4).map((photo, index) => (
                    <div key={`edit-photo-${index}`} className="new-listing-photo-slot has-photo">
                      <img src={photo} alt={`Listing edit photo ${index + 1}`} />
                    </div>
                  ))}
                </div>
              </div>
              <label className="new-listing-field">
                <span>Description</span>
                <textarea value={editDraft.description} onChange={(event) => setEditDraft((prev) => ({ ...prev, description: event.target.value }))} />
              </label>
              <div className="listing-modal-actions">
                <button className="unit-btn" onClick={() => setEditUnitId(null)}>Cancel</button>
                <button className="unit-btn unit-btn-primary" onClick={saveUnitEdits}>Save changes</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {selectedUnit && lightboxIndex !== null && (
        <div className="listing-modal-overlay listing-lightbox-overlay" onClick={() => setLightboxIndex(null)}>
          <div className="listing-lightbox-modal" role="dialog" aria-modal="true" aria-label="Listing photo viewer" onClick={(event) => event.stopPropagation()}>
            <div
              className="listing-lightbox-track"
              ref={lightboxRef}
              onScroll={(event) => {
                const target = event.currentTarget;
                const nextIndex = Math.round(target.scrollLeft / Math.max(target.clientWidth, 1));
                if (nextIndex !== lightboxIndex) setLightboxIndex(nextIndex);
              }}
            >
              {selectedUnitGallery.map((image, index) => (
                <div key={`${selectedUnit.id}-lightbox-${index}`} className="listing-lightbox-slide">
                  <img src={image} alt={`${selectedUnit.title} enlarged photo ${index + 1}`} />
                </div>
              ))}
            </div>
            <button className="listing-modal-close" onClick={() => setLightboxIndex(null)} aria-label="Close full photo">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
            {selectedUnitGallery.length > 1 && (
              <>
                <button
                  type="button"
                  className="listing-lightbox-nav is-prev"
                  onClick={() => setLightboxIndex((current) => current === null ? 0 : Math.max(current - 1, 0))}
                  disabled={lightboxIndex === 0}
                  aria-label="Previous photo"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="15 18 9 12 15 6" />
                  </svg>
                </button>
                <button
                  type="button"
                  className="listing-lightbox-nav is-next"
                  onClick={() => setLightboxIndex((current) => current === null ? 0 : Math.min(current + 1, selectedUnitGallery.length - 1))}
                  disabled={lightboxIndex === selectedUnitGallery.length - 1}
                  aria-label="Next photo"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </button>
                <div className="listing-lightbox-dots">
                  {selectedUnitGallery.map((_, index) => (
                    <button
                      key={`${selectedUnit.id}-lightbox-dot-${index}`}
                      type="button"
                      className={`listing-modal-carousel-dot ${lightboxIndex === index ? 'active' : ''}`}
                      onClick={() => setLightboxIndex(index)}
                      aria-label={`Go to full photo ${index + 1}`}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
