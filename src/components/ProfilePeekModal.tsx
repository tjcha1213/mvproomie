import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { avatarAt } from '../avatarPool';

interface Props {
  open: boolean;
  avatar: string;
  name: string;
  role: string;
  userId?: string;
  memberSince?: string;
  verificationStatus?: string;
  roomieScore?: number;
  uploadedListings?: string[];
  tenantReviews?: string[];
  landlordReviews?: string[];
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
  memberSince,
  verificationStatus,
  roomieScore,
  uploadedListings = [],
  tenantReviews = [],
  landlordReviews = [],
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

  const isLandlordRole = role.toLowerCase().includes('landlord');
  const memberSinceValue = memberSince ?? 'Not available';
  const verificationValue = verificationStatus ?? 'Not available';
  const roomieScoreValue = typeof roomieScore === 'number' ? String(roomieScore) : 'Not available';
  const uploadedListingLabel = isLandlordRole
    ? uploadedListings.length > 0
      ? uploadedListings
      : ['No uploaded listings in this preview.']
    : ['Listings are shown for landlord profiles only.'];
  const tenantReviewItems = tenantReviews.length > 0 ? tenantReviews : ['No tenant reviews in this preview.'];
  const landlordReviewItems = landlordReviews.length > 0 ? landlordReviews : ['No landlord reviews in this preview.'];

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

        <div className="profile-peek-summary-grid">
          <div className="profile-peek-summary-item">
            <span className="profile-peek-summary-label">Member since</span>
            <strong className="profile-peek-summary-value">{memberSinceValue}</strong>
          </div>
          <div className="profile-peek-summary-item">
            <span className="profile-peek-summary-label">Verification</span>
            <strong className="profile-peek-summary-value">{verificationValue}</strong>
          </div>
          <div className="profile-peek-summary-item">
            <span className="profile-peek-summary-label">Roomie score</span>
            <strong className="profile-peek-summary-value">{roomieScoreValue}</strong>
          </div>
        </div>

        <div className="profile-peek-section">
          <div className="profile-peek-section-title">Listings uploaded</div>
          <div className="profile-peek-chip-list">
            {uploadedListingLabel.map((item) => (
              <span key={item} className="profile-peek-chip">{item}</span>
            ))}
          </div>
        </div>

        <div className="profile-peek-section">
          <div className="profile-peek-section-title">Reviews as tenant</div>
          <div className="profile-peek-review-list">
            {tenantReviewItems.map((item) => (
              <div key={item} className="profile-peek-review">
                <span className="profile-peek-review-copy">{item}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="profile-peek-section">
          <div className="profile-peek-section-title">Reviews as landlord</div>
          <div className="profile-peek-review-list">
            {landlordReviewItems.map((item) => (
              <div key={item} className="profile-peek-review">
                <span className="profile-peek-review-copy">{item}</span>
              </div>
            ))}
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
