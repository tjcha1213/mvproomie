import { LANDLORD_PROFILE } from '../data';
import Logo from './Logo';

interface Props {
  onOpenProfile: () => void;
  onShowToast: (msg: string) => void;
}

// Shared app header: wordmark on the left, notifications + profile avatar on
// the right (the avatar replaces the tenant app's hamburger menu).
export default function Header({ onOpenProfile, onShowToast }: Props) {
  return (
    <div className="app-header">
      <Logo />
      <div className="header-actions">
        <button className="icon-btn" style={{ position: 'relative' }} onClick={() => onShowToast('🔔 3 new notifications')} aria-label="Notifications">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
            <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
          </svg>
          <span className="notif-dot" />
        </button>
        <button className="header-avatar" onClick={onOpenProfile} aria-label="Profile">
          <img src={LANDLORD_PROFILE.avatar} alt={LANDLORD_PROFILE.name} />
        </button>
      </div>
    </div>
  );
}
