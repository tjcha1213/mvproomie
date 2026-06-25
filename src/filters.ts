import type { Listing, ListingType } from './data/listings';

export interface Filters {
  priceMin: number;
  priceMax: number;
  types: ListingType[];
  furnished: boolean;
  wifi: boolean;
}

export const PRICE_MIN = 2000;
export const PRICE_MAX = 20000;
export const PRICE_STEP = 500;

export const defaultFilters: Filters = {
  priceMin: PRICE_MIN,
  priceMax: PRICE_MAX,
  types: [],
  furnished: false,
  wifi: false,
};

// Apply the text query and all filters to a list of listings.
export function applyFilters(listings: Listing[], query: string, f: Filters): Listing[] {
  const q = query.trim().toLowerCase();
  return listings.filter((l) => {
    if (l.price < f.priceMin || l.price > f.priceMax) return false;
    if (f.types.length > 0 && !f.types.includes(l.type)) return false;
    if (f.furnished && !l.furnished) return false;
    if (f.wifi && !l.wifi) return false;
    if (q && !(
      l.title.toLowerCase().includes(q) ||
      l.location.toLowerCase().includes(q) ||
      l.district.toLowerCase().includes(q)
    )) return false;
    return true;
  });
}

// How many filter dimensions differ from the defaults (drives the badge count).
export function activeFilterCount(f: Filters): number {
  let n = 0;
  if (f.priceMin > PRICE_MIN || f.priceMax < PRICE_MAX) n++;
  if (f.types.length > 0) n++;
  if (f.furnished) n++;
  if (f.wifi) n++;
  return n;
}
