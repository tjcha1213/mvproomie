import { useState, useEffect } from 'react';
import type { ListingType } from '../data/listings';
import type { Filters } from '../filters';
import { PRICE_MIN, PRICE_MAX, PRICE_STEP, defaultFilters } from '../filters';

interface Props {
  open: boolean;
  filters: Filters;
  countFor: (f: Filters) => number;
  onApply: (f: Filters) => void;
  onClose: () => void;
  fromTop?: boolean;
}

const TYPES: ListingType[] = ['Studio', 'Bedspace', 'Apartment'];

function pct(v: number): number {
  return ((v - PRICE_MIN) / (PRICE_MAX - PRICE_MIN)) * 100;
}

function priceLabel(v: number, isMax: boolean): string {
  return `₱${v.toLocaleString()}${isMax && v >= PRICE_MAX ? '+' : ''}`;
}

export default function FilterSheet({ open, filters, countFor, onApply, onClose, fromTop = false }: Props) {
  const [draft, setDraft] = useState<Filters>(filters);

  useEffect(() => {
    if (open) setDraft(filters);
  }, [open, filters]);

  if (!open) return null;

  const toggleType = (t: ListingType) => {
    setDraft((d) => ({
      ...d,
      types: d.types.includes(t) ? d.types.filter((x) => x !== t) : [...d.types, t],
    }));
  };

  const setMin = (v: number) => setDraft((d) => ({ ...d, priceMin: Math.min(v, d.priceMax - PRICE_STEP) }));
  const setMax = (v: number) => setDraft((d) => ({ ...d, priceMax: Math.max(v, d.priceMin + PRICE_STEP) }));

  const count = countFor(draft);

  if (fromTop) {
    return (
      <div className="top-filter-overlay" onClick={onClose}>
        <div className="top-filter-panel" onClick={(e) => e.stopPropagation()}>
          <div className="top-filter-header">
            <div className="top-filter-kicker">Filters</div>
            <div className="top-filter-title">Refine your search</div>
            <div className="top-filter-subtitle">Adjust rent, property type, and amenities.</div>
            <button className="top-filter-close" onClick={onClose} aria-label="Close">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          <div className="top-filter-content">
            <div className="top-filter-section">
              <div className="top-filter-section-title">Monthly rent</div>
              <div className="top-filter-range-values">
                <span>{priceLabel(draft.priceMin, false)}</span>
                <span>{priceLabel(draft.priceMax, true)}</span>
              </div>
              <div className="range-slider top-filter-range">
                <div className="range-track" />
                <div
                  className="range-fill"
                  style={{ left: `${pct(draft.priceMin)}%`, right: `${100 - pct(draft.priceMax)}%` }}
                />
                <input
                  type="range"
                  min={PRICE_MIN}
                  max={PRICE_MAX}
                  step={PRICE_STEP}
                  value={draft.priceMin}
                  onChange={(e) => setMin(Number(e.target.value))}
                  aria-label="Minimum rent"
                />
                <input
                  type="range"
                  min={PRICE_MIN}
                  max={PRICE_MAX}
                  step={PRICE_STEP}
                  value={draft.priceMax}
                  onChange={(e) => setMax(Number(e.target.value))}
                  aria-label="Maximum rent"
                />
              </div>
            </div>

            <div className="top-filter-section">
              <div className="top-filter-section-title">Property type</div>
              <div className="top-filter-chip-row">
                {TYPES.map((t) => (
                  <button
                    key={t}
                    type="button"
                    className={`top-filter-chip ${draft.types.includes(t) ? 'active' : ''}`}
                    onClick={() => toggleType(t)}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <div className="top-filter-section">
              <div className="top-filter-section-title">Facilities</div>
              <div className="top-filter-chip-row">
                <button
                  type="button"
                  className={`top-filter-chip ${draft.furnished ? 'active' : ''}`}
                  onClick={() => setDraft((d) => ({ ...d, furnished: !d.furnished }))}
                >
                  Furnished
                </button>
                <button
                  type="button"
                  className={`top-filter-chip ${draft.wifi ? 'active' : ''}`}
                  onClick={() => setDraft((d) => ({ ...d, wifi: !d.wifi }))}
                >
                  Wi-Fi
                </button>
              </div>
            </div>
          </div>

          <div className="top-filter-footer">
            <button className="top-filter-clear" onClick={() => setDraft(defaultFilters)}>
              Clear all
            </button>
            <button className="top-filter-apply" onClick={() => { onApply(draft); onClose(); }}>
              Show {count} {count === 1 ? 'result' : 'results'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`sheet-overlay ${fromTop ? 'sheet-overlay-topdown' : ''}`} onClick={onClose}>
      <div className={`filter-sheet ${fromTop ? 'sheet-topdown' : ''}`} onClick={(e) => e.stopPropagation()}>
        <div className={`sheet-handle ${fromTop ? 'sheet-handle-hidden' : ''}`} />
        <div className="sheet-header filter-sheet-header" style={fromTop ? { padding: '0 16px 12px', marginBottom: 0 } : {}}>
          <div>
            <div className="sheet-title">Filters</div>
            <div className="sheet-sub">Narrow down your search</div>
          </div>
          <button className="sheet-close" onClick={onClose} aria-label="Close">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="filter-body filter-sheet-body">
          {/* Monthly rent */}
          <div className="filter-section">
            <div className="filter-section-title">Monthly rent</div>
            <div className="price-range-label">
              <span>{priceLabel(draft.priceMin, false)}</span>
              <span>–</span>
              <span>{priceLabel(draft.priceMax, true)}</span>
            </div>
            <div className="range-slider">
              <div className="range-track" />
              <div
                className="range-fill"
                style={{ left: `${pct(draft.priceMin)}%`, right: `${100 - pct(draft.priceMax)}%` }}
              />
              <input
                type="range"
                min={PRICE_MIN}
                max={PRICE_MAX}
                step={PRICE_STEP}
                value={draft.priceMin}
                onChange={(e) => setMin(Number(e.target.value))}
                aria-label="Minimum rent"
              />
              <input
                type="range"
                min={PRICE_MIN}
                max={PRICE_MAX}
                step={PRICE_STEP}
                value={draft.priceMax}
                onChange={(e) => setMax(Number(e.target.value))}
                aria-label="Maximum rent"
              />
            </div>
          </div>

          {/* Property type */}
          <div className="filter-section">
            <div className="filter-section-title">Property type</div>
            <div className="filter-chip-group">
              {TYPES.map((t) => (
                <button
                  key={t}
                  className={`filter-chip ${draft.types.includes(t) ? 'active' : ''}`}
                  onClick={() => toggleType(t)}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Facilities */}
          <div className="filter-section">
            <div className="filter-section-title">Facilities</div>
            <div className="filter-chip-group">
              <button
                className={`filter-chip ${draft.furnished ? 'active' : ''}`}
                onClick={() => setDraft((d) => ({ ...d, furnished: !d.furnished }))}
              >
                Furnished
              </button>
              <button
                className={`filter-chip ${draft.wifi ? 'active' : ''}`}
                onClick={() => setDraft((d) => ({ ...d, wifi: !d.wifi }))}
              >
                Wi-Fi
              </button>
            </div>
          </div>
        </div>

        <div className="filter-actions filter-sheet-actions">
          <button className="filter-clear" onClick={() => setDraft(defaultFilters)}>
            Clear all
          </button>
          <button className="filter-apply" onClick={() => { onApply(draft); onClose(); }}>
            Show {count} {count === 1 ? 'result' : 'results'}
          </button>
        </div>
      </div>
    </div>
  );
}
