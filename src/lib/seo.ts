import { npr, nprShort } from './format';
import { summaryLine, listingUrl } from './share';
import type { Listing } from './types';

export const SITE_NAME = 'SK Real Estate Pvt. Ltd.';
export const SITE_TAGLINE = 'Verified homes to rent and buy across Kathmandu Valley';

function setMeta(selector: string, attr: 'name' | 'property', key: string, content: string) {
  let el = document.head.querySelector<HTMLMetaElement>(selector);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function setCanonical(href: string) {
  let el = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!el) {
    el = document.createElement('link');
    el.rel = 'canonical';
    document.head.appendChild(el);
  }
  el.href = href;
}

export interface MetaInput {
  title: string;
  description: string;
  image?: string;
  url?: string;
  type?: 'website' | 'article' | 'product';
}

/**
 * Updates the document head for the current route.
 *
 * Facebook and WhatsApp do not run JavaScript, so this alone is not enough for
 * a rich link preview — `scripts/prerender.mjs` writes a static HTML file per
 * listing at build time carrying the same tags. This keeps the tab title and
 * in-app previews correct while navigating.
 */
export function applyMeta({ title, description, image, url, type = 'website' }: MetaInput): void {
  if (typeof document === 'undefined') return;

  const fullTitle = title === SITE_NAME ? title : `${title} | ${SITE_NAME}`;
  const href = url ?? window.location.href;
  const img = image ? new URL(image, window.location.origin).href : `${window.location.origin}/og/default.png`;

  document.title = fullTitle;
  setMeta('meta[name="description"]', 'name', 'description', description);
  setCanonical(href);

  setMeta('meta[property="og:title"]', 'property', 'og:title', fullTitle);
  setMeta('meta[property="og:description"]', 'property', 'og:description', description);
  setMeta('meta[property="og:image"]', 'property', 'og:image', img);
  setMeta('meta[property="og:url"]', 'property', 'og:url', href);
  setMeta('meta[property="og:type"]', 'property', 'og:type', type);
  setMeta('meta[property="og:site_name"]', 'property', 'og:site_name', SITE_NAME);

  setMeta('meta[name="twitter:card"]', 'name', 'twitter:card', 'summary_large_image');
  setMeta('meta[name="twitter:title"]', 'name', 'twitter:title', fullTitle);
  setMeta('meta[name="twitter:description"]', 'name', 'twitter:description', description);
  setMeta('meta[name="twitter:image"]', 'name', 'twitter:image', img);
}

/** The blurb that shows under the link in a WhatsApp or Facebook preview. */
export function listingDescription(l: Listing): string {
  const price = l.purpose === 'rent' ? `${npr(l.price)}/month` : nprShort(l.price);
  const parts = [`${price} · ${summaryLine(l)}`];
  if (l.landmark) parts.push(l.landmark);
  const extras: string[] = [];
  if (l.parking.car) extras.push(`${l.parking.car} car parking`);
  if (l.builtUpArea) extras.push(`${l.builtUpArea} sq ft`);
  if (l.furnishing === 'full') extras.push('fully furnished');
  if (extras.length) parts.push(extras.join(' · '));
  return parts.join(' — ').slice(0, 300);
}

export function listingMeta(l: Listing): MetaInput {
  return {
    title: l.title,
    description: listingDescription(l),
    image: l.photos[0]?.src,
    url: listingUrl(l),
    type: 'article',
  };
}

/** schema.org payload so Google can show price and location in results. */
export function listingJsonLd(l: Listing, origin: string) {
  return {
    '@context': 'https://schema.org',
    '@type': l.purpose === 'rent' ? 'RentAction' : 'Product',
    name: l.title,
    description: l.description.slice(0, 500),
    image: l.photos.map((p) => `${origin}${p.src}`),
    url: `${origin}/property/${l.slug}`,
    offers: {
      '@type': 'Offer',
      price: l.price,
      priceCurrency: 'NPR',
      availability: l.status === 'active' ? 'https://schema.org/InStock' : 'https://schema.org/SoldOut',
      ...(l.purpose === 'rent' ? { unitText: 'MONTH' } : {}),
    },
    address: {
      '@type': 'PostalAddress',
      streetAddress: l.landmark,
      addressLocality: l.area,
      addressRegion: l.city,
      addressCountry: 'NP',
    },
    geo: { '@type': 'GeoCoordinates', latitude: l.lat, longitude: l.lng },
  };
}
