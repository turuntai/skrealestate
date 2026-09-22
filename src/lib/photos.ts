/**
 * Property imagery.
 *
 * Photos come from a random-image endpoint rather than being stored with the
 * listing, so every slot on the site shows a real photograph without us
 * hosting any.
 *
 * Two things about this are load-bearing:
 *
 * 1. Each slot gets a unique `sig`. Without it every `<img>` sharing a query
 *    would resolve to one cached response and a six-photo gallery would show
 *    the same picture six times.
 * 2. The endpoint is third-party, so every `<img>` renders through `Photo`
 *    (src/components/Photo.tsx), which falls back to a local placeholder if a
 *    request fails. The page never shows a broken-image icon.
 *
 * Because the endpoint is random, a listing's photos are not stable across
 * reloads. Swapping this module for stored photo URLs is the fix, and nothing
 * outside it needs to change.
 */

const ENDPOINT = 'https://api.sourcesplash.com/i/random';

/** Search terms per kind of shot, chosen to read as Nepali-market housing. */
export const PHOTO_QUERIES = {
  exterior: 'modern villa',
  apartment: 'apartment building',
  interior: 'luxury interior',
  living: 'modern living room',
  bedroom: 'modern bedroom',
  kitchen: 'modern kitchen',
  bathroom: 'modern bathroom',
  terrace: 'rooftop terrace',
  balcony: 'apartment balcony view',
  street: 'residential street',
  land: 'empty land plot',
  office: 'modern office space',
  shop: 'shop storefront',
  plan: 'architecture floor plan',
} as const;

export type PhotoKind = keyof typeof PHOTO_QUERIES;

export const PHOTO_FALLBACK = '/brand/photo-fallback.svg';

/**
 * A random photo URL for one slot.
 * `seed` only has to be unique per slot — it is what keeps sibling images
 * from collapsing into a single cached response.
 */
export function photoUrl(kind: PhotoKind, seed: string): string {
  const params = new URLSearchParams({ q: PHOTO_QUERIES[kind] });
  if (seed) params.set('sig', seed);
  return `${ENDPOINT}?${params.toString()}`;
}

/** Human-readable alt text, so the fallback and screen readers both make sense. */
const ALT: Record<PhotoKind, string> = {
  exterior: 'Front of the property',
  apartment: 'The apartment building',
  interior: 'Inside the property',
  living: 'Living room',
  bedroom: 'Bedroom',
  kitchen: 'Kitchen',
  bathroom: 'Bathroom',
  terrace: 'Terrace',
  balcony: 'View from the balcony',
  street: 'The road outside',
  land: 'The plot',
  office: 'Office space',
  shop: 'Shop frontage',
  plan: 'Floor plan',
};

export const photoAlt = (kind: PhotoKind, title: string) => `${title} — ${ALT[kind].toLowerCase()}`;

/** Builds a listing's photo set: `kinds` in order, each with a stable seed. */
export function photoSet(
  listingId: string,
  title: string,
  kinds: PhotoKind[],
): { src: string; alt: string }[] {
  return kinds.map((kind, i) => ({
    src: photoUrl(kind, `${listingId}-${i + 1}`),
    alt: photoAlt(kind, title),
  }));
}
