import type { Listing } from '../data/listings';
import AppLogo from '../components/AppLogo';

interface Props {
  listings: Listing[];
  onSelectListing: (l: Listing) => void;
  onToggleSave: (id: number) => void;
  onShowToast: (msg: string) => void;
}

function TypeBadge({ type }: { type: string }) {
  const cls = type === 'Studio' ? 'badge-studio' : type === 'Bedspace' ? 'badge-bedspace' : 'badge-apartment';
  return <span className={`saved-item-type ${cls}`} style={{ color: type === 'Studio' ? '#1D4ED8' : type === 'Bedspace' ? '#6D28D9' : '#065F46' }}>{type}</span>;
}

export default function SavedScreen({ listings, onSelectListing, onToggleSave, onShowToast }: Props) {
  return (
    <>
      <div className="app-header">
        <div className="logo"><AppLogo /></div>
        <div className="header-actions" />
      </div>

      <div className="section-header">
        <span className="section-title">Saved</span>
      </div>

      <div className="scroll-area">
        {listings.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
              </svg>
            </div>
            <div className="empty-title">No saved listings yet</div>
            <div className="empty-sub">Tap the heart icon on any listing to keep it here for later.</div>
          </div>
        ) : (
          <div className="saved-list">
            {listings.map(l => (
              <div key={l.id} className="saved-item" onClick={() => onSelectListing(l)}>
                <div className="saved-item-img">
                  <img src={l.image} alt={l.title} loading="lazy" />
                </div>
                <div className="saved-item-info">
                  <TypeBadge type={l.type} />
                  <div className="saved-item-title">{l.title}</div>
                  <div className="saved-item-location">{l.location}</div>
                  <div className="saved-item-price">₱{l.price.toLocaleString()} <span>/ month</span></div>
                </div>
                <button
                  className="saved-item-heart"
                  onClick={(e) => { e.stopPropagation(); onToggleSave(l.id); }}
                  aria-label="Unsave"
                >
                  <svg viewBox="0 0 24 24" fill="currentColor" stroke="none">
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Alert banner */}
        <div className="alert-banner">
          <div className="alert-banner-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
            </svg>
          </div>
          <div className="alert-banner-text">
            Can't find what you're looking for? Create an alert and get notified when new listings match.
          </div>
          <button className="alert-banner-btn" onClick={() => onShowToast('🔔 Alert created — we’ll notify you')}>Create Alert</button>
        </div>
      </div>
    </>
  );
}
