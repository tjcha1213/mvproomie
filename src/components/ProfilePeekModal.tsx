import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { avatarAt } from '../avatarPool';

interface Props {
  open: boolean;
  avatar: string;
  name: string;
  role: string;
  userId?: string;
  subtitle?: string;
  details?: string[];
  onClose: () => void;
}

export default function ProfilePeekModal({
  open,
  avatar,
  name,
  role,
  userId,
  subtitle,
  details = [],
  onClose,
}: Props) {
  const fallbackAvatar = useMemo(() => avatarAt(28), []);
  const [avatarSrc, setAvatarSrc] = useState(avatar || fallbackAvatar);

  useEffect(() => {
    setAvatarSrc(avatar || fallbackAvatar);
  }, [avatar, fallbackAvatar, open]);

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };

    document.body.classList.add('profile-peek-open');
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.classList.remove('profile-peek-open');
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div
      className="profile-peek-overlay"
      aria-label={`${name} profile preview`}
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div className="profile-peek-shell" onClick={(event) => event.stopPropagation()}>
        <button type="button" className="profile-peek-close" onClick={onClose} aria-label="Close profile preview">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        <div className="profile-peek-header">
          <div className="profile-peek-copy">
            <div className="profile-peek-name-row">
              <button type="button" className="profile-peek-avatar" onClick={onClose} aria-label={`Close ${name} profile preview`}>
                <img
                  src={avatarSrc}
                  alt={name}
                  onError={() => setAvatarSrc(fallbackAvatar)}
                />
              </button>
              <h2 className="profile-peek-name">{name}</h2>
              <span className="profile-peek-role">{role}</span>
            </div>
            {userId && <div className="profile-peek-id">{userId}</div>}
            {subtitle && <div className="profile-peek-subtitle">{subtitle}</div>}
          </div>
        </div>

        {details.length > 0 && (
          <div className="profile-peek-details">
            {details.map((detail) => (
              <div key={detail} className="profile-peek-detail">{detail}</div>
            ))}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
