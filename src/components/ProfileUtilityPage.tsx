import { useState } from 'react';
import ProfileSectionPage from './ProfileSectionPage';
import './ProfileUtilityPage.css';

export type ProfileUtilityPageKey = 'settings' | 'security' | 'verification' | 'payments' | 'support';

interface Props {
  page: ProfileUtilityPageKey;
  mode: 'tenant' | 'host';
  onBack: () => void;
}

const PAGE_COPY: Record<ProfileUtilityPageKey, { title: string; subtitle: string }> = {
  settings: {
    title: 'Account Settings',
    subtitle: 'Manage app preferences, alerts, and account defaults.',
  },
  security: {
    title: 'Login & Security',
    subtitle: 'Review sign-in methods and account safety controls.',
  },
  verification: {
    title: 'Verification',
    subtitle: 'Track the checks that build trust in your Roomie profile.',
  },
  payments: {
    title: 'Payment Methods',
    subtitle: 'Manage saved payment and payout preferences.',
  },
  support: {
    title: 'Help & Support',
    subtitle: 'Find help, contact support, and review common questions.',
  },
};

function ToggleRow({ label, detail, initial = true }: { label: string; detail: string; initial?: boolean }) {
  const [enabled, setEnabled] = useState(initial);

  return (
    <button type="button" className="profile-util-row" onClick={() => setEnabled((current) => !current)}>
      <span>
        <strong>{label}</strong>
        <small>{detail}</small>
      </span>
      <span className={`profile-util-switch ${enabled ? 'on' : ''}`} aria-hidden="true">
        <span />
      </span>
    </button>
  );
}

function StatusRow({ label, detail, status }: { label: string; detail: string; status: 'Complete' | 'Pending' | 'Optional' }) {
  return (
    <div className="profile-util-row">
      <span>
        <strong>{label}</strong>
        <small>{detail}</small>
      </span>
      <span className={`profile-util-pill is-${status.toLowerCase()}`}>{status}</span>
    </div>
  );
}

export default function ProfileUtilityPage({ page, mode, onBack }: Props) {
  const copy = PAGE_COPY[page];
  const isHost = mode === 'host';
  const paymentTitle = isHost ? 'Payout & Payment Methods' : 'Payment Methods';

  return (
    <ProfileSectionPage title={page === 'payments' ? paymentTitle : copy.title} subtitle={copy.subtitle} onBack={onBack}>
      {page === 'settings' && (
        <div className="profile-util-stack">
          <div className="profile-util-card">
            <div className="profile-util-card-title">Preferences</div>
            <ToggleRow label="Push notifications" detail="Important messages, booking updates, and reminders." />
            <ToggleRow label="Email summaries" detail="Weekly account activity and saved listing updates." />
            <ToggleRow label="Location-aware suggestions" detail="Use preferred areas to improve recommendations." />
          </div>
          <div className="profile-util-card">
            <div className="profile-util-card-title">Defaults</div>
            <StatusRow label="Language" detail="English" status="Complete" />
            <StatusRow label="Currency" detail="Philippine peso (PHP)" status="Complete" />
          </div>
        </div>
      )}

      {page === 'security' && (
        <div className="profile-util-stack">
          <div className="profile-util-card">
            <div className="profile-util-card-title">Sign-in</div>
            <StatusRow label="Password" detail="Last updated for this demo account." status="Complete" />
            <StatusRow label="Two-step verification" detail="Add an extra check before account changes." status="Pending" />
            <ToggleRow label="Remember this device" detail="Keep this demo device signed in." />
          </div>
          <div className="profile-util-card">
            <div className="profile-util-card-title">Active session</div>
            <StatusRow label="Current browser" detail="This local Roomie MVP session." status="Complete" />
          </div>
        </div>
      )}

      {page === 'verification' && (
        <div className="profile-util-stack">
          <div className="profile-util-card">
            <div className="profile-util-card-title">Trust checks</div>
            <StatusRow label="Profile details" detail="Name, contact, and participant role detail." status="Complete" />
            <StatusRow label={isHost ? 'Host identity' : 'Tenant identity'} detail="Government ID or institutional verification." status="Pending" />
            <StatusRow label={isHost ? 'Listing ownership' : 'Housing intent'} detail={isHost ? 'Proof that listings can be managed.' : 'Basic move-in or search context.'} status="Optional" />
          </div>
        </div>
      )}

      {page === 'payments' && (
        <div className="profile-util-stack">
          <div className="profile-util-card">
            <div className="profile-util-card-title">{paymentTitle}</div>
            <StatusRow label={isHost ? 'Primary payout account' : 'Primary payment method'} detail={isHost ? 'Bank transfer ending in 2041' : 'Card ending in 4242'} status="Complete" />
            <StatusRow label={isHost ? 'Payout schedule' : 'Autopay'} detail={isHost ? 'Monthly, after rent clears.' : 'Off for this demo account.'} status={isHost ? 'Complete' : 'Optional'} />
            <ToggleRow label="Payment reminders" detail={isHost ? 'Notify tenants before rent due dates.' : 'Notify me before due dates.'} />
          </div>
          <div className="profile-util-card">
            <div className="profile-util-card-title">Receipts</div>
            <StatusRow label="Monthly statements" detail="Available in demo export format." status="Complete" />
          </div>
        </div>
      )}

      {page === 'support' && (
        <div className="profile-util-stack">
          <div className="profile-util-card">
            <div className="profile-util-card-title">Contact Roomie</div>
            <StatusRow label="Support channel" detail="support@roomie.ph" status="Complete" />
            <StatusRow label="Response time" detail="Most requests receive a response as soon as possible." status="Complete" />
          </div>
          <div className="profile-util-card">
            <div className="profile-util-card-title">Common help topics</div>
            <StatusRow label={isHost ? 'Managing listings' : 'Finding a place'} detail={isHost ? 'Photos, availability, rent, and inquiries.' : 'Saved homes, inquiries, and viewing requests.'} status="Complete" />
            <StatusRow label="Account profile" detail="Profile picture, bio, and service preferences." status="Complete" />
            <StatusRow label="Survey feedback" detail="User testing survey responses and metadata." status="Complete" />
          </div>
        </div>
      )}
    </ProfileSectionPage>
  );
}
