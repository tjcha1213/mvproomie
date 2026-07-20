import { useCallback, useEffect, useMemo, useRef, useState, type UIEvent as ReactUIEvent } from 'react';
import type { Unit, UnitStatus } from '../data';
import { formatPeso } from '../data';

interface Props {
  unit: Unit | null;
  open: boolean;
  onClose: () => void;
}

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const CALENDAR_WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function StatusBadge({ status }: { status: UnitStatus }) {
  const cls = status === 'Active' ? 'st-active' : status === 'Occupied' ? 'st-occupied' : 'st-draft';
  return <span className={`status-badge ${cls}`}>{status}</span>;
}

function parseHistoryDate(label: string) {
  const [monthToken, dayToken] = label.split(' ');
  const monthIndex = MONTH_NAMES.findIndex((month) => month.toLowerCase() === monthToken.toLowerCase());
  const day = Number(dayToken);
  return new Date(2026, monthIndex >= 0 ? monthIndex : 6, Number.isFinite(day) ? day : 1);
}

export default function ListingDetailsModal({ unit, open, onClose }: Props) {
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [historyView, setHistoryView] = useState<'log' | 'calendar'>('log');
  const [selectedHistoryDate, setSelectedHistoryDate] = useState<string | null>(null);
  const [historyMonthIndex, setHistoryMonthIndex] = useState(0);
  const carouselRef = useRef<HTMLDivElement>(null);
  const lightboxRef = useRef<HTMLDivElement>(null);
  const carouselSnapTimerRef = useRef<number | null>(null);
  const lightboxSnapTimerRef = useRef<number | null>(null);

  const gallery = useMemo(() => {
    if (!unit) return [];
    return unit.gallery?.length ? unit.gallery : [unit.image];
  }, [unit]);

  const historyMonths = useMemo(() => {
    if (!unit) return [];
    const buckets = new Map<string, Date>();
    unit.history.forEach((entry) => {
      const date = parseHistoryDate(entry.date);
      const key = `${date.getFullYear()}-${date.getMonth()}`;
      if (!buckets.has(key)) buckets.set(key, new Date(date.getFullYear(), date.getMonth(), 1));
    });
    return Array.from(buckets.values()).sort((a, b) => a.getTime() - b.getTime());
  }, [unit]);

  const activeHistoryMonth = historyMonths[historyMonthIndex] ?? null;
  const historyEntriesForMonth = useMemo(() => {
    if (!unit || !activeHistoryMonth) return [];
    return unit.history.filter((entry) => {
      const date = parseHistoryDate(entry.date);
      const monthMatch = date.getMonth() === activeHistoryMonth.getMonth() && date.getFullYear() === activeHistoryMonth.getFullYear();
      const dayKey = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
      return monthMatch && (!selectedHistoryDate || selectedHistoryDate === dayKey);
    });
  }, [unit, activeHistoryMonth, selectedHistoryDate]);

  const historyCalendarCells = useMemo(() => {
    if (!unit || !activeHistoryMonth) return [];
    const month = activeHistoryMonth.getMonth();
    const year = activeHistoryMonth.getFullYear();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const eventCounts = new Map<string, number>();
    unit.history.forEach((entry) => {
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
  }, [activeHistoryMonth, unit]);

  const openLightboxPhoto = (index: number) => {
    setLightboxIndex(index);
    requestAnimationFrame(() => {
      const track = lightboxRef.current;
      if (!track) return;
      track.scrollTo({ left: track.clientWidth * index, behavior: 'smooth' });
    });
  };

  const handleCarouselScroll = useCallback((event: ReactUIEvent<HTMLDivElement>) => {
    const track = event.currentTarget;
    const width = Math.max(track.clientWidth, 1);
    const nextIndex = Math.max(0, Math.min(gallery.length - 1, Math.round(track.scrollLeft / width)));
    setCarouselIndex((current) => (current === nextIndex ? current : nextIndex));

    if (carouselSnapTimerRef.current !== null) window.clearTimeout(carouselSnapTimerRef.current);
    carouselSnapTimerRef.current = window.setTimeout(() => {
      const settledIndex = Math.max(0, Math.min(gallery.length - 1, Math.round(track.scrollLeft / width)));
      const targetLeft = settledIndex * width;
      if (Math.abs(track.scrollLeft - targetLeft) > 1) {
        track.scrollTo({ left: targetLeft, behavior: 'smooth' });
      }
    }, 90);
  }, [gallery.length]);

  const handleLightboxScroll = useCallback((event: ReactUIEvent<HTMLDivElement>) => {
    const track = event.currentTarget;
    const width = Math.max(track.clientWidth, 1);
    const nextIndex = Math.max(0, Math.min(gallery.length - 1, Math.round(track.scrollLeft / width)));
    setLightboxIndex((current) => (current === nextIndex ? current : nextIndex));

    if (lightboxSnapTimerRef.current !== null) window.clearTimeout(lightboxSnapTimerRef.current);
    lightboxSnapTimerRef.current = window.setTimeout(() => {
      const settledIndex = Math.max(0, Math.min(gallery.length - 1, Math.round(track.scrollLeft / width)));
      const targetLeft = settledIndex * width;
      if (Math.abs(track.scrollLeft - targetLeft) > 1) {
        track.scrollTo({ left: targetLeft, behavior: 'smooth' });
      }
    }, 90);
  }, [gallery.length]);

  useEffect(() => {
    if (!open || !unit) return;
    setCarouselIndex(0);
    setLightboxIndex(null);
    setHistoryView('log');
    setSelectedHistoryDate(null);
    setHistoryMonthIndex(Math.max(historyMonths.length - 1, 0));
  }, [historyMonths.length, open, unit]);

  useEffect(() => {
    if (!open) return;
    requestAnimationFrame(() => {
      const track = carouselRef.current;
      if (!track) return;
      track.scrollTo({ left: 0, behavior: 'auto' });
    });
  }, [open, unit]);

  useEffect(() => () => {
    if (carouselSnapTimerRef.current !== null) window.clearTimeout(carouselSnapTimerRef.current);
    if (lightboxSnapTimerRef.current !== null) window.clearTimeout(lightboxSnapTimerRef.current);
  }, []);

  if (!open || !unit) return null;

  return (
    <>
      <div className="listing-modal-overlay" onClick={onClose}>
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
              onScroll={handleCarouselScroll}
            >
              {gallery.map((image, index) => (
                <button
                  key={`${unit.id}-hero-${index}`}
                  type="button"
                  className="listing-modal-carousel-slide"
                  onClick={() => openLightboxPhoto(index)}
                  aria-label={`Open photo ${index + 1} full size`}
                >
                  <img src={image} alt={`${unit.title} photo ${index + 1}`} />
                </button>
              ))}
            </div>
            <div className="listing-modal-carousel-dots">
              {gallery.map((_, index) => (
                <button
                  key={`${unit.id}-dot-${index}`}
                  type="button"
                  className={`listing-modal-carousel-dot ${carouselIndex === index ? 'active' : ''}`}
                  onClick={() => {
                    const track = carouselRef.current;
                    if (!track) return;
                    track.scrollTo({ left: track.clientWidth * index, behavior: 'smooth' });
                    setCarouselIndex(index);
                  }}
                  aria-label={`Go to photo ${index + 1}`}
                />
              ))}
            </div>
            <button className="listing-modal-close" onClick={onClose} aria-label="Close listing details">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          <div className="listing-modal-body">
            <div className="listing-modal-topline">
              <div className="listing-modal-topline-left">
                <span className="listing-modal-type">{unit.type}</span>
                <span className="entity-id-tag">{unit.listingId}</span>
              </div>
              <StatusBadge status={unit.status} />
            </div>
            <h2 id="listing-modal-title" className="listing-modal-title">{unit.title}</h2>
            <div className="listing-id-row listing-id-row-modal">
              <span className="entity-id-tag">{unit.propertyId}</span>
              <span className="entity-id-tag entity-id-tag-muted">{unit.ownerUserId}</span>
            </div>
            <div className="listing-modal-location">{unit.location}</div>
            <div className="listing-modal-price">{formatPeso(unit.price)} <span>/ month</span></div>

            <div className="listing-modal-stats">
              <div className="listing-modal-stat">
                <strong>{unit.views}</strong>
                <span>Views</span>
              </div>
              <div className="listing-modal-stat">
                <strong>{unit.inquiries}</strong>
                <span>Inquiries</span>
              </div>
              <div className="listing-modal-stat">
                <strong>{unit.sqm}</strong>
                <span>sqm</span>
              </div>
            </div>

            <div className="listing-modal-detail-grid">
              <div className="listing-modal-detail">
                <span>Bedrooms</span>
                <strong>{unit.bedrooms}</strong>
              </div>
              <div className="listing-modal-detail">
                <span>Bathrooms</span>
                <strong>{unit.bathrooms}</strong>
              </div>
              <div className="listing-modal-detail">
                <span>Verification</span>
                <strong>{unit.verified ? 'Verified' : 'Pending'}</strong>
              </div>
              <div className="listing-modal-detail">
                <span>Last updated</span>
                <strong>{unit.lastUpdated}</strong>
              </div>
            </div>

            <div className="listing-modal-section">
              <div className="listing-modal-section-title">Listing summary</div>
              <p className="listing-modal-copy">{unit.description}</p>
            </div>

            <div className="listing-modal-section">
              <div className="listing-modal-section-title">Amenities</div>
              <div className="listing-modal-tags">
                {unit.amenities.map((amenity) => (
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
                {(historyView === 'log' ? unit.history : historyEntriesForMonth).map((entry) => (
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
          </div>
        </div>
      </div>

      {lightboxIndex !== null && (
        <div className="listing-modal-overlay listing-lightbox-overlay" onClick={onClose}>
          <div className="listing-lightbox" onClick={(event) => event.stopPropagation()}>
            <div className="listing-lightbox-track" ref={lightboxRef} onScroll={handleLightboxScroll}>
              {gallery.map((image, index) => (
                <div key={`${unit.id}-lightbox-${index}`} className="listing-lightbox-slide">
                  <img src={image} alt={`${unit.title} enlarged photo ${index + 1}`} />
                </div>
              ))}
            </div>
            <button className="listing-modal-close" onClick={onClose} aria-label="Close full photo">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
            <div className="listing-modal-carousel-dots listing-lightbox-dots">
              {gallery.map((_, index) => (
                <button
                  key={`${unit.id}-lightbox-dot-${index}`}
                  type="button"
                  className={`listing-modal-carousel-dot ${lightboxIndex === index ? 'active' : ''}`}
                  onClick={() => openLightboxPhoto(index)}
                  aria-label={`Go to full photo ${index + 1}`}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
