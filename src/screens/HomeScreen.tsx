import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { formatListingId, type Listing } from '../data/listings';
import ListingMap from '../components/ListingMap';
import Logo from '../components/Logo';
import FilterSheet from '../components/FilterSheet';
import type { Filters } from '../filters';
import { defaultFilters, applyFilters, activeFilterCount } from '../filters';

interface Props {
  listings: Listing[];
  onSelectListing: (l: Listing) => void;
  onToggleSave: (id: number) => void;
}

function TypeBadge({ type }: { type: string }) {
  const cls = type === 'Studio' ? 'badge-studio' : type === 'Bedspace' ? 'badge-bedspace' : 'badge-apartment';
  return <span className={`listing-type-badge ${cls}`}>{type}</span>;
}

export default function HomeScreen({ listings, onSelectListing, onToggleSave }: Props) {
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState<Filters>(defaultFilters);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<number>(listings[0]?.id ?? 0);
  const carouselRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const scrollTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const filteredListings = useMemo(() => applyFilters(listings, query, filters), [listings, query, filters]);
  const filterCount = activeFilterCount(filters);

  useEffect(() => {
    if (filteredListings.length === 0) return;
    if (!filteredListings.some((listing) => listing.id === selectedId)) {
      setSelectedId(filteredListings[0].id);
    }
  }, [filteredListings, selectedId]);

  // Smoothly bring a card to the centre of the carousel.
  const centerCard = useCallback((id: number) => {
    const el = carouselRef.current;
    if (!el) return;
    const idx = filteredListings.findIndex((l) => l.id === id);
    const child = el.children[idx] as HTMLElement | undefined;
    if (!child) return;
    el.scrollTo({ left: child.offsetLeft - (el.clientWidth - child.offsetWidth) / 2, behavior: 'smooth' });
  }, [filteredListings]);

  // Pin tap → select and centre the matching card.
  const selectFromMap = useCallback((id: number) => {
    setSelectedId(id);
    centerCard(id);
  }, [centerCard]);

  // Swiping the carousel → select the card nearest the centre (map follows).
  const handleScroll = useCallback(() => {
    if (scrollTimer.current) clearTimeout(scrollTimer.current);
    scrollTimer.current = setTimeout(() => {
      const el = carouselRef.current;
      if (!el) return;
      const center = el.scrollLeft + el.clientWidth / 2;
      let bestId = filteredListings[0]?.id ?? 0;
      let bestDist = Infinity;
      Array.from(el.children).forEach((child, i) => {
        const c = (child as HTMLElement).offsetLeft + (child as HTMLElement).offsetWidth / 2;
        const d = Math.abs(c - center);
        if (d < bestDist && filteredListings[i]) { bestDist = d; bestId = filteredListings[i].id; }
      });
      setSelectedId(bestId);
    }, 90);
  }, [filteredListings]);

  useEffect(() => () => { if (scrollTimer.current) clearTimeout(scrollTimer.current); }, []);

  return (
    <>
      <div className="mvp1-home-map-stage">
        <div className="mvp1-map-overlay">
          <div className="mvp1-map-header">
            <Logo />
          </div>
          <div className="search-container mvp1-map-search">
            <div
              className="search-input-wrap"
              onClick={() => searchInputRef.current?.focus()}
              style={{ textAlign: 'left' }}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8"/>
                <line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search area or geolocation"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
              {query && (
                <button
                  type="button"
                  className="mvp1-search-clear"
                  onClick={() => setQuery('')}
                  aria-label="Clear search"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
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
              {filterCount > 0 && <span className="filter-btn-badge">{filterCount}</span>}
            </button>
          </div>
          <div className="home-map-count mvp1-map-count">
            {filteredListings.length} homes in this area
          </div>
        </div>
        <div className="home-map-wrap">
          <ListingMap listings={filteredListings} selectedId={selectedId} onSelect={selectFromMap} />
        </div>
      </div>

      {/* Synced listing carousel */}
      <div className="home-carousel" ref={carouselRef} onScroll={handleScroll}>
        {filteredListings.map((l) => (
          <div
            key={l.id}
            className={`carousel-card ${l.id === selectedId ? 'active' : ''}`}
            onClick={() => onSelectListing(l)}
          >
            <div className="carousel-card-img">
              <img src={l.image} alt={l.title} loading="lazy" />
              <span className="listing-id-tag">{formatListingId(l.id)}</span>
              <TypeBadge type={l.type} />
              <button
                className={`save-btn ${l.saved ? 'saved' : ''}`}
                onClick={(e) => { e.stopPropagation(); onToggleSave(l.id); }}
                aria-label={l.saved ? 'Unsave' : 'Save'}
              >
                <svg viewBox="0 0 24 24" fill={l.saved ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                </svg>
              </button>
            </div>
            <div className="carousel-card-body">
              <div className="carousel-card-title">{l.title}</div>
              <div className="carousel-card-location">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                  <circle cx="12" cy="10" r="3"/>
                </svg>
                {l.location}
              </div>
              <div className="carousel-card-price">₱{l.price.toLocaleString()} <span>/ month</span></div>
            </div>
          </div>
        ))}
        {filteredListings.length === 0 && (
          <div className="mvp1-home-empty">No homes match this area yet.</div>
        )}
      </div>

      <FilterSheet
        open={sheetOpen}
        filters={filters}
        countFor={(f) => applyFilters(listings, query, f).length}
        onApply={setFilters}
        onClose={() => setSheetOpen(false)}
        fromTop
      />
    </>
  );
}
