import { DAY_MS, daysBetween, fmtDate } from './format';
import { STATUS } from './taxonomy';
import type { Listing, ListingStatus } from './types';

/** A listing is flagged "expiring soon" once it is inside this window. */
export const EXPIRY_WARNING_DAYS = 7;

export const DURATION_OPTIONS = [15, 30, 45, 60] as const;

export const expiresAt = (l: Listing): number =>
  new Date(l.updatedAt).getTime() + l.durationDays * DAY_MS;

/**
 * The status the UI should show. Stored status wins when it is `rented`
 * (an admin said so); otherwise expiry is derived from the clock, so a
 * listing ages out on its own with no cron job anywhere.
 */
export function effectiveStatus(l: Listing, now = Date.now()): ListingStatus {
  if (l.status === 'rented') return 'rented';
  return expiresAt(l) <= now ? 'expired' : 'active';
}

export type DisplayStatus = ListingStatus | 'expiring';

export function displayStatus(l: Listing, now = Date.now()): DisplayStatus {
  const s = effectiveStatus(l, now);
  if (s !== 'active') return s;
  return daysBetween(expiresAt(l), now) <= EXPIRY_WARNING_DAYS ? 'expiring' : 'active';
}

export const statusToken = (l: Listing, now = Date.now()) => STATUS[displayStatus(l, now)];

export const daysLeft = (l: Listing, now = Date.now()) =>
  Math.max(0, daysBetween(expiresAt(l), now));

/** Only live listings are shown to visitors by default. */
export const isLive = (l: Listing, now = Date.now()) => effectiveStatus(l, now) === 'active';

export function expiryLine(l: Listing, now = Date.now()): string {
  const s = effectiveStatus(l, now);
  if (s === 'rented') return 'Marked as rented by the owner';
  if (s === 'expired') return `Expired on ${fmtDate(new Date(expiresAt(l)).toISOString())}`;
  const d = daysLeft(l, now);
  if (d <= EXPIRY_WARNING_DAYS) return `Expires in ${d} day${d === 1 ? '' : 's'} — renew to keep it live`;
  return `Live for ${d} more days`;
}

/** Renewing restarts the clock from now and revives an expired listing. */
export function renew(l: Listing, days = l.durationDays, now = Date.now()): Listing {
  return {
    ...l,
    status: 'active',
    updatedAt: new Date(now).toISOString(),
    durationDays: days,
  };
}
