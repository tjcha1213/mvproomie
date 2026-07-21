export type Tab = 'dashboard' | 'listings' | 'tenants' | 'inquiries' | 'payments' | 'profile' | 'reviews';

interface Props {
  activeTab: Tab;
  onTabChange: (t: Tab) => void;
  inquiryBadge: number;
}

export default function HostNav({ activeTab, onTabChange, inquiryBadge }: Props) {
  return (
    <nav className="bottom-nav">
      <button className={`bottom-nav-item ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => onTabChange('dashboard')}>
        <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" strokeLinecap="round" strokeLinejoin="round">
          <path
            d="M3.5 8.8 12 2.7l8.5 6.1V19H3.5z"
            fill={activeTab === 'dashboard' ? 'currentColor' : 'none'}
            stroke="currentColor"
            strokeWidth="2"
          />
          <circle
            cx="12"
            cy="9.8"
            r="1.2"
            fill={activeTab === 'dashboard' ? '#fff' : 'currentColor'}
            stroke="none"
          />
        </svg>
        Home
      </button>

      <button className={`bottom-nav-item ${activeTab === 'listings' ? 'active' : ''}`} onClick={() => onTabChange('listings')}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="4" y="5" width="16" height="14" rx="2" fill={activeTab === 'listings' ? 'currentColor' : 'none'} />
          <path d="M8 9h8" stroke={activeTab === 'listings' ? '#fff' : 'currentColor'} strokeWidth="1.8" />
          <path d="M8 13h8" stroke={activeTab === 'listings' ? '#fff' : 'currentColor'} strokeWidth="1.8" />
          <path d="M8 17h5" stroke={activeTab === 'listings' ? '#fff' : 'currentColor'} strokeWidth="1.8" />
        </svg>
        Listings
      </button>

      <button className={`bottom-nav-item ${activeTab === 'tenants' ? 'active' : ''}`} onClick={() => onTabChange('tenants')}>
        <svg viewBox="0 0 24 24" fill={activeTab === 'tenants' ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
          <path d="M8 11a4 4 0 1 0-0.001-8.001A4 4 0 0 0 8 11Z"/>
          <path d="M16.5 12.5a3.5 3.5 0 1 0-.001-7.001A3.5 3.5 0 0 0 16.5 12.5Z"/>
          <path d="M3.5 20v-1.1a5.9 5.9 0 0 1 9.2-4.9"/>
          <path d="M12.5 20v-1a4.8 4.8 0 0 1 7-4.2"/>
        </svg>
        Tenants
      </button>

      <button className={`bottom-nav-item ${activeTab === 'inquiries' ? 'active' : ''}`} onClick={() => onTabChange('inquiries')} style={{ position: 'relative' }}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
          <path
            d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"
            fill={activeTab === 'inquiries' ? 'currentColor' : 'none'}
          />
          <path d="M8 9h8M8 13h6" stroke={activeTab === 'inquiries' ? '#fff' : 'currentColor'} strokeWidth="1.8" />
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
          <rect x="2" y="5" width="20" height="14" rx="2" fill={activeTab === 'payments' ? 'currentColor' : 'none'} />
          <circle cx="12" cy="12" r="3" fill={activeTab === 'payments' ? '#fff' : 'none'} />
          <path d="M6 9h.01M18 15h.01" stroke={activeTab === 'payments' ? '#fff' : 'currentColor'} />
        </svg>
        Payments
      </button>
    </nav>
  );
}
