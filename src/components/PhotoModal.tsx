import { useEffect } from 'react';

interface Props {
  open: boolean;
  src: string;
  alt: string;
  onClose: () => void;
}

export default function PhotoModal({ open, src, alt, onClose }: Props) {
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
        <img className="photo-modal-image" src={src} alt={alt} />
      </div>
    </div>
  );
}
