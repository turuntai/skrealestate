/**
 * Generates the property imagery as flat SVG files under public/media/.
 *
 * These are hand-composed architectural scenes, not photographs — they exist so
 * the site is complete and works offline. Replace public/media/*.svg with real
 * photography before launch; nothing else needs to change, the paths stay put.
 *
 *   node scripts/gen-media.mjs
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const OUT = resolve(dirname(fileURLToPath(import.meta.url)), '../public/media');
mkdirSync(OUT, { recursive: true });

const W = 1200, H = 800;

/* ---- palettes ------------------------------------------------------- */
// Each palette is a time of day. Light always falls from the upper left.
const SKIES = {
  morning: ['#CFE6F5', '#EAF4FA', '#FDF6EC'],
  noon:    ['#A8D3EE', '#D6EAF7', '#F4FAFD'],
  golden:  ['#F7C88B', '#FBE0B4', '#FDF2DC'],
  dusk:    ['#8FA9CA', '#C3B9CE', '#F0C9B4'],
};

const WALLS = [
  { body: '#E8DED2', trim: '#CBBCA9', shade: '#D2C4B4' }, // plaster cream
  { body: '#B5654A', trim: '#8E4A34', shade: '#9D5540' }, // Newari brick
  { body: '#DCE3E6', trim: '#B9C4C9', shade: '#C7D0D4' }, // grey render
  { body: '#E5D3B8', trim: '#C4AE8D', shade: '#D4C0A2' }, // sand
  { body: '#CBD9D2', trim: '#A6BAB1', shade: '#B6C7BF' }, // pale green
];

// Cabinet/joinery colours are deliberately muted — a saturated brand red on
// 4 m of kitchen units reads as a warning, not as a kitchen.
const CABINETS = ['#38505F', '#55654A', '#7A5B3C', '#46545E', '#6B4F5B'];

const INTERIORS = [
  { wall: '#F2EDE6', floor: '#B98C5E', accent: '#12795E', fabric: '#3E5E7E' },
  { wall: '#EDF1F3', floor: '#A8763F', accent: '#C62244', fabric: '#6B7E92' },
  { wall: '#F5EFE4', floor: '#8D6440', accent: '#E9A23B', fabric: '#46605A' },
  { wall: '#EAE6F0', floor: '#C09A6E', accent: '#245785', fabric: '#8A6A7C' },
];

/* ---- helpers -------------------------------------------------------- */
const rnd = (seed) => {
  // Deterministic PRNG so re-running the script never churns the git diff.
  let s = seed >>> 0 || 1;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
};

const hash = (str) => {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
};

const pick = (arr, r) => arr[Math.floor(r() * arr.length) % arr.length];

const wrap = (inner, defs = '') => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img">
<defs>${defs}</defs>
${inner}
</svg>`;

const skyDefs = (id, sky) => `<linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1">
<stop offset="0" stop-color="${sky[0]}"/><stop offset=".62" stop-color="${sky[1]}"/><stop offset="1" stop-color="${sky[2]}"/>
</linearGradient>`;

const grain = (id) => `<filter id="${id}" x="0" y="0" width="100%" height="100%">
<feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="3" stitchTiles="stitch"/>
<feColorMatrix type="saturate" values="0"/>
</filter>`;

/** A soft paper grain over the whole frame stops the flat fills looking plastic. */
const grainLayer = (id) => `<rect width="${W}" height="${H}" filter="url(#${id})" opacity=".05" style="mix-blend-mode:multiply"/>`;

/** Himalayan skyline — the horizon line that says "Kathmandu valley". */
function mountains(y, r) {
  const far = [];
  let x = -60;
  while (x < W + 60) {
    const w = 150 + r() * 220;
    const h = 70 + r() * 130;
    far.push(`${x},${y} ${x + w / 2},${y - h} ${x + w},${y}`);
    x += w * 0.68;
  }
  return `<g>
    ${far.map((p, i) => `<polygon points="${p}" fill="${i % 2 ? '#9FB4C9' : '#8FA6BE'}" opacity=".55"/>`).join('')}
    ${far.filter((_, i) => i % 2 === 0).map((p) => {
      const [, apex] = p.split(' ');
      const [ax, ay] = apex.split(',').map(Number);
      return `<polygon points="${ax - 34},${ay + 46} ${ax},${ay} ${ax + 34},${ay + 46} ${ax + 14},${ay + 36} ${ax - 6},${ay + 52} ${ax - 20},${ay + 34}" fill="#F7FAFC" opacity=".85"/>`;
    }).join('')}
  </g>`;
}

/** Prayer flags — strung across rooftops everywhere in the valley. */
function prayerFlags(x1, y1, x2, y2, n = 12) {
  const cols = ['#2E6FBE', '#F2F2F2', '#C62244', '#12795E', '#E9A23B'];
  const sag = 34;
  const pts = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const x = x1 + (x2 - x1) * t;
    const y = y1 + (y2 - y1) * t + Math.sin(Math.PI * t) * sag;
    pts.push([x, y]);
  }
  const line = pts.map((p) => p.join(',')).join(' ');
  const flags = pts.slice(0, -1).map(([x, y], i) => {
    const [nx, ny] = pts[i + 1];
    const w = nx - x;
    return `<path d="M${x} ${y} L${x + w} ${ny} L${x + w - 2} ${ny + 30} L${x + 2} ${y + 30} Z" fill="${cols[i % 5]}" opacity=".92"/>`;
  }).join('');
  return `<g><polyline points="${line}" fill="none" stroke="#6B5A4A" stroke-width="2"/>${flags}</g>`;
}

function windowGrid(x, y, w, h, cols, rows, frame, glass) {
  const cw = w / cols, ch = h / rows;
  let out = `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${frame}" rx="3"/>`;
  for (let c = 0; c < cols; c++) {
    for (let rr = 0; rr < rows; rr++) {
      const gx = x + c * cw + 5, gy = y + rr * ch + 5;
      out += `<rect x="${gx}" y="${gy}" width="${cw - 10}" height="${ch - 10}" fill="${glass}"/>`;
      out += `<path d="M${gx} ${gy + ch - 10} L${gx + cw - 10} ${gy} L${gx + cw - 10} ${gy + 14} L${gx + 14} ${gy + ch - 10} Z" fill="#FFFFFF" opacity=".28"/>`;
    }
  }
  return out;
}

function railing(x, y, w, h, col) {
  let bars = '';
  for (let i = x + 10; i < x + w - 4; i += 16) bars += `<rect x="${i}" y="${y}" width="3" height="${h}" fill="${col}" opacity=".85"/>`;
  return `<g>${bars}<rect x="${x}" y="${y - 5}" width="${w}" height="6" fill="${col}" rx="3"/><rect x="${x}" y="${y + h - 4}" width="${w}" height="5" fill="${col}" rx="2"/></g>`;
}

function tree(x, groundY, scale, r) {
  const s = scale;
  const canopy = ['#3E7A4E', '#4C8C58', '#356B45'];
  let blobs = '';
  for (let i = 0; i < 7; i++) {
    const cx = x + (r() - 0.5) * 90 * s;
    const cy = groundY - (120 + r() * 80) * s;
    const rad = (34 + r() * 26) * s;
    blobs += `<circle cx="${cx}" cy="${cy}" r="${rad}" fill="${canopy[i % 3]}" opacity=".95"/>`;
  }
  return `<g><rect x="${x - 6 * s}" y="${groundY - 130 * s}" width="${12 * s}" height="${130 * s}" fill="#6B5240" rx="3"/>${blobs}</g>`;
}

function potPlant(x, baseY, s, col = '#3E7A4E') {
  let leaves = '';
  for (let i = 0; i < 6; i++) {
    const a = -110 + i * 26;
    const rad = (a * Math.PI) / 180;
    leaves += `<ellipse cx="${x + Math.cos(rad) * 26 * s}" cy="${baseY - 46 * s + Math.sin(rad) * 24 * s}" rx="${20 * s}" ry="${9 * s}" fill="${col}" transform="rotate(${a} ${x} ${baseY - 40 * s})" opacity=".92"/>`;
  }
  return `<g>${leaves}<path d="M${x - 16 * s} ${baseY - 26 * s} L${x + 16 * s} ${baseY - 26 * s} L${x + 11 * s} ${baseY} L${x - 11 * s} ${baseY} Z" fill="#B0603C"/></g>`;
}

/* ================= SCENES ============================================ */

function facade(seed) {
  const r = rnd(seed);
  const sky = pick(Object.values(SKIES), r);
  const wall = pick(WALLS, r);
  const floors = 3 + Math.floor(r() * 2);
  const groundY = 690;
  const bodyW = 620, bodyX = 300;
  const floorH = 130;
  const bodyY = groundY - floors * floorH;

  let storeys = '';
  for (let f = 0; f < floors; f++) {
    const y = bodyY + f * floorH;
    storeys += `<rect x="${bodyX}" y="${y}" width="${bodyW}" height="${floorH}" fill="${f % 2 ? wall.body : wall.shade}"/>`;
    storeys += `<rect x="${bodyX}" y="${y + floorH - 6}" width="${bodyW}" height="6" fill="${wall.trim}" opacity=".7"/>`;
    // windows + a balcony on every upper floor
    storeys += windowGrid(bodyX + 52, y + 26, 130, 82, 2, 2, wall.trim, '#3C5A73');
    storeys += windowGrid(bodyX + 438, y + 26, 130, 82, 2, 2, wall.trim, '#3C5A73');
    if (f < floors - 1) {
      storeys += `<rect x="${bodyX + 216}" y="${y + 18}" width="${188}" height="${96}" fill="#2C4459"/>`;
      storeys += `<rect x="${bodyX + 200}" y="${y + floorH - 46}" width="${220}" height="10" fill="${wall.trim}"/>`;
      storeys += railing(bodyX + 200, y + floorH - 82, 220, 36, '#6E7C85');
    }
  }

  return wrap(`
    <rect width="${W}" height="${H}" fill="url(#sky${seed})"/>
    <g opacity=".45">${mountains(groundY - 150, r)}</g>
    <!-- neighbouring blocks, solid so they read as buildings rather than haze -->
    <rect x="40" y="${groundY - 320}" width="270" height="320" fill="#C3B8AA"/>
    <rect x="40" y="${groundY - 320}" width="270" height="12" fill="#AB9E8E"/>
    ${windowGrid(90, groundY - 264, 170, 96, 3, 2, '#AB9E8E', '#4D6377')}
    <rect x="890" y="${groundY - 360}" width="280" height="360" fill="#CDC3B6"/>
    <rect x="890" y="${groundY - 360}" width="280" height="12" fill="#B4A899"/>
    ${windowGrid(930, groundY - 300, 200, 96, 3, 2, '#B4A899', '#4D6377')}
    <rect x="0" y="${groundY}" width="${W}" height="${H - groundY}" fill="#9A9186"/>
    <rect x="0" y="${groundY}" width="${W}" height="14" fill="#7E766C"/>
    ${tree(150, groundY, 1.05, r)}
    ${tree(1075, groundY, 0.85, r)}
    <!-- main body -->
    <rect x="${bodyX - 12}" y="${bodyY - 26}" width="${bodyW + 24}" height="26" fill="${wall.trim}" rx="3"/>
    ${storeys}
    ${railing(bodyX - 6, bodyY - 62, bodyW + 12, 36, '#7A8790')}
    ${prayerFlags(bodyX + 20, bodyY - 70, bodyX + bodyW - 20, bodyY - 30, 10)}
    <!-- ground floor: gate + entrance -->
    <rect x="${bodyX + 250}" y="${groundY - 118}" width="120" height="118" fill="#5A3B2B" rx="4"/>
    <rect x="${bodyX + 258}" y="${groundY - 110}" width="50" height="104" fill="#6B4833"/>
    <rect x="${bodyX + 312}" y="${groundY - 110}" width="50" height="104" fill="#6B4833"/>
    <circle cx="${bodyX + 305}" cy="${groundY - 58}" r="4" fill="#D9B24C"/>
    <!-- boundary wall + gate -->
    <rect x="60" y="${groundY - 92}" width="${bodyX - 70}" height="92" fill="${wall.trim}"/>
    <rect x="${bodyX + bodyW + 10}" y="${groundY - 92}" width="${W - bodyX - bodyW - 70}" height="92" fill="${wall.trim}"/>
    ${potPlant(bodyX + 190, groundY - 2, 1)}
    ${potPlant(bodyX + 440, groundY - 2, 0.85)}
    <rect width="${W}" height="${H}" fill="url(#vig${seed})"/>
    ${grainLayer('gr' + seed)}
  `, skyDefs('sky' + seed, sky) + grain('gr' + seed) + `
    <radialGradient id="vig${seed}" cx=".5" cy=".42" r=".78">
      <stop offset=".55" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#1B2733" stop-opacity=".22"/>
    </radialGradient>`);
}

function living(seed) {
  const r = rnd(seed);
  const p = pick(INTERIORS, r);
  const floorY = 600;
  return wrap(`
    <rect width="${W}" height="${H}" fill="${p.wall}"/>
    <rect x="0" y="${floorY}" width="${W}" height="${H - floorY}" fill="${p.floor}"/>
    <rect x="0" y="${floorY}" width="${W}" height="10" fill="#00000022"/>
    ${Array.from({ length: 14 }, (_, i) => `<rect x="${i * 92 - 30}" y="${floorY}" width="3" height="${H - floorY}" fill="#00000018"/>`).join('')}
    <!-- daylight from the window, left -->
    <rect x="70" y="120" width="300" height="400" fill="#37536B" rx="4"/>
    <rect x="82" y="132" width="128" height="376" fill="#BBD9EA"/>
    <rect x="230" y="132" width="128" height="376" fill="#CBE3F1"/>
    <rect x="60" y="108" width="320" height="18" fill="${p.accent}" opacity=".9" rx="3"/>
    <path d="M370 130 L640 ${floorY} L300 ${floorY} Z" fill="#FFFFFF" opacity=".16"/>
    <!-- rug -->
    <ellipse cx="640" cy="${floorY + 88}" rx="360" ry="84" fill="${p.accent}" opacity=".18"/>
    <!-- sofa -->
    <rect x="430" y="400" width="430" height="120" rx="18" fill="${p.fabric}"/>
    <rect x="446" y="376" width="180" height="96" rx="14" fill="${p.fabric}" opacity=".85"/>
    <rect x="648" y="376" width="180" height="96" rx="14" fill="${p.fabric}" opacity=".85"/>
    <rect x="412" y="392" width="40" height="128" rx="14" fill="${p.fabric}" opacity=".7"/>
    <rect x="838" y="392" width="40" height="128" rx="14" fill="${p.fabric}" opacity=".7"/>
    <rect x="470" y="518" width="20" height="46" fill="#5B4028"/><rect x="790" y="518" width="20" height="46" fill="#5B4028"/>
    <rect x="474" y="392" width="76" height="62" rx="10" fill="${p.accent}" opacity=".9"/>
    <rect x="746" y="392" width="76" height="62" rx="10" fill="#FFFFFF" opacity=".55"/>
    <ellipse cx="645" cy="560" rx="230" ry="26" fill="#000" opacity=".12"/>
    <!-- coffee table -->
    <rect x="530" y="566" width="240" height="14" rx="6" fill="#7A542F"/>
    <rect x="552" y="580" width="12" height="46" fill="#6A4828"/><rect x="738" y="580" width="12" height="46" fill="#6A4828"/>
    <rect x="600" y="548" width="90" height="18" rx="4" fill="#FFFFFF" opacity=".8"/>
    <!-- wall art -->
    <rect x="900" y="180" width="180" height="230" rx="4" fill="#FFFFFF"/>
    <rect x="916" y="196" width="148" height="198" fill="${p.accent}" opacity=".35"/>
    <polygon points="916,394 990,270 1064,394" fill="${p.accent}" opacity=".7"/>
    <circle cx="1030" cy="236" r="18" fill="#E9A23B"/>
    <!-- plant + lamp -->
    ${potPlant(1090, floorY + 40, 1.5)}
    <rect x="392" y="300" width="6" height="266" fill="#4A4A4A"/>
    <path d="M356 300 L434 300 L420 254 L370 254 Z" fill="#F3E3C4"/>
    <rect width="${W}" height="${H}" fill="url(#vg${seed})"/>
    ${grainLayer('gr' + seed)}
  `, grain('gr' + seed) + `<radialGradient id="vg${seed}" cx=".3" cy=".35" r=".85">
      <stop offset=".5" stop-color="#FFF" stop-opacity=".07"/><stop offset="1" stop-color="#20242B" stop-opacity=".2"/></radialGradient>`);
}

function bedroom(seed) {
  const r = rnd(seed);
  const p = pick(INTERIORS, r);
  const floorY = 596;
  return wrap(`
    <rect width="${W}" height="${H}" fill="${p.wall}"/>
    <rect x="0" y="0" width="${W}" height="${floorY}" fill="${p.wall}"/>
    <rect x="300" y="0" width="600" height="${floorY}" fill="${p.accent}" opacity=".1"/>
    <rect x="0" y="${floorY}" width="${W}" height="${H - floorY}" fill="${p.floor}"/>
    ${Array.from({ length: 14 }, (_, i) => `<rect x="${i * 92 - 40}" y="${floorY}" width="3" height="${H - floorY}" fill="#00000018"/>`).join('')}
    <!-- window -->
    <rect x="880" y="140" width="260" height="330" rx="4" fill="#37536B"/>
    <rect x="892" y="152" width="112" height="306" fill="#C3DEEE"/>
    <rect x="1016" y="152" width="112" height="306" fill="#D2E7F3"/>
    <rect x="846" y="128" width="40" height="360" fill="#E8E2D8" opacity=".9"/>
    <rect x="1134" y="128" width="40" height="360" fill="#E8E2D8" opacity=".9"/>
    <!-- headboard + bed -->
    <rect x="300" y="286" width="420" height="200" rx="14" fill="${p.fabric}"/>
    ${Array.from({ length: 4 }, (_, i) => `<rect x="${314 + i * 104}" y="300" width="92" height="172" rx="10" fill="#FFFFFF" opacity=".08"/>`).join('')}
    <ellipse cx="530" cy="612" rx="310" ry="30" fill="#000" opacity=".13"/>
    <rect x="286" y="470" width="450" height="130" rx="10" fill="#EFEAE1"/>
    <rect x="286" y="470" width="450" height="34" rx="10" fill="#FFFFFF"/>
    <rect x="286" y="546" width="450" height="54" fill="${p.accent}" opacity=".55"/>
    <rect x="318" y="430" width="150" height="58" rx="14" fill="#FFFFFF"/>
    <rect x="552" y="430" width="150" height="58" rx="14" fill="#FFFFFF"/>
    <rect x="296" y="596" width="16" height="42" fill="#6A4828"/><rect x="712" y="596" width="16" height="42" fill="#6A4828"/>
    <!-- bedside table + lamp -->
    <rect x="766" y="470" width="110" height="126" rx="6" fill="#8A6239"/>
    <rect x="778" y="500" width="86" height="30" rx="4" fill="#FFFFFF" opacity=".6"/>
    <rect x="816" y="414" width="8" height="56" fill="#4A4A4A"/>
    <path d="M790 414 L850 414 L840 374 L800 374 Z" fill="#F3E3C4"/>
    <circle cx="820" cy="392" r="42" fill="#FFF3D0" opacity=".35"/>
    ${potPlant(180, floorY + 56, 1.35)}
    <rect x="130" y="200" width="120" height="160" rx="4" fill="#FFF"/>
    <rect x="142" y="212" width="96" height="136" fill="${p.accent}" opacity=".4"/>
    <rect width="${W}" height="${H}" fill="url(#vg${seed})"/>
    ${grainLayer('gr' + seed)}
  `, grain('gr' + seed) + `<radialGradient id="vg${seed}" cx=".62" cy=".38" r=".8">
      <stop offset=".5" stop-color="#FFF" stop-opacity=".08"/><stop offset="1" stop-color="#20242B" stop-opacity=".2"/></radialGradient>`);
}

function kitchen(seed) {
  const r = rnd(seed);
  const p = pick(INTERIORS, r);
  const floorY = 620, counterY = 430;
  const cab = pick(CABINETS, r);
  return wrap(`
    <rect width="${W}" height="${H}" fill="${p.wall}"/>
    <rect x="0" y="${floorY}" width="${W}" height="${H - floorY}" fill="#8E8E90"/>
    ${Array.from({ length: 18 }, (_, i) => `<rect x="${i * 70 - 20}" y="${floorY}" width="2" height="${H - floorY}" fill="#00000016"/>`).join('')}
    <!-- tiled backsplash -->
    <rect x="0" y="${counterY - 150}" width="${W}" height="150" fill="#DCE7EA"/>
    ${Array.from({ length: 20 }, (_, i) => Array.from({ length: 3 }, (_, j) =>
      `<rect x="${i * 62 + (j % 2 ? 31 : 0) - 30}" y="${counterY - 150 + j * 50}" width="58" height="46" fill="#EDF4F6" stroke="#C6D6DB" stroke-width="2"/>`).join('')).join('')}
    <!-- upper cabinets -->
    <rect x="60" y="120" width="480" height="160" rx="6" fill="${cab}"/>
    ${Array.from({ length: 4 }, (_, i) => `<rect x="${72 + i * 118}" y="132" width="106" height="136" rx="4" fill="#FFFFFF" opacity=".14"/>`).join('')}
    ${Array.from({ length: 4 }, (_, i) => `<rect x="${112 + i * 118}" y="252" width="30" height="6" rx="3" fill="#E4E4E4"/>`).join('')}
    <rect x="740" y="120" width="400" height="160" rx="6" fill="${cab}"/>
    ${Array.from({ length: 3 }, (_, i) => `<rect x="${754 + i * 131}" y="132" width="118" height="136" rx="4" fill="#FFFFFF" opacity=".14"/>`).join('')}
    <!-- counter -->
    <rect x="0" y="${counterY}" width="${W}" height="26" fill="#3B3F45"/>
    <rect x="0" y="${counterY + 4}" width="${W}" height="6" fill="#FFFFFF" opacity=".18"/>
    <rect x="0" y="${counterY + 26}" width="${W}" height="${floorY - counterY - 26}" fill="${cab}" opacity=".92"/>
    ${Array.from({ length: 8 }, (_, i) => `<rect x="${i * 150 + 12}" y="${counterY + 40}" width="126" height="132" rx="5" fill="#FFFFFF" opacity=".12"/>`).join('')}
    ${Array.from({ length: 8 }, (_, i) => `<rect x="${i * 150 + 58}" y="${counterY + 56}" width="34" height="6" rx="3" fill="#E4E4E4"/>`).join('')}
    <!-- sink + tap -->
    <rect x="300" y="${counterY + 2}" width="180" height="22" rx="4" fill="#9AA3A9"/>
    <path d="M372 ${counterY} v-64 q0-18 18-18 h34" stroke="#8C959B" stroke-width="9" fill="none" stroke-linecap="round"/>
    <!-- hob -->
    <rect x="700" y="${counterY + 2}" width="200" height="22" rx="4" fill="#23262A"/>
    ${[740, 800, 860].map((x) => `<circle cx="${x}" cy="${counterY + 13}" r="14" fill="#3A3E44"/>`).join('')}
    <!-- window over sink -->
    <rect x="290" y="150" width="200" height="130" rx="4" fill="#37536B"/>
    <rect x="302" y="162" width="82" height="106" fill="#C7E0EF"/>
    <rect x="396" y="162" width="82" height="106" fill="#D6EAF5"/>
    ${potPlant(1080, floorY + 40, 1.2)}
    <rect x="960" y="${counterY - 70}" width="70" height="70" rx="6" fill="#B8C0C6"/>
    <rect width="${W}" height="${H}" fill="url(#vg${seed})"/>
    ${grainLayer('gr' + seed)}
  `, grain('gr' + seed) + `<radialGradient id="vg${seed}" cx=".35" cy=".3" r=".85">
      <stop offset=".5" stop-color="#FFF" stop-opacity=".08"/><stop offset="1" stop-color="#20242B" stop-opacity=".2"/></radialGradient>`);
}

function bath(seed) {
  const r = rnd(seed);
  const tile = pick(['#DCE7EA', '#E7E1D6', '#DEE4EC', '#DDE8E1'], r);
  const accent = pick(['#12795E', '#245785', '#C62244', '#C77810'], r);
  const floorY = 640;
  return wrap(`
    <rect width="${W}" height="${H}" fill="${tile}"/>
    ${Array.from({ length: 22 }, (_, i) => Array.from({ length: 9 }, (_, j) =>
      `<rect x="${i * 58 + (j % 2 ? 29 : 0) - 30}" y="${j * 72}" width="54" height="68" fill="#FFFFFF" opacity="${j % 2 ? '.28' : '.16'}" stroke="#00000012" stroke-width="2"/>`).join('')).join('')}
    <rect x="0" y="${floorY}" width="${W}" height="${H - floorY}" fill="#A9AFB4"/>
    ${Array.from({ length: 12 }, (_, i) => `<rect x="${i * 104 - 30}" y="${floorY}" width="3" height="${H - floorY}" fill="#00000018"/>`).join('')}
    <!-- accent column behind the shower -->
    <rect x="760" y="0" width="360" height="${floorY}" fill="${accent}" opacity=".16"/>
    <!-- vanity + mirror -->
    <rect x="140" y="440" width="330" height="140" rx="8" fill="#7A5B3C"/>
    <rect x="128" y="424" width="354" height="26" rx="6" fill="#EDEFF1"/>
    <ellipse cx="305" cy="424" rx="86" ry="26" fill="#FFFFFF"/>
    <ellipse cx="305" cy="424" rx="66" ry="17" fill="#DFE6EA"/>
    <path d="M305 410 v-52 q0-14 14-14 h26" stroke="#9AA3A9" stroke-width="9" fill="none" stroke-linecap="round"/>
    <rect x="200" y="140" width="210" height="180" rx="10" fill="#C9D8E0" stroke="#FFFFFF" stroke-width="8"/>
    <path d="M208 316 L404 148 L404 190 L250 316 Z" fill="#FFFFFF" opacity=".4"/>
    <rect x="150" y="580" width="310" height="60" fill="#6A4E33"/>
    <!-- shower -->
    <rect x="820" y="130" width="14" height="150" fill="#9AA3A9"/>
    <rect x="770" y="118" width="116" height="16" rx="8" fill="#9AA3A9"/>
    ${Array.from({ length: 16 }, (_, i) => `<rect x="${778 + i * 7}" y="136" width="2" height="${160 + (i % 5) * 40}" fill="#BBD9EA" opacity=".55"/>`).join('')}
    <rect x="700" y="${floorY - 10}" width="300" height="14" rx="6" fill="#C2C9CE"/>
    <!-- glass partition -->
    <rect x="690" y="180" width="14" height="${floorY - 180}" fill="#AEB7BD"/>
    <rect x="704" y="190" width="6" height="${floorY - 200}" fill="#DFF0F7" opacity=".55"/>
    <!-- geyser: a headline feature in Kathmandu -->
    <rect x="1000" y="150" width="130" height="130" rx="65" fill="#E9ECEE" stroke="#C6CDD2" stroke-width="6"/>
    <circle cx="1065" cy="215" r="16" fill="${accent}" opacity=".8"/>
    <!-- towels -->
    <rect x="520" y="330" width="120" height="14" rx="7" fill="#9AA3A9"/>
    <rect x="536" y="340" width="40" height="150" rx="6" fill="#FFFFFF" opacity=".92"/>
    <rect x="586" y="340" width="40" height="120" rx="6" fill="${accent}" opacity=".55"/>
    ${potPlant(1110, floorY + 34, 0.95)}
    <rect width="${W}" height="${H}" fill="url(#vg${seed})"/>
    ${grainLayer('gr' + seed)}
  `, grain('gr' + seed) + `<radialGradient id="vg${seed}" cx=".4" cy=".35" r=".85">
      <stop offset=".5" stop-color="#FFF" stop-opacity=".1"/><stop offset="1" stop-color="#20242B" stop-opacity=".18"/></radialGradient>`);
}

function terrace(seed) {
  const r = rnd(seed);
  const sky = pick([SKIES.golden, SKIES.morning, SKIES.dusk], r);
  const deckY = 560;
  return wrap(`
    <rect width="${W}" height="${H}" fill="url(#sky${seed})"/>
    <circle cx="960" cy="200" r="70" fill="#FFF0C9" opacity=".85"/>
    <circle cx="960" cy="200" r="130" fill="#FFF0C9" opacity=".22"/>
    ${mountains(deckY - 150, r)}
    <!-- the city below -->
    ${Array.from({ length: 26 }, (_, i) => {
      const x = i * 52 - 20, h = 40 + ((i * 37) % 90);
      return `<rect x="${x}" y="${deckY - h - 40}" width="44" height="${h + 40}" fill="#8E9AA8" opacity="${0.35 + (i % 3) * 0.12}"/>`;
    }).join('')}
    <!-- deck -->
    <rect x="0" y="${deckY}" width="${W}" height="${H - deckY}" fill="#A8845A"/>
    ${Array.from({ length: 10 }, (_, i) => `<rect x="0" y="${deckY + i * 26}" width="${W}" height="3" fill="#00000020"/>`).join('')}
    <!-- parapet -->
    <rect x="0" y="${deckY - 120}" width="${W}" height="22" fill="#D9CFC2"/>
    <rect x="0" y="${deckY - 98}" width="${W}" height="98" fill="#C9BEAF"/>
    ${railing(0, deckY - 190, W, 70, '#8C7C6C')}
    ${prayerFlags(40, 150, 1160, 230, 14)}
    <!-- seating -->
    <rect x="180" y="${deckY + 20}" width="260" height="20" rx="8" fill="#7A542F"/>
    <rect x="192" y="${deckY + 40}" width="16" height="60" fill="#6A4828"/>
    <rect x="412" y="${deckY + 40}" width="16" height="60" fill="#6A4828"/>
    <rect x="180" y="${deckY - 50}" width="260" height="72" rx="10" fill="#C0553E" opacity=".9"/>
    <ellipse cx="640" cy="${deckY + 150}" rx="200" ry="40" fill="#C88A3C" opacity=".2"/>
    <rect x="560" y="${deckY + 60}" width="160" height="16" rx="8" fill="#7A542F"/>
    <rect x="632" y="${deckY + 76}" width="16" height="64" fill="#6A4828"/>
    ${potPlant(880, deckY + 120, 1.6, '#4C8C58')}
    ${potPlant(1040, deckY + 90, 1.2, '#3E7A4E')}
    ${potPlant(96, deckY + 100, 1.3, '#4C8C58')}
    <!-- water tank: no Kathmandu roof is complete without one -->
    <rect x="1020" y="${deckY - 300}" width="120" height="110" rx="10" fill="#2E6FBE" opacity=".85"/>
    <rect x="1010" y="${deckY - 306}" width="140" height="14" rx="7" fill="#245785"/>
    ${Array.from({ length: 4 }, (_, i) => `<rect x="${1026 + i * 30}" y="${deckY - 190}" width="10" height="${70}" fill="#6E7C85"/>`).join('')}
    <rect width="${W}" height="${H}" fill="url(#vig${seed})"/>
    ${grainLayer('gr' + seed)}
  `, skyDefs('sky' + seed, sky) + grain('gr' + seed) + `
    <radialGradient id="vig${seed}" cx=".5" cy=".4" r=".8">
      <stop offset=".55" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#1B2733" stop-opacity=".2"/></radialGradient>`);
}

function street(seed) {
  const r = rnd(seed);
  const sky = pick(Object.values(SKIES), r);
  const horizon = 430;
  const wall = pick(WALLS, r);
  return wrap(`
    <rect width="${W}" height="${H}" fill="url(#sky${seed})"/>
    ${mountains(horizon - 40, r)}
    <!-- buildings receding along the lane -->
    ${[0, 1, 2, 3].map((i) => {
      const x = i * 150, h = 300 - i * 46;
      return `<rect x="${x}" y="${horizon - h}" width="${150}" height="${h + 80}" fill="${i % 2 ? wall.body : wall.shade}" opacity="${1 - i * 0.12}"/>
              ${windowGrid(x + 30, horizon - h + 40, 84, 60, 2, 2, wall.trim, '#3C5A73')}`;
    }).join('')}
    ${[0, 1, 2, 3].map((i) => {
      const x = W - 150 - i * 150, h = 300 - i * 46;
      return `<rect x="${x}" y="${horizon - h}" width="150" height="${h + 80}" fill="${i % 2 ? wall.shade : wall.body}" opacity="${1 - i * 0.12}"/>
              ${windowGrid(x + 36, horizon - h + 40, 84, 60, 2, 2, wall.trim, '#3C5A73')}`;
    }).join('')}
    <!-- blacktop -->
    <path d="M0 ${H} L470 ${horizon + 40} L730 ${horizon + 40} L${W} ${H} Z" fill="#4A4E52"/>
    <path d="M0 ${H} L470 ${horizon + 40} L500 ${horizon + 40} L120 ${H} Z" fill="#5A5E62" opacity=".5"/>
    ${Array.from({ length: 6 }, (_, i) => {
      const t = i / 6, y = H - (H - horizon - 40) * t;
      const w = 26 - t * 20;
      return `<rect x="${600 - w / 2}" y="${y - 40 + t * 30}" width="${w}" height="${40 - t * 30}" fill="#E8E2D2" opacity=".75"/>`;
    }).join('')}
    <!-- footpath -->
    <path d="M0 ${H} L470 ${horizon + 40} L470 ${horizon + 24} L0 ${H - 60} Z" fill="#9A9186"/>
    <path d="M${W} ${H} L730 ${horizon + 40} L730 ${horizon + 24} L${W} ${H - 60} Z" fill="#9A9186"/>
    <!-- the gate you actually arrive at -->
    <rect x="120" y="${horizon - 60}" width="230" height="190" fill="#5C6B73"/>
    ${railing(126, horizon - 54, 218, 180, '#8FA0A9')}
    <rect x="112" y="${horizon - 80}" width="246" height="26" rx="4" fill="${wall.trim}"/>
    <rect x="186" y="${horizon - 74}" width="98" height="14" rx="3" fill="#C62244"/>
    <rect x="96" y="${horizon - 96}" width="32" height="230" fill="${wall.trim}"/>
    <rect x="344" y="${horizon - 96}" width="32" height="230" fill="${wall.trim}"/>
    ${tree(900, horizon + 60, 0.9, r)}
    <!-- utility pole, the honest Kathmandu detail -->
    <rect x="1010" y="${horizon - 200}" width="12" height="330" fill="#7A6A58"/>
    <rect x="964" y="${horizon - 190}" width="106" height="8" fill="#7A6A58"/>
    <path d="M0 ${horizon - 176} Q600 ${horizon - 120} 1016 ${horizon - 186}" stroke="#3A3A3A" stroke-width="3" fill="none"/>
    <path d="M0 ${horizon - 160} Q600 ${horizon - 96} 1016 ${horizon - 172}" stroke="#3A3A3A" stroke-width="2" fill="none"/>
    <rect width="${W}" height="${H}" fill="url(#vig${seed})"/>
    ${grainLayer('gr' + seed)}
  `, skyDefs('sky' + seed, sky) + grain('gr' + seed) + `
    <radialGradient id="vig${seed}" cx=".5" cy=".45" r=".8">
      <stop offset=".5" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#1B2733" stop-opacity=".25"/></radialGradient>`);
}

/** A simple measured floor plan — buyers in Nepal always ask for one. */
function plan(seed) {
  const r = rnd(seed);
  const ink = '#10243F';
  const rooms = [
    { x: 120, y: 140, w: 420, h: 300, name: 'LIVING' },
    { x: 540, y: 140, w: 300, h: 300, name: 'KITCHEN' },
    { x: 840, y: 140, w: 240, h: 150, name: 'BATH' },
    { x: 840, y: 290, w: 240, h: 150, name: 'STORE' },
    { x: 120, y: 440, w: 340, h: 260, name: 'BEDROOM 1' },
    { x: 460, y: 440, w: 300, h: 260, name: 'BEDROOM 2' },
    { x: 760, y: 440, w: 320, h: 260, name: 'BEDROOM 3' },
  ];
  const label = (rm) => `<text x="${rm.x + rm.w / 2}" y="${rm.y + rm.h / 2}" text-anchor="middle" font-family="Helvetica,Arial,sans-serif" font-size="20" font-weight="700" fill="${ink}" opacity=".7" letter-spacing="2">${rm.name}</text>
    <text x="${rm.x + rm.w / 2}" y="${rm.y + rm.h / 2 + 26}" text-anchor="middle" font-family="Helvetica,Arial,sans-serif" font-size="15" fill="${ink}" opacity=".45">${Math.round(rm.w / 24)}' × ${Math.round(rm.h / 24)}'</text>`;
  return wrap(`
    <rect width="${W}" height="${H}" fill="#FAF8F6"/>
    ${Array.from({ length: 60 }, (_, i) => `<rect x="${i * 20}" y="0" width="1" height="${H}" fill="#10243F" opacity=".05"/>`).join('')}
    ${Array.from({ length: 40 }, (_, i) => `<rect x="0" y="${i * 20}" width="${W}" height="1" fill="#10243F" opacity=".05"/>`).join('')}
    <rect x="100" y="120" width="1000" height="600" fill="#FFFFFF" stroke="${ink}" stroke-width="14"/>
    ${rooms.map((rm) => `<rect x="${rm.x}" y="${rm.y}" width="${rm.w}" height="${rm.h}" fill="#F3EFEA" stroke="${ink}" stroke-width="7"/>${label(rm)}`).join('')}
    <!-- door swings -->
    ${rooms.slice(0, 5).map((rm) => `<path d="M${rm.x + 30} ${rm.y + rm.h} a46 46 0 0 1 46 -46" fill="none" stroke="${ink}" stroke-width="3" opacity=".55"/>`).join('')}
    <!-- dimension line -->
    <path d="M100 ${760} H1100" stroke="${ink}" stroke-width="2" opacity=".6"/>
    <path d="M100 752 v16 M1100 752 v16" stroke="${ink}" stroke-width="2" opacity=".6"/>
    <text x="600" y="750" text-anchor="middle" font-family="Helvetica,Arial,sans-serif" font-size="17" fill="${ink}" opacity=".7">${34 + Math.floor(r() * 12)} ft</text>
    <text x="100" y="86" font-family="Georgia,serif" font-size="30" fill="${ink}">Floor plan</text>
    <text x="100" y="108" font-family="Helvetica,Arial,sans-serif" font-size="14" fill="${ink}" opacity=".55" letter-spacing="1">INDICATIVE — NOT TO SCALE</text>
    <circle cx="1090" cy="80" r="26" fill="none" stroke="${ink}" stroke-width="3" opacity=".6"/>
    <path d="M1090 58 L1098 80 L1090 76 L1082 80 Z" fill="${ink}" opacity=".7"/>
    <text x="1090" y="46" text-anchor="middle" font-family="Helvetica,Arial,sans-serif" font-size="13" font-weight="700" fill="${ink}" opacity=".7">N</text>
  `);
}

/* ---- render --------------------------------------------------------- */
const SCENES = { facade, living, bedroom, kitchen, bath, terrace, street, plan };

// 4 variants of each scene gives plenty of spread across the seed listings.
const VARIANTS = 4;
let count = 0;
for (const [name, fn] of Object.entries(SCENES)) {
  for (let v = 1; v <= VARIANTS; v++) {
    const file = `${name}-${v}.svg`;
    writeFileSync(`${OUT}/${file}`, fn(hash(file)));
    count++;
  }
}

/* Open Graph card: 1200x630, used as the share preview fallback. */
writeFileSync(`${OUT}/og-default.svg`, `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 630" width="1200" height="630">
<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
<stop offset="0" stop-color="#10243F"/><stop offset="1" stop-color="#1D466C"/></linearGradient></defs>
<rect width="1200" height="630" fill="url(#g)"/>
<circle cx="1050" cy="120" r="220" fill="#C62244" opacity=".18"/>
<circle cx="140" cy="560" r="180" fill="#E9A23B" opacity=".14"/>
<g transform="translate(90,180)">
  <rect width="74" height="74" rx="18" fill="#C62244"/>
  <path d="M18 44 L37 24 L56 44 V58 H18 Z" fill="#fff"/>
  <text x="102" y="36" font-family="Georgia,serif" font-size="42" fill="#fff">SK Real Estate</text>
  <text x="102" y="66" font-family="Helvetica,Arial,sans-serif" font-size="19" fill="#E9A23B" letter-spacing="3">PVT. LTD. · KATHMANDU VALLEY</text>
  <text x="0" y="168" font-family="Georgia,serif" font-size="58" fill="#fff">Verified homes to rent</text>
  <text x="0" y="234" font-family="Georgia,serif" font-size="58" fill="#fff">and buy — no broker fee.</text>
  <text x="0" y="300" font-family="Helvetica,Arial,sans-serif" font-size="22" fill="#C1D5E7">Kathmandu · Lalitpur · Bhaktapur</text>
</g>
</svg>`);
count++;

console.log(`Wrote ${count} SVG files to public/media/`);
