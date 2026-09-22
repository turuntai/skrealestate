/**
 * Derives the site's brand assets from the supplied logo artwork.
 *
 *   brand-src/sk-logo-original.jpg  ->  public/brand/*.png, public/favicon.png
 *
 * The original is a JPEG on a flat light-grey field. Web use needs a
 * transparent cut-out, and the header needs the building mark on its own
 * (the full lockup's wordmark is unreadable at 40px). This script does both,
 * so re-running it after an artwork change regenerates everything.
 *
 *   node scripts/gen-brand.mjs      (run by `npm run gen:media`)
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SRC = resolve(ROOT, 'brand-src/sk-logo-original.jpg');
const OUT = resolve(ROOT, 'public/brand');
mkdirSync(OUT, { recursive: true });

/* Content bands measured from the artwork: the building mark sits above the
   "SK Real Estate" wordmark with a clear gap between them. */
const MARK = { top: 185, bottom: 372 };
const FULL = { top: 185, bottom: 430 };

/** Soft alpha threshold — below T0 is background, above T1 is solid. */
const T0 = 10;
const T1 = 48;

/**
 * Keys out the flat background and un-premultiplies the edge pixels, so
 * anti-aliased edges don't keep a grey halo when placed on another colour.
 */
async function cutout(top, bottom) {
  const src = sharp(SRC).extract({ left: 0, top, width: 640, height: bottom - top });
  const { data, info } = await src.raw().toBuffer({ resolveWithObject: true });
  const { width: W, height: H, channels: C } = info;

  // Background colour is whatever dominates the border ring.
  const border = [];
  for (let x = 0; x < W; x++) {
    for (const y of [0, H - 1]) border.push((y * W + x) * C);
  }
  const bg = [0, 1, 2].map((k) => {
    const vals = border.map((i) => data[i + k]).sort((a, b) => a - b);
    return vals[Math.floor(vals.length / 2)];
  });

  const out = Buffer.alloc(W * H * 4);
  for (let p = 0; p < W * H; p++) {
    const i = p * C;
    const r = data[i], g = data[i + 1], b = data[i + 2];
    const dist = Math.max(Math.abs(r - bg[0]), Math.abs(g - bg[1]), Math.abs(b - bg[2]));
    const a = Math.min(1, Math.max(0, (dist - T0) / (T1 - T0)));
    const o = p * 4;
    if (a <= 0) { out[o] = out[o + 1] = out[o + 2] = out[o + 3] = 0; continue; }
    // unpremultiply against the background we just removed
    const un = (v, bgv) => Math.round(Math.min(255, Math.max(0, (v - bgv * (1 - a)) / a)));
    out[o] = un(r, bg[0]);
    out[o + 1] = un(g, bg[1]);
    out[o + 2] = un(b, bg[2]);
    out[o + 3] = Math.round(a * 255);
  }

  return sharp(out, { raw: { width: W, height: H, channels: 4 } })
    .trim({ threshold: 1 })
    .png();
}

async function main() {
  const mark = await cutout(MARK.top, MARK.bottom);
  const full = await cutout(FULL.top, FULL.bottom);

  await mark.clone().resize({ height: 512, fit: 'inside' }).toFile(resolve(OUT, 'logo-mark.png'));
  await full.clone().resize({ height: 512, fit: 'inside' }).toFile(resolve(OUT, 'logo-full.png'));

  // Favicon: the mark on a transparent square with a little breathing room.
  // Fit inside a 200x200 box — the mark is wider than it is tall, so a
  // height-only resize would overflow the 256px canvas.
  const markBuf = await mark.clone().resize({ width: 216, height: 200, fit: 'inside' }).toBuffer();
  const m = await sharp(markBuf).metadata();
  await sharp({
    create: { width: 256, height: 256, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } },
  })
    .composite([{ input: markBuf, left: Math.round((256 - m.width) / 2), top: Math.round((256 - m.height) / 2) }])
    .png()
    .toFile(resolve(ROOT, 'public/favicon.png'));

  const dims = await Promise.all(
    ['logo-mark.png', 'logo-full.png'].map(async (f) => {
      const d = await sharp(resolve(OUT, f)).metadata();
      return `${f} ${d.width}x${d.height}`;
    }),
  );
  writeFileSync(resolve(OUT, '.gitkeep'), '');
  console.log('Brand assets:', dims.join(', '));
}

main().catch((e) => { console.error('Brand asset generation failed:', e); process.exit(1); });
