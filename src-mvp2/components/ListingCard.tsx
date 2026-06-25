import type { Listing } from '../data/listings';

interface Props {
  listing: Listing;
  onSelect: (listing: Listing) => void;
  onToggleSave: (id: number) => void;
}

function TypeBadge({ type }: { type: string }) {
  const cls = type === 'Studio' ? 'badge-studio' : type === 'Bedspace' ? 'badge-bedspace' : 'badge-apartment';
  return <span className={`listing-type-badge ${cls}`}>{type}</span>;
}

export default function ListingCard({ listing, onSelect, onToggleSave }: Props) {
  return (
    <div className="listing-card" onClick={() => onSelect(listing)}>
      <div className="listing-card-img">
        <img src={listing.image} alt={listing.title} loading="lazy" />
        <TypeBadge type={listing.type} />
        <button
          className={`save-btn ${listing.saved ? 'saved' : ''}`}
          onClick={(e) => { e.stopPropagation(); onToggleSave(listing.id); }}
          aria-label={listing.saved ? 'Unsave' : 'Save'}
        >
          <svg viewBox="0 0 24 24" fill={listing.saved ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
          </svg>
        </button>
      </div>
      <div className="listing-card-body">
        <div className="listing-card-title">{listing.title}</div>
        <div className="listing-card-location">{listing.location}</div>
        <div className="listing-card-price">
          ₱{listing.price.toLocaleString()} <span>/ month</span>
        </div>
      </div>
    </div>
  );
}
