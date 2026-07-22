import { useState, useSyncExternalStore } from 'react';
import type { ReactNode } from 'react';
import Logo from './Logo';
import './MockSession.css';

export type MockRole = 'tenant' | 'host' | 'broker';

export interface MockUserProfile {
  name: string;
  contact: string;
  role: MockRole;
  bio: string;
  servicePreferences: string[];
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
  servicePreferences: [],
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
      const servicePreferences = Array.isArray((parsed as { servicePreferences?: unknown }).servicePreferences)
        ? (parsed as { servicePreferences?: unknown[] }).servicePreferences!.filter((item): item is string => typeof item === 'string')
        : [];
      return {
        name: parsed.name,
        contact: parsed.contact,
        role: parsed.role,
        bio: parsed.bio,
        servicePreferences,
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
  const normalizedProfile: MockUserProfile = {
    ...DEFAULT_PROFILE,
    ...profile,
    servicePreferences: profile.servicePreferences ?? [],
  };
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(normalizedProfile));
  }
  sessionState = {
    authenticated: true,
    profile: normalizedProfile,
  };
  emit();
}

export function updateServicePreferences(servicePreferences: string[]) {
  const nextProfile: MockUserProfile = {
    ...(sessionState.profile ?? DEFAULT_PROFILE),
    servicePreferences,
  };
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextProfile));
  }
  sessionState = {
    ...sessionState,
    profile: nextProfile,
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
  const [account, setAccount] = useState(profile?.contact ?? '');
  const [password, setPassword] = useState('');
  const [name, setName] = useState(profile?.name ?? '');
  const [contact, setContact] = useState(profile?.contact ?? '');
  const [role, setRole] = useState<MockRole>(profile?.role ?? (variant === 'host' ? 'host' : 'tenant'));
  const [bio, setBio] = useState(profile?.bio ?? '');

  if (authenticated) return <>{children}</>;

  return (
    <div className="mock-auth-shell">
      <div className="mock-auth-card">
        <div className="mock-auth-brand">
          <div className="mock-auth-logo" aria-hidden="true">
            <Logo />
          </div>
        </div>

        {mode === 'landing' ? (
          <form
            className="mock-auth-form"
            onSubmit={(event) => {
              event.preventDefault();
              loginToDemo();
            }}
          >
            <label className="mock-auth-field">
              <span>Account</span>
              <input
                value={account}
                onChange={(event) => setAccount(event.target.value)}
                placeholder="Email or username"
                autoComplete="username"
              />
            </label>
            <label className="mock-auth-field">
              <span>Password</span>
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Enter your password"
                autoComplete="current-password"
              />
            </label>
            <div className="mock-auth-actions">
              <button type="submit" className="mock-auth-btn primary">
                Log in
              </button>
              <button type="button" className="mock-auth-btn secondary" onClick={() => setMode('signup')}>
                Create new account
              </button>
            </div>
          </form>
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
                servicePreferences: [],
              });
            }}
          >
            <label className="mock-auth-field">
              <span>Account</span>
              <input
                value={account}
                onChange={(event) => setAccount(event.target.value)}
                placeholder="Email or username"
                autoComplete="username"
              />
            </label>
            <label className="mock-auth-field">
              <span>Password</span>
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Create a password"
                autoComplete="new-password"
              />
            </label>
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
