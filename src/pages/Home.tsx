import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ListingCard } from '../components/ListingCard';
import { Icon } from '../components/Icon';
import { Badge, SectionHeading, cx } from '../components/ui';
import { isLive } from '../lib/expiry';
import { npr } from '../lib/format';
import { applyMeta, SITE_NAME, SITE_TAGLINE } from '../lib/seo';
import { useStore } from '../lib/store';
import { CITIES, POPULAR_AREAS, PROPERTY_TYPE } from '../lib/taxonomy';
import type { Purpose, PropertyType } from '../lib/types';

const QUICK_TYPES: { type: PropertyType; blurb: string }[] = [
  { type: 'flat', blurb: 'Apartments & flats' },
  { type: 'house', blurb: 'Whole houses' },
  { type: 'room', blurb: 'Rooms & RK' },
  { type: 'shutter', blurb: 'Shops & shutters' },
  { type: 'office', blurb: 'Office space' },
  { type: 'land', blurb: 'Land plots' },
];

export function Home() {
  const { listings } = useStore();
  const nav = useNavigate();
  const [purpose, setPurpose] = useState<Purpose>('rent');
  const [q, setQ] = useState('');
  const [area, setArea] = useState('');
  const [budget, setBudget] = useState('');

  useEffect(() => {
    applyMeta({
      title: SITE_NAME,
      description: `${SITE_TAGLINE}. Browse verified houses, flats, rooms, shutters and land in Kathmandu, Lalitpur and Bhaktapur — with real photos, honest charges and direct owner contact.`,
    });
  }, []);

  const live = useMemo(() => listings.filter((l) => isLive(l)), [listings]);
  const featured = useMemo(() => live.filter((l) => l.featured).slice(0, 6), [live]);
  const newest = useMemo(
    () => [...live].sort((a, b) => +new Date(b.postedAt) - +new Date(a.postedAt)).slice(0, 3),
    [live],
  );

  const counts = useMemo(() => {
    const byType: Record<string, number> = {};
    live.forEach((l) => { byType[l.type] = (byType[l.type] ?? 0) + 1; });
    return {
      total: live.length,
      rent: live.filter((l) => l.purpose === 'rent').length,
      sale: live.filter((l) => l.purpose === 'sale').length,
      byType,
    };
  }, [live]);

  const search = (e: React.FormEvent) => {
    e.preventDefault();
    const p = new URLSearchParams();
    p.set('for', purpose);
    if (q.trim()) p.set('q', q.trim());
    if (area) p.set('areas', area);
    if (budget) p.set('max', budget);
    nav(`/listings?${p}`);
  };

  const budgetOptions =
    purpose === 'rent'
      ? [10000, 20000, 35000, 50000, 80000, 150000]
      : [5000000, 10000000, 20000000, 30000000, 50000000, 100000000];

  return (
    <div>
      {/* ================= HERO ==================================== */}
      <section className="relative overflow-hidden bg-navy-900 text-white">
        {/* layered wash — crimson at the top left, marigold low right */}
        <div className="absolute inset-0" aria-hidden="true">
          <div className="absolute -top-40 -left-32 w-[36rem] h-[36rem] rounded-full bg-crimson-600/25 blur-3xl" />
          <div className="absolute -bottom-52 -right-24 w-[34rem] h-[34rem] rounded-full bg-marigold-500/20 blur-3xl" />
          <svg className="absolute bottom-0 inset-x-0 w-full h-40 text-navy-950/40" viewBox="0 0 1200 160" preserveAspectRatio="none">
            <path d="M0 160 L120 70 L200 110 L310 30 L420 105 L530 55 L650 120 L760 60 L880 115 L1000 45 L1100 100 L1200 60 L1200 160Z" fill="currentColor" />
          </svg>
        </div>

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 pt-14 pb-20 sm:pt-20 sm:pb-28 xl:grid xl:grid-cols-[minmax(0,1fr)_22rem] xl:gap-12 xl:items-center">
          <div>
          <Badge tone="bg-white/12 text-marigold-200 border border-white/15" icon="shield-check" className="!text-[11px] backdrop-blur">
            Every listing checked before it goes live
          </Badge>

          <h1 className="mt-5 text-[2.1rem] leading-[1.1] sm:text-5xl lg:text-[3.5rem] font-bold text-white max-w-3xl">
            Find your next home in the{' '}
            <span className="text-marigold-300">Kathmandu Valley</span>
          </h1>

          <p className="mt-5 text-[16.5px] sm:text-lg text-navy-100 max-w-2xl leading-relaxed">
            Real photos, the full monthly cost including sewa sulka and water, and the
            owner's number on every listing. No commission from tenants — ever.
          </p>

          {/* ---- search card ------------------------------------- */}
          <form
            onSubmit={search}
            className="mt-9 bg-white rounded-2xl sm:rounded-3xl shadow-lift p-2.5 sm:p-3 max-w-4xl"
          >
            <div className="flex gap-1 p-1 bg-brick-100 rounded-xl mb-2.5 w-fit">
              {(['rent', 'sale'] as Purpose[]).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => { setPurpose(p); setBudget(''); }}
                  aria-pressed={purpose === p}
                  className={cx(
                    'px-5 py-2 rounded-lg text-[14px] font-bold transition-all',
                    purpose === p ? 'bg-white text-navy-900 shadow-sm' : 'text-brick-700 hover:text-navy-900',
                  )}
                >
                  {p === 'rent' ? 'Rent' : 'Buy'}
                </button>
              ))}
            </div>

            <div className="grid gap-2 sm:grid-cols-[1.6fr_1fr_1fr_auto]">
              <div className="relative">
                <Icon name="search" className="w-[18px] h-[18px] absolute left-3.5 top-1/2 -translate-y-1/2 text-brick-500" />
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Area, landmark or 2BHK"
                  aria-label="Search area, landmark or property"
                  className="field !pl-10 !py-3 !text-navy-900"
                />
              </div>

              <select value={area} onChange={(e) => setArea(e.target.value)} aria-label="Area" className="field !py-3">
                <option value="">Any area</option>
                {CITIES.map((c) => (
                  <optgroup key={c.name} label={c.name}>
                    {c.areas.map((a) => <option key={a} value={a}>{a}</option>)}
                  </optgroup>
                ))}
              </select>

              <select value={budget} onChange={(e) => setBudget(e.target.value)} aria-label="Budget" className="field !py-3">
                <option value="">Any budget</option>
                {budgetOptions.map((b) => (
                  <option key={b} value={b}>Up to {npr(b)}{purpose === 'rent' ? '/mo' : ''}</option>
                ))}
              </select>

              <button type="submit" className="btn-primary btn-lg sm:!px-7">
                <Icon name="search" className="w-[18px] h-[18px]" strokeWidth={2.2} />
                Search
              </button>
            </div>
          </form>

          {/* ---- quick area chips -------------------------------- */}
          <div className="mt-6 flex items-center gap-2 overflow-x-auto no-scrollbar scroll-fade pb-1">
            <span className="text-[13px] text-navy-200 font-medium shrink-0 mr-1">Popular:</span>
            {POPULAR_AREAS.map((a) => (
              <Link
                key={a}
                to={`/listings?areas=${encodeURIComponent(a)}`}
                className="shrink-0 text-[13px] font-medium px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 transition-colors backdrop-blur"
              >
                {a}
              </Link>
            ))}
          </div>

          {/* ---- counts ------------------------------------------ */}
          <dl className="mt-10 grid grid-cols-3 gap-4 max-w-xl">
            {[
              { n: counts.total, label: 'Live listings' },
              { n: counts.rent, label: 'To rent' },
              { n: counts.sale, label: 'For sale' },
            ].map((s) => (
              <div key={s.label}>
                <dt className="sr-only">{s.label}</dt>
                <dd>
                  <span className="block text-3xl sm:text-4xl font-display font-bold text-marigold-300 tabular-nums">{s.n}</span>
                  <span className="block text-[13px] text-navy-200 mt-0.5">{s.label}</span>
                </dd>
              </div>
            ))}
          </dl>
          </div>

          {/* Decorative composition — only where there is room for it. */}
          <div className="hidden xl:block relative h-[34rem]" aria-hidden="true">
            <div className="absolute left-0 top-2 w-[13rem] rounded-2xl overflow-hidden shadow-lift rotate-[-5deg] bg-white">
              <img src="/media/facade-2.svg" alt="" className="w-full aspect-[4/3] object-cover" />
              <div className="px-3.5 py-3">
                <div className="font-bold text-navy-900 text-[16px]">Rs 85,000<span className="text-[11.5px] text-brick-600 font-medium">/mo</span></div>
                <div className="text-[12px] text-brick-700 mt-0.5">3 BHK house · Baluwatar</div>
              </div>
            </div>

            <div className="absolute right-0 top-[15rem] w-[13rem] rounded-2xl overflow-hidden shadow-lift rotate-[4deg] bg-white">
              <img src="/media/terrace-1.svg" alt="" className="w-full aspect-[4/3] object-cover" />
              <div className="px-3.5 py-3">
                <div className="font-bold text-navy-900 text-[16px]">Rs 38,000<span className="text-[11.5px] text-brick-600 font-medium">/mo</span></div>
                <div className="text-[12px] text-brick-700 mt-0.5">2 BHK flat · Jhamsikhel</div>
              </div>
            </div>

            <div className="absolute left-0 top-[28.5rem] rounded-2xl bg-white shadow-lift px-4 py-3 rotate-[-3deg] flex items-center gap-2.5">
              <span className="w-9 h-9 rounded-full bg-jade-600 text-white grid place-items-center shrink-0">
                <Icon name="shield-check" className="w-5 h-5" />
              </span>
              <div>
                <div className="text-[13px] font-bold text-navy-900 leading-tight whitespace-nowrap">Visited &amp; verified</div>
                <div className="text-[11px] text-brick-600 whitespace-nowrap">by our team, on site</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================= BROWSE BY TYPE ========================== */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 -mt-10 sm:-mt-12 relative z-10">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 sm:gap-3">
          {QUICK_TYPES.map(({ type, blurb }) => {
            const token = PROPERTY_TYPE[type];
            return (
              <Link
                key={type}
                to={`/listings?types=${type}`}
                className="card p-4 hover:shadow-lift hover:-translate-y-0.5 transition-all group"
              >
                <span className={cx('w-10 h-10 rounded-xl grid place-items-center mb-3', token.soft, 'border')}>
                  <Icon name={(token.icon ?? 'house') as never} className="w-5 h-5" />
                </span>
                <div className="font-semibold text-[14.5px] leading-tight group-hover:text-crimson-700 transition-colors">
                  {blurb}
                </div>
                <div className="text-[12.5px] text-brick-600 mt-1">
                  {counts.byType[type] ?? 0} listed
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* ================= FEATURED ================================ */}
      {featured.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 sm:px-6 mt-16 sm:mt-20">
          <SectionHeading
            title="Handpicked this week"
            sub="Visited by our team, photographed on site, and the charges confirmed with the owner."
            action={
              <Link to="/listings" className="btn-outline btn-sm shrink-0 hidden sm:inline-flex">
                See all <Icon name="arrow-right" className="w-4 h-4" />
              </Link>
            }
          />
          <div className="grid gap-4 sm:gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {featured.map((l) => <ListingCard key={l.id} listing={l} />)}
          </div>
          <Link to="/listings" className="btn-outline w-full mt-5 sm:hidden">
            See all {counts.total} listings <Icon name="arrow-right" className="w-4 h-4" />
          </Link>
        </section>
      )}

      {/* ================= HOW IT WORKS ============================ */}
      <section className="mt-20 sm:mt-24 bg-brick-100 border-y border-brick-200 py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <SectionHeading
            title="How renting here works"
            sub="Three steps, no middleman, and no fee asked of you at any point."
          />
          <div className="grid gap-5 sm:gap-6 md:grid-cols-3">
            {[
              {
                n: '01', icon: 'search' as const, title: 'Search with real filters',
                body: 'Filter by area, budget, BHK and the things that actually decide it — car parking, water source, road width and furnishing.',
                tone: 'bg-navy-600',
              },
              {
                n: '02', icon: 'calendar' as const, title: 'Book a visit in a tap',
                body: 'Send a visit request with your preferred day and time. It lands on the owner\'s WhatsApp immediately, with the listing attached.',
                tone: 'bg-marigold-500',
              },
              {
                n: '03', icon: 'key' as const, title: 'Deal direct with the owner',
                body: 'Every number on the site is the owner or their caretaker. We take no commission from tenants, so nobody is pushing you into a place.',
                tone: 'bg-jade-600',
              },
            ].map((s) => (
              <div key={s.n} className="card p-6 relative overflow-hidden">
                <span className="absolute top-4 right-5 font-display text-5xl font-bold text-brick-200 select-none">{s.n}</span>
                <span className={cx('w-11 h-11 rounded-xl grid place-items-center text-white mb-4', s.tone)}>
                  <Icon name={s.icon} className="w-[22px] h-[22px]" />
                </span>
                <h3 className="font-bold text-[17px] mb-2">{s.title}</h3>
                <p className="text-[14.5px] text-brick-800 leading-relaxed">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================= NEWEST ================================== */}
      {newest.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 sm:px-6 mt-16 sm:mt-20">
          <SectionHeading title="Just posted" sub="The freshest listings on the site." />
          <div className="grid gap-4 sm:gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {newest.map((l) => <ListingCard key={l.id} listing={l} />)}
          </div>
        </section>
      )}

      {/* ================= OWNER CTA =============================== */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 mt-16 sm:mt-24">
        <div className="relative overflow-hidden rounded-3xl bg-navy-900 text-white px-6 sm:px-12 py-12 sm:py-16">
          <div className="absolute -right-20 -top-20 w-80 h-80 rounded-full bg-crimson-600/25 blur-3xl" aria-hidden="true" />
          <div className="absolute -left-16 -bottom-24 w-72 h-72 rounded-full bg-jade-600/20 blur-3xl" aria-hidden="true" />
          <div className="relative grid lg:grid-cols-[1.4fr_1fr] gap-10 items-center">
            <div>
              <h2 className="text-3xl sm:text-4xl font-bold text-white">Have a place to rent out?</h2>
              <p className="mt-4 text-navy-100 text-[16px] leading-relaxed max-w-xl">
                Put it up in under three minutes. Add your photos, the rent and what it
                really costs each month — we check it, publish it, and send you the
                enquiries directly. Free for the first listing.
              </p>
              <div className="mt-7 flex flex-wrap gap-3">
                <Link to="/post" className="btn-marigold btn-lg">
                  <Icon name="plus" className="w-4.5 h-4.5" strokeWidth={2.4} /> Post a property
                </Link>
                <Link to="/contact" className="btn-lg btn border border-white/25 text-white hover:bg-white/10">
                  Talk to our team
                </Link>
              </div>
            </div>
            <ul className="space-y-3.5">
              {[
                'Listing stays live for 30 days, renewable in one tap',
                'Mark it rented the moment it goes — no stale calls',
                'Shareable link with a proper preview for Facebook groups',
                'We answer the first round of questions for you',
              ].map((t) => (
                <li key={t} className="flex gap-3 text-[14.5px] text-navy-100">
                  <Icon name="check-circle" className="w-5 h-5 text-jade-400 shrink-0 mt-0.5" />
                  {t}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
}
