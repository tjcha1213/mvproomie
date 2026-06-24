export interface Theme {
  name: string;
  color: string;
}

// Selectable brand colors. The chosen color becomes --primary at runtime and
// every other accent (gradients, shadows, tints) is derived from it via color-mix.
export const THEMES: Theme[] = [
  { name: 'Deep Ocean Blue', color: '#1D4ED8' },
  { name: 'Modern Teal', color: '#0F9D9A' },
  { name: 'Warm Mango', color: '#FFB000' },
  { name: 'Sunset Orange', color: '#FF5A1F' },
];

export const DEFAULT_PRIMARY = '#1D4ED8';
export const THEME_STORAGE_KEY = 'roomie-primary';
