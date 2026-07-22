import type { ReactNode } from 'react';
import './ProfileSectionPage.css';

interface Props {
  title: string;
  subtitle: string;
  onBack: () => void;
  children: ReactNode;
}

export default function ProfileSectionPage({ title, subtitle, onBack, children }: Props) {
  return (
    <div className="profile-section-page">
      <div className="profile-section-shell">
        <button type="button" className="profile-section-back" onClick={onBack}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <div className="profile-section-copy">
          <div className="profile-section-title">{title}</div>
          <div className="profile-section-subtitle">{subtitle}</div>
        </div>
      </div>

      <div className="profile-section-body">{children}</div>
    </div>
  );
}
