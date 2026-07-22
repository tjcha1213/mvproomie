import { useState, useSyncExternalStore } from 'react';
import type { FormEvent, ReactNode } from 'react';
import Logo from './Logo';
import { AVATARS, JUAN_AVATAR } from '../avatarPool';
import { DEFAULT_PRIMARY, THEME_STORAGE_KEY, THEMES } from '../theme';
import './MockSession.css';

export type MockRole = 'tenant' | 'host' | 'broker';

export interface MockUserProfile {
  participantId: string;
  avatar?: string;
  themeColor?: string;
  name: string;
  contact: string;
  role: MockRole;
  participantRoleDetail: string;
  mvpRoute: string;
  bio: string;
  servicePreferences: string[];
}

type SessionState = {
  authenticated: boolean;
  profile: MockUserProfile | null;
};

const STORAGE_KEY = 'roomie.mock-user-profile';

const DEFAULT_PROFILE: MockUserProfile = {
  participantId: 'PT-DEMO-0001',
  avatar: JUAN_AVATAR,
  themeColor: DEFAULT_PRIMARY,
  name: 'Juan Dela Cruz',
  contact: 'juan@roomie.ph',
  role: 'tenant',
  participantRoleDetail: 'Tenant',
  mvpRoute: 'Tenant MVP 1',
  bio: 'Mock user profile ready for demo testing.',
  servicePreferences: [],
};

function isRole(value: unknown): value is MockRole {
  return value === 'tenant' || value === 'host' || value === 'broker';
}

function generateParticipantId() {
  const random = typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID().slice(0, 8).toUpperCase()
    : Math.random().toString(36).slice(2, 10).toUpperCase();
  return `PT-${random}`;
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
        participantId: typeof parsed.participantId === 'string' ? parsed.participantId : generateParticipantId(),
        avatar: typeof parsed.avatar === 'string' ? parsed.avatar : JUAN_AVATAR,
        themeColor: typeof parsed.themeColor === 'string' ? parsed.themeColor : DEFAULT_PRIMARY,
        name: parsed.name,
        contact: parsed.contact,
        role: parsed.role,
        participantRoleDetail: typeof parsed.participantRoleDetail === 'string' ? parsed.participantRoleDetail : formatMockRole(parsed.role),
        mvpRoute: typeof parsed.mvpRoute === 'string' ? parsed.mvpRoute : 'Tenant MVP 1',
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

export function signUpToDemo(profile: Omit<MockUserProfile, 'participantId'>) {
  const normalizedProfile: MockUserProfile = {
    ...DEFAULT_PROFILE,
    ...profile,
    participantId: generateParticipantId(),
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
  mvpRoute,
}: {
  children: ReactNode;
  variant: 'tenant' | 'host';
  mvpRoute: string;
}) {
  const { authenticated, profile } = useMockSession();
  const [mode, setMode] = useState<'landing' | 'signup'>('landing');
  const [account, setAccount] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState(profile?.name ?? '');
  const [contact, setContact] = useState(profile?.contact ?? '');
  const [role, setRole] = useState<MockRole>(profile?.role ?? (variant === 'host' ? 'host' : 'tenant'));
  const [bio, setBio] = useState(profile?.bio ?? '');
  const [avatar, setAvatar] = useState(profile?.avatar ?? JUAN_AVATAR);
  const [themeColor, setThemeColor] = useState(profile?.themeColor ?? DEFAULT_PRIMARY);
  const [customizeOpen, setCustomizeOpen] = useState(false);

  if (authenticated) return <>{children}</>;

  const resetSignupFields = () => {
    setAccount('');
    setPassword('');
    setName('');
    setContact('');
    setRole(variant === 'host' ? 'host' : 'tenant');
    setBio('');
    setAvatar(JUAN_AVATAR);
    setThemeColor(DEFAULT_PRIMARY);
    setCustomizeOpen(false);
  };

  const handleSignupSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    signUpToDemo({
      avatar,
      themeColor,
      name: name.trim() || DEFAULT_PROFILE.name,
      contact: contact.trim() || DEFAULT_PROFILE.contact,
      role,
      participantRoleDetail: formatMockRole(role),
      mvpRoute,
      bio: bio.trim() || 'No bio provided yet.',
      servicePreferences: [],
    });
    resetSignupFields();
    setMode('landing');
  };

  const applyThemeColor = (nextTheme: string) => {
    setThemeColor(nextTheme);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
      window.document.documentElement.style.setProperty('--primary', nextTheme);
    }
  };

  return (
    <div className={`mock-auth-shell ${mode === 'signup' ? 'signup-mode' : ''}`}>
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
            onSubmit={handleSignupSubmit}
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
            <div className="mock-auth-customize">
              <div className="mock-auth-customize-head">
                <button
                  type="button"
                  className="mock-auth-btn primary mock-auth-customize-btn"
                  onClick={() => setCustomizeOpen(true)}
                >
                  Select Avatar & Color Theme
                </button>
              </div>
              <div className="mock-auth-preview-stack">
                <div className="mock-auth-preview-avatar">
                  <img src={avatar} alt="Selected avatar preview" />
                </div>
                <div className="mock-auth-preview-copy">
                  <strong>Selected theme</strong>
                  <span>{THEMES.find((item) => item.color.toLowerCase() === themeColor.toLowerCase())?.name ?? 'Custom theme'}</span>
                </div>
              </div>
            </div>
            <div className="mock-auth-actions">
              <button type="submit" className="mock-auth-btn primary">Create account</button>
              <button type="button" className="mock-auth-btn secondary" onClick={() => setMode('landing')}>
                Back
              </button>
            </div>
          </form>
        )}
      </div>

      {mode === 'signup' && customizeOpen && (
        <div className="mock-auth-modal-overlay" role="presentation" onClick={() => setCustomizeOpen(false)}>
          <div className="mock-auth-modal" role="dialog" aria-modal="true" aria-label="Customize avatar and theme" onClick={(event) => event.stopPropagation()}>
            <div className="mock-auth-modal-header">
              <div>
                <div className="mock-auth-modal-title">Choose avatar & theme</div>
                <div className="mock-auth-modal-subtitle">Pick a profile image and color accent for this account.</div>
              </div>
              <button type="button" className="mock-auth-modal-close" onClick={() => setCustomizeOpen(false)} aria-label="Close customization">
                ×
              </button>
            </div>

            <div className="mock-auth-modal-section">
              <div className="mock-auth-modal-label">Avatar</div>
              <div className="mock-auth-avatar-grid">
                {AVATARS.map((item, index) => {
                  const selected = item === avatar;
                  return (
                    <button
                      key={item}
                      type="button"
                      className={`mock-auth-avatar-option ${selected ? 'selected' : ''}`}
                      onClick={() => setAvatar(item)}
                    >
                      <img src={item} alt={`Avatar option ${index + 1}`} />
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="mock-auth-modal-section">
              <div className="mock-auth-modal-label">Theme color</div>
              <div className="mock-auth-theme-grid">
                {THEMES.map((theme) => {
                  const selected = theme.color.toLowerCase() === themeColor.toLowerCase();
                  return (
                    <button
                      key={theme.color}
                      type="button"
                      className={`mock-auth-theme-option ${selected ? 'selected' : ''}`}
                      onClick={() => applyThemeColor(theme.color)}
                    >
                      <span className="mock-auth-theme-swatch" style={{ background: theme.color }} />
                      <span className="mock-auth-theme-name">{theme.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="mock-auth-modal-actions">
              <button type="button" className="mock-auth-btn primary" onClick={() => setCustomizeOpen(false)}>
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export { DEFAULT_PROFILE };
