import { useState, useRef, useEffect, useCallback, type PointerEvent as ReactPointerEvent } from 'react';
import type { Listing } from '../data/listings';
import ListingMap, { MiniListingMap } from '../components/ListingMap';
import AppLogo from '../components/AppLogo';

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

function ListingPhotoCarousel({
  images,
  title,
  lat,
  lng,
}: {
  images: string[];
  title: string;
  lat: number;
  lng: number;
}) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [showMap, setShowMap] = useState(false);

  const handleScroll = useCallback((event: React.UIEvent<HTMLDivElement>) => {
    const el = event.currentTarget;
    if (!el.clientWidth) return;
    const nextIndex = Math.round(el.scrollLeft / el.clientWidth);
    setActiveIndex(Math.max(0, Math.min(images.length - 1, nextIndex)));
  }, [images.length]);

  return (
    <>
      {showMap ? (
        <div
          className="carousel-mini-map-wrap"
          onClick={(event) => event.stopPropagation()}
          onPointerDown={(event) => event.stopPropagation()}
          onTouchStart={(event) => event.stopPropagation()}
          onMouseDown={(event) => event.stopPropagation()}
        >
          <MiniListingMap lat={lat} lng={lng} />
        </div>
      ) : (
        <>
          <div className="carousel-photo-strip" onScroll={handleScroll}>
            {images.map((image, imageIndex) => (
              <div className="carousel-photo-slide" key={`${title}-${imageIndex}`}>
                <img src={image} alt={`${title} photo ${imageIndex + 1}`} loading="lazy" />
              </div>
            ))}
          </div>
          <div className="carousel-photo-dots" aria-hidden="true">
            {images.map((_, imageIndex) => (
              <span
                key={`${title}-dot-${imageIndex}`}
                className={`carousel-photo-dot ${imageIndex === activeIndex ? 'active' : ''}`}
              />
            ))}
          </div>
        </>
      )}
      <button
        className={`carousel-map-toggle ${showMap ? 'active' : ''}`}
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          setShowMap((prev) => !prev);
        }}
        aria-label={showMap ? 'Show listing photos' : 'Show listing location on map'}
      >
        {showMap ? (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="5" width="18" height="14" rx="2" />
            <circle cx="9" cy="10" r="1.5" />
            <path d="M21 15l-5-5-4 4-2-2-5 5" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 6l6-2 6 2 6-2v14l-6 2-6-2-6 2V6z" />
            <path d="M9 4v14" />
            <path d="M15 6v14" />
          </svg>
        )}
      </button>
    </>
  );
}

export default function HomeScreen({ listings, onSelectListing, onToggleSave, onOpenSearch, onOpenMenu, onShowToast }: Props) {
  const [selectedId, setSelectedId] = useState<number>(listings[0]?.id ?? 0);
  const [sheetHeight, setSheetHeight] = useState(320);
  const [stageHeight, setStageHeight] = useState(0);
  const [topInset, setTopInset] = useState(0);
  const stageRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const scrollTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sheetHeightRef = useRef(244);
  const dragState = useRef<{ startY: number; startHeight: number; dragging: boolean; moved: boolean }>({
    startY: 0,
    startHeight: 244,
    dragging: false,
    moved: false,
  });

  const getSnapPoints = useCallback(() => {
    const collapsed = 44;
    const full = stageHeight > 0 ? Math.max(320, stageHeight) : 454;
    const split = stageHeight > 0
      ? Math.min(full - 84, Math.max(292, Math.round(stageHeight * 0.48)))
      : 320;
    return [collapsed, split, full];
  }, [stageHeight]);

  const clampHeight = useCallback((value: number) => {
    const [collapsed, , full] = getSnapPoints();
    return Math.max(collapsed, Math.min(full, value));
  }, [getSnapPoints]);

  const snapSheetHeight = useCallback((value: number) => {
    const snapPoints = getSnapPoints();
    const next = snapPoints.reduce((best, point) =>
      Math.abs(point - value) < Math.abs(best - value) ? point : best
    );
    setSheetHeight(next);
  }, [getSnapPoints]);

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
    const updateMeasurements = () => {
      setStageHeight(stageRef.current?.clientHeight ?? 0);
      setTopInset(overlayRef.current?.clientHeight ?? 0);
    };
    updateMeasurements();
    window.addEventListener('resize', updateMeasurements);
    return () => window.removeEventListener('resize', updateMeasurements);
  }, []);

  useEffect(() => {
    if (stageHeight <= 0) return;
    setSheetHeight((prev) => clampHeight(prev));
  }, [clampHeight, stageHeight]);

  useEffect(() => {
    sheetHeightRef.current = sheetHeight;
  }, [sheetHeight]);

  const expandSheet = useCallback(() => {
    const snapPoints = getSnapPoints();
    setSheetHeight((prev) => {
      const currentIndex = snapPoints.reduce((bestIndex, point, index) =>
        Math.abs(point - prev) < Math.abs(snapPoints[bestIndex] - prev) ? index : bestIndex
      , 0);
      const nextIndex = currentIndex >= snapPoints.length - 1 ? 0 : currentIndex + 1;
      return snapPoints[nextIndex];
    });
  }, [getSnapPoints]);

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

  const [collapsedHeight, splitHeight, fullHeight] = getSnapPoints();
  const sheetMode =
    sheetHeight <= collapsedHeight + 18
      ? 'peek'
      : sheetHeight >= fullHeight - 28
        ? 'full'
        : 'mid';
  const mapBottom = sheetMode === 'full'
    ? stageHeight
    : Math.max(0, sheetHeight - 6);
  const returnToMapView = useCallback(() => {
    setSheetHeight(collapsedHeight);
  }, [collapsedHeight]);

  return (
    <>
      <div className={`home-stage sheet-${sheetMode}`} ref={stageRef}>
      <div className="mvp2-map-overlay" ref={overlayRef}>
        <button
          className="mvp2-logo-pill"
          type="button"
          onClick={() => onShowToast('Roomie home')}
          aria-label="Roomie"
        >
          <AppLogo className="mvp2-logo-img" />
        </button>

        <div className="search-container mvp2-search-shell">
          <button className="search-input-wrap mvp2-search-pill" onClick={onOpenSearch} style={{ textAlign: 'left' }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/>
              <line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input type="text" placeholder="Search location or property" readOnly tabIndex={-1} style={{ pointerEvents: 'none' }} />
          </button>
          <button className="filter-btn mvp2-filter-pill" onClick={onOpenSearch} aria-label="Filters">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="4" y1="6" x2="20" y2="6"/>
              <line x1="8" y1="12" x2="16" y2="12"/>
              <line x1="11" y1="18" x2="13" y2="18"/>
            </svg>
          </button>
        </div>
      </div>

      {/* Interactive map */}
      <div className="home-map-wrap" style={{ bottom: `${mapBottom}px` }}>
        <ListingMap
          listings={listings}
          selectedId={selectedId}
          onSelect={selectFromMap}
          bottomInset={mapBottom}
          topInset={topInset}
        />
      </div>

      <div
        className={`home-sheet ${sheetMode}`}
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
            <div className="home-sheet-title">{listings.length} listings in this area</div>
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
                <ListingPhotoCarousel
                  images={l.images}
                  title={l.title}
                  lat={l.lat}
                  lng={l.lng}
                />
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
                <div className="carousel-card-location">{l.location}</div>
                <div className="carousel-card-size">{l.sqm} sqm</div>
                <div className="carousel-card-price">₱{l.price.toLocaleString()} <span>/ month</span></div>
                <button
                  className="carousel-inquiry-pill"
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    onShowToast(`Inquiry sent for ${l.title}`);
                  }}
                >
                  Send inquiry
                </button>
              </div>
            </div>
          ))}
        </div>

        {sheetMode === 'full' && (
          <button
            className="home-map-return-pill"
            type="button"
            onClick={returnToMapView}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 6l6-2 6 2 6-2v14l-6 2-6-2-6 2V6z" />
              <path d="M9 4v14" />
              <path d="M15 6v14" />
            </svg>
            <span>Map view</span>
          </button>
        )}
      </div>
      </div>
    </>
  );
}
