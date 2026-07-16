import { useEffect, useMemo, useRef, useState } from 'react';
import type { Listing } from '../data/listings';
import ListingCard from '../components/ListingCard';
import AppLogo from '../components/AppLogo';

interface Props {
  listings: Listing[];
  onSelectListing: (l: Listing) => void;
  onToggleSave: (id: number) => void;
  onOpenMenu: () => void;
  onShowToast: (msg: string) => void;
  onSendInquiry: (listing: Listing) => void;
}

type FilterType = 'All' | 'Studio' | 'Bedspace' | 'Apartment';

const FILTERS: FilterType[] = ['All', 'Studio', 'Bedspace', 'Apartment'];

export default function SearchScreen({ listings, onSelectListing, onToggleSave, onOpenMenu, onShowToast, onSendInquiry: _onSendInquiry }: Props) {
  const [query, setQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterType>('All');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [minSqm, setMinSqm] = useState('');
  const [maxSqm, setMaxSqm] = useState('');
  const [listingType, setListingType] = useState<'Any' | Listing['type']>('Any');
  const filterRef = useRef<HTMLDivElement>(null);

  const filtered = useMemo(() => {
    const parsedMinPrice = minPrice ? Number(minPrice) : null;
    const parsedMaxPrice = maxPrice ? Number(maxPrice) : null;
    const parsedMinSqm = minSqm ? Number(minSqm) : null;
    const parsedMaxSqm = maxSqm ? Number(maxSqm) : null;
    const q = query.toLowerCase();

    return listings.filter((l) => {
      const matchChipType = activeFilter === 'All' || l.type === activeFilter;
      const matchDropdownType = listingType === 'Any' || l.type === listingType;
      const matchQuery =
        !q ||
        l.title.toLowerCase().includes(q) ||
        l.location.toLowerCase().includes(q) ||
        l.district.toLowerCase().includes(q);
      const matchMinPrice = parsedMinPrice === null || l.price >= parsedMinPrice;
      const matchMaxPrice = parsedMaxPrice === null || l.price <= parsedMaxPrice;
      const matchMinSqm = parsedMinSqm === null || l.sqm >= parsedMinSqm;
      const matchMaxSqm = parsedMaxSqm === null || l.sqm <= parsedMaxSqm;

      return (
        matchChipType &&
        matchDropdownType &&
        matchQuery &&
        matchMinPrice &&
        matchMaxPrice &&
        matchMinSqm &&
        matchMaxSqm
      );
    });
  }, [activeFilter, listingType, listings, maxPrice, maxSqm, minPrice, minSqm, query]);

  const activeFilterCount = [
    minPrice,
    maxPrice,
    minSqm,
    maxSqm,
    listingType !== 'Any' ? listingType : '',
  ].filter(Boolean).length;

  useEffect(() => {
    const handlePointerDown = (event: PointerEvent) => {
      if (!filtersOpen) return;
      if (filterRef.current?.contains(event.target as Node)) return;
      setFiltersOpen(false);
    };

    window.addEventListener('pointerdown', handlePointerDown);
    return () => window.removeEventListener('pointerdown', handlePointerDown);
  }, [filtersOpen]);

  const resetFilters = () => {
    setMinPrice('');
    setMaxPrice('');
    setMinSqm('');
    setMaxSqm('');
    setListingType('Any');
  };

  return (
    <>
      {/* Header */}
      <div className="app-header">
        <div className="logo"><AppLogo /></div>
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
      <div className="search-container mvp2-search-page-shell" ref={filterRef}>
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
          className={`filter-btn mvp2-page-filter-pill ${filtersOpen ? 'active' : ''}`}
          onClick={() => setFiltersOpen((prev) => !prev)}
          aria-label="Filters"
          aria-expanded={filtersOpen}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="4" y1="6" x2="20" y2="6"/>
            <line x1="8" y1="12" x2="16" y2="12"/>
            <line x1="11" y1="18" x2="13" y2="18"/>
          </svg>
          {activeFilterCount > 0 && <span className="mvp2-filter-count">{activeFilterCount}</span>}
        </button>
        {filtersOpen && (
          <div className="mvp2-filter-menu mvp2-filter-menu-page" onClick={(event) => event.stopPropagation()}>
            <div className="mvp2-filter-menu-head">
              <div>
                <div className="mvp2-filter-menu-title">Filters</div>
                <div className="mvp2-filter-menu-copy">Refine search results by price, size, and type.</div>
              </div>
              <button type="button" className="mvp2-filter-reset" onClick={resetFilters}>
                Reset
              </button>
            </div>
            <div className="mvp2-filter-grid">
              <label className="mvp2-filter-field">
                <span>Min price</span>
                <input
                  type="number"
                  inputMode="numeric"
                  placeholder="2500"
                  value={minPrice}
                  onChange={(event) => setMinPrice(event.target.value)}
                />
              </label>
              <label className="mvp2-filter-field">
                <span>Max price</span>
                <input
                  type="number"
                  inputMode="numeric"
                  placeholder="18000"
                  value={maxPrice}
                  onChange={(event) => setMaxPrice(event.target.value)}
                />
              </label>
              <label className="mvp2-filter-field">
                <span>Min room size</span>
                <input
                  type="number"
                  inputMode="numeric"
                  placeholder="10 sqm"
                  value={minSqm}
                  onChange={(event) => setMinSqm(event.target.value)}
                />
              </label>
              <label className="mvp2-filter-field">
                <span>Max room size</span>
                <input
                  type="number"
                  inputMode="numeric"
                  placeholder="40 sqm"
                  value={maxSqm}
                  onChange={(event) => setMaxSqm(event.target.value)}
                />
              </label>
              <label className="mvp2-filter-field mvp2-filter-field-wide">
                <span>Listing type</span>
                <select value={listingType} onChange={(event) => setListingType(event.target.value as 'Any' | Listing['type'])}>
                  <option value="Any">Any</option>
                  <option value="Studio">Studio</option>
                  <option value="Bedspace">Bedspace</option>
                  <option value="Apartment">Apartment</option>
                </select>
              </label>
            </div>
          </div>
        )}
      </div>

      {/* Filter chips */}
      <div className="search-filter-chips">
        {FILTERS.map(f => (
          <button
            key={f}
            className={`filter-chip ${activeFilter === f ? 'active' : ''}`}
            onClick={() => setActiveFilter(f)}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="scroll-area">
        <div className="section-header">
          <span className="section-title">{filtered.length} listings found</span>
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
    </>
  );
}
