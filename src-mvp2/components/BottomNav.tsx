import type { NavTab } from '../types';

interface Props {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  savedCount: number;
}

export default function BottomNav({ activeTab, onTabChange, savedCount }: Props) {
  return (
    <nav className="bottom-nav">
      <button className={`bottom-nav-item ${activeTab === 'home' ? 'active' : ''}`} onClick={() => onTabChange('home')}>
        <svg viewBox="0 0 24 24" fill={activeTab === 'home' ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
          <polyline points="9 22 9 12 15 12 15 22"/>
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
        <svg viewBox="0 0 24 24" fill={activeTab === 'saved' ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
        </svg>
        {savedCount > 0 && (
          <span style={{
            position: 'absolute', top: 4, right: 'calc(50% - 14px)',
            width: 16, height: 16, borderRadius: '50%',
            background: '#EF4444', color: 'white',
            fontSize: 9, fontWeight: 700,
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>{savedCount}</span>
        )}
        Saved
      </button>

      <button className={`bottom-nav-item ${activeTab === 'inbox' ? 'active' : ''}`} onClick={() => onTabChange('inbox')}>
        <svg viewBox="0 0 24 24" fill={activeTab === 'inbox' ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
          <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
          <polyline points="22,6 12,13 2,6"/>
        </svg>
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
