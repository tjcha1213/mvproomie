import { useMemo, useState, useSyncExternalStore } from 'react';
import type { ReactNode } from 'react';
import './MockSession.css';

export type MockRole = 'tenant' | 'host' | 'broker';

export interface MockUserProfile {
  name: string;
  contact: string;
  role: MockRole;
  bio: string;
}

type SessionState = {
  authenticated: boolean;
  profile: MockUserProfile | null;
};

const STORAGE_KEY = 'roomie.mock-user-profile';

const DEFAULT_PROFILE: MockUserProfile = {
  name: 'Juan Dela Cruz',
  contact: 'juan@roomie.ph',
  role: 'tenant',
  bio: 'Mock user profile ready for demo testing.',
};

function isRole(value: unknown): value is MockRole {
  return value === 'tenant' || value === 'host' || value === 'broker';
}

function readStoredProfile(): MockUserProfile | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<MockUserProfile>;
    if (
      typeof parsed.name === 'string'
      && typeof parsed.contact === 'string'
      && typeof parsed.bio === 'string'
      && isRole(parsed.role)
    ) {
      return {
        name: parsed.name,
        contact: parsed.contact,
        role: parsed.role,
        bio: parsed.bio,
      };
    }
  } catch {
    // Ignore malformed storage and fall back to the default mock profile.
  }
  return null;
}

let sessionState: SessionState = {
  authenticated: false,
  profile: readStoredProfile(),
};

const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((listener) => listener());
}

function getSnapshot(): SessionState {
  return sessionState;
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function useMockSession() {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

export function formatMockRole(role: MockRole) {
  if (role === 'tenant') return 'Tenant';
  if (role === 'host') return 'Host';
  return 'Broker';
}

export function loginToDemo() {
  sessionState = {
    authenticated: true,
    profile: sessionState.profile ?? DEFAULT_PROFILE,
  };
  emit();
}

export function signUpToDemo(profile: MockUserProfile) {
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
  }
  sessionState = {
    authenticated: true,
    profile,
  };
  emit();
}

function RoleCard({
  role,
  selected,
  onSelect,
}: {
  role: MockRole;
  selected: boolean;
  onSelect: (role: MockRole) => void;
}) {
  const labels: Record<MockRole, { title: string; subtitle: string; emoji: string }> = {
    tenant: { title: 'Tenant', subtitle: 'Looking for a place', emoji: '🏡' },
    host: { title: 'Host', subtitle: 'Managing listings', emoji: '🏠' },
    broker: { title: 'Broker', subtitle: 'Helping both sides', emoji: '🤝' },
  };

  const data = labels[role];

  return (
    <button
      type="button"
      className={`mock-role-card ${selected ? 'selected' : ''}`}
      onClick={() => onSelect(role)}
    >
      <span className="mock-role-emoji" aria-hidden="true">{data.emoji}</span>
      <span className="mock-role-copy">
        <strong>{data.title}</strong>
        <small>{data.subtitle}</small>
      </span>
      <span className="mock-role-check" aria-hidden="true">{selected ? '✓' : ''}</span>
    </button>
  );
}

export function MockLoginGate({
  children,
  variant,
}: {
  children: ReactNode;
  variant: 'tenant' | 'host';
}) {
  const { authenticated, profile } = useMockSession();
  const [mode, setMode] = useState<'landing' | 'signup'>('landing');
  const [name, setName] = useState(profile?.name ?? '');
  const [contact, setContact] = useState(profile?.contact ?? '');
  const [role, setRole] = useState<MockRole>(profile?.role ?? (variant === 'host' ? 'host' : 'tenant'));
  const [bio, setBio] = useState(profile?.bio ?? '');

  const existingProfileCopy = useMemo(() => {
    if (!profile) return null;
    return `${profile.name} · ${profile.role === 'broker' ? 'Broker' : profile.role === 'host' ? 'Host' : 'Tenant'}`;
  }, [profile]);

  if (authenticated) return <>{children}</>;

  const title = variant === 'host' ? 'Host demo access' : 'Tenant demo access';
  const subtitle = variant === 'host'
    ? 'Log in or create a mock account to enter the host MVPs.'
    : 'Log in or create a mock account to enter the tenant MVPs.';

  return (
    <div className="mock-auth-shell">
      <div className="mock-auth-card">
        <div className="mock-auth-brand">
          <div className="mock-auth-logo" aria-hidden="true">
            <span className="mock-auth-logo-house">⌂</span>
          </div>
          <div className="mock-auth-brand-copy">
            <strong>Roomie</strong>
            <span>{title}</span>
          </div>
        </div>

        <div className="mock-auth-copy">
          <h1>Mock login</h1>
          <p>{subtitle}</p>
          {existingProfileCopy && (
            <div className="mock-auth-saved">
              <span className="mock-auth-saved-label">Saved profile</span>
              <strong>{existingProfileCopy}</strong>
            </div>
          )}
        </div>

        {mode === 'landing' ? (
          <div className="mock-auth-actions">
            <button type="button" className="mock-auth-btn primary" onClick={loginToDemo}>
              Log in
            </button>
            <button type="button" className="mock-auth-btn secondary" onClick={() => setMode('signup')}>
              Sign up / New account
            </button>
          </div>
        ) : (
          <form
            className="mock-auth-form"
            onSubmit={(event) => {
              event.preventDefault();
              signUpToDemo({
                name: name.trim() || DEFAULT_PROFILE.name,
                contact: contact.trim() || DEFAULT_PROFILE.contact,
                role,
                bio: bio.trim() || 'No bio provided yet.',
              });
            }}
          >
            <label className="mock-auth-field">
              <span>Name</span>
              <input value={name} onChange={(event) => setName(event.target.value)} placeholder="Your full name" />
            </label>
            <label className="mock-auth-field">
              <span>Contact</span>
              <input value={contact} onChange={(event) => setContact(event.target.value)} placeholder="Mobile number or email" />
            </label>
            <div className="mock-auth-field">
              <span>I am a…</span>
              <div className="mock-auth-roles">
                {(['tenant', 'host', 'broker'] as MockRole[]).map((nextRole) => (
                  <RoleCard key={nextRole} role={nextRole} selected={role === nextRole} onSelect={setRole} />
                ))}
              </div>
            </div>
            <label className="mock-auth-field">
              <span>Personal bio</span>
              <textarea
                value={bio}
                onChange={(event) => setBio(event.target.value)}
                placeholder="A short intro that will appear in Personal Details."
                rows={4}
              />
            </label>
            <div className="mock-auth-actions">
              <button type="submit" className="mock-auth-btn primary">Create account</button>
              <button type="button" className="mock-auth-btn secondary" onClick={() => setMode('landing')}>
                Back
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export { DEFAULT_PROFILE };
