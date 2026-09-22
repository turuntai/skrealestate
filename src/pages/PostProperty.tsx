import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon } from '../components/Icon';
import { Photo } from '../components/Photo';
import { Badge, CheckChip, cx, useToast } from '../components/ui';
import { DURATION_OPTIONS } from '../lib/expiry';
import { npr, slugify, toISODate } from '../lib/format';
import { applyMeta } from '../lib/seo';
import { photoAlt, photoUrl, type PhotoKind } from '../lib/photos';
import { uid } from '../lib/storage';
import { useStore } from '../lib/store';
import {
  AMENITIES, BHK, CITIES, FURNISHING, PROPERTY_TYPE, ROAD, WATER,
} from '../lib/taxonomy';
import type {
  Bhk, Furnishing, Listing, Media, PropertyType, Purpose, RoadAccess, WaterSource,
} from '../lib/types';

/**
 * Offered to owners who have no photos to hand. Each entry pulls a random
 * photo of that kind, so the placeholder at least matches the room it stands in
 * for. They are still placeholders — the form says so.
 */
const STOCK: { kind: PhotoKind; label: string }[] = [
  { kind: 'exterior', label: 'Exterior' },
  { kind: 'living', label: 'Living' },
  { kind: 'bedroom', label: 'Bedroom' },
  { kind: 'kitchen', label: 'Kitchen' },
  { kind: 'bathroom', label: 'Bathroom' },
  { kind: 'terrace', label: 'Terrace' },
  { kind: 'street', label: 'Road' },
  { kind: 'plan', label: 'Floor plan' },
];

const STEPS = [
  { n: 1, label: 'Basics', icon: 'house' as const },
  { n: 2, label: 'Price', icon: 'tag' as const },
  { n: 3, label: 'Details', icon: 'sliders' as const },
  { n: 4, label: 'Photos', icon: 'camera' as const },
  { n: 5, label: 'Contact', icon: 'phone' as const },
];

interface Draft {
  purpose: Purpose;
  type: PropertyType;
  title: string;
  city: string;
  area: string;
  landmark: string;
  price: string;
  deposit: string;
  serviceCharge: string;
  waterCharge: string;
  electricityNote: string;
  negotiable: boolean;
  bhk: Bhk | '';
  bathrooms: string;
  floor: string;
  builtUpArea: string;
  landArea: string;
  water: WaterSource;
  roadAccess: RoadAccess;
  roadWidthFt: string;
  bikeParking: string;
  carParking: string;
  furnishing: Furnishing;
  amenities: string[];
  availableFrom: string;
  durationDays: number;
  photos: Media[];
  description: string;
  preferredTenant: string;
  contactName: string;
  phone: string;
  whatsapp: string;
  viber: string;
  sameWhatsapp: boolean;
}

const BLANK: Draft = {
  purpose: 'rent', type: 'flat', title: '', city: 'Kathmandu', area: '', landmark: '',
  price: '', deposit: '', serviceCharge: '', waterCharge: '', electricityNote: '',
  negotiable: true, bhk: '2', bathrooms: '1', floor: '', builtUpArea: '', landArea: '',
  water: 'both', roadAccess: 'blacktop', roadWidthFt: '', bikeParking: '1', carParking: '0',
  furnishing: 'unfurnished', amenities: [], availableFrom: toISODate(new Date()),
  durationDays: 30, photos: [], description: '', preferredTenant: '',
  contactName: '', phone: '', whatsapp: '', viber: '', sameWhatsapp: true,
};

const DRAFT_KEY = 'sk.post.draft.v1';

export function PostProperty() {
  const { addListing, listings } = useStore();
  const toast = useToast();
  const nav = useNavigate();
  const fileRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState(1);
  const [d, setD] = useState<Draft>(() => {
    try {
      const raw = sessionStorage.getItem(DRAFT_KEY);
      return raw ? { ...BLANK, ...JSON.parse(raw) } : BLANK;
    } catch {
      return BLANK;
    }
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [startedAt] = useState(() => Date.now());

  useEffect(() => {
    applyMeta({
      title: 'Post your property',
      description: 'List your house, flat, room, shutter or land on SK Real Estate in under three minutes. Free for your first listing.',
    });
  }, []);

  // Keep a draft so a refresh mid-form is not a disaster.
  useEffect(() => {
    try {
      sessionStorage.setItem(DRAFT_KEY, JSON.stringify({ ...d, photos: d.photos.filter((p) => !p.src.startsWith('data:')) }));
    } catch { /* quota — the form still works, it just won't survive a refresh */ }
  }, [d]);

  useEffect(() => { window.scrollTo({ top: 0, behavior: 'smooth' }); }, [step]);

  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => {
    setD((p) => ({ ...p, [k]: v }));
    setErrors((e) => { const { [k as string]: _drop, ...rest } = e; return rest; });
  };

  const areas = useMemo(() => CITIES.find((c) => c.name === d.city)?.areas ?? [], [d.city]);
  const isLand = d.type === 'land';
  const isCommercial = d.type === 'shutter' || d.type === 'office';
  const needsBhk = !isLand && !isCommercial;

  /* ---- validation ------------------------------------------------- */

  const validateStep = (s: number): boolean => {
    const e: Record<string, string> = {};
    if (s === 1) {
      if (d.title.trim().length < 10) e.title = 'Give it a title of at least 10 characters';
      if (!d.area) e.area = 'Choose the area';
      if (d.landmark.trim().length < 5) e.landmark = 'A nearby landmark helps people find it';
    }
    if (s === 2) {
      const p = Number(d.price);
      if (!d.price || Number.isNaN(p) || p <= 0) e.price = 'Enter the price in rupees';
      else if (d.purpose === 'rent' && p > 2_000_000) e.price = 'That looks like a sale price — switch to "For sale" above';
      if (d.deposit && Number(d.deposit) < 0) e.deposit = 'Deposit cannot be negative';
    }
    if (s === 5) {
      if (d.contactName.trim().length < 2) e.contactName = 'Enter the contact name';
      if (!/^9\d{9}$/.test(d.phone.replace(/\D/g, ''))) e.phone = 'Enter a 10-digit mobile starting with 9';
      if (!d.sameWhatsapp && d.whatsapp && !/^9\d{9}$/.test(d.whatsapp.replace(/\D/g, ''))) {
        e.whatsapp = 'Enter a valid 10-digit number';
      }
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const next = () => {
    if (!validateStep(step)) {
      toast('Please fix the highlighted fields', 'err');
      return;
    }
    setStep((s) => Math.min(5, s + 1));
  };

  const back = () => setStep((s) => Math.max(1, s - 1));

  /* ---- photos ----------------------------------------------------- */

  const addFiles = (files: FileList | null) => {
    if (!files?.length) return;
    const room = 10 - d.photos.length;
    if (room <= 0) { toast('Ten photos is the maximum', 'err'); return; }

    Array.from(files).slice(0, room).forEach((file) => {
      if (!file.type.startsWith('image/')) return;
      if (file.size > 4 * 1024 * 1024) { toast(`${file.name} is over 4 MB`, 'err'); return; }
      const reader = new FileReader();
      reader.onload = () => {
        setD((p) => (p.photos.length >= 10 ? p : {
          ...p,
          photos: [...p.photos, { src: String(reader.result), alt: file.name.replace(/\.[^.]+$/, '') }],
        }));
      };
      reader.readAsDataURL(file);
    });
  };

  const toggleStock = (kind: PhotoKind) => {
    setD((p) => {
      const existing = p.photos.find((x) => x.src.includes(`sig=stock-${kind}`));
      if (existing) return { ...p, photos: p.photos.filter((x) => x !== existing) };
      if (p.photos.length >= 10) return p;
      return {
        ...p,
        photos: [...p.photos, {
          src: photoUrl(kind, `stock-${kind}`),
          alt: photoAlt(kind, p.title || 'Property'),
        }],
      };
    });
  };

  const movePhoto = (i: number, dir: -1 | 1) => {
    setD((p) => {
      const j = i + dir;
      if (j < 0 || j >= p.photos.length) return p;
      const photos = [...p.photos];
      [photos[i], photos[j]] = [photos[j], photos[i]];
      return { ...p, photos };
    });
  };

  /* ---- submit ----------------------------------------------------- */

  const publish = () => {
    if (!validateStep(5)) { toast('Please fix the highlighted fields', 'err'); return; }

    const now = new Date().toISOString();
    const base = slugify(d.title) || 'property';
    // Guarantee a unique, readable slug even if two listings share a title.
    let slug = base;
    let n = 2;
    while (listings.some((l) => l.slug === slug)) slug = `${base}-${n++}`;

    const photos = d.photos.length
      ? d.photos
      : [{ src: photoUrl('exterior', `${slug}-1`), alt: photoAlt('exterior', d.title.trim()) }];

    const listing: Listing = {
      id: uid('sk'),
      slug,
      title: d.title.trim(),
      purpose: d.purpose,
      type: d.type,
      photos,
      price: Number(d.price),
      deposit: d.deposit ? Number(d.deposit) : undefined,
      serviceCharge: d.serviceCharge ? Number(d.serviceCharge) : undefined,
      waterCharge: d.waterCharge ? Number(d.waterCharge) : undefined,
      electricityNote: d.electricityNote.trim() || undefined,
      negotiable: d.negotiable,
      area: d.area,
      city: d.city,
      landmark: d.landmark.trim(),
      // Approximate coordinates; the admin refines the pin later.
      lat: 27.7 + (Math.random() - 0.5) * 0.09,
      lng: 85.32 + (Math.random() - 0.5) * 0.11,
      bhk: needsBhk && d.bhk ? d.bhk : undefined,
      floor: d.floor.trim() || undefined,
      bathrooms: Number(d.bathrooms) || 0,
      builtUpArea: d.builtUpArea ? Number(d.builtUpArea) : undefined,
      landArea: d.landArea.trim() || undefined,
      water: d.water,
      parking: { bike: Number(d.bikeParking) || 0, car: Number(d.carParking) || 0 },
      roadAccess: d.roadAccess,
      roadWidthFt: d.roadWidthFt ? Number(d.roadWidthFt) : undefined,
      furnishing: d.furnishing,
      amenities: d.amenities,
      availableFrom: d.availableFrom,
      postedAt: now,
      updatedAt: now,
      durationDays: d.durationDays,
      status: 'active',
      contactName: d.contactName.trim(),
      phone: d.phone.replace(/\D/g, ''),
      whatsapp: (d.sameWhatsapp ? d.phone : d.whatsapp).replace(/\D/g, '') || undefined,
      viber: d.viber.replace(/\D/g, '') || undefined,
      description: d.description.trim() || `${d.title.trim()} in ${d.area}, ${d.city}. ${d.landmark.trim()}`,
      preferredTenant: d.preferredTenant.trim() || undefined,
      verified: false,
      featured: false,
      views: 0,
    };

    addListing(listing);
    try { sessionStorage.removeItem(DRAFT_KEY); } catch { /* ignore */ }

    const mins = Math.max(1, Math.round((Date.now() - startedAt) / 60000));
    toast(`Published in about ${mins} minute${mins === 1 ? '' : 's'}.`, 'ok');
    nav(`/property/${slug}`);
  };

  const err = (k: string) => errors[k];
  const Err = ({ k }: { k: string }) =>
    err(k) ? <p className="err"><Icon name="alert" className="w-3.5 h-3.5 mt-px shrink-0" />{err(k)}</p> : null;

  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 py-8 sm:py-12">
      <div className="mb-8">
        <Badge tone="bg-marigold-100 text-marigold-900 border border-marigold-300" icon="clock">
          Most owners finish this in under 3 minutes
        </Badge>
        <h1 className="text-3xl sm:text-4xl font-bold mt-4">Post your property</h1>
        <p className="text-brick-700 mt-2 text-[15.5px]">
          Five short steps. Only the title, area, price and your number are required —
          everything else makes the listing easier to trust.
        </p>
      </div>

      {/* ---- stepper ------------------------------------------------ */}
      <ol className="flex items-center mb-8 overflow-x-auto no-scrollbar" aria-label="Progress">
        {STEPS.map((s, i) => {
          const done = step > s.n;
          const current = step === s.n;
          return (
            <li key={s.n} className="flex items-center shrink-0">
              <button
                onClick={() => s.n < step && setStep(s.n)}
                disabled={s.n > step}
                className={cx(
                  'flex items-center gap-2 px-1 transition-colors',
                  s.n < step ? 'cursor-pointer' : 'cursor-default',
                )}
              >
                <span
                  className={cx(
                    'w-9 h-9 rounded-full grid place-items-center text-[13px] font-bold shrink-0 transition-colors',
                    done ? 'bg-jade-600 text-white'
                      : current ? 'bg-crimson-600 text-white ring-4 ring-crimson-100'
                      : 'bg-brick-200 text-brick-600',
                  )}
                >
                  {done ? <Icon name="check" className="w-4 h-4" strokeWidth={3} /> : s.n}
                </span>
                <span className={cx('text-[13.5px] font-semibold hidden sm:block', current ? 'text-navy-900' : 'text-brick-600')}>
                  {s.label}
                </span>
              </button>
              {i < STEPS.length - 1 && (
                <span className={cx('w-6 sm:w-10 h-0.5 mx-1', step > s.n ? 'bg-jade-500' : 'bg-brick-200')} />
              )}
            </li>
          );
        })}
      </ol>

      <div className="card p-5 sm:p-8">
        {/* ============ STEP 1 — basics ============================ */}
        {step === 1 && (
          <section className="space-y-6 animate-fade-in">
            <h2 className="text-xl font-bold">What are you listing?</h2>

            <div>
              <span className="label">This property is</span>
              <div className="flex gap-1 p-1 bg-brick-100 rounded-xl w-fit">
                {(['rent', 'sale'] as Purpose[]).map((p) => (
                  <button
                    key={p} type="button" onClick={() => set('purpose', p)} aria-pressed={d.purpose === p}
                    className={cx('px-6 py-2 rounded-lg text-[14px] font-bold transition-all',
                      d.purpose === p ? 'bg-white text-navy-900 shadow-sm' : 'text-brick-700')}
                  >
                    {p === 'rent' ? 'For rent' : 'For sale'}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <span className="label">Property type</span>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {(Object.keys(PROPERTY_TYPE) as PropertyType[]).map((tp) => (
                  <button
                    key={tp} type="button" onClick={() => set('type', tp)} aria-pressed={d.type === tp}
                    className={cx(
                      'flex items-center gap-2.5 p-3 rounded-xl border text-[14px] font-medium transition-all text-left',
                      d.type === tp ? 'border-navy-900 bg-navy-900 text-white' : 'border-brick-200 hover:border-brick-400',
                    )}
                  >
                    <Icon name={(PROPERTY_TYPE[tp].icon ?? 'house') as 'house'} className="w-[18px] h-[18px] shrink-0" />
                    {PROPERTY_TYPE[tp].label.split(' /')[0]}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="label" htmlFor="p-title">Listing title <span className="text-crimson-600">*</span></label>
              <input
                id="p-title" value={d.title} onChange={(e) => set('title', e.target.value)} maxLength={90}
                className={cx('field', err('title') && 'field-err')}
                placeholder="Sunny 2BHK flat with parking in Chabahil"
              />
              <div className="flex justify-between items-start gap-4">
                <p className="hint">Say the size, the best feature and the area. That is what people scan for.</p>
                <span className="hint shrink-0 tabular-nums">{d.title.length}/90</span>
              </div>
              <Err k="title" />
            </div>

            <div className="grid sm:grid-cols-2 gap-5">
              <div>
                <label className="label" htmlFor="p-city">City <span className="text-crimson-600">*</span></label>
                <select
                  id="p-city" value={d.city}
                  onChange={(e) => { set('city', e.target.value); set('area', ''); }}
                  className="field"
                >
                  {CITIES.map((c) => <option key={c.name}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="label" htmlFor="p-area">Area <span className="text-crimson-600">*</span></label>
                <select
                  id="p-area" value={d.area} onChange={(e) => set('area', e.target.value)}
                  className={cx('field', err('area') && 'field-err')}
                >
                  <option value="">Choose an area</option>
                  {areas.map((a) => <option key={a}>{a}</option>)}
                </select>
                <Err k="area" />
              </div>
            </div>

            <div>
              <label className="label" htmlFor="p-landmark">Nearest landmark <span className="text-crimson-600">*</span></label>
              <input
                id="p-landmark" value={d.landmark} onChange={(e) => set('landmark', e.target.value)}
                className={cx('field', err('landmark') && 'field-err')}
                placeholder="2 min from Chabahil chowk, behind Nepal Bank"
              />
              <p className="hint">People search by landmark far more than by street name.</p>
              <Err k="landmark" />
            </div>
          </section>
        )}

        {/* ============ STEP 2 — price ============================= */}
        {step === 2 && (
          <section className="space-y-6 animate-fade-in">
            <h2 className="text-xl font-bold">
              {d.purpose === 'rent' ? 'Rent and charges' : 'Asking price'}
            </h2>

            <div>
              <label className="label" htmlFor="p-price">
                {d.purpose === 'rent' ? 'Monthly rent' : 'Asking price'} (NPR) <span className="text-crimson-600">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-brick-600 font-semibold text-[15px]">Rs</span>
                <input
                  id="p-price" type="number" min={0} inputMode="numeric" value={d.price}
                  onChange={(e) => set('price', e.target.value)}
                  className={cx('field !pl-11 !text-lg !font-semibold', err('price') && 'field-err')}
                  placeholder={d.purpose === 'rent' ? '25000' : '25000000'}
                />
              </div>
              {d.price && !err('price') && (
                <p className="hint text-jade-700 font-medium">
                  {npr(Number(d.price))}{d.purpose === 'rent' ? ' per month' : ''}
                </p>
              )}
              <Err k="price" />
            </div>

            <label className="flex items-center gap-2.5 cursor-pointer">
              <input type="checkbox" checked={d.negotiable} onChange={(e) => set('negotiable', e.target.checked)} className="accent-crimson-600 w-4 h-4" />
              <span className="text-[14.5px] font-medium">Price is negotiable</span>
            </label>

            {d.purpose === 'rent' && (
              <>
                <div className="grid sm:grid-cols-2 gap-5">
                  <div>
                    <label className="label" htmlFor="p-deposit">Deposit / advance</label>
                    <input
                      id="p-deposit" type="number" min={0} inputMode="numeric" value={d.deposit}
                      onChange={(e) => set('deposit', e.target.value)}
                      className={cx('field', err('deposit') && 'field-err')} placeholder="50000"
                    />
                    {d.price && d.deposit && Number(d.price) > 0 && (
                      <p className="hint">
                        That is {(Number(d.deposit) / Number(d.price)).toFixed(1)} months' rent.
                      </p>
                    )}
                    <Err k="deposit" />
                  </div>
                  <div>
                    <label className="label" htmlFor="p-service">Service charge / month</label>
                    <input
                      id="p-service" type="number" min={0} inputMode="numeric" value={d.serviceCharge}
                      onChange={(e) => set('serviceCharge', e.target.value)} className="field" placeholder="1500"
                    />
                    <p className="hint">Sewa sulka, guard, stairs cleaning.</p>
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-5">
                  <div>
                    <label className="label" htmlFor="p-water">Water charge / month</label>
                    <input
                      id="p-water" type="number" min={0} inputMode="numeric" value={d.waterCharge}
                      onChange={(e) => set('waterCharge', e.target.value)} className="field" placeholder="800"
                    />
                  </div>
                  <div>
                    <label className="label" htmlFor="p-elec">Electricity</label>
                    <input
                      id="p-elec" value={d.electricityNote} onChange={(e) => set('electricityNote', e.target.value)}
                      className="field" placeholder="Separate meter, paid to NEA"
                    />
                  </div>
                </div>

                {/* Live total — the thing tenants actually budget against. */}
                {!!Number(d.price) && (
                  <div className="rounded-xl bg-navy-900 text-white p-4">
                    <div className="text-[12px] uppercase tracking-wide text-navy-300 font-semibold">
                      What a tenant pays each month
                    </div>
                    <div className="text-2xl font-bold mt-1 tabular-nums">
                      {npr(Number(d.price) + Number(d.serviceCharge || 0) + Number(d.waterCharge || 0))}
                    </div>
                    <p className="text-[12.5px] text-navy-200 mt-1.5">
                      Listings that show the real total get noticeably more calls than ones that hide charges.
                    </p>
                  </div>
                )}
              </>
            )}
          </section>
        )}

        {/* ============ STEP 3 — details =========================== */}
        {step === 3 && (
          <section className="space-y-6 animate-fade-in">
            <h2 className="text-xl font-bold">The details people ask about</h2>

            {needsBhk && (
              <div>
                <span className="label">Bedrooms</span>
                <div className="flex flex-wrap gap-2">
                  {BHK.map((b) => (
                    <button
                      key={b.value} type="button" onClick={() => set('bhk', b.value)}
                      className={d.bhk === b.value ? 'chip-on' : 'chip-off'}
                    >
                      {b.value === 'rk' ? 'RK' : b.value}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="grid sm:grid-cols-3 gap-5">
              <div>
                <label className="label" htmlFor="p-bath">Bathrooms</label>
                <input id="p-bath" type="number" min={0} max={20} value={d.bathrooms} onChange={(e) => set('bathrooms', e.target.value)} className="field" />
              </div>
              <div>
                <label className="label" htmlFor="p-floor">Floor</label>
                <input id="p-floor" value={d.floor} onChange={(e) => set('floor', e.target.value)} className="field" placeholder="2nd of 4" />
              </div>
              <div>
                <label className="label" htmlFor="p-sqft">Built-up (sq ft)</label>
                <input id="p-sqft" type="number" min={0} value={d.builtUpArea} onChange={(e) => set('builtUpArea', e.target.value)} className="field" placeholder="900" />
              </div>
            </div>

            {(isLand || d.type === 'house') && (
              <div>
                <label className="label" htmlFor="p-land">Land area</label>
                <input id="p-land" value={d.landArea} onChange={(e) => set('landArea', e.target.value)} className="field" placeholder="4 aana 2 paisa" />
                <p className="hint">Aana and paisa for the valley, ropani for outside it.</p>
              </div>
            )}

            <div className="grid sm:grid-cols-2 gap-5">
              <div>
                <label className="label" htmlFor="p-waters">Water source</label>
                <select id="p-waters" value={d.water} onChange={(e) => set('water', e.target.value as WaterSource)} className="field">
                  {(Object.keys(WATER) as WaterSource[]).map((w) => <option key={w} value={w}>{WATER[w].label}</option>)}
                </select>
              </div>
              <div>
                <label className="label" htmlFor="p-furnish">Furnishing</label>
                <select id="p-furnish" value={d.furnishing} onChange={(e) => set('furnishing', e.target.value as Furnishing)} className="field">
                  {(Object.keys(FURNISHING) as Furnishing[]).map((f) => <option key={f} value={f}>{FURNISHING[f].label}</option>)}
                </select>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-5">
              <div>
                <label className="label" htmlFor="p-road">Road access</label>
                <select id="p-road" value={d.roadAccess} onChange={(e) => set('roadAccess', e.target.value as RoadAccess)} className="field">
                  {(Object.keys(ROAD) as RoadAccess[]).map((r) => <option key={r} value={r}>{ROAD[r].label}</option>)}
                </select>
              </div>
              <div>
                <label className="label" htmlFor="p-roadw">Road width (ft)</label>
                <input id="p-roadw" type="number" min={0} value={d.roadWidthFt} onChange={(e) => set('roadWidthFt', e.target.value)} className="field" placeholder="20" />
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-5">
              <div>
                <label className="label" htmlFor="p-car">Car parking spaces</label>
                <input id="p-car" type="number" min={0} max={10} value={d.carParking} onChange={(e) => set('carParking', e.target.value)} className="field" />
              </div>
              <div>
                <label className="label" htmlFor="p-bike">Bike parking spaces</label>
                <input id="p-bike" type="number" min={0} max={20} value={d.bikeParking} onChange={(e) => set('bikeParking', e.target.value)} className="field" />
              </div>
            </div>

            <div>
              <span className="label">Amenities</span>
              <div className="flex flex-wrap gap-2">
                {AMENITIES.map((a) => (
                  <CheckChip
                    key={a.key}
                    checked={d.amenities.includes(a.key)}
                    onChange={() =>
                      set('amenities', d.amenities.includes(a.key)
                        ? d.amenities.filter((x) => x !== a.key)
                        : [...d.amenities, a.key])
                    }
                  >
                    {a.label}
                  </CheckChip>
                ))}
              </div>
            </div>

            <div>
              <label className="label" htmlFor="p-desc">Description</label>
              <textarea
                id="p-desc" value={d.description} onChange={(e) => set('description', e.target.value)} rows={5}
                className="field resize-none"
                placeholder="Describe the light, the water situation, how quiet the lane is, what is walking distance. Two honest paragraphs beat ten adjectives."
              />
              <p className="hint">Leave it blank and we will write a basic one from the details above.</p>
            </div>

            {d.purpose === 'rent' && (
              <div>
                <label className="label" htmlFor="p-tenant">Preferred tenant</label>
                <input
                  id="p-tenant" value={d.preferredTenant} onChange={(e) => set('preferredTenant', e.target.value)}
                  className="field" placeholder="Family only · Bachelors welcome · Vegetarian household"
                />
              </div>
            )}
          </section>
        )}

        {/* ============ STEP 4 — photos ============================ */}
        {step === 4 && (
          <section className="space-y-6 animate-fade-in">
            <div>
              <h2 className="text-xl font-bold">Photos</h2>
              <p className="text-brick-700 text-[14.5px] mt-1">
                Listings with six or more photos get roughly three times the enquiries.
                Shoot in daylight with the curtains open.
              </p>
            </div>

            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => { e.preventDefault(); addFiles(e.dataTransfer.files); }}
              className="border-2 border-dashed border-brick-300 rounded-2xl p-8 text-center hover:border-crimson-400 hover:bg-crimson-50/40 transition-colors"
            >
              <input
                ref={fileRef} type="file" accept="image/*" multiple className="sr-only"
                onChange={(e) => { addFiles(e.target.files); e.target.value = ''; }}
              />
              <Icon name="camera" className="w-9 h-9 mx-auto text-brick-400 mb-3" />
              <button type="button" onClick={() => fileRef.current?.click()} className="btn-primary">
                Choose photos
              </button>
              <p className="hint">Or drag them here. JPG or PNG, up to 4 MB each, 10 photos maximum.</p>
            </div>

            {d.photos.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="label !mb-0">{d.photos.length} photo{d.photos.length === 1 ? '' : 's'}</span>
                  <span className="hint !mt-0">The first one is the cover</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {d.photos.map((p, i) => (
                    <div key={p.src + i} className="relative group aspect-[4/3] rounded-xl overflow-hidden bg-brick-200 border border-brick-200">
                      <Photo src={p.src} alt={p.alt} className="w-full h-full object-cover" />
                      {i === 0 && (
                        <span className="absolute top-2 left-2 badge bg-crimson-600 text-white">Cover</span>
                      )}
                      <div className="absolute inset-0 bg-navy-950/45 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity grid place-items-center gap-2 grid-flow-col">
                        <button type="button" onClick={() => movePhoto(i, -1)} disabled={i === 0}
                          className="w-8 h-8 rounded-full bg-white/92 grid place-items-center disabled:opacity-35" aria-label="Move earlier">
                          <Icon name="chevron-left" className="w-4 h-4" />
                        </button>
                        <button type="button" onClick={() => setD((prev) => ({ ...prev, photos: prev.photos.filter((_, x) => x !== i) }))}
                          className="w-8 h-8 rounded-full bg-crimson-600 text-white grid place-items-center" aria-label="Remove photo">
                          <Icon name="trash" className="w-4 h-4" />
                        </button>
                        <button type="button" onClick={() => movePhoto(i, 1)} disabled={i === d.photos.length - 1}
                          className="w-8 h-8 rounded-full bg-white/92 grid place-items-center disabled:opacity-35" aria-label="Move later">
                          <Icon name="chevron-right" className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div>
              <span className="label">No photos to hand? Pick placeholders for now</span>
              <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                {STOCK.map((s) => {
                  const on = d.photos.some((p) => p.src.includes(`sig=stock-${s.kind}`));
                  return (
                    <button
                      key={s.kind} type="button" onClick={() => toggleStock(s.kind)}
                      className={cx(
                        'aspect-square rounded-lg overflow-hidden border-2 relative transition-all',
                        on ? 'border-crimson-600 ring-2 ring-crimson-200' : 'border-brick-200 hover:border-brick-400',
                      )}
                      aria-pressed={on}
                      title={s.label}
                    >
                      <Photo src={photoUrl(s.kind, `stock-${s.kind}`)} alt={s.label} className="w-full h-full object-cover" loading="lazy" />
                      {on && (
                        <span className="absolute inset-0 bg-crimson-600/25 grid place-items-center">
                          <span className="w-5 h-5 rounded-full bg-crimson-600 text-white grid place-items-center">
                            <Icon name="check" className="w-3 h-3" strokeWidth={3} />
                          </span>
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
              <p className="hint">Swap these for real photos before the listing goes live — we will remind you.</p>
            </div>
          </section>
        )}

        {/* ============ STEP 5 — contact =========================== */}
        {step === 5 && (
          <section className="space-y-6 animate-fade-in">
            <h2 className="text-xl font-bold">How should people reach you?</h2>

            <div className="grid sm:grid-cols-2 gap-5">
              <div>
                <label className="label" htmlFor="p-name">Contact name <span className="text-crimson-600">*</span></label>
                <input
                  id="p-name" value={d.contactName} onChange={(e) => set('contactName', e.target.value)}
                  className={cx('field', err('contactName') && 'field-err')} placeholder="Sabina Karki" autoComplete="name"
                />
                <Err k="contactName" />
              </div>
              <div>
                <label className="label" htmlFor="p-phone">Mobile number <span className="text-crimson-600">*</span></label>
                <input
                  id="p-phone" value={d.phone} onChange={(e) => set('phone', e.target.value)} inputMode="numeric"
                  className={cx('field', err('phone') && 'field-err')} placeholder="98XXXXXXXX" autoComplete="tel"
                />
                <Err k="phone" />
              </div>
            </div>

            <label className="flex items-center gap-2.5 cursor-pointer">
              <input type="checkbox" checked={d.sameWhatsapp} onChange={(e) => set('sameWhatsapp', e.target.checked)} className="accent-crimson-600 w-4 h-4" />
              <span className="text-[14.5px] font-medium">WhatsApp is on this same number</span>
            </label>

            {!d.sameWhatsapp && (
              <div>
                <label className="label" htmlFor="p-wa">WhatsApp number</label>
                <input
                  id="p-wa" value={d.whatsapp} onChange={(e) => set('whatsapp', e.target.value)} inputMode="numeric"
                  className={cx('field', err('whatsapp') && 'field-err')} placeholder="98XXXXXXXX"
                />
                <Err k="whatsapp" />
              </div>
            )}

            <div>
              <label className="label" htmlFor="p-viber">Viber number <span className="font-normal text-brick-600">(optional)</span></label>
              <input id="p-viber" value={d.viber} onChange={(e) => set('viber', e.target.value)} inputMode="numeric" className="field" placeholder="98XXXXXXXX" />
            </div>

            <div className="grid sm:grid-cols-2 gap-5">
              <div>
                <label className="label" htmlFor="p-avail">Available from</label>
                <input
                  id="p-avail" type="date" value={d.availableFrom} min={toISODate(new Date())}
                  onChange={(e) => set('availableFrom', e.target.value)} className="field"
                />
              </div>
              <div>
                <span className="label">Keep it live for</span>
                <div className="flex gap-2">
                  {DURATION_OPTIONS.map((days) => (
                    <button
                      key={days} type="button" onClick={() => set('durationDays', days)}
                      className={cx('flex-1', d.durationDays === days ? 'chip-on' : 'chip-off', '!justify-center')}
                    >
                      {days}d
                    </button>
                  ))}
                </div>
                <p className="hint">It expires on its own after that. One tap renews it.</p>
              </div>
            </div>

            {/* ---- review ---------------------------------------- */}
            <div className="rounded-2xl border border-brick-200 bg-brick-50 p-5">
              <h3 className="font-bold text-[15px] mb-3 flex items-center gap-2">
                <Icon name="check-circle" className="w-4.5 h-4.5 text-jade-600" /> Ready to publish
              </h3>
              <dl className="space-y-2 text-[14px]">
                <Review label="Title" value={d.title || '—'} />
                <Review label="Where" value={d.area ? `${d.area}, ${d.city}` : '—'} />
                <Review
                  label={d.purpose === 'rent' ? 'Rent' : 'Price'}
                  value={d.price ? `${npr(Number(d.price))}${d.purpose === 'rent' ? '/month' : ''}` : '—'}
                />
                <Review label="Photos" value={d.photos.length ? `${d.photos.length} added` : 'None — a placeholder will be used'} />
                <Review label="Expires" value={`${d.durationDays} days after publishing`} />
              </dl>
            </div>

            <p className="hint">
              By publishing you confirm you own this property or are authorised to let it,
              and that the details above are accurate. We check every listing before it
              gets the Verified mark.
            </p>
          </section>
        )}

        {/* ---- nav ------------------------------------------------- */}
        <div className="flex gap-3 mt-8 pt-6 border-t border-brick-200">
          {step > 1 && (
            <button onClick={back} className="btn-outline btn-lg">
              <Icon name="chevron-left" className="w-4 h-4" /> Back
            </button>
          )}
          {step < 5 ? (
            <button onClick={next} className="btn-primary btn-lg flex-1">
              Continue <Icon name="chevron-right" className="w-4 h-4" />
            </button>
          ) : (
            <button onClick={publish} className="btn-jade btn-lg flex-1">
              <Icon name="check" className="w-4.5 h-4.5" strokeWidth={2.6} /> Publish listing
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function Review({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-brick-700 shrink-0">{label}</dt>
      <dd className="font-medium text-right">{value}</dd>
    </div>
  );
}
