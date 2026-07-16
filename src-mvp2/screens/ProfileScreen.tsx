import AppLogo from '../components/AppLogo';

const MENU_ITEMS = [
  { label: 'Personal Details', icon: <><circle cx="12" cy="8" r="4"/><path d="M4 20v-1a8 8 0 0 1 16 0v1"/></> },
  { label: 'Login & Security', icon: <><path d="M5 11V8a7 7 0 1 1 14 0v3"/><rect x="4" y="11" width="16" height="10" rx="2"/><circle cx="12" cy="16" r="1"/></> },
  { label: 'Verification', icon: <path d="M9 12l2 2 4-4m6 2a9 9 0 1 1-18 0 9 9 0 0 1 18 0z"/> },
  { label: 'Payment Methods', icon: <><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></> },
  { label: 'Help & Support', icon: <><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></> },
];

interface Props {
  onShowToast: (msg: string) => void;
}

export default function ProfileScreen({ onShowToast }: Props) {
  return (
    <>
      <div className="app-header">
        <div className="logo"><AppLogo /></div>
      </div>

      <div className="scroll-area">
        {/* Profile header */}
        <div className="profile-header">
          <div className="profile-avatar">T</div>
          <div className="profile-name">Takashi B.</div>
          <div className="profile-email">takashi@roomie.ph</div>
        </div>

        <div className="section-header">
          <span className="section-title">Account Settings</span>
        </div>

        {/* Menu */}
        <div className="profile-menu" style={{ marginTop: 12 }}>
          {MENU_ITEMS.map((item, i) => (
            <div key={i} className="profile-menu-item" onClick={() => onShowToast(`${item.label} — coming soon`)}>
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
            </div>
          ))}
        </div>

        <div style={{ height: 32 }} />
      </div>
    </>
  );
}
