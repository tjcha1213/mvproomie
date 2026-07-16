import { useMemo } from 'react';
import type { Listing } from '../data/listings';
import AppLogo from '../components/AppLogo';

interface Props {
  listings: Listing[];
  onSelectListing: (l: Listing) => void;
  onToggleSave: (id: number) => void;
  onOpenSearch: () => void;
  onSendInquiry: (listing: Listing) => void;
}

function TypeBadge({ type }: { type: string }) {
  const cls = type === 'Studio' ? 'badge-studio' : type === 'Bedspace' ? 'badge-bedspace' : 'badge-apartment';
  return <span className={`listing-type-badge ${cls}`}>{type}</span>;
}

function getBathroomLabel(listing: Listing) {
  if (listing.type === 'Bedspace') return 'Shared bathroom';
  return `${listing.baths} bathroom${listing.baths > 1 ? 's' : ''}`;
}

interface ListingRailSection {
  title: string;
  subtitle: string;
  listings: Listing[];
}

export default function HomeScreen({
  listings,
  onSelectListing,
  onToggleSave,
  onOpenSearch,
  onSendInquiry: _onSendInquiry,
}: Props) {
  const sections = useMemo<ListingRailSection[]>(() => {
    const qcListings = listings.filter((listing) => listing.district === 'QC');
    const makatiListings = listings.filter((listing) => listing.district === 'Makati');
    const affordableListings = listings.filter((listing) => listing.price <= 8000);
    const largerListings = listings.filter((listing) => listing.sqm >= 25);

    return [
      {
        title: 'Around Quezon City',
        subtitle: 'Dense renter demand near campus and transport corridors.',
        listings: qcListings,
      },
      {
        title: 'Makati picks',
        subtitle: 'Compact units close to business districts and evening activity.',
        listings: makatiListings,
      },
      {
        title: 'Under ₱8,000',
        subtitle: 'Affordable options for early demand testing.',
        listings: affordableListings,
      },
      {
        title: '25 sqm and above',
        subtitle: 'Listings with more space for longer stays or shared use.',
        listings: largerListings,
      },
    ].filter((section) => section.listings.length > 0);
  }, [listings]);

  return (
    <>
      <div className="app-header">
        <div className="logo">
          <AppLogo />
        </div>
      </div>

      <div className="mvp3-home-scroll">
        <div className="search-container mvp3-home-search-row">
          <button className="search-input-wrap mvp3-home-search-pill" onClick={onOpenSearch} style={{ textAlign: 'left' }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              placeholder="Search location or property"
              readOnly
              tabIndex={-1}
              style={{ pointerEvents: 'none' }}
            />
          </button>
          <button className="filter-btn mvp3-home-filter-pill" onClick={onOpenSearch} aria-label="Open map search">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="4" y1="6" x2="20" y2="6" />
              <line x1="8" y1="12" x2="16" y2="12" />
              <line x1="11" y1="18" x2="13" y2="18" />
            </svg>
          </button>
        </div>


        {sections.map((section) => (
          <section className="mvp3-home-section" key={section.title}>
            <div className="mvp3-home-section-head">
              <div>
                <h3>{section.title}</h3>
                <p>{section.subtitle}</p>
              </div>
            </div>
            <div className="mvp3-home-rail" role="list" aria-label={section.title}>
              {section.listings.map((listing) => (
                <article
                  className="mvp3-home-card"
                  key={listing.id}
                  role="listitem"
                  onClick={() => onSelectListing(listing)}
                >
                  <div className="mvp3-home-card-image">
                    <img src={listing.image} alt={listing.title} loading="lazy" />
                    <TypeBadge type={listing.type} />
                    <button
                      className={`save-btn ${listing.saved ? 'saved' : ''}`}
                      onClick={(event) => {
                        event.stopPropagation();
                        onToggleSave(listing.id);
                      }}
                      aria-label={listing.saved ? 'Unsave' : 'Save'}
                    >
                      <svg viewBox="0 0 24 24" fill={listing.saved ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
                        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                      </svg>
                    </button>
                  </div>
                  <div className="mvp3-home-card-body">
                    <div className="mvp3-home-card-title">{listing.title}</div>
                    <div className="mvp3-home-card-meta">{listing.location}</div>
                    <div className="mvp3-home-card-detail">{listing.sqm} sqm • {getBathroomLabel(listing)}</div>
                    <div className="mvp3-home-card-price">
                      ₱{listing.price.toLocaleString()} <span>/ month</span>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>
        ))}
      </div>
    </>
  );
}
