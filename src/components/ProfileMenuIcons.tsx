export const PROFILE_MENU_ICONS = {
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
  support: (
    <>
      <circle cx="12" cy="12" r="10" />
      <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </>
  ),
  theme: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M8 15h.01M9 8h.01M15 8h.01M17 14h.01M12 18a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />
    </>
  ),
} as const;
