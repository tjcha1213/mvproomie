import { useState, useRef, useEffect, useCallback, type UIEvent } from 'react';
import type { Listing } from '../data/listings';

interface Props {
  listing: Listing;
  onBack: () => void;
  onToggleSave: (id: number) => void;
  onShowToast: (msg: string) => void;
  onOpenChat: (listing: Listing) => void;
  onSendInquiry: (listing: Listing) => void;
}

function TypeBadge({ type }: { type: string }) {
  const cls = type === 'Studio' ? 'badge-studio' : type === 'Bedspace' ? 'badge-bedspace' : 'badge-apartment';
  return <span className={`detail-type-badge ${cls}`}>{type}</span>;
}

export default function DetailScreen({ listing, onBack, onToggleSave, onShowToast, onOpenChat, onSendInquiry }: Props) {
  const [activeImg, setActiveImg] = useState(0);
  const bodyRef = useRef<HTMLDivElement>(null);
  const imageStripRef = useRef<HTMLDivElement>(null);

  // Always open the detail at the top — without this the body can inherit a
  // scroll offset that hides the title, type and location behind the hero image.
  useEffect(() => {
    bodyRef.current?.scrollTo(0, 0);
    imageStripRef.current?.scrollTo({ left: 0 });
    setActiveImg(0);
  }, [listing.id]);

  const imgs = listing.images.length > 0 ? listing.images : [listing.image];
  const MAX_THUMBS = 4;
  const extraCount = imgs.length - MAX_THUMBS;

  const handleImageScroll = useCallback((event: UIEvent<HTMLDivElement>) => {
    const el = event.currentTarget;
    if (!el.clientWidth) return;
    const nextIndex = Math.round(el.scrollLeft / el.clientWidth);
    setActiveImg(Math.max(0, Math.min(imgs.length - 1, nextIndex)));
  }, [imgs.length]);

  const jumpToImage = useCallback((index: number) => {
    const boundedIndex = Math.max(0, Math.min(imgs.length - 1, index));
    setActiveImg(boundedIndex);
    imageStripRef.current?.scrollTo({
      left: imageStripRef.current.clientWidth * boundedIndex,
      behavior: 'smooth',
    });
  }, [imgs.length]);

  return (
    <div className="detail-screen">
      {/* Image hero */}
      <div className="detail-image-container">
        <div className="detail-image-strip" ref={imageStripRef} onScroll={handleImageScroll}>
          {imgs.map((img, index) => (
            <div className="detail-image-slide" key={`${listing.id}-${index}`}>
              <img src={img} alt={`${listing.title} photo ${index + 1}`} />
            </div>
          ))}
        </div>
        <div className="detail-image-overlay" />

        {/* Nav bar */}
        <div className="detail-image-nav">
          <button className="detail-back-btn" onClick={onBack}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
          </button>
          <div className="detail-top-actions">
            <button
              className={`detail-action-btn ${listing.saved ? 'saved' : ''}`}
              onClick={() => onToggleSave(listing.id)}
            >
              <svg viewBox="0 0 24 24" fill={listing.saved ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
              </svg>
            </button>
            <button className="detail-action-btn" onClick={() => onShowToast('Link copied!')}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
                <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
              </svg>
            </button>
          </div>
        </div>

        {/* Image counter */}
        <div className="image-counter">{activeImg + 1} / {imgs.length}</div>

        {/* Thumbnails */}
        <div className="detail-thumbnails">
          {imgs.slice(0, MAX_THUMBS).map((img, i) => (
            <div
              key={i}
              className={`detail-thumb ${i === activeImg ? 'active' : ''}`}
              onClick={() => jumpToImage(i)}
            >
              <img src={img} alt="" />
            </div>
          ))}
          {extraCount > 0 && (
            <div
              className="detail-thumb-more"
              onClick={() => jumpToImage(MAX_THUMBS)}
            >+{extraCount}</div>
          )}
        </div>
      </div>

      {/* Detail body */}
      <div className="detail-body" ref={bodyRef}>
        <TypeBadge type={listing.type} />
        <h1 className="detail-title">{listing.title}</h1>
        <div className="detail-location-row">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
            <circle cx="12" cy="10" r="3"/>
          </svg>
          {listing.location}
        </div>
        <div className="detail-price">₱{listing.price.toLocaleString()} <span>/ month</span></div>

        {/* Amenity pills */}
        <div className="amenity-row">
          <div className="amenity-pill">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 7v10a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-6l-2-2H5a2 2 0 0 0-2 2z"/>
            </svg>
            <span className="amenity-label">{listing.beds} Bed</span>
          </div>
          <div className="amenity-pill">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M5 12H2a10 10 0 0 0 20 0h-3"/>
              <path d="M12 2v4M4.22 4.22l2.83 2.83M19.78 4.22l-2.83 2.83"/>
            </svg>
            <span className="amenity-label">{listing.baths} Bath</span>
          </div>
          <div className="amenity-pill">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="18" height="18" rx="2"/>
              <path d="M3 9h18M9 21V9"/>
            </svg>
            <span className="amenity-label">{listing.sqm} sqm</span>
          </div>
          {listing.furnished && (
            <div className="amenity-pill">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 9V7a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v2"/>
                <path d="M2 11v5a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-5a2 2 0 0 0-4 0v2H6v-2a2 2 0 0 0-4 0z"/>
                <line x1="6" y1="19" x2="6" y2="21"/><line x1="18" y1="19" x2="18" y2="21"/>
              </svg>
              <span className="amenity-label">Furnished</span>
            </div>
          )}
          {listing.wifi && (
            <div className="amenity-pill">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M5 12.55a11 11 0 0 1 14.08 0"/>
                <path d="M1.42 9a16 16 0 0 1 21.16 0"/>
                <path d="M8.53 16.11a6 6 0 0 1 6.95 0"/>
                <circle cx="12" cy="20" r="1" fill="currentColor"/>
              </svg>
              <span className="amenity-label">Wi-Fi</span>
            </div>
          )}
        </div>

        {/* Landlord */}
        <div className="landlord-card">
          <div className="landlord-left">
            <div className="landlord-avatar">{listing.landlordName[0]}</div>
            <div className="landlord-info">
              <div className="landlord-name-row">
                {listing.verified && (
                  <svg className="verified-badge" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="11" fill="currentColor" />
                    <path d="M7.5 12.5l3 3 6-6.5" fill="none" stroke="white" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
                <span className="landlord-name">{listing.verified ? 'Verified Landlord' : 'Landlord'}</span>
              </div>
              <span className="landlord-since">{listing.landlordName} · Member since {listing.landlordSince}</span>
              <div className="landlord-rating">
                <span className="landlord-rating-star">★</span>
                {listing.landlordRating} ({listing.landlordReviews} reviews)
              </div>
            </div>
          </div>
          <div className="landlord-actions">
            <button className="action-btn-sm btn-message" onClick={() => onOpenChat(listing)}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
              </svg>
              Message
            </button>
            <button className="action-btn-sm btn-call" onClick={() => onShowToast('Calling landlord...')}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 9.91a16 16 0 0 0 6.06 6.06l.94-1.94a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
              </svg>
              Call
            </button>
          </div>
        </div>

        {/* About */}
        <div className="about-section">
          <div className="about-title">About this property</div>
          <p className="about-text">{listing.description}</p>
        </div>

        {/* CTA */}
        <div className="detail-cta">
          <button className="cta-primary" onClick={() => onSendInquiry(listing)}>
            Send Inquiry
          </button>
        </div>
      </div>
    </div>
  );
}
