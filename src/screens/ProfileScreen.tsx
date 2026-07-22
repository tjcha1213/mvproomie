import { useState } from 'react';
import Logo from '../components/Logo';
import ModeSwitchModal from '../components/ModeSwitchModal';
import { JUAN_AVATAR } from '../avatarPool';
import { PROFILE_MENU_ICONS } from '../components/ProfileMenuIcons';
import { formatMockRole, useMockSession } from '../components/MockSession';

const MENU_ITEMS = [
  { label: 'Account Settings', icon: PROFILE_MENU_ICONS.settings },
  { label: 'Personal Details', icon: PROFILE_MENU_ICONS.personal },
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
  const { profile } = useMockSession();
  const displayProfile = profile ?? {
    name: 'Juan Dela Cruz',
    contact: 'juan@roomie.ph',
    role: 'tenant' as const,
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
        { label: 'Tenant MVP 1', description: 'Open the MVP 1 profile tab.', href: 'mvp1/?tab=profile', note: 'Live profile tab' },
        { label: 'Tenant MVP 2', description: 'Open the MVP 2 profile tab.', href: 'mvp2/?tab=profile' },
        { label: 'Tenant MVP 3', description: 'Open the MVP 3 profile tab.', href: 'mvp3/?tab=profile' },
      ]
    : chooser === 'host'
      ? [
          { label: 'Host MVP 1', description: 'Open the host dashboard profile tab.', href: 'host/?tab=profile', note: 'MVP 1 links to the live host layout' },
          { label: 'Host MVP 2', description: 'Open the host broker overview.', href: 'hosts-brokers.html' },
          { label: 'Host MVP 3', description: 'Open the host survey layout.', href: 'host-surveys.html' },
        ]
      : [];

  return (
    <>
      <div className="app-header">
        <Logo />
      </div>

      <div className="scroll-area">
        {/* Profile header */}
        <div className="profile-header">
          <div className="profile-avatar">
            <img src={JUAN_AVATAR} alt={displayProfile.name} />
          </div>
          <div className="profile-name">{displayProfile.name}</div>
          <div className="profile-email">{displayProfile.contact}</div>
        </div>

        <div className="profile-details-card">
          <div className="profile-details-title">Personal Details</div>
          <div className="profile-details-grid">
            <div className="profile-details-item">
              <span className="profile-details-label">Role</span>
              <span className="profile-details-value">{formatMockRole(displayProfile.role)}</span>
            </div>
            <div className="profile-details-item">
              <span className="profile-details-label">Bio</span>
              <span className="profile-details-value">{displayProfile.bio}</span>
            </div>
          </div>
        </div>

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
            <button key={i} type="button" className="profile-menu-item" onClick={() => onShowToast(`${item.label} — coming soon`)}>
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
