import { useState } from 'react';
import type { Listing, ListingType } from '../data/listings';
import ListingCard from '../components/ListingCard';
import AppLogo from '../components/AppLogo';
import FilterSheet from '../../src/components/FilterSheet';
import type { Filters } from '../../src/filters';
import { defaultFilters, applyFilters, activeFilterCount } from '../../src/filters';

const QUICK_TYPES: ListingType[] = ['Studio', 'Bedspace', 'Apartment'];

interface Props {
  listings: Listing[];
  onSelectListing: (l: Listing) => void;
  onToggleSave: (id: number) => void;
  onShowToast: (msg: string) => void;
  onSendInquiry: (listing: Listing) => void;
}

export default function SearchScreen({ listings, onSelectListing, onToggleSave }: Props) {
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState<Filters>(defaultFilters);
  const [sheetOpen, setSheetOpen] = useState(false);
  const filtered = applyFilters(listings, query, filters);
  const filterCount = activeFilterCount(filters);
  const setQuickType = (type: ListingType | null) => {
    setFilters((current) => ({ ...current, types: type ? [type] : [] }));
  };
  const quickTypeActive = (type: ListingType | null) =>
    type === null ? filters.types.length === 0 : filters.types.length === 1 && filters.types[0] === type;

  return (
    <>
      {/* Header */}
      <div className="app-header">
        <div className="logo"><AppLogo /></div>
      </div>

      {/* Search */}
      <div className="search-container mvp2-search-page-shell">
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
        <button
          className="filter-btn mvp2-page-filter-pill"
          onClick={() => setSheetOpen(true)}
          aria-label="Filters"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="4" y1="6" x2="20" y2="6"/>
            <line x1="8" y1="12" x2="16" y2="12"/>
            <line x1="11" y1="18" x2="13" y2="18"/>
          </svg>
          {filterCount > 0 && <span className="mvp2-filter-count">{filterCount}</span>}
        </button>
      </div>

      <div className="search-filter-chips">
        <button className={`filter-chip ${quickTypeActive(null) ? 'active' : ''}`} onClick={() => setQuickType(null)}>
          All
        </button>
        {QUICK_TYPES.map((type) => (
          <button key={type} className={`filter-chip ${quickTypeActive(type) ? 'active' : ''}`} onClick={() => setQuickType(type)}>
            {type}
          </button>
        ))}
      </div>

      <div className="scroll-area">
        <div className="section-header">
          <span className="section-title">{filtered.length} listings found</span>
          {filterCount > 0 && (
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
            <div className="empty-sub">Try a different keyword or filter</div>
          </div>
        ) : (
          <div className="listing-grid">
            {filtered.map(listing => (
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
        countFor={(nextFilters) => applyFilters(listings, query, nextFilters).length}
        onApply={setFilters}
        onClose={() => setSheetOpen(false)}
      />
    </>
  );
}
