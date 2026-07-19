import Logo from './Logo';
import type { Tab } from './LandlordNav';

interface Props {
  activeTab: Tab;
  onTabChange: (t: Tab) => void;
  inquiryBadge: number;
  onAdd: () => void;
}

const ITEMS: { tab: Tab; label: string; icon: React.ReactNode }[] = [
  {
    tab: 'dashboard', label: 'Home',
    icon: <>
      <path d="M3.5 8.8 12 2.7l8.5 6.1V19H3.5z" />
      <circle cx="12" cy="9.8" r="1.2" />
    </>,
  },
  {
    tab: 'listings', label: 'Listings',
    icon: <><rect x="4" y="5" width="16" height="14" rx="2"/><path d="M8 9h8"/><path d="M8 13h8"/><path d="M8 17h5"/></>,
  },
  {
    tab: 'tenants', label: 'Tenants',
    icon: <><path d="M8 11a4 4 0 1 0-0.001-8.001A4 4 0 0 0 8 11Z"/><path d="M16.5 12.5a3.5 3.5 0 1 0-.001-7.001A3.5 3.5 0 0 0 16.5 12.5Z"/><path d="M3.5 20v-1.1a5.9 5.9 0 0 1 9.2-4.9"/><path d="M12.5 20v-1a4.8 4.8 0 0 1 7-4.2"/></>,
  },
  {
    tab: 'inquiries', label: 'Inquiries',
    icon: <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>,
  },
  {
    tab: 'payments', label: 'Payments',
    icon: <><rect x="2" y="5" width="20" height="14" rx="2"/><circle cx="12" cy="12" r="3"/></>,
  },
  {
    tab: 'profile', label: 'Profile',
    icon: <><circle cx="12" cy="8" r="4"/><path d="M4 20v-1a8 8 0 0 1 16 0v1"/></>,
  },
];

// Desktop-only navigation (hidden on mobile, where LandlordNav takes over).
export default function Sidebar({ activeTab, onTabChange, inquiryBadge, onAdd }: Props) {
  return (
    <aside className="ll-sidebar">
      <div className="ll-sidebar-logo">
        <Logo />
      </div>

      <button className="ll-sidebar-add" onClick={onAdd}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" width="16" height="16">
          <line x1="12" y1="5" x2="12" y2="19"/>
          <line x1="5" y1="12" x2="19" y2="12"/>
        </svg>
        New listing
      </button>

      <nav className="ll-sidebar-nav">
        {ITEMS.map(item => (
          <button
            key={item.tab}
            className={`ll-sidebar-item ${activeTab === item.tab ? 'active' : ''}`}
            onClick={() => onTabChange(item.tab)}
          >
            {item.tab === 'dashboard' ? (
              <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
                <path
                  d="M3.5 8.8 12 2.7l8.5 6.1V19H3.5z"
                  fill={activeTab === item.tab ? 'currentColor' : 'none'}
                  stroke="currentColor"
                  strokeWidth="2"
                />
                <circle
                  cx="12"
                  cy="9.8"
                  r="1.2"
                  fill={activeTab === item.tab ? '#fff' : 'currentColor'}
                  stroke="none"
                />
              </svg>
            ) : item.tab === 'listings' ? (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
                <rect
                  x="4"
                  y="5"
                  width="16"
                  height="14"
                  rx="2"
                  fill={activeTab === item.tab ? 'currentColor' : 'none'}
                />
                <path d="M8 9h8" stroke={activeTab === item.tab ? '#fff' : 'currentColor'} />
                <path d="M8 13h8" stroke={activeTab === item.tab ? '#fff' : 'currentColor'} />
                <path d="M8 17h5" stroke={activeTab === item.tab ? '#fff' : 'currentColor'} />
              </svg>
            ) : item.tab === 'payments' ? (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
                <rect
                  x="2"
                  y="5"
                  width="20"
                  height="14"
                  rx="2"
                  fill={activeTab === item.tab ? 'currentColor' : 'none'}
                />
                <circle
                  cx="12"
                  cy="12"
                  r="3"
                  fill={activeTab === item.tab ? '#fff' : 'none'}
                />
              </svg>
            ) : (
              <svg
                viewBox="0 0 24 24"
                fill={activeTab === item.tab ? 'currentColor' : 'none'}
                stroke="currentColor"
                strokeWidth="2"
                width="18"
                height="18"
              >
                {item.icon}
              </svg>
            )}
            <span>{item.label}</span>
            {item.tab === 'inquiries' && inquiryBadge > 0 && (
              <span className="ll-sidebar-badge">{inquiryBadge}</span>
            )}
          </button>
        ))}
      </nav>

      <div className="ll-sidebar-foot">Roomie for Landlords · demo</div>
    </aside>
  );
}
