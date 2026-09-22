import { npr } from '../lib/format';
import { activeFilterCount } from '../lib/search';
import {
  AMENITIES, BHK, CITIES, FURNISHING, PROPERTY_TYPE,
} from '../lib/taxonomy';
import type { Bhk, Filters, Furnishing, PropertyType, Purpose } from '../lib/types';
import { Icon } from './Icon';
import { CheckChip, Collapsible, cx } from './ui';

const RENT_BANDS: [number, number | null][] = [
  [0, 10000], [10000, 20000], [20000, 35000], [35000, 60000], [60000, 100000], [100000, null],
];
const SALE_BANDS: [number, number | null][] = [
  [0, 5000000], [5000000, 10000000], [10000000, 20000000],
  [20000000, 40000000], [40000000, 80000000], [80000000, null],
];

/** Immutable toggle for the array-valued filters. */
function toggle<T>(arr: T[], v: T): T[] {
  return arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v];
}

interface Props {
  filters: Filters;
  onChange: (next: Filters) => void;
  onReset: () => void;
}

export function FilterPanel({ filters: f, onChange, onReset }: Props) {
  const set = <K extends keyof Filters>(key: K, value: Filters[K]) => onChange({ ...f, [key]: value });
  const bands = f.purpose === 'sale' ? SALE_BANDS : RENT_BANDS;
  const count = activeFilterCount(f);

  // Areas are scoped to the chosen cities, so the list stays readable.
  const areaGroups = CITIES.filter((c) => !f.cities.length || f.cities.includes(c.name));

  return (
    <div className="text-[14px]">
      <div className="flex items-center justify-between pb-3 border-b border-brick-200">
        <span className="font-bold text-[15px] flex items-center gap-2">
          <Icon name="sliders" className="w-4 h-4" /> Filters
        </span>
        {count > 0 && (
          <button onClick={onReset} className="text-[13px] font-semibold text-crimson-700 hover:underline">
            Clear all ({count})
          </button>
        )}
      </div>

      {/* ---- purpose ------------------------------------------------ */}
      <Collapsible label="I want to">
        <div className="flex gap-1 p-1 bg-brick-100 rounded-xl">
          {([
            ['all', 'Both'], ['rent', 'Rent'], ['sale', 'Buy'],
          ] as [Purpose | 'all', string][]).map(([v, label]) => (
            <button
              key={v}
              onClick={() => set('purpose', v)}
              aria-pressed={f.purpose === v}
              className={cx(
                'flex-1 py-2 rounded-lg text-[13.5px] font-bold transition-all',
                f.purpose === v ? 'bg-white text-navy-900 shadow-sm' : 'text-brick-700 hover:text-navy-900',
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </Collapsible>

      {/* ---- budget ------------------------------------------------- */}
      <Collapsible label={f.purpose === 'sale' ? 'Budget' : 'Monthly rent'} count={f.min !== null || f.max !== null ? 1 : 0}>
        <div className="space-y-2">
          {bands.map(([lo, hi]) => {
            const on = f.min === lo && f.max === hi;
            return (
              <button
                key={`${lo}-${hi}`}
                onClick={() => (on ? onChange({ ...f, min: null, max: null }) : onChange({ ...f, min: lo, max: hi }))}
                className={cx(
                  'w-full text-left px-3 py-2 rounded-lg border transition-colors flex items-center justify-between',
                  on ? 'border-navy-900 bg-navy-900 text-white' : 'border-brick-200 hover:border-brick-400',
                )}
              >
                <span>
                  {lo === 0 ? `Under ${npr(hi!)}` : hi === null ? `${npr(lo)} and above` : `${npr(lo)} – ${npr(hi)}`}
                </span>
                {on && <Icon name="check" className="w-3.5 h-3.5" strokeWidth={3} />}
              </button>
            );
          })}
        </div>

        <div className="grid grid-cols-2 gap-2 mt-3">
          <div>
            <label className="text-[11px] font-semibold text-brick-600 uppercase tracking-wide" htmlFor="f-min">Min</label>
            <input
              id="f-min" type="number" min={0} inputMode="numeric" placeholder="Any"
              value={f.min ?? ''}
              onChange={(e) => set('min', e.target.value === '' ? null : Math.max(0, Number(e.target.value)))}
              className="field !py-2 !text-[13.5px] mt-1"
            />
          </div>
          <div>
            <label className="text-[11px] font-semibold text-brick-600 uppercase tracking-wide" htmlFor="f-max">Max</label>
            <input
              id="f-max" type="number" min={0} inputMode="numeric" placeholder="Any"
              value={f.max ?? ''}
              onChange={(e) => set('max', e.target.value === '' ? null : Math.max(0, Number(e.target.value)))}
              className="field !py-2 !text-[13.5px] mt-1"
            />
          </div>
        </div>
      </Collapsible>

      {/* ---- property type ------------------------------------------ */}
      <Collapsible label="Property type" count={f.types.length}>
        <div className="flex flex-wrap gap-2">
          {(Object.keys(PROPERTY_TYPE) as PropertyType[]).map((t) => (
            <CheckChip
              key={t}
              checked={f.types.includes(t)}
              onChange={() => set('types', toggle(f.types, t))}
            >
              {PROPERTY_TYPE[t].label.split(' /')[0]}
            </CheckChip>
          ))}
        </div>
      </Collapsible>

      {/* ---- bedrooms ----------------------------------------------- */}
      <Collapsible label="Bedrooms" count={f.bhk.length}>
        <div className="flex flex-wrap gap-2">
          {BHK.map((b) => (
            <CheckChip
              key={b.value}
              checked={f.bhk.includes(b.value as Bhk)}
              onChange={() => set('bhk', toggle(f.bhk, b.value as Bhk))}
            >
              {b.value === 'rk' ? 'RK' : b.value === '5+' ? '5+' : b.value}
            </CheckChip>
          ))}
        </div>
        <p className="hint">RK is one room with an attached kitchen.</p>
      </Collapsible>

      {/* ---- city + area -------------------------------------------- */}
      <Collapsible label="Location" count={f.cities.length + f.areas.length}>
        <div className="flex flex-wrap gap-2 mb-4">
          {CITIES.map((c) => (
            <CheckChip
              key={c.name}
              checked={f.cities.includes(c.name)}
              onChange={() => {
                const cities = toggle(f.cities, c.name);
                // Drop any selected areas that no longer belong to a chosen city.
                const allowed = new Set(
                  CITIES.filter((x) => !cities.length || cities.includes(x.name)).flatMap((x) => x.areas),
                );
                onChange({ ...f, cities, areas: f.areas.filter((a) => allowed.has(a)) });
              }}
            >
              {c.name}
            </CheckChip>
          ))}
        </div>

        <div className="max-h-56 overflow-y-auto pr-1 space-y-3">
          {areaGroups.map((c) => (
            <div key={c.name}>
              <div className="text-[11px] font-bold uppercase tracking-wide text-brick-600 mb-1.5">{c.name}</div>
              <div className="grid grid-cols-2 gap-x-3 gap-y-1">
                {c.areas.map((a) => (
                  <label key={a} className="flex items-center gap-2 py-1 cursor-pointer text-[13.5px] hover:text-crimson-700">
                    <input
                      type="checkbox"
                      checked={f.areas.includes(a)}
                      onChange={() => set('areas', toggle(f.areas, a))}
                      className="accent-crimson-600 w-4 h-4 rounded"
                    />
                    {a}
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Collapsible>

      {/* ---- furnishing --------------------------------------------- */}
      <Collapsible label="Furnishing" count={f.furnishing.length} defaultOpen={false}>
        <div className="flex flex-wrap gap-2">
          {(Object.keys(FURNISHING) as Furnishing[]).map((v) => (
            <CheckChip
              key={v}
              checked={f.furnishing.includes(v)}
              onChange={() => set('furnishing', toggle(f.furnishing, v))}
            >
              {FURNISHING[v].label}
            </CheckChip>
          ))}
        </div>
      </Collapsible>

      {/* ---- amenities ---------------------------------------------- */}
      <Collapsible label="Must have" count={f.amenities.length + (f.parking ? 1 : 0) + (f.verifiedOnly ? 1 : 0)} defaultOpen={false}>
        <div className="flex flex-wrap gap-2">
          <CheckChip checked={f.parking} onChange={(v) => set('parking', v)} icon="car">
            Car parking
          </CheckChip>
          <CheckChip checked={f.verifiedOnly} onChange={(v) => set('verifiedOnly', v)} icon="verified">
            Verified only
          </CheckChip>
          {AMENITIES.map((a) => (
            <CheckChip
              key={a.key}
              checked={f.amenities.includes(a.key)}
              onChange={() => set('amenities', toggle(f.amenities, a.key))}
            >
              {a.label}
            </CheckChip>
          ))}
        </div>
      </Collapsible>

      {/* ---- rented ------------------------------------------------- */}
      <Collapsible label="Also show" defaultOpen={false}>
        <CheckChip checked={f.includeRented} onChange={(v) => set('includeRented', v)}>
          Properties already rented out
        </CheckChip>
        <p className="hint">Useful for seeing what a street actually rents for.</p>
      </Collapsible>
    </div>
  );
}
