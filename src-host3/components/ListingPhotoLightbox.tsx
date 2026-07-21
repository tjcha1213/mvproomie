import { useCallback, useEffect, useRef, useState, type UIEvent as ReactUIEvent } from 'react';

interface Props {
  open: boolean;
  unitTitle: string;
  gallery: string[];
  initialIndex: number;
  onClose: () => void;
}

export default function ListingPhotoLightbox({
  open,
  unitTitle,
  gallery,
  initialIndex,
  onClose,
}: Props) {
  const [activeIndex, setActiveIndex] = useState(initialIndex);
  const trackRef = useRef<HTMLDivElement>(null);
  const snapTimerRef = useRef<number | null>(null);

  useEffect(() => {
    if (!open) return;
    setActiveIndex(Math.max(0, Math.min(gallery.length - 1, initialIndex)));
    requestAnimationFrame(() => {
      const track = trackRef.current;
      if (!track) return;
      track.scrollTo({ left: track.clientWidth * Math.max(0, Math.min(gallery.length - 1, initialIndex)), behavior: 'auto' });
    });
  }, [gallery.length, initialIndex, open]);

  useEffect(() => () => {
    if (snapTimerRef.current !== null) window.clearTimeout(snapTimerRef.current);
  }, []);

  const openPhoto = useCallback((index: number) => {
    const track = trackRef.current;
    if (!track) return;
    const nextIndex = Math.max(0, Math.min(gallery.length - 1, index));
    setActiveIndex(nextIndex);
    track.scrollTo({ left: track.clientWidth * nextIndex, behavior: 'smooth' });
  }, [gallery.length]);

  const handleScroll = useCallback((event: ReactUIEvent<HTMLDivElement>) => {
    const track = event.currentTarget;
    const width = Math.max(track.clientWidth, 1);
    const nextIndex = Math.max(0, Math.min(gallery.length - 1, Math.round(track.scrollLeft / width)));
    setActiveIndex((current) => (current === nextIndex ? current : nextIndex));

    if (snapTimerRef.current !== null) window.clearTimeout(snapTimerRef.current);
    snapTimerRef.current = window.setTimeout(() => {
      const settledIndex = Math.max(0, Math.min(gallery.length - 1, Math.round(track.scrollLeft / width)));
      const targetLeft = settledIndex * width;
      if (Math.abs(track.scrollLeft - targetLeft) > 1) {
        track.scrollTo({ left: targetLeft, behavior: 'smooth' });
      }
    }, 90);
  }, [gallery.length]);

  if (!open) return null;

  return (
    <div className="listing-modal-overlay listing-lightbox-overlay" onClick={onClose}>
      <div className="listing-lightbox-modal" role="dialog" aria-modal="true" aria-label="Listing photo viewer" onClick={(event) => event.stopPropagation()}>
        <div
          className="listing-lightbox-track"
          ref={trackRef}
          onScroll={handleScroll}
        >
          {gallery.map((image, index) => (
            <button
              key={`${unitTitle}-lightbox-${index}`}
              type="button"
              className="listing-lightbox-slide"
              onClick={() => openPhoto(index)}
            >
              <img src={image} alt={`${unitTitle} enlarged photo ${index + 1}`} />
            </button>
          ))}
        </div>
        <button className="listing-modal-close" onClick={onClose} aria-label="Close full photo">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
        {gallery.length > 1 && (
          <>
            <button
              type="button"
              className="listing-lightbox-nav is-prev"
              onClick={() => openPhoto(Math.max(activeIndex - 1, 0))}
              disabled={activeIndex === 0}
              aria-label="Previous photo"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>
            <button
              type="button"
              className="listing-lightbox-nav is-next"
              onClick={() => openPhoto(Math.min(activeIndex + 1, gallery.length - 1))}
              disabled={activeIndex === gallery.length - 1}
              aria-label="Next photo"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
            <div className="listing-lightbox-dots">
              {gallery.map((_, index) => (
                <button
                  key={`${unitTitle}-lightbox-dot-${index}`}
                  type="button"
                  className={`listing-modal-carousel-dot ${activeIndex === index ? 'active' : ''}`}
                  onClick={() => openPhoto(index)}
                  aria-label={`Go to full photo ${index + 1}`}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
