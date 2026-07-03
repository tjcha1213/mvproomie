import { useState, useRef, useEffect, useCallback, type PointerEvent as ReactPointerEvent } from 'react';
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
  const [sheetHeight, setSheetHeight] = useState(244);
  const listRef = useRef<HTMLDivElement>(null);
  const scrollTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sheetHeightRef = useRef(244);
  const dragState = useRef<{ startY: number; startHeight: number; dragging: boolean; moved: boolean }>({
    startY: 0,
    startHeight: 244,
    dragging: false,
    moved: false,
  });

  const clampHeight = useCallback((value: number) => Math.max(154, Math.min(454, value)), []);
  const snapSheetHeight = useCallback(
    (value: number) => {
      const snapPoints = [154, 244, 454];
      const next = snapPoints.reduce((best, point) =>
        Math.abs(point - value) < Math.abs(best - value) ? point : best
      );
      setSheetHeight(next);
    },
    []
  );

  // Smoothly bring a card to the centre of the carousel.
  const centerCard = useCallback((id: number) => {
    const el = listRef.current;
    if (!el) return;
    const idx = listings.findIndex((l) => l.id === id);
    const child = el.children[idx] as HTMLElement | undefined;
    if (!child) return;
    const targetTop = child.offsetTop - 10;
    el.scrollTo({ top: targetTop, behavior: 'smooth' });
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
      const el = listRef.current;
      if (!el) return;
      const center = el.scrollTop + el.clientHeight / 2;
      let bestId = listings[0]?.id ?? 0;
      let bestDist = Infinity;
      Array.from(el.children).forEach((child, i) => {
        const c = (child as HTMLElement).offsetTop + (child as HTMLElement).offsetHeight / 2;
        const d = Math.abs(c - center);
        if (d < bestDist) { bestDist = d; bestId = listings[i].id; }
      });
      setSelectedId(bestId);
    }, 90);
  }, [listings]);

  useEffect(() => () => { if (scrollTimer.current) clearTimeout(scrollTimer.current); }, []);

  useEffect(() => {
    sheetHeightRef.current = sheetHeight;
  }, [sheetHeight]);

  const expandSheet = useCallback(() => setSheetHeight((prev) => (prev >= 340 ? 154 : 454)), []);

  useEffect(() => {
    const handlePointerMove = (event: PointerEvent) => {
      if (!dragState.current.dragging) return;
      const delta = dragState.current.startY - event.clientY;
      if (Math.abs(delta) > 6) {
        dragState.current.moved = true;
      }
      setSheetHeight(clampHeight(dragState.current.startHeight + delta));
    };

    const handlePointerUp = () => {
      if (!dragState.current.dragging) return;
      const shouldToggle = !dragState.current.moved;
      dragState.current.dragging = false;
      if (shouldToggle) {
        expandSheet();
        return;
      }
      snapSheetHeight(sheetHeightRef.current);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    window.addEventListener('pointercancel', handlePointerUp);
    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('pointercancel', handlePointerUp);
    };
  }, [clampHeight, expandSheet, snapSheetHeight]);

  const beginDrag = useCallback((event: ReactPointerEvent<HTMLButtonElement>) => {
    dragState.current = {
      startY: event.clientY,
      startHeight: sheetHeight,
      dragging: true,
      moved: false,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  }, [sheetHeight]);

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

      <div className="home-stage">
      {/* Interactive map */}
      <div className="home-map-wrap" style={{ bottom: `${sheetHeight - 6}px` }}>
        <ListingMap listings={listings} selectedId={selectedId} onSelect={selectFromMap} />
        <div className="home-map-count">{listings.length} homes in this area</div>
      </div>

      <div
        className={`home-sheet ${sheetHeight >= 340 ? 'expanded' : sheetHeight <= 170 ? 'peek' : 'mid'}`}
        style={{ height: `${sheetHeight}px` }}
      >
        <button
          className="home-sheet-grabber"
          type="button"
          onPointerDown={beginDrag}
          aria-label="Expand or minimize listings"
        >
          <span className="home-sheet-handle" />
        </button>
        <div className="home-sheet-head">
          <div>
            <div className="home-sheet-title">Listings nearby</div>
            <div className="home-sheet-sub">
              Expand for a larger map-to-listing comparison view.
            </div>
          </div>
        </div>

        {/* Synced listing carousel */}
        <div className="home-carousel vertical-list" ref={listRef} onScroll={handleScroll}>
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
      </div>
      </div>
    </>
  );
}
