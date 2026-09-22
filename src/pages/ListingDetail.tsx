import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ActionRow, ContactButtons, VisitModal } from '../components/ContactActions';
import { Gallery } from '../components/Gallery';
import { Icon, type IconName } from '../components/Icon';

import { MapPin } from '../components/MapPin';
import { Badge, SectionHeading, Spec, cx } from '../components/ui';
import { displayStatus, expiryLine, statusToken } from '../lib/expiry';
import {
  availabilityLabel, fmtDate, monthlyTotal, npr, nprShort, prettyPhone, relativeTime,
} from '../lib/format';
import { pickLang, useLang } from '../lib/i18n';
import { similarListings } from '../lib/search';
import { applyMeta, listingJsonLd, listingMeta } from '../lib/seo';
import { useStore } from '../lib/store';
import {
  AMENITY_MAP, FURNISHING, PROPERTY_TYPE, PURPOSE, ROAD, WATER,
} from '../lib/taxonomy';
import type { Listing } from '../lib/types';
import { Photo } from '../components/Photo';

export function ListingDetail() {
  const { slug = '' } = useParams();
  const { bySlug, listings, trackView } = useStore();
  const { lang, t } = useLang();
  const [visitOpen, setVisitOpen] = useState(false);
  const priceRef = useRef<HTMLDivElement>(null);
  const [showStickyBar, setShowStickyBar] = useState(false);

  const listing = bySlug(slug);

  // Count the view once per mount, not on every re-render.
  const countedRef = useRef<string | null>(null);
  useEffect(() => {
    if (listing && countedRef.current !== listing.id) {
      countedRef.current = listing.id;
      trackView(listing.id);
    }
  }, [listing, trackView]);

  useEffect(() => {
    if (listing) applyMeta(listingMeta(listing));
  }, [listing]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [slug]);

  // The sticky mobile contact bar appears once the price block scrolls away.
  useEffect(() => {
    const el = priceRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setShowStickyBar(!e.isIntersecting), { threshold: 0 });
    io.observe(el);
    return () => io.disconnect();
  }, [listing]);

  const similar = useMemo(
    () => (listing ? similarListings(listing, listings) : []),
    [listing, listings],
  );

  if (!listing) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-24 text-center">
        <div className="w-16 h-16 rounded-2xl bg-brick-100 grid place-items-center mx-auto mb-5 text-brick-500">
          <Icon name="house" className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-bold mb-2">This property is no longer listed</h1>
        <p className="text-brick-700 mb-6">
          It may have been rented out, or the link may be mistyped.
        </p>
        <Link to="/listings" className="btn-primary btn-lg">Browse all properties</Link>
      </div>
    );
  }

  const l = listing;
  const status = displayStatus(l);
  const token = statusToken(l);
  const typeToken = PROPERTY_TYPE[l.type];
  const purposeToken = PURPOSE[l.purpose];
  const unavailable = status === 'rented' || status === 'expired';

  return (
    <div className="pb-28 sm:pb-12">
      {/* ---- breadcrumb ------------------------------------------- */}
      <nav aria-label="Breadcrumb" className="mx-auto max-w-7xl px-4 sm:px-6 pt-4 pb-3 no-print">
        <ol className="flex items-center gap-1.5 text-[13px] text-brick-600 flex-wrap">
          <li><Link to="/" className="hover:text-crimson-700">Home</Link></li>
          <li aria-hidden="true">/</li>
          <li><Link to={`/listings?for=${l.purpose}`} className="hover:text-crimson-700">{purposeToken.label}</Link></li>
          <li aria-hidden="true">/</li>
          <li><Link to={`/listings?areas=${encodeURIComponent(l.area)}`} className="hover:text-crimson-700">{l.area}</Link></li>
          <li aria-hidden="true">/</li>
          <li className="text-navy-800 font-medium line-clamp-1">{l.title}</li>
        </ol>
      </nav>

      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        {/* ---- gallery ------------------------------------------- */}
        <Gallery photos={l.photos} video={l.video} title={l.title} />

        <div className="lg:grid lg:grid-cols-[1fr_22rem] lg:gap-10 mt-6 sm:mt-8">
          {/* ================= MAIN COLUMN ======================= */}
          <div className="min-w-0">
            <div className="flex flex-wrap gap-2 mb-3">
              <Badge tone={purposeToken.solid}>{pickLang(lang, purposeToken.label, purposeToken.labelNe)}</Badge>
              <Badge tone={typeToken.solid}>{pickLang(lang, typeToken.label, typeToken.labelNe)}</Badge>
              <Badge tone={token.soft + ' border'}>{pickLang(lang, token.label, token.labelNe)}</Badge>
              {l.verified && (
                <Badge tone="bg-jade-50 text-jade-800 border border-jade-200" icon="verified">Verified by SK</Badge>
              )}
              {l.negotiable && (
                <Badge tone="bg-marigold-50 text-marigold-800 border border-marigold-200">Price negotiable</Badge>
              )}
            </div>

            <h1 className="text-[26px] sm:text-4xl font-bold leading-tight">
              {pickLang(lang, l.title, l.titleNe)}
            </h1>

            <div className="flex items-start gap-2 mt-3 text-[15px] text-brick-800">
              <Icon name="pin" className="w-[18px] h-[18px] text-crimson-600 shrink-0 mt-0.5" />
              <span>{l.landmark} — {l.area}, {l.city}</span>
            </div>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mt-3 text-[13px] text-brick-600">
              <span className="flex items-center gap-1.5">
                <Icon name="clock" className="w-3.5 h-3.5" /> {t('detail.posted')} {relativeTime(l.postedAt)}
              </span>
              {l.updatedAt !== l.postedAt && (
                <span className="flex items-center gap-1.5">
                  <Icon name="refresh" className="w-3.5 h-3.5" /> {t('detail.updated')} {relativeTime(l.updatedAt)}
                </span>
              )}
              <span className="flex items-center gap-1.5">
                <Icon name="eye" className="w-3.5 h-3.5" /> {l.views} views
              </span>
              <span className="font-mono text-[12px] text-brick-500">Ref {l.id.toUpperCase()}</span>
            </div>

            <div className="mt-5 no-print">
              <ActionRow listing={l} />
            </div>

            {unavailable && (
              <div className={cx(
                'mt-5 rounded-2xl border p-4 flex gap-3',
                status === 'rented' ? 'bg-navy-50 border-navy-200' : 'bg-brick-100 border-brick-300',
              )}>
                <Icon name="info" className="w-5 h-5 shrink-0 mt-0.5 text-navy-700" />
                <div className="text-[14.5px]">
                  <div className="font-semibold text-navy-900">
                    {status === 'rented' ? 'This property has been rented out' : 'This listing has expired'}
                  </div>
                  <p className="text-brick-800 mt-1">
                    {status === 'rented'
                      ? 'The owner marked it as taken. It stays here so you can see what the street rents for.'
                      : 'Listings come down after their run unless the owner renews. Details may be out of date.'}
                    {' '}
                    <Link to={`/listings?areas=${encodeURIComponent(l.area)}`} className="font-semibold text-crimson-700 hover:underline">
                      See what's available in {l.area}
                    </Link>
                  </p>
                </div>
              </div>
            )}

            {/* ---- price block (mobile) -------------------------- */}
            <div ref={priceRef} className="lg:hidden mt-6">
              <PriceCard listing={l} onVisit={() => setVisitOpen(true)} />
            </div>

            {/* ---- key facts strip ------------------------------- */}
            <section className="mt-8 card p-5 sm:p-6">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-5">
                {l.bhk && (
                  <Fact icon="bed" value={l.bhk === 'rk' ? 'RK' : l.bhk} label={l.bhk === 'rk' ? 'Room + kitchen' : 'Bedrooms'} />
                )}
                <Fact icon="bath" value={String(l.bathrooms)} label="Bathrooms" />
                {l.builtUpArea && <Fact icon="ruler" value={String(l.builtUpArea)} label="Sq ft built-up" />}
                {l.landArea && <Fact icon="map" value={l.landArea} label="Land area" />}
                {l.parking.car > 0 && <Fact icon="car" value={String(l.parking.car)} label="Car parking" />}
                {l.parking.bike > 0 && <Fact icon="bike" value={String(l.parking.bike)} label="Bike parking" />}
              </div>
            </section>

            {/* ---- description ----------------------------------- */}
            <section className="mt-10">
              <h2 className="text-2xl font-bold mb-4">{t('detail.about')}</h2>
              <div className="text-[15.5px] leading-[1.75] text-navy-800 space-y-4">
                {l.description.split('\n\n').map((p, i) => <p key={i}>{p}</p>)}
              </div>
              {l.preferredTenant && (
                <div className="mt-5 flex gap-3 p-4 rounded-xl bg-marigold-50 border border-marigold-200">
                  <Icon name="users" className="w-5 h-5 text-marigold-700 shrink-0 mt-0.5" />
                  <div className="text-[14.5px]">
                    <span className="font-semibold text-marigold-900">Owner's preference: </span>
                    <span className="text-marigold-900">{l.preferredTenant}</span>
                  </div>
                </div>
              )}
            </section>

            {/* ---- the basics ------------------------------------ */}
            <section className="mt-10">
              <h2 className="text-2xl font-bold mb-5">{t('detail.basics')}</h2>
              <div className="card p-5 sm:p-6 grid sm:grid-cols-2 gap-5">
                <Spec icon="drop" label={t('detail.water')} value={WATER[l.water].label} />
                <Spec
                  icon="road"
                  label={t('basics.road')}
                  value={`${ROAD[l.roadAccess].label}${l.roadWidthFt ? ` · ${l.roadWidthFt} ft wide` : ''}`}
                />
                <Spec
                  icon="car"
                  label={t('basics.parking')}
                  value={
                    l.parking.car || l.parking.bike
                      ? [l.parking.car && `${l.parking.car} car`, l.parking.bike && `${l.parking.bike} bike`]
                          .filter(Boolean).join(' · ')
                      : 'No parking'
                  }
                />
                <Spec icon="sofa" label={t('basics.furnishing')} value={FURNISHING[l.furnishing].label} />
                <Spec icon="bath" label={t('basics.bathroom')} value={String(l.bathrooms)} />
                {l.floor && <Spec icon="building" label={t('basics.floor')} value={l.floor} />}
                {l.facing && <Spec icon="compass" label={t('basics.facing')} value={`${l.facing} facing`} />}
                {l.electricityNote && <Spec icon="bolt" label="Electricity" value={l.electricityNote} />}
              </div>
            </section>

            {/* ---- amenities ------------------------------------- */}
            {l.amenities.length > 0 && (
              <section className="mt-10">
                <h2 className="text-2xl font-bold mb-5">{t('detail.amenities')}</h2>
                <div className="card p-5 sm:p-6 grid grid-cols-2 sm:grid-cols-3 gap-y-4 gap-x-5">
                  {l.amenities.map((key) => {
                    const a = AMENITY_MAP[key];
                    if (!a) return null;
                    return (
                      <div key={key} className="flex items-center gap-2.5 text-[14.5px]">
                        <span className="w-7 h-7 rounded-lg bg-jade-50 text-jade-700 grid place-items-center shrink-0">
                          <Icon name="check" className="w-3.5 h-3.5" strokeWidth={3} />
                        </span>
                        {pickLang(lang, a.label, a.labelNe)}
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {/* ---- availability ---------------------------------- */}
            <section className="mt-10">
              <h2 className="text-2xl font-bold mb-5">{t('detail.availability')}</h2>
              <div className="card p-5 sm:p-6 grid sm:grid-cols-3 gap-5">
                <Spec icon="calendar" label="Move in from" value={availabilityLabel(l.availableFrom)} />
                <Spec icon="clock" label="Posted on" value={fmtDate(l.postedAt)} />
                <Spec icon="refresh" label="Listing status" value={expiryLine(l)} />
              </div>
            </section>

            {/* ---- location -------------------------------------- */}
            <section className="mt-10">
              <h2 className="text-2xl font-bold mb-5">{t('detail.location')}</h2>
              <MapPin listing={l} />
            </section>

            {/* ---- similar --------------------------------------- */}
            {similar.length > 0 && (
              <section className="mt-14 no-print">
                <SectionHeading title={t('detail.similar')} sub={`Other places around ${l.area} in a similar range.`} />
                <div className="grid gap-4 sm:grid-cols-3">
                  {similar.map((s) => (
                    <Link
                      key={s.id}
                      to={`/property/${s.slug}`}
                      className="card overflow-hidden group hover:shadow-lift hover:-translate-y-0.5 transition-all"
                    >
                      <div className="aspect-[4/3] bg-brick-200 overflow-hidden">
                        <Photo
                          src={s.photos[0]?.src}
                          alt={s.photos[0]?.alt ?? ''}
                          loading="lazy"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      </div>
                      <div className="p-4">
                        <div className="font-bold text-[17px]">
                          {s.purpose === 'rent' ? `${npr(s.price)}` : nprShort(s.price)}
                          {s.purpose === 'rent' && <span className="text-[13px] text-brick-600 font-medium">/mo</span>}
                        </div>
                        <div className="text-[14px] mt-1 line-clamp-2 leading-snug group-hover:text-crimson-700">{s.title}</div>
                        <div className="text-[12.5px] text-brick-600 mt-1.5">{s.area}, {s.city}</div>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            )}
          </div>

          {/* ================= SIDEBAR =========================== */}
          <aside className="hidden lg:block">
            <div className="sticky top-[5rem] space-y-4">
              <PriceCard listing={l} onVisit={() => setVisitOpen(true)} />
              <SafetyNote />
            </div>
          </aside>
        </div>

        <div className="lg:hidden mt-8">
          <SafetyNote />
        </div>
      </div>

      {/* ---- sticky mobile contact bar ---------------------------- */}
      {showStickyBar && !unavailable && (
        <div className="sm:hidden fixed bottom-[3.75rem] inset-x-0 z-40 bg-white border-t border-brick-200 px-4 py-3 shadow-lift animate-slide-up no-print">
          <div className="flex items-center gap-3">
            <div className="min-w-0">
              <div className="font-bold text-[17px] leading-tight">
                {l.purpose === 'rent' ? npr(l.price) : nprShort(l.price)}
                {l.purpose === 'rent' && <span className="text-[12px] text-brick-600 font-medium">/mo</span>}
              </div>
              <div className="text-[11.5px] text-brick-600 truncate">{l.area}, {l.city}</div>
            </div>
            <div className="flex gap-2 ml-auto shrink-0">
              <a href={`tel:+977${l.phone}`} className="btn-navy btn-sm !px-3.5" aria-label="Call owner">
                <Icon name="phone" className="w-4 h-4" strokeWidth={2.2} />
              </a>
              <button onClick={() => setVisitOpen(true)} className="btn-primary btn-sm">Request visit</button>
            </div>
          </div>
        </div>
      )}

      <VisitModal listing={l} open={visitOpen} onClose={() => setVisitOpen(false)} />

      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(listingJsonLd(l, typeof window === 'undefined' ? '' : window.location.origin)),
        }}
      />
    </div>
  );
}

/* ==================== Price + contact card ========================== */

function PriceCard({ listing: l, onVisit }: { listing: Listing; onVisit: () => void }) {
  const { t } = useLang();
  const status = displayStatus(l);
  const unavailable = status === 'rented' || status === 'expired';
  const total = monthlyTotal(l);
  const hasExtras = l.purpose === 'rent' && total !== l.price;

  return (
    <div className="card p-5 sm:p-6">
      <div className="flex items-baseline gap-2 flex-wrap">
        <span className="text-[32px] font-bold tracking-tight leading-none">
          {l.priceOnRequest ? 'On request' : l.purpose === 'rent' ? npr(l.price) : nprShort(l.price)}
        </span>
        {l.purpose === 'rent' && !l.priceOnRequest && (
          <span className="text-[15px] text-brick-600 font-medium">/month</span>
        )}
      </div>

      {l.purpose === 'sale' && !l.priceOnRequest && (
        <div className="text-[13px] text-brick-600 mt-1">{npr(l.price)}</div>
      )}

      {/* Every recurring rupee, itemised. This is the honesty the site sells on. */}
      {l.purpose === 'rent' && (
        <dl className="mt-4 space-y-2 text-[14px] border-t border-brick-200 pt-4">
          <Row label={t('detail.monthly')} value={npr(l.price)} />
          {!!l.serviceCharge && <Row label={t('detail.service')} value={npr(l.serviceCharge)} />}
          {!!l.waterCharge && <Row label={t('detail.water')} value={npr(l.waterCharge)} />}
          {hasExtras && (
            <div className="flex justify-between pt-2.5 mt-1 border-t border-brick-200 font-bold text-[15px]">
              <dt>Monthly total</dt>
              <dd className="tabular-nums">{npr(total)}</dd>
            </div>
          )}
          {!!l.deposit && (
            <Row
              label={`${t('detail.deposit')} (one time)`}
              value={npr(l.deposit)}
              note={`${Math.round(l.deposit / l.price)} months`}
            />
          )}
          {l.electricityNote && (
            <div className="text-[12.5px] text-brick-600 pt-1.5 flex gap-1.5">
              <Icon name="bolt" className="w-3.5 h-3.5 shrink-0 mt-px" />
              Electricity: {l.electricityNote}
            </div>
          )}
        </dl>
      )}

      {unavailable ? (
        <div className="mt-5">
          <div className="rounded-xl bg-brick-100 border border-brick-300 p-3.5 text-center text-[14px] text-brick-800 font-medium">
            {status === 'rented' ? 'Already rented out' : 'Listing expired'}
          </div>
          <Link to={`/listings?areas=${encodeURIComponent(l.area)}`} className="btn-outline w-full mt-3">
            See similar in {l.area}
          </Link>
        </div>
      ) : (
        <div className="mt-5 space-y-2.5 no-print">
          <button onClick={onVisit} className="btn-primary btn-lg w-full">
            <Icon name="calendar" className="w-4.5 h-4.5" /> {t('action.visit')}
          </button>
          <ContactButtons listing={l} />
        </div>
      )}

      <div className="mt-5 pt-4 border-t border-brick-200 flex items-center gap-3">
        <span className="w-10 h-10 rounded-full bg-navy-900 text-white grid place-items-center font-bold text-[15px] shrink-0">
          {l.contactName.trim()[0]?.toUpperCase()}
        </span>
        <div className="min-w-0">
          <div className="font-semibold text-[14.5px] flex items-center gap-1.5">
            {l.contactName}
            {l.verified && <Icon name="verified" className="w-4 h-4 text-jade-600" />}
          </div>
          <div className="text-[13px] text-brick-600">{prettyPhone(l.phone)}</div>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-brick-700 min-w-0">
        {label}
        {note && <span className="text-[12px] text-brick-500 ml-1.5 whitespace-nowrap">({note})</span>}
      </dt>
      <dd className="font-semibold tabular-nums shrink-0">{value}</dd>
    </div>
  );
}

function Fact({ icon, value, label }: { icon: IconName; value: string; label: string }) {
  return (
    <div className="text-center sm:text-left">
      <Icon name={icon} className="w-6 h-6 text-crimson-600 mx-auto sm:mx-0 mb-2" />
      <div className="text-xl font-bold leading-none">{value}</div>
      <div className="text-[12.5px] text-brick-600 mt-1">{label}</div>
    </div>
  );
}

function SafetyNote() {
  return (
    <div className="rounded-2xl border border-jade-200 bg-jade-50 p-5">
      <div className="flex items-center gap-2 font-bold text-jade-900 text-[15px] mb-3">
        <Icon name="shield-check" className="w-5 h-5" /> Before you pay anything
      </div>
      <ul className="space-y-2 text-[13.5px] text-jade-900/90">
        {[
          'Visit the property in person before paying any deposit.',
          'SK Real Estate never asks tenants for a commission or booking fee.',
          'Get the deposit amount and notice period written into the agreement.',
          'Check the electricity and water meters are separate before signing.',
        ].map((s) => (
          <li key={s} className="flex gap-2">
            <Icon name="check" className="w-3.5 h-3.5 shrink-0 mt-1" strokeWidth={3} />
            {s}
          </li>
        ))}
      </ul>
    </div>
  );
}
