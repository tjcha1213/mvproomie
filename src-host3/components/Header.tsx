import { useEffect, useRef, useState } from 'react';
import { HOST_PROFILE } from '../data';
import type { Tab } from './HostNav';
import Logo from './Logo';
import { useMockSession } from '../../src/components/MockSession';

export interface HeaderNotification {
  id: string;
  title: string;
  detail: string;
  tab: Exclude<Tab, 'profile'>;
}

interface Props {
  onOpenProfile: () => void;
  notifications: HeaderNotification[];
  onOpenNotification: (notification: HeaderNotification) => void;
}

// Shared app header: wordmark on the left, notifications + profile avatar on
// the right (the avatar replaces the tenant app's hamburger menu).
export default function Header({ onOpenProfile, notifications, onOpenNotification }: Props) {
  const [open, setOpen] = useState(false);
  const shellRef = useRef<HTMLDivElement>(null);
  const { profile } = useMockSession();
  const profileAvatar = profile?.avatar ?? HOST_PROFILE.avatar;
  const profileName = profile?.name ?? HOST_PROFILE.name;

  useEffect(() => {
    function handleMouseDown(event: MouseEvent) {
      if (shellRef.current && !shellRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener('mousedown', handleMouseDown);
    return () => document.removeEventListener('mousedown', handleMouseDown);
  }, []);

  return (
    <div className="app-header">
      <Logo />
      <div className="header-actions" ref={shellRef}>
        <button className="icon-btn" style={{ position: 'relative' }} onClick={() => setOpen((value) => !value)} aria-label="Notifications">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
            <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
          </svg>
          {notifications.length > 0 && <span className="notif-dot" />}
        </button>
        {open && (
          <div className="header-notif-menu">
            <div className="header-notif-head">
              <strong>Notifications</strong>
              <span>{notifications.length}</span>
            </div>
            {notifications.length === 0 ? (
              <div className="header-notif-empty">No new notifications.</div>
            ) : (
              <div className="header-notif-list">
                {notifications.map((notification) => (
                  <button
                    key={notification.id}
                    className="header-notif-item"
                    onClick={() => {
                      setOpen(false);
                      onOpenNotification(notification);
                    }}
                  >
                    <span className="header-notif-bullet" />
                    <span className="header-notif-copy">
                      <strong>{notification.title}</strong>
                      <small>{notification.detail}</small>
                    </span>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
                      <polyline points="9 18 15 12 9 6"/>
                    </svg>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
        <button className="header-avatar" onClick={onOpenProfile} aria-label="Profile">
          <img src={profileAvatar} alt={profileName} />
        </button>
      </div>
    </div>
  );
}
