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
    icon: <><path d="M3 11.5 12 4l9 7.5"/><path d="M5.5 10.5V20h13V10.5"/><path d="M10 20v-5h4v5"/></>,
  },
  {
    tab: 'listings', label: 'Listings',
    icon: <><rect x="4" y="5" width="16" height="14" rx="2"/><path d="M8 9h8"/><path d="M8 13h8"/><path d="M8 17h5"/></>,
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
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
              {item.icon}
            </svg>
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
