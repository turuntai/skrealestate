import { effectiveStatus } from './expiry';
import type { Filters, Listing, SortKey } from './types';

export const EMPTY_FILTERS: Filters = {
  q: '', purpose: 'all', cities: [], areas: [], types: [], bhk: [],
  min: null, max: null, furnishing: [], amenities: [],
  parking: false, verifiedOnly: false, includeRented: false, sort: 'newest',
};

const norm = (s: string) => s.toLowerCase().normalize('NFKD');

/** Free-text match across the fields someone would actually type. */
function matchesQuery(l: Listing, q: string): boolean {
  if (!q.trim()) return true;
  const haystack = norm(
    [l.title, l.titleNe ?? '', l.area, l.city, l.landmark, l.description, l.type, l.bhk ?? '']
      .join(' '),
  );
  // Every word must appear somewhere — "baluwatar 3bhk" should narrow, not widen.
  return norm(q).split(/\s+/).filter(Boolean).every((w) => haystack.includes(w));
}

export function applyFilters(all: Listing[], f: Filters, now = Date.now()): Listing[] {
  const out = all.filter((l) => {
    const status = effectiveStatus(l, now);
    if (status === 'expired') return false;
    if (status === 'rented' && !f.includeRented) return false;

    if (f.purpose !== 'all' && l.purpose !== f.purpose) return false;
    if (f.cities.length && !f.cities.includes(l.city)) return false;
    if (f.areas.length && !f.areas.includes(l.area)) return false;
    if (f.types.length && !f.types.includes(l.type)) return false;
    if (f.bhk.length && (!l.bhk || !f.bhk.includes(l.bhk))) return false;
    if (f.furnishing.length && !f.furnishing.includes(l.furnishing)) return false;
    if (f.min !== null && l.price < f.min) return false;
    if (f.max !== null && l.price > f.max) return false;
    if (f.parking && l.parking.car < 1) return false;
    if (f.verifiedOnly && !l.verified) return false;
    if (f.amenities.length && !f.amenities.every((a) => l.amenities.includes(a))) return false;
    if (!matchesQuery(l, f.q)) return false;
    return true;
  });

  return sortListings(out, f.sort);
}

export function sortListings(list: Listing[], sort: SortKey): Listing[] {
  const copy = [...list];
  switch (sort) {
    case 'price-asc':
      return copy.sort((a, b) => a.price - b.price);
    case 'price-desc':
      return copy.sort((a, b) => b.price - a.price);
    case 'popular':
      return copy.sort((a, b) => b.views - a.views);
    case 'newest':
    default:
      return copy.sort(
        (a, b) => new Date(b.postedAt).getTime() - new Date(a.postedAt).getTime(),
      );
  }
}

/** How many filters are on — drives the "3" bubble on the Filters button. */
export function activeFilterCount(f: Filters): number {
  let n = 0;
  if (f.purpose !== 'all') n++;
  n += f.cities.length + f.areas.length + f.types.length + f.bhk.length + f.furnishing.length + f.amenities.length;
  if (f.min !== null || f.max !== null) n++;
  if (f.parking) n++;
  if (f.verifiedOnly) n++;
  if (f.includeRented) n++;
  return n;
}

/* ---- URL <-> Filters ------------------------------------------------ */
/* The search page keeps its state in the querystring so a filtered search
   can be copied, bookmarked and shared like any other link. */

const LIST_KEYS = ['cities', 'areas', 'types', 'bhk', 'furnishing', 'amenities'] as const;

export function filtersToParams(f: Filters): URLSearchParams {
  const p = new URLSearchParams();
  if (f.q) p.set('q', f.q);
  if (f.purpose !== 'all') p.set('for', f.purpose);
  LIST_KEYS.forEach((k) => {
    const v = f[k] as string[];
    if (v.length) p.set(k, v.join(','));
  });
  if (f.min !== null) p.set('min', String(f.min));
  if (f.max !== null) p.set('max', String(f.max));
  if (f.parking) p.set('parking', '1');
  if (f.verifiedOnly) p.set('verified', '1');
  if (f.includeRented) p.set('rented', '1');
  if (f.sort !== 'newest') p.set('sort', f.sort);
  return p;
}

export function paramsToFilters(p: URLSearchParams): Filters {
  const list = (k: string) => (p.get(k) ? p.get(k)!.split(',').filter(Boolean) : []);
  const num = (k: string) => {
    const v = p.get(k);
    if (v === null || v === '') return null;
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  };
  const purposeRaw = p.get('for');
  const sortRaw = p.get('sort');
  const validSorts: SortKey[] = ['newest', 'price-asc', 'price-desc', 'popular'];

  return {
    ...EMPTY_FILTERS,
    q: p.get('q') ?? '',
    purpose: purposeRaw === 'rent' || purposeRaw === 'sale' ? purposeRaw : 'all',
    cities: list('cities'),
    areas: list('areas'),
    types: list('types') as Filters['types'],
    bhk: list('bhk') as Filters['bhk'],
    furnishing: list('furnishing') as Filters['furnishing'],
    amenities: list('amenities'),
    min: num('min'),
    max: num('max'),
    parking: p.get('parking') === '1',
    verifiedOnly: p.get('verified') === '1',
    includeRented: p.get('rented') === '1',
    sort: validSorts.includes(sortRaw as SortKey) ? (sortRaw as SortKey) : 'newest',
  };
}

/** Listings in the same area / price band, for the bottom of the detail page. */
export function similarListings(target: Listing, all: Listing[], limit = 3, now = Date.now()): Listing[] {
  return all
    .filter((l) => l.id !== target.id && effectiveStatus(l, now) === 'active')
    .map((l) => {
      let score = 0;
      if (l.area === target.area) score += 5;
      if (l.city === target.city) score += 2;
      if (l.type === target.type) score += 3;
      if (l.purpose === target.purpose) score += 3;
      if (l.bhk && l.bhk === target.bhk) score += 2;
      const ratio = target.price ? Math.abs(l.price - target.price) / target.price : 1;
      if (ratio < 0.25) score += 3;
      else if (ratio < 0.5) score += 1;
      return { l, score };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score || b.l.views - a.l.views)
    .slice(0, limit)
    .map((x) => x.l);
}
