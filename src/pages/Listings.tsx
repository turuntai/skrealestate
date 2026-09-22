import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { FilterPanel } from '../components/FilterPanel';
import { Icon } from '../components/Icon';
import { ListingCard } from '../components/ListingCard';
import { Badge, EmptyState, Modal, cx, useDebounced, useIsDesktop } from '../components/ui';
import { applyMeta } from '../lib/seo';
import { activeFilterCount, applyFilters, filtersToParams, paramsToFilters } from '../lib/search';
import { useStore } from '../lib/store';
import { FURNISHING, PROPERTY_TYPE } from '../lib/taxonomy';
import type { Filters, SortKey } from '../lib/types';

const SORTS: { value: SortKey; label: string }[] = [
  { value: 'newest', label: 'Newest first' },
  { value: 'price-asc', label: 'Price: low to high' },
  { value: 'price-desc', label: 'Price: high to low' },
  { value: 'popular', label: 'Most viewed' },
];

const PAGE_SIZE = 9;

export function Listings() {
  const { listings } = useStore();
  const [params, setParams] = useSearchParams();
  const isDesktop = useIsDesktop();

  // The querystring is the source of truth, so a filtered search is shareable.
  const filters = useMemo(() => paramsToFilters(params), [params]);

  const [qDraft, setQDraft] = useState(filters.q);
  const debouncedQ = useDebounced(qDraft, 300);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [layout, setLayout] = useState<'grid' | 'row'>('grid');
  const [shown, setShown] = useState(PAGE_SIZE);

  const update = useCallback(
    (next: Filters) => setParams(filtersToParams(next), { replace: true }),
    [setParams],
  );

  // Keep the box in step when the URL changes from outside (back button, a chip).
  useEffect(() => setQDraft(filters.q), [filters.q]);

  useEffect(() => {
    if (debouncedQ === filters.q) return;
    update({ ...filters, q: debouncedQ });
  }, [debouncedQ, filters, update]);

  const results = useMemo(() => applyFilters(listings, filters), [listings, filters]);

  useEffect(() => setShown(PAGE_SIZE), [params]);

  useEffect(() => {
    const what = filters.purpose === 'sale' ? 'Property for sale' : 'Houses & flats for rent';
    const where = filters.areas[0] ?? filters.cities[0] ?? 'Kathmandu Valley';
    applyMeta({
      title: `${what} in ${where}`,
      description: `${results.length} verified properties in ${where}. Filter by area, budget, type and bedrooms on SK Real Estate.`,
    });
  }, [filters, results.length]);

  const count = activeFilterCount(filters);
  const reset = () => setParams(new URLSearchParams(), { replace: true });

  /* Chips summarising what is on, each removable. */
  const chips = useMemo(() => {
    const out: { label: string; clear: () => void }[] = [];
    if (filters.purpose !== 'all') {
      out.push({ label: filters.purpose === 'rent' ? 'For rent' : 'For sale', clear: () => update({ ...filters, purpose: 'all' }) });
    }
    filters.cities.forEach((c) => out.push({ label: c, clear: () => update({ ...filters, cities: filters.cities.filter((x) => x !== c) }) }));
    filters.areas.forEach((a) => out.push({ label: a, clear: () => update({ ...filters, areas: filters.areas.filter((x) => x !== a) }) }));
    filters.types.forEach((t) => out.push({ label: PROPERTY_TYPE[t].label.split(' /')[0], clear: () => update({ ...filters, types: filters.types.filter((x) => x !== t) }) }));
    filters.bhk.forEach((b) => out.push({ label: b === 'rk' ? 'RK' : `${b} BHK`, clear: () => update({ ...filters, bhk: filters.bhk.filter((x) => x !== b) }) }));
    filters.furnishing.forEach((v) => out.push({ label: FURNISHING[v].label, clear: () => update({ ...filters, furnishing: filters.furnishing.filter((x) => x !== v) }) }));
    if (filters.min !== null || filters.max !== null) {
      out.push({ label: 'Budget set', clear: () => update({ ...filters, min: null, max: null }) });
    }
    if (filters.parking) out.push({ label: 'Car parking', clear: () => update({ ...filters, parking: false }) });
    if (filters.verifiedOnly) out.push({ label: 'Verified only', clear: () => update({ ...filters, verifiedOnly: false }) });
    if (filters.includeRented) out.push({ label: 'Incl. rented', clear: () => update({ ...filters, includeRented: false }) });
    return out;
  }, [filters, update]);

  const visible = results.slice(0, shown);

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-6 sm:py-8">
      {/* ---- search bar --------------------------------------------- */}
      <div className="flex gap-2.5 mb-5">
        <div className="relative flex-1">
          <Icon name="search" className="w-[18px] h-[18px] absolute left-3.5 top-1/2 -translate-y-1/2 text-brick-500" />
          <input
            value={qDraft}
            onChange={(e) => setQDraft(e.target.value)}
            placeholder="Search area, landmark or 2BHK Baluwatar"
            aria-label="Search properties"
            className="field !pl-10 !py-3"
          />
          {qDraft && (
            <button
              onClick={() => setQDraft('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-brick-500 hover:text-navy-800 p-1"
              aria-label="Clear search"
            >
              <Icon name="x" className="w-4 h-4" />
            </button>
          )}
        </div>
        <button onClick={() => setSheetOpen(true)} className="btn-outline btn-lg lg:hidden relative shrink-0">
          <Icon name="sliders" className="w-[18px] h-[18px]" />
          <span className="hidden sm:inline">Filters</span>
          {count > 0 && (
            <span className="absolute -top-1.5 -right-1.5 bg-crimson-600 text-white text-[10px] font-bold rounded-full w-5 h-5 grid place-items-center">
              {count}
            </span>
          )}
        </button>
      </div>

      <div className="lg:grid lg:grid-cols-[17rem_1fr] lg:gap-8 xl:gap-10">
        {/* ---- desktop sidebar -------------------------------------- */}
        <aside className="hidden lg:block">
          <div className="sticky top-[5rem] max-h-[calc(100vh-7rem)] overflow-y-auto pr-2 pb-6">
            <FilterPanel filters={filters} onChange={update} onReset={reset} />
          </div>
        </aside>

        {/* ---- results ---------------------------------------------- */}
        <main>
          <div className="flex items-center justify-between gap-3 flex-wrap mb-4">
            <h1 className="text-[15px] sm:text-base">
              <span className="font-bold text-navy-900">{results.length}</span>
              <span className="text-brick-700"> {results.length === 1 ? 'property' : 'properties'}</span>
              {filters.q && <span className="text-brick-700"> for “{filters.q}”</span>}
            </h1>

            <div className="flex items-center gap-2 ml-auto">
              <label className="sr-only" htmlFor="sort">Sort by</label>
              <select
                id="sort"
                value={filters.sort}
                onChange={(e) => update({ ...filters, sort: e.target.value as SortKey })}
                className="field !py-2 !text-[13.5px] !w-auto !pr-8"
              >
                {SORTS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>

              <div className="hidden sm:flex rounded-lg border border-brick-300 overflow-hidden">
                {(['grid', 'row'] as const).map((v) => (
                  <button
                    key={v}
                    onClick={() => setLayout(v)}
                    aria-label={v === 'grid' ? 'Grid view' : 'List view'}
                    aria-pressed={layout === v}
                    className={cx('p-2 transition-colors', layout === v ? 'bg-navy-900 text-white' : 'bg-white text-brick-600 hover:bg-brick-50')}
                  >
                    <Icon name={v === 'grid' ? 'grid' : 'list'} className="w-4 h-4" />
                  </button>
                ))}
              </div>
            </div>
          </div>

          {chips.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 mb-5">
              {chips.map((c, i) => (
                <button key={`${c.label}-${i}`} onClick={c.clear} className="chip-on !bg-navy-800 group">
                  {c.label}
                  <Icon name="x" className="w-3 h-3 opacity-70 group-hover:opacity-100" strokeWidth={2.6} />
                </button>
              ))}
              <button onClick={reset} className="text-[13px] font-semibold text-crimson-700 hover:underline px-1">
                Clear all
              </button>
            </div>
          )}

          {results.length === 0 ? (
            <div className="card">
              <EmptyState
                title="Nothing matches those filters"
                body="Try widening the budget, adding nearby areas, or clearing a filter or two. New properties go up most days."
                action={<button onClick={reset} className="btn-primary">Clear all filters</button>}
              />
            </div>
          ) : (
            <>
              <div
                className={cx(
                  'grid gap-4 sm:gap-5',
                  layout === 'grid' ? 'sm:grid-cols-2 xl:grid-cols-3' : 'grid-cols-1',
                )}
              >
                {visible.map((l) => (
                  <ListingCard key={l.id} listing={l} layout={isDesktop ? layout : 'grid'} />
                ))}
              </div>

              {shown < results.length && (
                <div className="mt-8 text-center">
                  <button onClick={() => setShown((s) => s + PAGE_SIZE)} className="btn-outline btn-lg">
                    Show {Math.min(PAGE_SIZE, results.length - shown)} more
                    <Badge tone="bg-brick-200 text-brick-800">{results.length - shown} left</Badge>
                  </button>
                </div>
              )}
            </>
          )}

          {/* Nudge toward posting once someone has scrolled the whole list. */}
          {results.length > 0 && shown >= results.length && (
            <div className="mt-10 card p-6 sm:p-8 text-center bg-gradient-to-br from-navy-900 to-navy-800 border-0 text-white">
              <h2 className="text-xl sm:text-2xl font-bold text-white">Nothing quite right?</h2>
              <p className="text-navy-100 mt-2 text-[15px] max-w-md mx-auto">
                Tell us what you are after and we will message you when something in that
                area and budget comes in.
              </p>
              <Link to="/contact" className="btn-marigold mt-5">
                Tell us what you need <Icon name="arrow-right" className="w-4 h-4" />
              </Link>
            </div>
          )}
        </main>
      </div>

      {/* ---- mobile filter sheet ------------------------------------ */}
      <Modal
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        title="Filters"
        footer={
          <div className="flex gap-2.5">
            <button onClick={reset} className="btn-outline flex-1">Clear all</button>
            <button onClick={() => setSheetOpen(false)} className="btn-primary flex-[2]">
              Show {results.length} {results.length === 1 ? 'property' : 'properties'}
            </button>
          </div>
        }
      >
        <FilterPanel filters={filters} onChange={update} onReset={reset} />
      </Modal>
    </div>
  );
}
