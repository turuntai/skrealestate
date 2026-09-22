/**
 * Writes a static HTML file per listing after the Vite build.
 *
 * Facebook, Messenger, WhatsApp and Viber fetch a URL and read the <meta> tags
 * without running any JavaScript. A single-page app therefore shares with the
 * same generic preview on every link. This step gives each listing its own
 * index.html carrying its own title, description, photo and JSON-LD, so a
 * pasted link shows the property. The file loads the same JS bundle, so the
 * app takes over as normal for a real visitor.
 *
 * Run automatically by `npm run build`.
 */
import { build } from 'esbuild';
import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const DIST = resolve(ROOT, 'dist');
const TMP = resolve(ROOT, 'node_modules/.cache/sk-prerender');

/** Change this to the real domain before going live. */
const ORIGIN = process.env.SITE_ORIGIN?.replace(/\/$/, '') || 'https://skrealestate.com.np';

const escapeHtml = (s) =>
  String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

/* ---- pull the catalogue out of the TypeScript source ---------------- */
async function loadSeed() {
  mkdirSync(TMP, { recursive: true });
  const out = resolve(TMP, 'seed.mjs');
  await build({
    entryPoints: [resolve(ROOT, 'src/data/seed.ts')],
    outfile: out,
    bundle: true,
    format: 'esm',
    platform: 'node',
    logLevel: 'silent',
  });
  const mod = await import(`${pathToFileURL(out).href}?t=${Date.now()}`);
  return mod.SEED_LISTINGS;
}

/* ---- formatting, kept in step with src/lib/format.ts ---------------- */
function groupIndian(n) {
  const int = Math.abs(Math.round(n)).toString();
  const last3 = int.slice(-3);
  const rest = int.slice(0, -3);
  return rest ? `${rest.replace(/\B(?=(\d{2})+(?!\d))/g, ',')},${last3}` : last3;
}
const npr = (n) => `Rs ${groupIndian(n)}`;
function nprShort(n) {
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

const TYPE_LABEL = {
  house: 'House', flat: 'Flat', room: 'Room', shutter: 'Shutter', office: 'Office space', land: 'Land',
};

function summary(l) {
  const bits = [];
  if (l.bhk) bits.push(l.bhk === 'rk' ? 'Room + Kitchen' : `${l.bhk} BHK`);
  bits.push(TYPE_LABEL[l.type] ?? l.type);
  bits.push(`in ${l.area}, ${l.city}`);
  return bits.join(' ');
}

function description(l) {
  const price = l.purpose === 'rent' ? `${npr(l.price)}/month` : nprShort(l.price);
  const parts = [`${price} · ${summary(l)}`];
  if (l.landmark) parts.push(l.landmark);
  const extras = [];
  if (l.parking?.car) extras.push(`${l.parking.car} car parking`);
  if (l.builtUpArea) extras.push(`${l.builtUpArea} sq ft`);
  if (l.furnishing === 'full') extras.push('fully furnished');
  if (extras.length) parts.push(extras.join(' · '));
  return parts.join(' — ').slice(0, 300);
}

function jsonLd(l) {
  return {
    '@context': 'https://schema.org',
    '@type': l.purpose === 'rent' ? 'RentAction' : 'Product',
    name: l.title,
    description: l.description.slice(0, 500),
    image: l.photos.map((p) => `${ORIGIN}${p.src}`),
    url: `${ORIGIN}/property/${l.slug}`,
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

/* ---- rewrite the built index.html for one listing -------------------- */
function pageFor(template, l) {
  const url = `${ORIGIN}/property/${l.slug}`;
  const title = `${l.title} | SK Real Estate Pvt. Ltd.`;
  const desc = description(l);
  // The PNG share card from scripts/gen-og.mjs — Facebook and WhatsApp will not
  // render an SVG in a preview.
  const image = `${ORIGIN}/og/${l.slug}.png`;

  let html = template;

  const replaceMeta = (attr, key, value) => {
    const re = new RegExp(`<meta\\s+${attr}="${key}"\\s+content="[^"]*"\\s*/?>`, 'i');
    const tag = `<meta ${attr}="${key}" content="${escapeHtml(value)}" />`;
    html = re.test(html) ? html.replace(re, tag) : html.replace('</head>', `    ${tag}\n  </head>`);
  };

  html = html.replace(/<title>[\s\S]*?<\/title>/i, `<title>${escapeHtml(title)}</title>`);
  replaceMeta('name', 'description', desc);
  replaceMeta('property', 'og:title', title);
  replaceMeta('property', 'og:description', desc);
  replaceMeta('property', 'og:image', image);
  replaceMeta('property', 'og:url', url);
  replaceMeta('property', 'og:type', 'article');
  replaceMeta('name', 'twitter:title', title);
  replaceMeta('name', 'twitter:description', desc);
  replaceMeta('name', 'twitter:image', image);

  html = html.replace(
    /<link rel="canonical"[^>]*>/i,
    `<link rel="canonical" href="${escapeHtml(url)}" />`,
  );

  // Swap the org-level JSON-LD for this listing's.
  html = html.replace(
    /<script type="application\/ld\+json">[\s\S]*?<\/script>/i,
    `<script type="application/ld+json">${JSON.stringify(jsonLd(l))}</script>`,
  );

  return html;
}

function sitemap(listings) {
  const today = new Date().toISOString().slice(0, 10);
  const staticPages = ['', '/listings', '/post', '/about', '/contact'];
  const urls = [
    ...staticPages.map((p) => ({ loc: `${ORIGIN}${p}`, lastmod: today, priority: p === '' ? '1.0' : '0.7' })),
    ...listings.map((l) => ({
      loc: `${ORIGIN}/property/${l.slug}`,
      lastmod: l.updatedAt.slice(0, 10),
      priority: '0.9',
    })),
  ];
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `  <url>
    <loc>${u.loc}</loc>
    <lastmod>${u.lastmod}</lastmod>
    <priority>${u.priority}</priority>
  </url>`).join('\n')}
</urlset>`;
}

/* ---- run ------------------------------------------------------------- */
async function main() {
  const template = readFileSync(resolve(DIST, 'index.html'), 'utf8');
  const listings = await loadSeed();

  for (const l of listings) {
    const dir = resolve(DIST, 'property', l.slug);
    mkdirSync(dir, { recursive: true });
    writeFileSync(resolve(dir, 'index.html'), pageFor(template, l));
  }

  // Static hosts that serve 404.html for unknown paths (GitHub Pages) still
  // boot the app, which then renders the right route client-side.
  writeFileSync(resolve(DIST, '404.html'), template);

  writeFileSync(resolve(DIST, 'sitemap.xml'), sitemap(listings));

  // Netlify-style SPA fallback. Real files win over this rule, so the
  // prerendered listing pages are still served as themselves.
  writeFileSync(resolve(DIST, '_redirects'), '/*    /index.html   200\n');

  rmSync(TMP, { recursive: true, force: true });
  console.log(`Prerendered ${listings.length} listing pages + sitemap into dist/`);
}

main().catch((err) => {
  console.error('Prerender failed:', err);
  process.exit(1);
});
