export interface Theme {
  name: string;
  color: string;
}

// Selectable brand colors. The chosen color becomes --primary at runtime and
// every other accent (gradients, shadows, tints) is derived from it via color-mix.
export const THEMES: Theme[] = [
  { name: 'Roomie Teal', color: '#15BDB6' },
  { name: 'Deep Ocean Blue', color: '#1D4ED8' },
  { name: 'Warm Mango', color: '#FFB000' },
  { name: 'Sunset Orange', color: '#FF5A1F' },
];

export const DEFAULT_PRIMARY = '#15BDB6';
export const THEME_STORAGE_KEY = 'roomie-primary';
