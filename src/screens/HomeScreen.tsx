import { useState, useRef, useEffect, useCallback } from 'react';
import type { Listing } from '../data/listings';
import ListingMap from '../components/ListingMap';

interface Props {
  listings: Listing[];
  onSelectListing: (l: Listing) => void;
  onToggleSave: (id: number) => void;
  onOpenSearch: () => void;
  onOpenMenu: () => void;
  onShowToast: (msg: string) => void;
}

function TypeBadge({ type }: { type: string }) {
  const cls = type === 'Studio' ? 'badge-studio' : type === 'Bedspace' ? 'badge-bedspace' : 'badge-apartment';
  return <span className={`listing-type-badge ${cls}`}>{type}</span>;
}

export default function HomeScreen({ listings, onSelectListing, onToggleSave, onOpenSearch, onOpenMenu, onShowToast }: Props) {
  const [selectedId, setSelectedId] = useState<number>(listings[0]?.id ?? 0);
  const carouselRef = useRef<HTMLDivElement>(null);
  const scrollTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Smoothly bring a card to the centre of the carousel.
  const centerCard = useCallback((id: number) => {
    const el = carouselRef.current;
    if (!el) return;
    const idx = listings.findIndex((l) => l.id === id);
    const child = el.children[idx] as HTMLElement | undefined;
    if (!child) return;
    el.scrollTo({ left: child.offsetLeft - (el.clientWidth - child.offsetWidth) / 2, behavior: 'smooth' });
  }, [listings]);

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
      let bestId = listings[0]?.id ?? 0;
      let bestDist = Infinity;
      Array.from(el.children).forEach((child, i) => {
        const c = (child as HTMLElement).offsetLeft + (child as HTMLElement).offsetWidth / 2;
        const d = Math.abs(c - center);
        if (d < bestDist) { bestDist = d; bestId = listings[i].id; }
      });
      setSelectedId(bestId);
    }, 90);
  }, [listings]);

  useEffect(() => () => { if (scrollTimer.current) clearTimeout(scrollTimer.current); }, []);

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
          <button className="icon-btn" style={{ position: 'relative' }} onClick={() => onShowToast('🔔 No new notifications')} aria-label="Notifications">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
            </svg>
            <span className="notif-dot" />
          </button>
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
        <button className="search-input-wrap" onClick={onOpenSearch} style={{ textAlign: 'left' }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/>
            <line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input type="text" placeholder="Search location or property" readOnly tabIndex={-1} style={{ pointerEvents: 'none' }} />
        </button>
        <button className="filter-btn" onClick={onOpenSearch} aria-label="Filters">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="4" y1="6" x2="20" y2="6"/>
            <line x1="8" y1="12" x2="16" y2="12"/>
            <line x1="11" y1="18" x2="13" y2="18"/>
          </svg>
        </button>
      </div>

      {/* Interactive map */}
      <div className="home-map-wrap">
        <ListingMap listings={listings} selectedId={selectedId} onSelect={selectFromMap} />
        <div className="home-map-count">{listings.length} homes in this area</div>
      </div>

      {/* Synced listing carousel */}
      <div className="home-carousel" ref={carouselRef} onScroll={handleScroll}>
        {listings.map((l) => (
          <div
            key={l.id}
            className={`carousel-card ${l.id === selectedId ? 'active' : ''}`}
            onClick={() => onSelectListing(l)}
          >
            <div className="carousel-card-img">
              <img src={l.image} alt={l.title} loading="lazy" />
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
      </div>
    </>
  );
}
