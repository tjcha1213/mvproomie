import { useEffect, useRef, useState, useCallback, type UIEvent as ReactUIEvent } from 'react';

interface Props {
  open: boolean;
  images: string[];
  initialIndex: number;
  onClose: () => void;
}

export default function PhotoModal({ open, images, initialIndex, onClose }: Props) {
  const [activeIndex, setActiveIndex] = useState(initialIndex);
  const stripRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };

    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
    const nextIndex = Math.max(0, Math.min(images.length - 1, initialIndex));
    setActiveIndex(nextIndex);
    requestAnimationFrame(() => {
      stripRef.current?.scrollTo({
        left: stripRef.current.clientWidth * nextIndex,
        behavior: 'auto',
      });
    });
  }, [open, initialIndex, images.length]);

  const handleScroll = useCallback((event: ReactUIEvent<HTMLDivElement>) => {
    const el = event.currentTarget;
    if (!el.clientWidth) return;
    const nextIndex = Math.round(el.scrollLeft / el.clientWidth);
    setActiveIndex(Math.max(0, Math.min(images.length - 1, nextIndex)));
  }, [images.length]);

  if (!open) return null;

  return (
    <div className="photo-modal-overlay" role="dialog" aria-modal="true" aria-label="Listing photo viewer" onClick={onClose}>
      <div className="photo-modal-shell" onClick={(event) => event.stopPropagation()}>
        <button type="button" className="photo-modal-close" onClick={onClose} aria-label="Close photo viewer">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
        <div className="photo-modal-strip" ref={stripRef} onScroll={handleScroll}>
          {images.map((src, index) => (
            <div className="photo-modal-slide" key={`${src}-${index}`}>
              <img className="photo-modal-image" src={src} alt={`Listing photo ${index + 1}`} />
            </div>
          ))}
        </div>
        {images.length > 1 && (
          <div className="photo-modal-dots" aria-hidden="true">
            {images.map((_, index) => (
              <button
                key={index}
                type="button"
                className={`photo-modal-dot ${index === activeIndex ? 'active' : ''}`}
                onClick={() => {
                  setActiveIndex(index);
                  stripRef.current?.scrollTo({
                    left: stripRef.current.clientWidth * index,
                    behavior: 'smooth',
                  });
                }}
                aria-label={`Show photo ${index + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
