import { useState } from 'react';
import type { Listing, ListingType } from '../data/listings';
import ListingCard from '../components/ListingCard';
import FilterSheet from '../components/FilterSheet';
import type { Filters } from '../filters';
import { defaultFilters, applyFilters, activeFilterCount } from '../filters';

interface Props {
  listings: Listing[];
  onSelectListing: (l: Listing) => void;
  onToggleSave: (id: number) => void;
  onOpenMenu: () => void;
  onShowToast: (msg: string) => void;
}

const QUICK_TYPES: ListingType[] = ['Studio', 'Bedspace', 'Apartment'];

export default function SearchScreen({ listings, onSelectListing, onToggleSave, onOpenMenu }: Props) {
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState<Filters>(defaultFilters);
  const [sheetOpen, setSheetOpen] = useState(false);

  const filtered = applyFilters(listings, query, filters);
  const activeCount = activeFilterCount(filters);

  // The quick chip row is a convenient single-select view of filters.types.
  const setQuickType = (t: ListingType | null) => {
    setFilters((f) => ({ ...f, types: t ? [t] : [] }));
  };
  const quickActive = (t: ListingType | null) =>
    t === null ? filters.types.length === 0 : filters.types.length === 1 && filters.types[0] === t;

  return (
    <>
      {/* Header */}
      <div className="app-header">
        <div className="logo">
          <div className="logo-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
              <circle cx="12" cy="11" r="2" fill="currentColor" stroke="none"/>
            </svg>
          </div>
          <span className="logo-text">roomie</span>
        </div>
        <div className="header-actions">
          <button className="icon-btn" onClick={onOpenMenu} aria-label="Menu">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="3" y1="12" x2="21" y2="12"/>
              <line x1="3" y1="6" x2="21" y2="6"/>
              <line x1="3" y1="18" x2="21" y2="18"/>
            </svg>
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="search-container">
        <div className="search-input-wrap">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/>
            <line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            type="text"
            placeholder="Search location or property"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
          />
          {query && (
            <button onClick={() => setQuery('')} style={{ color: 'var(--text-light)', lineHeight: 1 }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          )}
        </div>
        <button className="filter-btn" onClick={() => setSheetOpen(true)} aria-label="Filters">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="4" y1="6" x2="20" y2="6"/>
            <line x1="8" y1="12" x2="16" y2="12"/>
            <line x1="11" y1="18" x2="13" y2="18"/>
          </svg>
          {activeCount > 0 && <span className="filter-btn-badge">{activeCount}</span>}
        </button>
      </div>

      {/* Quick type chips */}
      <div className="search-filter-chips">
        <button className={`filter-chip ${quickActive(null) ? 'active' : ''}`} onClick={() => setQuickType(null)}>
          All
        </button>
        {QUICK_TYPES.map((t) => (
          <button
            key={t}
            className={`filter-chip ${quickActive(t) ? 'active' : ''}`}
            onClick={() => setQuickType(t)}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="scroll-area">
        <div className="section-header">
          <span className="section-title">{filtered.length} listings found</span>
          {activeCount > 0 && (
            <button className="see-all-btn" onClick={() => setFilters(defaultFilters)}>
              Clear filters
            </button>
          )}
        </div>

        {filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <circle cx="11" cy="11" r="8"/>
                <line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
            </div>
            <div className="empty-title">No results found</div>
            <div className="empty-sub">Try adjusting your filters or keyword</div>
          </div>
        ) : (
          <div className="listing-grid">
            {filtered.map((listing) => (
              <ListingCard
                key={listing.id}
                listing={listing}
                onSelect={onSelectListing}
                onToggleSave={onToggleSave}
              />
            ))}
          </div>
        )}
      </div>

      <FilterSheet
        open={sheetOpen}
        filters={filters}
        countFor={(f) => applyFilters(listings, query, f).length}
        onApply={setFilters}
        onClose={() => setSheetOpen(false)}
      />
    </>
  );
}
