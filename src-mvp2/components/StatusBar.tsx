export default function StatusBar() {
  const now = new Date();
  const time = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: false });

  return (
    <div className="status-bar">
      <span className="status-bar-time">{time}</span>
      <div className="status-bar-icons">
        {/* Signal */}
        <svg viewBox="0 0 24 24" fill="currentColor">
          <rect x="2" y="16" width="3" height="6" rx="1"/>
          <rect x="7" y="12" width="3" height="10" rx="1"/>
          <rect x="12" y="8" width="3" height="14" rx="1"/>
          <rect x="17" y="4" width="3" height="18" rx="1"/>
        </svg>
        {/* WiFi */}
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M5 12.55a11 11 0 0 1 14.08 0"/>
          <path d="M1.42 9a16 16 0 0 1 21.16 0"/>
          <path d="M8.53 16.11a6 6 0 0 1 6.95 0"/>
          <circle cx="12" cy="20" r="1" fill="currentColor"/>
        </svg>
        {/* Battery */}
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="1" y="6" width="18" height="12" rx="2"/>
          <path d="M23 13v-2" strokeLinecap="round"/>
          <rect x="3" y="8" width="14" height="8" rx="1" fill="currentColor" stroke="none"/>
        </svg>
      </div>
    </div>
  );
}
