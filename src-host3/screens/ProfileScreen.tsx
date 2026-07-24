import { useState } from 'react';
import { HOST_PROFILE } from '../data';
import type { Unit } from '../data';
import Header from '../components/Header';
import type { HeaderNotification } from '../components/Header';
import ModeSwitchModal from '../../src/components/ModeSwitchModal';
import ProfileSectionPage from '../../src/components/ProfileSectionPage';
import ServicePreferencesCard from '../../src/components/ServicePreferencesCard';
import { JUAN_AVATAR } from '../../src/avatarPool';
import { PROFILE_MENU_ICONS } from '../../src/components/ProfileMenuIcons';
import { formatMockRole, useMockSession } from '../../src/components/MockSession';

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
  { key: 'settings', label: 'Account Settings', icon: PROFILE_MENU_ICONS.settings },
  { key: 'personal', label: 'Personal Details', icon: PROFILE_MENU_ICONS.personal },
  { key: 'services', label: 'Other Services', icon: PROFILE_MENU_ICONS.services },
  { key: 'survey', label: 'User Testing Survey', icon: PROFILE_MENU_ICONS.smile },
  { key: 'security', label: 'Login & Security', icon: PROFILE_MENU_ICONS.security },
  { key: 'verification', label: 'Verification', icon: PROFILE_MENU_ICONS.verification },
  { key: 'reviews', label: 'Reviews', icon: PROFILE_MENU_ICONS.reviews },
  { key: 'payments', label: 'Payout & Payment Methods', icon: PROFILE_MENU_ICONS.payment },
  { key: 'support', label: 'Help & Support', icon: PROFILE_MENU_ICONS.support },
];

export default function ProfileScreen({ units, onOpenListings, onOpenTenants, onOpenTheme, onOpenReviews, notifications, onOpenNotification, onShowToast }: Props) {
  const occupied = units.filter(u => u.status === 'Occupied').length;
  const [chooser, setChooser] = useState<'tenant' | 'host' | null>(null);
  const [page, setPage] = useState<'main' | 'personal' | 'services'>('main');
  const { profile } = useMockSession();
  const displayProfile = profile ?? {
    participantId: 'PT-DEMO-2003',
    avatar: JUAN_AVATAR,
    name: HOST_PROFILE.name,
    contact: 'juan@roomie.ph',
    role: 'host' as const,
    participantRoleDetail: 'Host',
    mvpRoute: 'Host MVP 3',
    bio: 'Mock host profile ready for demo testing.',
  };

  const navigateTo = (path: string) => {
    window.location.assign(`${import.meta.env.BASE_URL}${path}`);
  };

  const openChooser = (nextMode: 'Tenant Mode' | 'Host Mode') => {
    setChooser(nextMode === 'Tenant Mode' ? 'tenant' : 'host');
  };

  const chooserOptions = chooser === 'tenant'
    ? [
        { label: 'Tenant MVP 1', description: 'Tenant MVP 1', href: 'mvp1/?tab=profile' },
        { label: 'Tenant MVP 2', description: 'Tenant MVP 2', href: 'mvp2/?tab=profile' },
        { label: 'Tenant MVP 3', description: 'Tenant MVP 3', href: 'mvp3/?tab=profile' },
      ]
    : chooser === 'host'
      ? [
        { label: 'Host MVP 1', description: 'Host MVP 1', href: 'host/?tab=profile' },
        { label: 'Host MVP 2', description: 'Host MVP 2', href: 'host2/?tab=profile' },
        { label: 'Host MVP 3', description: 'Host MVP 3', href: 'host3/?tab=profile' },
        ]
      : [];

  return (
    <>
      <Header onOpenProfile={() => {}} notifications={notifications} onOpenNotification={onOpenNotification} />

      <div className="scroll-area">
        {/* Profile header */}
        <div className="profile-header">
          <div className="profile-avatar">
            <img src={displayProfile.avatar ?? JUAN_AVATAR} alt={displayProfile.name} />
          </div>
          <div className="profile-name-row-ll">
            <span className="profile-name">{displayProfile.name}</span>
            <svg className="verified-badge" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="11" fill="currentColor" />
              <path d="M7.5 12.5l3 3 6-6.5" fill="none" stroke="white" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div className="listing-id-row listing-id-row-modal">
            <span className="entity-id-tag">{HOST_PROFILE.userId}</span>
            <span className={`roomie-score-chip is-${HOST_PROFILE.roomieTemperature.toLowerCase()}`}>Roomie {HOST_PROFILE.roomieScore}</span>
          </div>
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
        {page === 'main' ? (
          <>
            <div className="profile-mode-card">
              <div className="profile-mode-copy">
                <div className="profile-mode-title">Account mode</div>
              </div>
              <div className="profile-mode-toggle" role="tablist" aria-label="Account mode">
                <button type="button" className="profile-mode-btn" onClick={() => openChooser('Tenant Mode')}>
                  Tenant Mode
                </button>
                <button type="button" className="profile-mode-btn active" onClick={() => openChooser('Host Mode')}>
                  Host Mode
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
                    if (item.key === 'settings') {
                      onShowToast('Account Settings — coming soon');
                      return;
                    }
                    if (item.key === 'personal') {
                      setPage('personal');
                      return;
                    }
                    if (item.key === 'services') {
                      setPage('services');
                      return;
                    }
                    if (item.key === 'survey') {
                      window.location.assign(`${import.meta.env.BASE_URL}host-surveys.html`);
                      return;
                    }
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
          </>
        ) : page === 'personal' ? (
          <ProfileSectionPage
            title="Personal Details"
            subtitle="Your account information and profile summary."
            onBack={() => setPage('main')}
          >
            <div className="profile-details-card">
              <div className="profile-details-grid">
                <div className="profile-details-item">
                  <span className="profile-details-label">Name</span>
                  <span className="profile-details-value">{displayProfile.name}</span>
                </div>
                <div className="profile-details-item">
                  <span className="profile-details-label">Contact</span>
                  <span className="profile-details-value">{displayProfile.contact}</span>
                </div>
                <div className="profile-details-item">
                  <span className="profile-details-label">Participant ID</span>
                  <span className="profile-details-value">{displayProfile.participantId}</span>
                </div>
                <div className="profile-details-item">
                  <span className="profile-details-label">Role</span>
                  <span className="profile-details-value">{formatMockRole(displayProfile.role)}</span>
                </div>
                <div className="profile-details-item">
                  <span className="profile-details-label">Participant role detail</span>
                  <span className="profile-details-value">{displayProfile.participantRoleDetail}</span>
                </div>
                <div className="profile-details-item">
                  <span className="profile-details-label">MVP route</span>
                  <span className="profile-details-value">{displayProfile.mvpRoute}</span>
                </div>
                <div className="profile-details-item">
                  <span className="profile-details-label">Bio</span>
                  <span className="profile-details-value">{displayProfile.bio}</span>
                </div>
              </div>
            </div>
          </ProfileSectionPage>
        ) : (
          <ProfileSectionPage
            title="Other Services"
            subtitle="Rank the services you would like on Roomie."
            onBack={() => setPage('main')}
          >
            <ServicePreferencesCard />
          </ProfileSectionPage>
        )}

        <div style={{ height: 32 }} />
      </div>

      <ModeSwitchModal
        open={chooser !== null}
        title={chooser === 'tenant' ? 'Move to a tenant MVP' : 'Move to a host MVP'}
        subtitle={chooser === 'tenant'
          ? 'Pick which tenant profile tab you want to open.'
          : 'Pick which host layout you want to open.'}
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
