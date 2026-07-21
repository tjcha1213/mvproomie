import Header from '../components/Header';
import type { HeaderNotification } from '../components/Header';
import { INQUIRIES, HOST_PROFILE, LANDLORD_REVIEWS, PAYMENTS, PLATFORM_CONTACTS } from '../data';

interface Props {
  onOpenProfile: () => void;
  notifications: HeaderNotification[];
  onOpenNotification: (notification: HeaderNotification) => void;
  onAdd?: () => void;
}

function ScoreChip({ score, temperature }: { score: number; temperature: 'Cool' | 'Warm' | 'Hot' }) {
  return <span className={`roomie-score-chip is-${temperature.toLowerCase()}`}>Roomie {score}</span>;
}

export default function ReviewsScreen({ onOpenProfile, notifications, onOpenNotification, onAdd }: Props) {
  const trustSnapshots = [
    { label: 'Host account', name: HOST_PROFILE.name, userId: HOST_PROFILE.userId, score: HOST_PROFILE.roomieScore, temperature: HOST_PROFILE.roomieTemperature },
    { label: 'Broker verification desk', name: PLATFORM_CONTACTS.broker.name, userId: PLATFORM_CONTACTS.broker.userId, score: PLATFORM_CONTACTS.broker.roomieScore, temperature: PLATFORM_CONTACTS.broker.roomieTemperature },
    { label: 'Admin trust anchor', name: PLATFORM_CONTACTS.admin.name, userId: PLATFORM_CONTACTS.admin.userId, score: PLATFORM_CONTACTS.admin.roomieScore, temperature: PLATFORM_CONTACTS.admin.roomieTemperature },
    { label: 'Top tenant score', name: PAYMENTS[0].tenant, userId: PAYMENTS[0].tenantId, score: PAYMENTS[0].trust.roomieScore, temperature: PAYMENTS[0].trust.roomieTemperature },
    { label: 'Most active inquiry profile', name: INQUIRIES[1].name, userId: INQUIRIES[1].userId, score: INQUIRIES[1].trust.roomieScore, temperature: INQUIRIES[1].trust.roomieTemperature },
  ];

  return (
    <>
      <Header onOpenProfile={onOpenProfile} notifications={notifications} onOpenNotification={onOpenNotification} onAdd={onAdd} />

      <div className="scroll-area">
        <div className="section-header">
          <span className="section-title">Reviews & Trust</span>
        </div>

        <div className="profile-header reviews-summary-card">
          <div className="profile-name-row-ll">
            <span className="profile-name">{HOST_PROFILE.name}</span>
          </div>
          <div className="listing-id-row listing-id-row-modal">
            <span className="entity-id-tag">{HOST_PROFILE.userId}</span>
            <ScoreChip score={HOST_PROFILE.roomieScore} temperature={HOST_PROFILE.roomieTemperature} />
          </div>
          <div className="profile-email">Average rating 4.9 · 128 reviews logged in the host demo</div>
        </div>

        <div className="reviews-trust-grid">
          {trustSnapshots.map((item) => (
            <div key={item.userId} className="reviews-trust-card">
              <span className="reviews-trust-label">{item.label}</span>
              <strong>{item.name}</strong>
              <div className="listing-id-row">
                <span className="entity-id-tag">{item.userId}</span>
                <ScoreChip score={item.score} temperature={item.temperature} />
              </div>
            </div>
          ))}
        </div>

        <div className="profile-menu" style={{ marginTop: 12 }}>
          {LANDLORD_REVIEWS.map((review) => (
            <div key={review.id} className="reviews-item">
              <div className="reviews-item-head">
                <strong>{review.author}</strong>
                <span>{'★'.repeat(review.rating)}</span>
              </div>
              <div className="listing-id-row">
                <span className="entity-id-tag">{review.authorId}</span>
              </div>
              <p>{review.quote}</p>
              <small>{review.date}</small>
            </div>
          ))}
        </div>

        <div style={{ height: 32 }} />
      </div>
    </>
  );
}
