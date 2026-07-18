import { useState } from 'react';
import { LANDLORD_PROFILE } from '../data';
import type { Unit } from '../data';
import Header from '../components/Header';
import type { HeaderNotification } from '../components/Header';
import ModeSwitchModal from '../../src/components/ModeSwitchModal';
import { JUAN_AVATAR } from '../../src/avatarPool';
import { PROFILE_MENU_ICONS } from '../../src/components/ProfileMenuIcons';

interface Props {
  units: Unit[];
  onOpenListings: () => void;
  onOpenTenants: () => void;
  onOpenTheme: () => void;
  onOpenReviews: () => void;
  notifications: HeaderNotification[];
  onOpenNotification: (notification: HeaderNotification) => void;
  onShowToast: (msg: string) => void;
}

const MENU_ITEMS = [
  { key: 'personal', label: 'Personal Details', icon: PROFILE_MENU_ICONS.personal },
  { key: 'security', label: 'Login & Security', icon: PROFILE_MENU_ICONS.security },
  { key: 'verification', label: 'Verification', icon: PROFILE_MENU_ICONS.verification },
  { key: 'reviews', label: 'Reviews', icon: PROFILE_MENU_ICONS.reviews },
  { key: 'payments', label: 'Payout & Payment Methods', icon: PROFILE_MENU_ICONS.payment },
  { key: 'support', label: 'Help & Support', icon: PROFILE_MENU_ICONS.support },
];

export default function ProfileScreen({ units, onOpenListings, onOpenTenants, onOpenTheme, onOpenReviews, notifications, onOpenNotification, onShowToast }: Props) {
  const occupied = units.filter(u => u.status === 'Occupied').length;
  const [mode, setMode] = useState<'Tenant Mode' | 'Landlord Mode'>('Landlord Mode');
  const [chooser, setChooser] = useState<'tenant' | 'landlord' | null>(null);

  const navigateTo = (path: string) => {
    window.location.assign(`${import.meta.env.BASE_URL}${path}`);
  };

  const openChooser = (nextMode: 'Tenant Mode' | 'Landlord Mode') => {
    setMode(nextMode);
    setChooser(nextMode === 'Tenant Mode' ? 'tenant' : 'landlord');
  };

  const chooserOptions = chooser === 'tenant'
    ? [
        { label: 'Tenant MVP 1', description: 'Open the MVP 1 profile tab.', href: 'mvp1/?tab=profile', note: 'Live profile tab' },
        { label: 'Tenant MVP 2', description: 'Open the MVP 2 profile tab.', href: 'mvp2/?tab=profile' },
        { label: 'Tenant MVP 3', description: 'Open the MVP 3 profile tab.', href: 'mvp3/?tab=profile' },
      ]
    : chooser === 'landlord'
      ? [
          { label: 'Landlord MVP 1', description: 'Open the landlord dashboard profile tab.', href: 'landlord/?tab=profile', note: 'MVP 1 links to the live landlord layout' },
          { label: 'Landlord MVP 2', description: 'Open the landlord broker overview.', href: 'landlords-brokers.html' },
          { label: 'Landlord MVP 3', description: 'Open the landlord survey layout.', href: 'landlord-surveys.html' },
        ]
      : [];

  return (
    <>
      <Header onOpenProfile={() => {}} notifications={notifications} onOpenNotification={onOpenNotification} />

      <div className="scroll-area">
        {/* Profile header */}
        <div className="profile-header">
          <div className="profile-avatar">
            <img src={JUAN_AVATAR} alt={LANDLORD_PROFILE.name} />
          </div>
          <div className="profile-name-row-ll">
            <span className="profile-name">{LANDLORD_PROFILE.name}</span>
            <svg className="verified-badge" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="11" fill="currentColor" />
              <path d="M7.5 12.5l3 3 6-6.5" fill="none" stroke="white" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div className="listing-id-row listing-id-row-modal">
            <span className="entity-id-tag">{LANDLORD_PROFILE.userId}</span>
            <span className={`roomie-score-chip is-${LANDLORD_PROFILE.roomieTemperature.toLowerCase()}`}>Roomie {LANDLORD_PROFILE.roomieScore}</span>
          </div>
          <div className="profile-email">Verified Landlord · ★ 4.9 (128 reviews)</div>

          <div className="profile-stats">
            <button type="button" className="profile-stat profile-stat-btn" onClick={onOpenListings}>
              <div className="profile-stat-value">{units.length}</div>
              <div className="profile-stat-label">Listings</div>
            </button>
            <button type="button" className="profile-stat profile-stat-btn" onClick={onOpenTenants}>
              <div className="profile-stat-value">{occupied}</div>
              <div className="profile-stat-label">Tenants</div>
            </button>
            <div className="profile-stat">
              <div className="profile-stat-value">2021</div>
              <div className="profile-stat-label">Member since</div>
            </div>
          </div>
        </div>

        <div className="profile-mode-card">
          <div className="profile-mode-copy">
            <div className="profile-mode-title">Account mode</div>
          </div>
          <div className="profile-mode-toggle" role="tablist" aria-label="Account mode">
            <button type="button" className={`profile-mode-btn ${mode === 'Tenant Mode' ? 'active' : ''}`} onClick={() => openChooser('Tenant Mode')}>
              Tenant Mode
            </button>
            <button type="button" className={`profile-mode-btn ${mode === 'Landlord Mode' ? 'active' : ''}`} onClick={() => openChooser('Landlord Mode')}>
              Landlord Mode
            </button>
          </div>
        </div>

        {/* Menu */}
        <div className="profile-menu" style={{ marginTop: 12 }}>
          {MENU_ITEMS.map((item) => (
            <button
              key={item.key}
              type="button"
              className="profile-menu-item"
              onClick={() => {
                if (item.key === 'reviews') {
                  onOpenReviews();
                  return;
                }
                onShowToast(`${item.label} — coming soon`);
              }}
            >
              <div className="profile-menu-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
                  {item.icon}
                </svg>
              </div>
              <span className="profile-menu-label">{item.label}</span>
              <span className="profile-menu-arrow">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="9 18 15 12 9 6"/>
                </svg>
              </span>
            </button>
          ))}
          <button type="button" className="profile-menu-item" onClick={onOpenTheme}>
            <div className="profile-menu-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
                {PROFILE_MENU_ICONS.themeBlock}
              </svg>
            </div>
            <span className="profile-menu-label">Theme color</span>
            <span className="profile-menu-arrow">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">{PROFILE_MENU_ICONS.chevron}</svg>
            </span>
          </button>
        </div>

        <div style={{ height: 32 }} />
      </div>

      <ModeSwitchModal
        open={chooser !== null}
        title={chooser === 'tenant' ? 'Move to a tenant MVP' : 'Move to a landlord MVP'}
        subtitle={chooser === 'tenant'
          ? 'Pick which tenant profile tab you want to open.'
          : 'Pick which landlord layout you want to open.'}
        options={chooserOptions}
        onClose={() => setChooser(null)}
        onSelect={(option) => {
          setChooser(null);
          navigateTo(option.href);
          onShowToast(`Opening ${option.label}`);
        }}
      />
    </>
  );
}
