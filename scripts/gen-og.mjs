/**
 * Builds a 1200x630 PNG share card for every listing.
 *
 * Facebook, Messenger and WhatsApp will not render an SVG in a link preview —
 * they need a raster image. This composites each listing's cover scene with a
 * branded band carrying the price, title and location, so a link pasted into a
 * Facebook group reads as an advert rather than a bare URL.
 *
 *   node scripts/gen-og.mjs        (run by `npm run build` before Vite)
 */
import { build } from 'esbuild';
import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import sharp from 'sharp';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = resolve(ROOT, 'public/og');
const TMP = resolve(ROOT, 'node_modules/.cache/sk-og');

const W = 1200, H = 630;
const BAND = 210; // height of the dark info band along the bottom

mkdirSync(OUT, { recursive: true });

/* ---- shared formatting (mirrors src/lib/format.ts) ------------------ */
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

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

/** Naive width estimate is enough to keep the headline on two lines. */
function truncate(text, maxChars) {
  return text.length <= maxChars ? text : `${text.slice(0, maxChars - 1).trimEnd()}…`;
}

const TYPE_LABEL = {
  house: 'House', flat: 'Flat', room: 'Room', shutter: 'Shutter', office: 'Office', land: 'Land',
};

function overlay(l) {
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
  const badgeW = badge.length * 11 + 28;

  return Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
  <defs>
    <linearGradient id="scrim" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#0A1729" stop-opacity="0"/>
      <stop offset=".45" stop-color="#0A1729" stop-opacity=".72"/>
      <stop offset="1" stop-color="#0A1729" stop-opacity=".97"/>
    </linearGradient>
  </defs>

  <!-- The scene behind can be any brightness, so the band has to carry the
       contrast on its own rather than relying on the photo being dark. -->
  <rect y="${H - BAND - 170}" width="${W}" height="${BAND + 170}" fill="url(#scrim)"/>

  <!-- top-left status chips -->
  <g transform="translate(44,42)">
    <rect width="${badgeW}" height="38" rx="8" fill="${badgeFill}"/>
    <text x="${badgeW / 2}" y="25" text-anchor="middle" font-family="Helvetica,Arial,sans-serif"
          font-size="15" font-weight="bold" fill="#fff" letter-spacing="1.4">${badge}</text>
    ${l.verified ? `<g transform="translate(${badgeW + 12},0)">
      <rect width="118" height="38" rx="8" fill="#12795E"/>
      <text x="59" y="25" text-anchor="middle" font-family="Helvetica,Arial,sans-serif"
            font-size="15" font-weight="bold" fill="#fff" letter-spacing="1.2">VERIFIED</text>
    </g>` : ''}
  </g>

  <!-- brand mark, top right -->
  <g transform="translate(${W - 268},40)">
    <rect width="44" height="44" rx="11" fill="#C62244"/>
    <path d="M10 25 L22 13 L34 25" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M13.5 24.5 V34 H30.5 V24.5" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
    <text x="56" y="21" font-family="Georgia,serif" font-size="20" fill="#fff">SK Real Estate</text>
    <text x="56" y="39" font-family="Helvetica,Arial,sans-serif" font-size="11" fill="#E9A23B" letter-spacing="2.2">PVT. LTD.</text>
  </g>

  <!-- info band -->
  <g transform="translate(48,${H - BAND + 6})">
    <text x="0" y="46" font-family="Helvetica,Arial,sans-serif" font-size="46" font-weight="bold" fill="#ffffff">${esc(price)}</text>
    <text x="${price.length * 26 + 14}" y="46" font-family="Helvetica,Arial,sans-serif" font-size="22" fill="#C1D5E7">${unit}</text>

    <text x="0" y="96" font-family="Georgia,serif" font-size="31" fill="#ffffff">${esc(truncate(l.title, 52))}</text>

    <g transform="translate(0,124)">
      <path d="M9 26 C9 26 17 19 17 11 A8 8 0 0 0 1 11 C1 19 9 26 9 26 Z" fill="#E9A23B"/>
      <text x="30" y="24" font-family="Helvetica,Arial,sans-serif" font-size="22" fill="#E3EBF3">${esc(`${l.area}, ${l.city}`)}</text>
    </g>

    <text x="0" y="176" font-family="Helvetica,Arial,sans-serif" font-size="19" fill="#8EB3D2">${esc(tags)}</text>
  </g>

  <!-- marigold rule -->
  <rect y="${H - 6}" width="${W}" height="6" fill="#E9A23B"/>
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

  for (const l of listings) {
    const cover = l.photos[0]?.src ?? '/media/facade-1.svg';
    const svgPath = resolve(ROOT, 'public', cover.replace(/^\//, ''));

    // Rasterise the scene first; librsvg will not nest an SVG inside an SVG.
    const base = await sharp(readFileSync(svgPath), { density: 150 })
      .resize(W, H, { fit: 'cover', position: 'center' })
      .png()
      .toBuffer();

    await sharp(base)
      .composite([{ input: overlay(l), top: 0, left: 0 }])
      .png({ quality: 90, compressionLevel: 9 })
      .toFile(resolve(OUT, `${l.slug}.png`));
  }

  // Site-wide fallback for the home page and any listing without a card.
  await sharp(readFileSync(resolve(ROOT, 'public/media/og-default.svg')), { density: 150 })
    .resize(W, H, { fit: 'cover' })
    .png()
    .toFile(resolve(OUT, 'default.png'));

  rmSync(TMP, { recursive: true, force: true });
  writeFileSync(resolve(OUT, '.gitkeep'), '');
  console.log(`Wrote ${listings.length + 1} share cards to public/og/`);
}

main().catch((e) => { console.error('OG card generation failed:', e); process.exit(1); });
