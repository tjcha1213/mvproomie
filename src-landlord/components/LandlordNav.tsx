export type Tab = 'dashboard' | 'listings' | 'inquiries' | 'payments' | 'profile';

interface Props {
  activeTab: Tab;
  onTabChange: (t: Tab) => void;
  inquiryBadge: number;
  onAdd: () => void;
}

export default function LandlordNav({ activeTab, onTabChange, inquiryBadge, onAdd }: Props) {
  return (
    <nav className="bottom-nav">
      <button className={`bottom-nav-item ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => onTabChange('dashboard')}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M3 11.5 12 4l9 7.5"/>
          <path d="M5.5 10.5V20h13V10.5"/>
          <path d="M10 20v-5h4v5"/>
        </svg>
        Home
      </button>

      <button className={`bottom-nav-item ${activeTab === 'listings' ? 'active' : ''}`} onClick={() => onTabChange('listings')}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="4" y="5" width="16" height="14" rx="2"/>
          <path d="M8 9h8"/>
          <path d="M8 13h8"/>
          <path d="M8 17h5"/>
        </svg>
        Listings
      </button>

      <button className="nav-add-btn" onClick={onAdd} aria-label="Add listing">
        <div className="nav-add-circle">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="12" y1="5" x2="12" y2="19"/>
            <line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
        </div>
      </button>

      <button className={`bottom-nav-item ${activeTab === 'inquiries' ? 'active' : ''}`} onClick={() => onTabChange('inquiries')} style={{ position: 'relative' }}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
        </svg>
        {inquiryBadge > 0 && (
          <span style={{
            position: 'absolute', top: 4, right: 'calc(50% - 16px)',
            minWidth: 16, height: 16, borderRadius: '50%', padding: '0 3px',
            background: '#EF4444', color: 'white',
            fontSize: 9, fontWeight: 700,
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>{inquiryBadge}</span>
        )}
        Inquiries
      </button>

      <button className={`bottom-nav-item ${activeTab === 'payments' ? 'active' : ''}`} onClick={() => onTabChange('payments')}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="2" y="5" width="20" height="14" rx="2"/>
          <circle cx="12" cy="12" r="3"/>
          <path d="M6 9h.01M18 15h.01"/>
        </svg>
        Payments
      </button>
    </nav>
  );
}
