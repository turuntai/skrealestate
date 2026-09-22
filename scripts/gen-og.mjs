/**
 * Builds a 1200x630 PNG share card for every listing.
 *
 * Facebook, Messenger and WhatsApp will not render an SVG in a link preview,
 * so these are raster. They are also brand-led rather than photo-led: listing
 * photos now come from a third-party random-image endpoint at render time, so
 * there is no local photo to composite and fetching one at build time would
 * make the build depend on a service we do not control. A branded card always
 * renders, and always carries the price and location — which is what makes
 * someone tap the link in a Facebook group.
 *
 *   node scripts/gen-og.mjs        (run by `npm run build`)
 */
import { build } from 'esbuild';
import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import sharp from 'sharp';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = resolve(ROOT, 'public/og');
const TMP = resolve(ROOT, 'node_modules/.cache/sk-og');
const LOGO = resolve(ROOT, 'public/brand/logo-full.png');

const W = 1200, H = 630;

mkdirSync(OUT, { recursive: true });

/* ---- formatting (mirrors src/lib/format.ts) ------------------------- */
const groupIndian = (n) => {
  const int = Math.abs(Math.round(n)).toString();
  const last3 = int.slice(-3);
  const rest = int.slice(0, -3);
  return rest ? `${rest.replace(/\B(?=(\d{2})+(?!\d))/g, ',')},${last3}` : last3;
};
const npr = (n) => `Rs ${groupIndian(n)}`;
const nprShort = (n) => {
  if (n >= 1_00_00_000) {
    const cr = n / 1_00_00_000;
    return `Rs ${cr % 1 === 0 ? cr : cr.toFixed(2).replace(/\.?0+$/, '')} Cr`;
  }
  if (n >= 1_00_000) {
    const l = n / 1_00_000;
    return `Rs ${l % 1 === 0 ? l : l.toFixed(2).replace(/\.?0+$/, '')} Lakh`;
  }
  return npr(n);
};

const esc = (s) => String(s).replace(/[&<>"']/g, (c) =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const truncate = (t, max) => (t.length <= max ? t : `${t.slice(0, max - 1).trimEnd()}…`);

const TYPE_LABEL = {
  house: 'House', flat: 'Flat', room: 'Room', shutter: 'Shutter', office: 'Office', land: 'Land',
};

function card(l) {
  const price = l.purpose === 'rent' ? npr(l.price) : nprShort(l.price);
  const unit = l.purpose === 'rent' ? '/month' : '';
  const tags = [
    l.bhk ? (l.bhk === 'rk' ? 'RK' : `${l.bhk} BHK`) : null,
    TYPE_LABEL[l.type] ?? l.type,
    l.builtUpArea ? `${l.builtUpArea} sq ft` : l.landArea,
    l.parking?.car ? `${l.parking.car} car parking` : null,
  ].filter(Boolean).join('   ·   ');

  const badge = l.purpose === 'rent' ? 'FOR RENT' : 'FOR SALE';
  const badgeFill = l.purpose === 'rent' ? '#245785' : '#12795E';
  const badgeW = badge.length * 11 + 30;

  return Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#10243F"/><stop offset="1" stop-color="#1D466C"/>
    </linearGradient>
    <radialGradient id="crimson" cx=".5" cy=".5" r=".5">
      <stop offset="0" stop-color="#C62244" stop-opacity=".55"/>
      <stop offset="1" stop-color="#C62244" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="gold" cx=".5" cy=".5" r=".5">
      <stop offset="0" stop-color="#E9A23B" stop-opacity=".4"/>
      <stop offset="1" stop-color="#E9A23B" stop-opacity="0"/>
    </radialGradient>
  </defs>

  <rect width="${W}" height="${H}" fill="url(#bg)"/>
  <circle cx="1040" cy="90" r="300" fill="url(#crimson)"/>
  <circle cx="120" cy="600" r="280" fill="url(#gold)"/>

  <!-- white tile for the logo: the mark's navy would vanish on this background -->
  <rect x="832" y="40" width="326" height="118" rx="18" fill="#FFFFFF"/>

  <g transform="translate(56,48)">
    <rect width="${badgeW}" height="40" rx="9" fill="${badgeFill}"/>
    <text x="${badgeW / 2}" y="26" text-anchor="middle" font-family="Helvetica,Arial,sans-serif"
          font-size="16" font-weight="bold" fill="#fff" letter-spacing="1.5">${badge}</text>
    ${l.verified ? `<g transform="translate(${badgeW + 14},0)">
      <rect width="128" height="40" rx="9" fill="#12795E"/>
      <text x="64" y="26" text-anchor="middle" font-family="Helvetica,Arial,sans-serif"
            font-size="16" font-weight="bold" fill="#fff" letter-spacing="1.3">VERIFIED</text>
    </g>` : ''}
  </g>

  <g transform="translate(56,300)">
    <text x="0" y="52" font-family="Helvetica,Arial,sans-serif" font-size="66" font-weight="bold" fill="#ffffff">${esc(price)}</text>
    <text x="${price.length * 37 + 16}" y="52" font-family="Helvetica,Arial,sans-serif" font-size="26" fill="#C1D5E7">${unit}</text>

    <text x="0" y="118" font-family="Georgia,serif" font-size="36" fill="#ffffff">${esc(truncate(l.title, 52))}</text>

    <g transform="translate(0,150)">
      <path d="M10 30 C10 30 19 22 19 13 A9 9 0 0 0 1 13 C1 22 10 30 10 30 Z" fill="#E9A23B"/>
      <text x="34" y="27" font-family="Helvetica,Arial,sans-serif" font-size="25" fill="#E3EBF3">${esc(`${l.area}, ${l.city}`)}</text>
    </g>

    <text x="0" y="222" font-family="Helvetica,Arial,sans-serif" font-size="21" fill="#8EB3D2">${esc(tags)}</text>
  </g>

  <text x="56" y="596" font-family="Helvetica,Arial,sans-serif" font-size="20" fill="#C1D5E7">skrealestate.com.np   ·   +977 985-1410559</text>
  <rect y="${H - 8}" width="${W}" height="8" fill="#E9A23B"/>
</svg>`);
}

async function loadSeed() {
  mkdirSync(TMP, { recursive: true });
  const out = resolve(TMP, 'seed.mjs');
  await build({
    entryPoints: [resolve(ROOT, 'src/data/seed.ts')],
    outfile: out, bundle: true, format: 'esm', platform: 'node', logLevel: 'silent',
  });
  const mod = await import(`${pathToFileURL(out).href}?t=${Date.now()}`);
  return mod.SEED_LISTINGS;
}

async function main() {
  const listings = await loadSeed();
  const logo = await sharp(readFileSync(LOGO)).resize({ width: 278, height: 86, fit: 'inside' }).toBuffer();
  const lm = await sharp(logo).metadata();
  const logoLayer = {
    input: logo,
    left: 832 + Math.round((326 - lm.width) / 2),
    top: 40 + Math.round((118 - lm.height) / 2),
  };

  for (const l of listings) {
    await sharp(card(l))
      .composite([logoLayer])
      .png({ compressionLevel: 9, palette: true })
      .toFile(resolve(OUT, `${l.slug}.png`));
  }

  // Site-wide fallback for the home page and any page without its own card.
  const home = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#10243F"/><stop offset="1" stop-color="#1D466C"/>
    </linearGradient>
    <radialGradient id="c" cx=".5" cy=".5" r=".5">
      <stop offset="0" stop-color="#C62244" stop-opacity=".5"/><stop offset="1" stop-color="#C62244" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="g" cx=".5" cy=".5" r=".5">
      <stop offset="0" stop-color="#E9A23B" stop-opacity=".38"/><stop offset="1" stop-color="#E9A23B" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#bg)"/>
  <circle cx="1060" cy="110" r="300" fill="url(#c)"/>
  <circle cx="140" cy="590" r="280" fill="url(#g)"/>
  <rect x="56" y="56" width="360" height="130" rx="20" fill="#FFFFFF"/>
  <text x="56" y="330" font-family="Georgia,serif" font-size="58" fill="#ffffff">Verified homes to rent</text>
  <text x="56" y="398" font-family="Georgia,serif" font-size="58" fill="#ffffff">and buy — no broker fee.</text>
  <text x="56" y="462" font-family="Helvetica,Arial,sans-serif" font-size="25" fill="#C1D5E7">Kathmandu · Lalitpur · Bhaktapur</text>
  <text x="56" y="596" font-family="Helvetica,Arial,sans-serif" font-size="20" fill="#C1D5E7">skrealestate.com.np   ·   +977 985-1410559</text>
  <rect y="${H - 8}" width="${W}" height="8" fill="#E9A23B"/>
</svg>`);
  const homeLogo = await sharp(readFileSync(LOGO)).resize({ width: 310, height: 98, fit: 'inside' }).toBuffer();
  const hm = await sharp(homeLogo).metadata();
  await sharp(home)
    .composite([{ input: homeLogo, left: 56 + Math.round((360 - hm.width) / 2), top: 56 + Math.round((130 - hm.height) / 2) }])
    .png({ compressionLevel: 9, palette: true })
    .toFile(resolve(OUT, 'default.png'));

  rmSync(TMP, { recursive: true, force: true });
  writeFileSync(resolve(OUT, '.gitkeep'), '');
  console.log(`Wrote ${listings.length + 1} share cards to public/og/`);
}

main().catch((e) => { console.error('OG card generation failed:', e); process.exit(1); });
