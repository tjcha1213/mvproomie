import { useState } from 'react';
import AppLogo from '../components/AppLogo';
import ModeSwitchModal from '../../src/components/ModeSwitchModal';
import ProfileBioEditor from '../../src/components/ProfileBioEditor';
import ProfilePhotoCard from '../../src/components/ProfilePhotoCard';
import ProfileSectionPage from '../../src/components/ProfileSectionPage';
import ServicePreferencesCard from '../../src/components/ServicePreferencesCard';
import { JUAN_AVATAR } from '../../src/avatarPool';
import { PROFILE_MENU_ICONS } from '../../src/components/ProfileMenuIcons';
import { formatMockRole, useMockSession } from '../../src/components/MockSession';

const MENU_ITEMS = [
  { label: 'Account Settings', icon: PROFILE_MENU_ICONS.settings },
  { label: 'Personal Details', icon: PROFILE_MENU_ICONS.personal },
  { label: 'Other Services', icon: PROFILE_MENU_ICONS.services },
  { label: 'User Testing Survey', icon: PROFILE_MENU_ICONS.smile },
  { label: 'Login & Security', icon: PROFILE_MENU_ICONS.security },
  { label: 'Verification', icon: PROFILE_MENU_ICONS.verification },
  { label: 'Payment Methods', icon: PROFILE_MENU_ICONS.payment },
  { label: 'Help & Support', icon: PROFILE_MENU_ICONS.support },
];

interface Props {
  onShowToast: (msg: string) => void;
  onOpenTheme: () => void;
}

export default function ProfileScreen({ onShowToast, onOpenTheme }: Props) {
  const [chooser, setChooser] = useState<'tenant' | 'host' | null>(null);
  const [page, setPage] = useState<'main' | 'personal' | 'services'>('main');
  const { profile } = useMockSession();
  const displayProfile = profile ?? {
    participantId: 'PT-DEMO-1002',
    avatar: JUAN_AVATAR,
    name: 'Juan Dela Cruz',
    contact: 'juan@roomie.ph',
    role: 'tenant' as const,
    participantRoleDetail: 'Tenant',
    mvpRoute: 'Tenant MVP 2',
    bio: 'Mock user profile ready for demo testing.',
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
        { label: 'Host MVP 2', description: 'Host MVP 2', href: 'hosts-brokers.html' },
        { label: 'Host MVP 3', description: 'Host MVP 3', href: 'host-surveys.html' },
      ]
      : [];

  return (
    <>
      <div className="app-header">
        <div className="logo"><AppLogo /></div>
      </div>

      <div className="scroll-area">
        {/* Profile header */}
        <div className="profile-header">
          <div className="profile-avatar">
            <img src={displayProfile.avatar ?? JUAN_AVATAR} alt={displayProfile.name} />
          </div>
          <div className="profile-name">{displayProfile.name}</div>
          <div className="profile-stats">
            <div className="profile-stat">
              <div className="profile-stat-value">5</div>
              <div className="profile-stat-label">Listings</div>
            </div>
            <div className="profile-stat">
              <div className="profile-stat-value">2</div>
              <div className="profile-stat-label">Tenants</div>
            </div>
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
                <button type="button" className="profile-mode-btn active" onClick={() => openChooser('Tenant Mode')}>
                  Tenant Mode
                </button>
                <button type="button" className="profile-mode-btn" onClick={() => openChooser('Host Mode')}>
                  Host Mode
                </button>
              </div>
            </div>

            <div className="section-header">
              <span className="section-title">Account Settings</span>
            </div>

            {/* Menu */}
            <div className="profile-menu" style={{ marginTop: 12 }}>
              {MENU_ITEMS.map((item, i) => (
                <button
                  key={i}
                  type="button"
                  className="profile-menu-item"
                  onClick={() => {
                    if (item.label === 'Personal Details') {
                      setPage('personal');
                      return;
                    }
                    if (item.label === 'Other Services') {
                      setPage('services');
                      return;
                    }
                    if (item.label === 'User Testing Survey') {
                      window.location.assign(`${import.meta.env.BASE_URL}tenant-surveys.html?mvp=Tenant%20MVP%202`);
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
            <ProfilePhotoCard
              avatar={displayProfile.avatar ?? JUAN_AVATAR}
              name={displayProfile.name}
              onShowToast={onShowToast}
            />
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
                <ProfileBioEditor bio={displayProfile.bio} onShowToast={onShowToast} />
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
