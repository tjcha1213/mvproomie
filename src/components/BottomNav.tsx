import type { NavTab } from '../types';

interface Props {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  savedCount: number;
  inboxCount: number;
}

export default function BottomNav({ activeTab, onTabChange, savedCount, inboxCount }: Props) {
  return (
    <nav className="bottom-nav">
      <button className={`bottom-nav-item ${activeTab === 'home' ? 'active' : ''}`} onClick={() => onTabChange('home')}>
        <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" strokeLinecap="round" strokeLinejoin="round">
          <path
            d="M3.5 8.8 12 2.7l8.5 6.1V19H3.5z"
            fill={activeTab === 'home' ? 'currentColor' : 'none'}
            stroke="currentColor"
            strokeWidth="2"
          />
          <circle
            cx="12"
            cy="9.8"
            r="1.2"
            fill={activeTab === 'home' ? '#fff' : 'currentColor'}
            stroke="none"
          />
        </svg>
        Home
      </button>

      <button className={`bottom-nav-item ${activeTab === 'search' ? 'active' : ''}`} onClick={() => onTabChange('search')}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="8"/>
          <line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        Search
      </button>

      <button className={`bottom-nav-item ${activeTab === 'saved' ? 'active' : ''}`} onClick={() => onTabChange('saved')} style={{ position: 'relative' }}>
        <span style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg viewBox="0 0 24 24" fill={activeTab === 'saved' ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
          </svg>
        </span>
        {savedCount > 0 && (
          <span style={{
            position: 'absolute', top: 2, right: 'calc(50% - 20px)',
            width: 16, height: 16, borderRadius: '50%',
            background: '#EF4444', color: 'white',
            fontSize: 9, fontWeight: 700,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 2,
          }}>{savedCount}</span>
        )}
        Saved
      </button>

      <button className={`bottom-nav-item ${activeTab === 'inbox' ? 'active' : ''}`} onClick={() => onTabChange('inbox')} style={{ position: 'relative' }}>
        <span style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path
              d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"
              fill={activeTab === 'inbox' ? 'currentColor' : 'none'}
              stroke="currentColor"
            />
            <polyline
              points="22,6 12,13 2,6"
              stroke={activeTab === 'inbox' ? '#fff' : 'currentColor'}
              fill="none"
            />
          </svg>
        </span>
        {inboxCount > 0 && (
          <span style={{
            position: 'absolute', top: 2, right: 'calc(50% - 20px)',
            width: 16, height: 16, borderRadius: '50%',
            background: '#EF4444', color: 'white',
            fontSize: 9, fontWeight: 700,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 2,
          }}>{inboxCount}</span>
        )}
        Chat
      </button>

      <button className={`bottom-nav-item ${activeTab === 'profile' ? 'active' : ''}`} onClick={() => onTabChange('profile')}>
        <svg viewBox="0 0 24 24" fill={activeTab === 'profile' ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="8" r="4"/>
          <path d="M4 20v-1a8 8 0 0 1 16 0v1"/>
        </svg>
        Profile
      </button>
    </nav>
  );
}
