export const PROFILE_MENU_ICONS = {
  settings: (
    <>
      <circle cx="12" cy="12" r="3.2" />
      <path d="M19.4 13.2a7.9 7.9 0 0 0 .05-2.4l2-1.55-2-3.45-2.42.65a8 8 0 0 0-2.1-1.2L14.5 2h-5L9.07 5.25a8 8 0 0 0-2.1 1.2l-2.42-.65-2 3.45 2 1.55a7.9 7.9 0 0 0 0 2.4l-2 1.55 2 3.45 2.42-.65a8 8 0 0 0 2.1 1.2L9.5 22h5l.43-3.25a8 8 0 0 0 2.1-1.2l2.42.65 2-3.45-2-1.55Z" />
    </>
  ),
  personal: (
    <>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20v-1a8 8 0 0 1 16 0v1" />
    </>
  ),
  security: (
    <>
      <path d="M5 11V8a7 7 0 1 1 14 0v3" />
      <rect x="4" y="11" width="16" height="10" rx="2" />
      <circle cx="12" cy="16" r="1" />
    </>
  ),
  verification: <path d="M9 12l2 2 4-4m6 2a9 9 0 1 1-18 0 9 9 0 0 1 18 0z" />,
  reviews: <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />,
  payment: (
    <>
      <rect x="2" y="5" width="20" height="14" rx="2" />
      <line x1="2" y1="10" x2="22" y2="10" />
    </>
  ),
  services: (
    <>
      <rect x="4" y="4" width="7" height="7" rx="1.8" />
      <rect x="13" y="4" width="7" height="7" rx="1.8" />
      <rect x="4" y="13" width="7" height="7" rx="1.8" />
      <rect x="13" y="13" width="7" height="7" rx="1.8" />
    </>
  ),
  support: (
    <>
      <circle cx="12" cy="12" r="10" />
      <path d="M9.7 9.3a2.7 2.7 0 0 1 5.3.8c0 2.1-2.5 2.4-3.3 3.9-.3.5-.4 1-.4 1.6" />
      <circle cx="12" cy="17.4" r="0.7" />
    </>
  ),
  smile: (
    <>
      <circle cx="12" cy="12" r="10" />
      <circle cx="9" cy="10" r="1" fill="currentColor" stroke="none" />
      <circle cx="15" cy="10" r="1" fill="currentColor" stroke="none" />
      <path d="M8.5 14.2c1.1 1.4 2.4 2.1 3.5 2.1s2.4-.7 3.5-2.1" />
    </>
  ),
  themeBlock: (
    <>
      <circle cx="12" cy="12" r="10" />
      <path d="M12 2a10 10 0 0 1 0 20z" fill="currentColor" stroke="none" />
    </>
  ),
  chevron: (
    <>
      <polyline points="9 18 15 12 9 6" />
    </>
  ),
} as const;
