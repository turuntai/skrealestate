import type { Listing } from './types';

const NE_DIGITS = ['०', '१', '२', '३', '४', '५', '६', '७', '८', '९'];

export const toNepaliDigits = (s: string | number) =>
  String(s).replace(/\d/g, (d) => NE_DIGITS[+d]);

/**
 * South-Asian digit grouping: 12,34,567 rather than 1,234,567.
 * Intl's en-IN locale does this, but we implement it so the output is
 * identical in every browser and in the Node prerender step.
 */
export function groupIndian(n: number): string {
  const [int, dec] = Math.abs(n).toFixed(0).split('.');
  const last3 = int.slice(-3);
  const rest = int.slice(0, -3);
  const grouped = rest ? rest.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + ',' + last3 : last3;
  return (n < 0 ? '-' : '') + grouped + (dec ? '.' + dec : '');
}

/** `Rs 45,000` */
export const npr = (n: number) => `Rs ${groupIndian(n)}`;

/**
 * Short form the way people actually say it in Nepal:
 * 2,50,00,000 -> "Rs 2.5 Cr", 45,00,000 -> "Rs 45 Lakh", 45,000 -> "Rs 45,000".
 */
export function nprShort(n: number): string {
  if (n >= 1_00_00_000) {
    const cr = n / 1_00_00_000;
    return `Rs ${cr % 1 === 0 ? cr : cr.toFixed(2).replace(/\.?0+$/, '')} Cr`;
  }
  if (n >= 1_00_000) {
    const l = n / 1_00_000;
    return `Rs ${l % 1 === 0 ? l : l.toFixed(2).replace(/\.?0+$/, '')} Lakh`;
  }
  return npr(n);
}

/** Headline price with the right unit for the listing's purpose. */
export function priceLabel(l: Listing): { amount: string; unit: string } {
  if (l.priceOnRequest) return { amount: 'Price on request', unit: '' };
  if (l.purpose === 'rent') return { amount: npr(l.price), unit: '/month' };
  return { amount: nprShort(l.price), unit: '' };
}

/** Rent + every recurring charge, so nobody is surprised at the door. */
export function monthlyTotal(l: Listing): number {
  if (l.purpose !== 'rent') return l.price;
  return l.price + (l.serviceCharge ?? 0) + (l.waterCharge ?? 0);
}

/* ---- Dates ---------------------------------------------------------- */

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function fmtDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

export function relativeTime(iso: string, now = Date.now()): string {
  const diff = now - new Date(iso).getTime();
  const mins = Math.round(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs} hour${hrs > 1 ? 's' : ''} ago`;
  const days = Math.round(hrs / 24);
  if (days === 1) return 'yesterday';
  if (days < 30) return `${days} days ago`;
  const months = Math.round(days / 30);
  if (months < 12) return `${months} month${months > 1 ? 's' : ''} ago`;
  return fmtDate(iso);
}

export const DAY_MS = 86_400_000;

export const daysBetween = (a: number, b: number) => Math.ceil((a - b) / DAY_MS);

export const toISODate = (d: Date) => d.toISOString().slice(0, 10);

/** "Available now" reads better than a date that has already passed. */
export function availabilityLabel(iso: string, now = Date.now()): string {
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return '—';
  if (t <= now) return 'Available now';
  const days = daysBetween(t, now);
  if (days <= 7) return `Available in ${days} day${days > 1 ? 's' : ''}`;
  return `Available from ${fmtDate(iso)}`;
}

/* ---- Text ----------------------------------------------------------- */

export function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 70);
}

/** 98XXXXXXXX -> 980-1234567; leaves anything unexpected untouched. */
export function prettyPhone(p: string): string {
  const d = p.replace(/\D/g, '');
  if (d.length === 10) return `${d.slice(0, 3)}-${d.slice(3)}`;
  return p;
}

/** Nepal country code, digits only — what tel:/wa.me links need. */
export function intlPhone(p: string): string {
  const d = p.replace(/\D/g, '');
  return d.startsWith('977') ? d : `977${d}`;
}

export const pluralize = (n: number, one: string, many = one + 's') =>
  `${n} ${n === 1 ? one : many}`;

export const titleCase = (s: string) =>
  s.replace(/\w\S*/g, (t) => t[0].toUpperCase() + t.slice(1).toLowerCase());
