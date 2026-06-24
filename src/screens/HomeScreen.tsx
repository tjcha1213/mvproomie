import type { Listing } from '../data/listings';
import ListingCard from '../components/ListingCard';

interface Props {
  listings: Listing[];
  onSelectListing: (l: Listing) => void;
  onToggleSave: (id: number) => void;
  onOpenSearch: () => void;
  onOpenMenu: () => void;
  onShowToast: (msg: string) => void;
}

export default function HomeScreen({ listings, onSelectListing, onToggleSave, onOpenSearch, onOpenMenu, onShowToast }: Props) {
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

      {/* Scrollable content */}
      <div className="scroll-area">
        <div className="section-header">
          <span className="section-title">Nearby Listings</span>
          <span className="see-all-btn" onClick={onOpenSearch}>See all</span>
        </div>

        <div className="listing-grid">
          {listings.map(listing => (
            <ListingCard
              key={listing.id}
              listing={listing}
              onSelect={onSelectListing}
              onToggleSave={onToggleSave}
            />
          ))}
        </div>
      </div>
    </>
  );
}
