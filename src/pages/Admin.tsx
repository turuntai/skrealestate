import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Icon } from '../components/Icon';
import { Badge, EmptyState, Modal, cx, useToast } from '../components/ui';
import {
  DURATION_OPTIONS, daysLeft, displayStatus, expiryLine, statusToken, type DisplayStatus,
} from '../lib/expiry';
import { fmtDate, npr, nprShort, relativeTime } from '../lib/format';
import { applyMeta } from '../lib/seo';
import { useStore } from '../lib/store';
import { PROPERTY_TYPE, STATUS } from '../lib/taxonomy';
import type { Listing } from '../lib/types';

type Tab = 'all' | 'active' | 'expiring' | 'rented' | 'expired';

const TABS: { key: Tab; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'active', label: 'Live' },
  { key: 'expiring', label: 'Expiring soon' },
  { key: 'rented', label: 'Rented' },
  { key: 'expired', label: 'Expired' },
];

export function Admin() {
  const { listings, markRented, renew, deleteListing, updateListing, visits, reports, resetDemoData } = useStore();
  const toast = useToast();
  const [tab, setTab] = useState<Tab>('all');
  const [q, setQ] = useState('');
  const [confirmDelete, setConfirmDelete] = useState<Listing | null>(null);
  const [renewing, setRenewing] = useState<Listing | null>(null);
  const [resetOpen, setResetOpen] = useState(false);

  useEffect(() => {
    applyMeta({
      title: 'Manage listings',
      description: 'SK Real Estate internal dashboard: renew, mark rented and retire listings.',
    });
  }, []);

  const withStatus = useMemo(
    () => listings.map((l) => ({ l, status: displayStatus(l) as DisplayStatus })),
    [listings],
  );

  const counts = useMemo(() => {
    const c: Record<Tab, number> = { all: withStatus.length, active: 0, expiring: 0, rented: 0, expired: 0 };
    withStatus.forEach(({ status }) => { c[status as Tab] += 1; });
    return c;
  }, [withStatus]);

  const rows = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return withStatus
      .filter(({ status }) => tab === 'all' || status === tab)
      .filter(({ l }) =>
        !needle ||
        [l.title, l.area, l.city, l.contactName, l.phone, l.id].join(' ').toLowerCase().includes(needle))
      .sort((a, b) => +new Date(b.l.updatedAt) - +new Date(a.l.updatedAt));
  }, [withStatus, tab, q]);

  const visitsFor = (id: string) => visits.filter((v) => v.listingId === id).length;
  const reportsFor = (id: string) => reports.filter((r) => r.listingId === id).length;

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8">
      {/* ---- header -------------------------------------------------- */}
      <div className="flex flex-wrap items-start justify-between gap-4 mb-7">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-3xl font-bold">Manage listings</h1>
            <Badge tone="bg-navy-900 text-white">Admin</Badge>
          </div>
          <p className="text-brick-700 mt-1.5 text-[15px]">
            Renew before a listing ages out, mark it rented the day it goes, and keep the
            board honest.
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setResetOpen(true)} className="btn-outline btn-sm">
            <Icon name="refresh" className="w-4 h-4" /> Reset demo data
          </button>
          <Link to="/post" className="btn-primary">
            <Icon name="plus" className="w-4 h-4" strokeWidth={2.4} /> New listing
          </Link>
        </div>
      </div>

      {/* ---- stat tiles --------------------------------------------- */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-7">
        {([
          { key: 'all', label: 'Total listings', tone: 'bg-white', accent: 'text-navy-900' },
          { key: 'active', label: STATUS.active.label, tone: 'bg-jade-50 border-jade-200', accent: 'text-jade-700' },
          { key: 'expiring', label: STATUS.expiring.label, tone: 'bg-marigold-50 border-marigold-200', accent: 'text-marigold-700' },
          { key: 'rented', label: STATUS.rented.label, tone: 'bg-navy-50 border-navy-200', accent: 'text-navy-700' },
          { key: 'expired', label: STATUS.expired.label, tone: 'bg-brick-100 border-brick-300', accent: 'text-brick-700' },
        ] as { key: Tab; label: string; tone: string; accent: string }[]).map((s) => (
          <button
            key={s.key}
            onClick={() => setTab(s.key)}
            className={cx(
              'rounded-2xl border p-4 text-left transition-all hover:-translate-y-0.5 hover:shadow-card',
              s.tone,
              tab === s.key ? 'ring-2 ring-navy-900 border-transparent' : 'border-brick-200',
            )}
          >
            <div className={cx('text-3xl font-display font-bold tabular-nums', s.accent)}>{counts[s.key]}</div>
            <div className="text-[13px] text-brick-700 mt-0.5 font-medium">{s.label}</div>
          </button>
        ))}
      </div>

      {/* ---- toolbar ------------------------------------------------- */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={cx('shrink-0', tab === t.key ? 'chip-on' : 'chip-off')}
            >
              {t.label}
              <span className="opacity-60 tabular-nums">{counts[t.key]}</span>
            </button>
          ))}
        </div>
        <div className="relative sm:ml-auto sm:w-72">
          <Icon name="search" className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-brick-500" />
          <input
            value={q} onChange={(e) => setQ(e.target.value)}
            placeholder="Search title, area, owner or ref"
            aria-label="Search listings"
            className="field !pl-10 !py-2 !text-[14px]"
          />
        </div>
      </div>

      {/* ---- table ---------------------------------------------------- */}
      {rows.length === 0 ? (
        <div className="card">
          <EmptyState
            icon="list"
            title="Nothing here"
            body={q ? 'No listing matches that search.' : 'No listings in this state right now.'}
          />
        </div>
      ) : (
        <div className="card overflow-hidden">
          {/* desktop header */}
          <div className="hidden lg:grid grid-cols-[1fr_8rem_9.5rem_7rem_15rem] gap-4 px-5 py-3 bg-brick-100 border-b border-brick-200 text-[12px] font-bold uppercase tracking-wide text-brick-700">
            <span>Property</span>
            <span>Price</span>
            <span>Status</span>
            <span>Activity</span>
            <span className="text-right">Actions</span>
          </div>

          <ul className="divide-y divide-brick-200">
            {rows.map(({ l, status }) => {
              const token = statusToken(l);
              const left = daysLeft(l);
              return (
                <li key={l.id} className="grid lg:grid-cols-[1fr_8rem_9.5rem_7rem_15rem] gap-4 px-4 sm:px-5 py-4 items-center hover:bg-brick-50 transition-colors">
                  {/* property */}
                  <div className="flex gap-3 min-w-0">
                    <img
                      src={l.photos[0]?.src} alt=""
                      className={cx('w-16 h-14 rounded-lg object-cover shrink-0 bg-brick-200', status !== 'active' && status !== 'expiring' && 'grayscale opacity-70')}
                      loading="lazy"
                    />
                    <div className="min-w-0">
                      <Link to={`/property/${l.slug}`} className="font-semibold text-[14.5px] line-clamp-1 hover:text-crimson-700">
                        {l.title}
                      </Link>
                      <div className="text-[12.5px] text-brick-600 mt-0.5 line-clamp-1">
                        {l.area}, {l.city} · {PROPERTY_TYPE[l.type].label.split(' /')[0]}
                      </div>
                      <div className="text-[11.5px] text-brick-500 mt-0.5 font-mono">
                        {l.id.toUpperCase()} · {l.contactName}
                      </div>
                    </div>
                  </div>

                  {/* price */}
                  <div className="lg:block flex items-center gap-2">
                    <span className="lg:hidden text-[12px] text-brick-600 font-medium">Price:</span>
                    <span className="font-bold text-[14.5px] tabular-nums">
                      {l.purpose === 'rent' ? npr(l.price) : nprShort(l.price)}
                    </span>
                    {l.purpose === 'rent' && <span className="text-[11.5px] text-brick-600 lg:block">/month</span>}
                  </div>

                  {/* status */}
                  <div>
                    <Badge tone={token.soft + ' border'}>{token.label}</Badge>
                    <div className="text-[11.5px] text-brick-600 mt-1.5">
                      {status === 'active' || status === 'expiring' ? `${left} days left` : expiryLine(l)}
                    </div>
                    {(status === 'active' || status === 'expiring') && (
                      <div className="h-1 rounded-full bg-brick-200 mt-1.5 overflow-hidden max-w-[8rem]">
                        <div
                          className={cx('h-full rounded-full transition-all', status === 'expiring' ? 'bg-marigold-400' : 'bg-jade-500')}
                          style={{ width: `${Math.max(3, Math.min(100, (left / l.durationDays) * 100))}%` }}
                        />
                      </div>
                    )}
                  </div>

                  {/* activity */}
                  <div className="text-[12.5px] text-brick-700 space-y-0.5">
                    <div className="flex items-center gap-1.5"><Icon name="eye" className="w-3.5 h-3.5" /> {l.views}</div>
                    <div className="flex items-center gap-1.5"><Icon name="calendar" className="w-3.5 h-3.5" /> {visitsFor(l.id)} visits</div>
                    {reportsFor(l.id) > 0 && (
                      <div className="flex items-center gap-1.5 text-crimson-700 font-semibold">
                        <Icon name="flag" className="w-3.5 h-3.5" /> {reportsFor(l.id)} reports
                      </div>
                    )}
                    <div className="text-[11.5px] text-brick-500">{relativeTime(l.updatedAt)}</div>
                  </div>

                  {/* actions */}
                  <div className="flex flex-wrap lg:flex-col lg:items-stretch gap-1.5">
                    {l.status === 'rented' ? (
                      <button
                        onClick={() => { markRented(l.id, false); toast('Back on the market', 'ok'); }}
                        className="btn-outline btn-sm lg:w-full"
                      >
                        <Icon name="refresh" className="w-3.5 h-3.5" /> Relist
                      </button>
                    ) : (
                      <button
                        onClick={() => { markRented(l.id, true); toast('Marked as rented', 'ok'); }}
                        className="btn-navy btn-sm lg:w-full"
                      >
                        <Icon name="check-circle" className="w-3.5 h-3.5" /> Mark rented
                      </button>
                    )}

                    <div className="flex gap-1.5 lg:w-full">
                    <button onClick={() => setRenewing(l)} className="btn-outline btn-sm grow">
                      <Icon name="clock" className="w-3.5 h-3.5" /> Renew
                    </button>

                    <button
                      onClick={() => {
                        updateListing(l.id, { verified: !l.verified });
                        toast(l.verified ? 'Verified mark removed' : 'Marked as verified', 'info');
                      }}
                      className={cx('btn-sm', l.verified ? 'btn-jade' : 'btn-outline')}
                      title={l.verified ? 'Remove verified mark' : 'Mark as verified'}
                      aria-label={l.verified ? 'Remove verified mark' : 'Mark as verified'}
                    >
                      <Icon name="verified" className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => {
                        updateListing(l.id, { featured: !l.featured });
                        toast(l.featured ? 'Removed from featured' : 'Featured on the home page', 'info');
                      }}
                      className={cx('btn-sm', l.featured ? 'btn-marigold' : 'btn-outline')}
                      title={l.featured ? 'Remove from featured' : 'Feature on home page'}
                      aria-label={l.featured ? 'Remove from featured' : 'Feature on home page'}
                    >
                      <Icon name="star" className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => setConfirmDelete(l)}
                      className="btn-ghost btn-sm text-crimson-700 hover:bg-crimson-50"
                      aria-label="Delete listing"
                    >
                      <Icon name="trash" className="w-3.5 h-3.5" />
                    </button>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {/* ---- recent enquiries ---------------------------------------- */}
      {visits.length > 0 && (
        <section className="mt-10">
          <h2 className="text-xl font-bold mb-4">Recent visit requests</h2>
          <div className="card divide-y divide-brick-200">
            {visits.slice(0, 8).map((v) => {
              const l = listings.find((x) => x.id === v.listingId);
              return (
                <div key={v.id} className="p-4 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[14px]">
                  <span className="font-semibold">{v.name}</span>
                  <a href={`tel:+977${v.phone}`} className="text-navy-700 hover:text-crimson-700 font-mono text-[13px]">{v.phone}</a>
                  <span className="text-brick-700">
                    wants to see{' '}
                    {l ? <Link to={`/property/${l.slug}`} className="font-medium hover:text-crimson-700">{l.title}</Link> : 'a removed listing'}
                  </span>
                  <span className="text-brick-600 text-[13px] ml-auto">{fmtDate(v.date)} · {v.slot}</span>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* ---- renew modal --------------------------------------------- */}
      <Modal
        open={!!renewing}
        onClose={() => setRenewing(null)}
        title="Renew this listing"
        size="sm"
      >
        {renewing && (
          <>
            <p className="text-[14.5px] text-brick-800 mb-5">
              <span className="font-semibold text-navy-900">{renewing.title}</span> currently
              {' '}{expiryLine(renewing).toLowerCase()}. Renewing restarts the clock from today.
            </p>
            <span className="label">Run it for</span>
            <div className="grid grid-cols-4 gap-2">
              {DURATION_OPTIONS.map((days) => (
                <button
                  key={days}
                  onClick={() => {
                    renew(renewing.id, days);
                    toast(`Renewed for ${days} days`, 'ok');
                    setRenewing(null);
                  }}
                  className="btn-outline flex-col !py-3 hover:border-jade-600 hover:bg-jade-50"
                >
                  <span className="text-lg font-bold">{days}</span>
                  <span className="text-[11px] text-brick-600">days</span>
                </button>
              ))}
            </div>
          </>
        )}
      </Modal>

      {/* ---- delete confirm ------------------------------------------ */}
      <Modal
        open={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        title="Delete this listing?"
        size="sm"
        footer={
          <div className="flex gap-2.5">
            <button onClick={() => setConfirmDelete(null)} className="btn-outline flex-1">Keep it</button>
            <button
              onClick={() => {
                if (confirmDelete) {
                  deleteListing(confirmDelete.id);
                  toast('Listing deleted', 'info');
                }
                setConfirmDelete(null);
              }}
              className="btn-primary flex-1"
            >
              Delete permanently
            </button>
          </div>
        }
      >
        <p className="text-[14.5px] text-brick-800">
          <span className="font-semibold text-navy-900">{confirmDelete?.title}</span> will be
          removed for good and its share link will stop working.
        </p>
        <p className="text-[14.5px] text-brick-800 mt-3">
          If it has just been taken, mark it as rented instead — the page stays up and shows
          what the street actually rents for.
        </p>
      </Modal>

      {/* ---- reset confirm ------------------------------------------- */}
      <Modal
        open={resetOpen}
        onClose={() => setResetOpen(false)}
        title="Reset demo data?"
        size="sm"
        footer={
          <div className="flex gap-2.5">
            <button onClick={() => setResetOpen(false)} className="btn-outline flex-1">Cancel</button>
            <button
              onClick={() => { resetDemoData(); setResetOpen(false); toast('Demo data restored', 'ok'); }}
              className="btn-primary flex-1"
            >
              Reset everything
            </button>
          </div>
        }
      >
        <p className="text-[14.5px] text-brick-800">
          This restores the sample catalogue and clears everything stored in this browser —
          listings you posted, saved properties, visit requests and reports.
        </p>
      </Modal>
    </div>
  );
}
