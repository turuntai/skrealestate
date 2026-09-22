/**
 * Everything persists to localStorage. There is no backend yet, so this module
 * is the whole data layer — swapping it for `fetch` calls later should not
 * require touching any component.
 */

const PREFIX = 'sk.';

export const KEYS = {
  listings: `${PREFIX}listings.v1`,
  saved: `${PREFIX}saved.v1`,
  visits: `${PREFIX}visits.v1`,
  reports: `${PREFIX}reports.v1`,
  recent: `${PREFIX}recent.v1`,
  lang: `${PREFIX}lang.v1`,
  seedVersion: `${PREFIX}seed.version`,
} as const;

export function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    // Private mode, quota trouble, or hand-edited JSON — fall back quietly.
    return fallback;
  }
}

export function write<T>(key: string, value: T): boolean {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

export function remove(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch {
    /* no-op */
  }
}

/** Wipes app data only — never the whole origin. */
export function resetAll(): void {
  Object.values(KEYS).forEach(remove);
}

export const uid = (prefix = 'id'): string =>
  `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
