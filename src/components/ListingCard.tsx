import { useState } from 'react';
import { Link } from 'react-router-dom';
import { displayStatus, statusToken } from '../lib/expiry';
import { availabilityLabel, npr, nprShort, relativeTime } from '../lib/format';
import { useLang, pickLang } from '../lib/i18n';
import { listingPath } from '../lib/share';
import { useStore } from '../lib/store';
import { FURNISHING, PROPERTY_TYPE, PURPOSE } from '../lib/taxonomy';
import type { Listing } from '../lib/types';
import { Icon } from './Icon';
import { Badge, cx, useInView } from './ui';

function bhkLabel(l: Listing): string | null {
  if (!l.bhk) return null;
  return l.bhk === 'rk' ? 'RK' : `${l.bhk} BHK`;
}

export function ListingCard({ listing: l, layout = 'grid' }: { listing: Listing; layout?: 'grid' | 'row' }) {
  const { isSaved, toggleSave } = useStore();
  const { lang } = useLang();
  const [ref, seen] = useInView<HTMLDivElement>();
  const saved = isSaved(l.id);
  const status = displayStatus(l);
  const token = statusToken(l);
  const typeToken = PROPERTY_TYPE[l.type];
  const purposeToken = PURPOSE[l.purpose];
  const dimmed = status === 'rented' || status === 'expired';

  const photo = l.photos[0];
  const price = l.purpose === 'rent' ? npr(l.price) : nprShort(l.price);

  const onSave = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleSave(l.id);
  };

  const meta = [bhkLabel(l), `${l.bathrooms || 0} bath`, l.builtUpArea ? `${l.builtUpArea} sq ft` : l.landArea]
    .filter(Boolean) as string[];

  return (
    <div ref={ref} className="h-full">
      <Link
        to={listingPath(l)}
        className={cx(
          'group card overflow-hidden h-full flex transition-all duration-200 hover:shadow-lift hover:-translate-y-0.5',
          layout === 'grid' ? 'flex-col' : 'flex-col sm:flex-row',
        )}
      >
        {/* ---- photo ---------------------------------------------- */}
        <div
          className={cx(
            'relative overflow-hidden bg-brick-200 shrink-0',
            layout === 'grid' ? 'aspect-[4/3]' : 'aspect-[4/3] sm:aspect-auto sm:w-72',
          )}
        >
          {seen && photo ? (
            <img
              src={photo.src}
              alt={photo.alt}
              loading="lazy"
              decoding="async"
              className={cx(
                'w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.04]',
                dimmed && 'grayscale-[.7] opacity-80',
              )}
            />
          ) : (
            <div className="w-full h-full skeleton" />
          )}

          {/* top-left: what it is */}
          <div className="absolute top-3 left-3 flex flex-wrap gap-1.5 max-w-[calc(100%-4rem)]">
            <Badge tone={purposeToken.solid} className="shadow-sm">
              {pickLang(lang, purposeToken.label, purposeToken.labelNe)}
            </Badge>
            <Badge tone={typeToken.solid} className="shadow-sm">
              {pickLang(lang, typeToken.label.split(' /')[0], typeToken.labelNe)}
            </Badge>
          </div>

          {/* top-right: save */}
          <button
            onClick={onSave}
            aria-label={saved ? 'Remove from saved' : 'Save this property'}
            aria-pressed={saved}
            className={cx(
              'absolute top-2.5 right-2.5 w-9 h-9 rounded-full grid place-items-center transition-all',
              'bg-white/92 backdrop-blur shadow-sm hover:scale-110 active:scale-95',
              saved ? 'text-crimson-600' : 'text-navy-700',
            )}
          >
            <Icon name="heart" className="w-[18px] h-[18px]" filled={saved} strokeWidth={2} />
          </button>

          {/* bottom-left: status, only when it needs saying */}
          {status !== 'active' && (
            <div className="absolute bottom-3 left-3">
              <Badge tone={token.solid} className="shadow-sm">
                {pickLang(lang, token.label, token.labelNe)}
              </Badge>
            </div>
          )}

          {/* bottom-right: photo & video count */}
          <div className="absolute bottom-3 right-3 flex gap-1.5">
            {l.video && (
              <span className="badge bg-navy-950/75 text-white backdrop-blur-sm">
                <Icon name="play" className="w-3 h-3" strokeWidth={2.2} /> Video
              </span>
            )}
            <span className="badge bg-navy-950/75 text-white backdrop-blur-sm">
              <Icon name="camera" className="w-3 h-3" strokeWidth={2.2} /> {l.photos.length}
            </span>
          </div>

          {dimmed && <div className="absolute inset-0 bg-navy-950/10" />}
        </div>

        {/* ---- body ------------------------------------------------ */}
        <div className="p-4 sm:p-4.5 flex flex-col grow min-w-0">
          <div className="flex items-baseline gap-1.5 flex-wrap">
            <span className="text-[21px] font-bold text-navy-900 tracking-tight">{price}</span>
            {l.purpose === 'rent' && <span className="text-[13px] text-brick-600 font-medium">/month</span>}
            {l.negotiable && (
              <span className="text-[11px] font-semibold text-jade-700 bg-jade-50 border border-jade-200 rounded px-1.5 py-0.5 ml-auto">
                Negotiable
              </span>
            )}
          </div>

          {l.purpose === 'rent' && !!l.deposit && (
            <div className="text-[12.5px] text-brick-600 mt-0.5">
              {npr(l.deposit)} deposit
              {!!l.serviceCharge && ` · ${npr(l.serviceCharge)} service`}
            </div>
          )}

          <h3 className="font-display font-bold text-[16.5px] leading-snug mt-2 line-clamp-2 group-hover:text-crimson-700 transition-colors">
            {pickLang(lang, l.title, l.titleNe)}
          </h3>

          <div className="flex items-start gap-1.5 text-[13.5px] text-brick-700 mt-1.5">
            <Icon name="pin" className="w-4 h-4 shrink-0 mt-px text-crimson-600" />
            <span className="line-clamp-1">{l.area}, {l.city}</span>
          </div>

          {!!meta.length && (
            <div className="flex items-center flex-wrap gap-x-0 gap-y-1 mt-2.5 text-[13px] text-navy-700">
              {meta.map((m, i) => (
                <span key={m} className={cx('font-medium', i < meta.length - 1 && 'divider-dot')}>{m}</span>
              ))}
            </div>
          )}

          <div className="mt-3 flex flex-wrap gap-1.5">
            <Badge tone={FURNISHING[l.furnishing].soft + ' border'}>
              {FURNISHING[l.furnishing].label}
            </Badge>
            {l.parking.car > 0 && (
              <Badge tone="bg-brick-100 text-brick-800 border border-brick-300" icon="car">
                {l.parking.car} car
              </Badge>
            )}
            {l.verified && (
              <Badge tone="bg-jade-50 text-jade-800 border border-jade-200" icon="verified">
                Verified
              </Badge>
            )}
          </div>

          <div className="mt-auto pt-3.5 flex items-center justify-between gap-2 text-[12px] text-brick-600 border-t border-brick-100 mt-3">
            <span className="flex items-center gap-1.5">
              <Icon name="calendar" className="w-3.5 h-3.5" />
              {availabilityLabel(l.availableFrom)}
            </span>
            <span className="flex items-center gap-1.5 shrink-0">
              <Icon name="clock" className="w-3.5 h-3.5" />
              {relativeTime(l.postedAt)}
            </span>
          </div>
        </div>
      </Link>
    </div>
  );
}

/** Placeholder shown while a list is being computed. */
export function ListingCardSkeleton() {
  return (
    <div className="card overflow-hidden h-full">
      <div className="aspect-[4/3] skeleton rounded-none" />
      <div className="p-4 space-y-3">
        <div className="h-6 w-28 skeleton" />
        <div className="h-4 w-full skeleton" />
        <div className="h-4 w-2/3 skeleton" />
        <div className="h-3 w-1/2 skeleton" />
      </div>
    </div>
  );
}

/** Compact horizontal card used in the "similar properties" rail. */
export function ListingMini({ listing: l }: { listing: Listing }) {
  const [broken, setBroken] = useState(false);
  return (
    <Link to={listingPath(l)} className="flex gap-3 group p-2 -m-2 rounded-xl hover:bg-brick-100 transition-colors">
      <div className="w-24 h-20 rounded-lg overflow-hidden bg-brick-200 shrink-0">
        {!broken && l.photos[0] && (
          <img
            src={l.photos[0].src}
            alt={l.photos[0].alt}
            loading="lazy"
            onError={() => setBroken(true)}
            className="w-full h-full object-cover"
          />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="font-bold text-[15px]">
          {l.purpose === 'rent' ? `${npr(l.price)}/mo` : nprShort(l.price)}
        </div>
        <div className="text-[13px] line-clamp-2 leading-snug text-navy-800 group-hover:text-crimson-700">
          {l.title}
        </div>
        <div className="text-[12px] text-brick-600 mt-0.5">{l.area}, {l.city}</div>
      </div>
    </Link>
  );
}
