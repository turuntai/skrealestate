# SK Real Estate Pvt. Ltd. — frontend

Property listing site for the Kathmandu Valley: houses, flats, rooms, shutters,
office space and land, to rent or to buy.

**This is the frontend only.** There is no backend yet — every feature below is
fully working, with browser `localStorage` standing in for the database. The
data layer is isolated in `src/lib/storage.ts` and `src/lib/store.tsx`, so
swapping it for real API calls should not require touching any component.

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # share cards -> typecheck -> bundle -> prerender
npm run preview  # serve the production build
```

---

## What is built

### Listing page — `/property/:slug`
- **Photos** — mosaic gallery on desktop, swipeable strip on phones, full-screen
  lightbox with keyboard and thumbnail navigation. An optional walkthrough video
  rides along as the last slide.
- **Price** — deposit, monthly rent, service charge (*sewa sulka*), water charge
  and how electricity is billed, itemised, with a **monthly total** so nothing
  appears on moving day that was not on the listing.
- **Location** — area, landmark, and a map pin with hand-off to Google Maps for
  directions.
- **Type** — house / flat / room / shutter / office / land, with BHK (including
  RK) and floor.
- **Basics** — water source, parking split by car and bike, road access and
  width, furnishing, bathrooms, facing, built-up and land area.
- **Availability** — available-from date, posted date, updated date and how long
  the listing stays live.
- **Actions** — Call, WhatsApp, Viber, Request a visit, Save, Share, Report.

### Search and filter — `/listings`
Area, city, price band (with free min/max), property type, BHK, furnishing,
amenities, car parking and verified-only. Filter state lives in the querystring,
so a filtered search is a shareable link. Sidebar on desktop, bottom sheet on
phones.

### Post a property — `/post`
Five short steps built to finish in under three minutes. Only the title, area,
landmark, price and phone number are required. Photo upload with drag-and-drop,
reordering and a cover-photo marker; a live "what a tenant pays each month"
total; and a draft saved to `sessionStorage` so a refresh mid-form is not a
disaster.

### Contact
`tel:` and `wa.me` links throughout, plus Viber — still the default messenger for
a lot of Nepal. The visit-request form composes a filled-in WhatsApp message to
the owner with the date, time slot and listing link.

### Mark as rented / auto-expire — `/admin`
Every listing carries `durationDays`. Expiry is **derived from the clock**
(`src/lib/expiry.ts`), so listings age out on their own with no cron job
anywhere. Status flows Available → Expiring soon (inside 7 days) → Expired, and
Rented is set by hand. The admin board renews in one tap, marks rented, toggles
verified and featured, and deletes.

### Share link
`npm run build` runs two steps that make link previews real:

1. `scripts/gen-og.mjs` renders a **1200×630 PNG share card** per listing —
   the cover photo with a branded band carrying the price, title and location.
   PNG matters: Facebook and WhatsApp will not render an SVG in a preview.
2. `scripts/prerender.mjs` writes a **static `index.html` per listing** with that
   listing's own `<title>`, description, `og:image`, canonical URL and
   schema.org JSON-LD. Crawlers do not run JavaScript, so a single-page app
   otherwise shares with the same generic preview on every link.

It also emits `sitemap.xml`, a `404.html` fallback and a `_redirects` file.

Vercel's routing order is redirects → filesystem → rewrites, so the catch-all
rewrite in `vercel.json` never shadows those prerendered files: a crawler asking
for `/property/<slug>` gets the real file, and every other route falls through to
the SPA shell. (`vercel.json` rejects unknown keys, so that note lives here
rather than in the file.)

---

## Design

The palette is drawn from things you actually see in Kathmandu, not from a
template:

| Token | Hex | Where it comes from | Used for |
|---|---|---|---|
| `crimson` | `#C62244` | the flag, sindoor | brand, primary actions |
| `navy` | `#10243F` | Himalayan night sky | headers, footer, body copy |
| `marigold` | `#E9A23B` | *sayapatri* garlands | accents, warnings, "expiring" |
| `jade` | `#12795E` | valley terraces | verified, available, success |
| `brick` | warm neutrals | old Newari brick | surfaces instead of cold grey |

**Everything domain-related is colour-coded from one place.** `src/lib/taxonomy.ts`
holds a token per concept — purpose, property type, status, furnishing — each
carrying a solid fill, a soft tint and a dot colour. A concept therefore looks
identical on a card, a filter chip, the detail page and the admin table. No
component hard-codes a colour for these.

Other deliberate choices: a bilingual EN / नेपाली toggle; Nepali number
formatting (`12,34,567`, lakh and crore); land in *aana* and *paisa*; no web
fonts, so nothing blocks the first paint; and full keyboard and screen-reader
support with focus trapping in every dialog.

Interaction patterns were drawn from how Zillow, Airbnb and Expedia solve the
same problems — the gallery mosaic, the filter sheet, the sticky price card and
the stepped listing form.

---

## Imagery — replace before launch

`public/media/*.svg` are **hand-composed placeholder scenes**, not photographs —
generated by `scripts/gen-media.mjs` so the site is complete and works offline.
They carry Nepali detail (prayer flags, rooftop water tanks, the valley skyline)
but they are still placeholders.

**To go live: drop real photography into `public/media/` under the same
filenames, then run `npm run gen:media` to rebuild the share cards.** Nothing
else changes — the paths in `src/data/seed.ts` stay put.

---

## Known limits (no backend yet)

- Data lives in `localStorage`, so it is per-browser. Admin has a **Reset demo
  data** button.
- Listings posted through the form exist only in that browser and get no
  prerendered share card — those are generated at build time from the catalogue.
  Both are solved by the same backend.
- Visit requests and reports are stored locally and shown on the admin board;
  the visit request also opens WhatsApp, which is what actually reaches the owner
  today.
- The map is a schematic locator, not a tile map. It renders instantly, costs
  nothing, and does not hand the visitor's IP to a tile provider. Directions
  hand off to Google Maps.
- `SITE_ORIGIN` defaults to `https://skrealestate.com.np` for the prerendered
  absolute URLs — set the env var if the domain differs.

## Layout

```
src/
  lib/          types, taxonomy (colour tokens), format (NPR/dates),
                expiry, search, share, seo, storage, store, i18n
  components/   Icon, ui primitives, Header, Footer, ListingCard,
                Gallery, MapPin, FilterPanel, ContactActions
  pages/        Home, Listings, ListingDetail, PostProperty,
                Saved, Admin, About, Contact, NotFound
  data/seed.ts  14 sample Kathmandu Valley listings
scripts/
  gen-media.mjs  property scene artwork  -> public/media
  gen-og.mjs     1200x630 share cards    -> public/og
  prerender.mjs  per-listing HTML + sitemap -> dist
```

Stack: React 18 · TypeScript (strict) · Vite · Tailwind · React Router.
No UI kit, no icon package — the icon set is a single inline SVG sprite.
