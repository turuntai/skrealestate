import { intlPhone, nprShort, npr } from './format';
import { PROPERTY_TYPE } from './taxonomy';
import type { Listing } from './types';

export const listingPath = (l: Listing) => `/property/${l.slug}`;

export const listingUrl = (l: Listing) =>
  typeof window === 'undefined'
    ? listingPath(l)
    : `${window.location.origin}${listingPath(l)}`;

/** One line that says what the place is — reused in previews and messages. */
export function summaryLine(l: Listing): string {
  const bits: string[] = [];
  if (l.bhk) bits.push(l.bhk === 'rk' ? 'Room + Kitchen' : `${l.bhk} BHK`);
  bits.push(PROPERTY_TYPE[l.type].label);
  bits.push(`in ${l.area}, ${l.city}`);
  return bits.join(' ');
}

export function shareText(l: Listing): string {
  const price = l.purpose === 'rent' ? `${npr(l.price)}/month` : nprShort(l.price);
  return `${l.title}\n${summaryLine(l)} — ${price}\n${listingUrl(l)}`;
}

/* ---- Channel intents ------------------------------------------------ */

export const telHref = (phone: string) => `tel:+${intlPhone(phone)}`;

export const whatsappHref = (phone: string, message: string) =>
  `https://wa.me/${intlPhone(phone)}?text=${encodeURIComponent(message)}`;

export const viberHref = (phone: string) => `viber://chat?number=%2B${intlPhone(phone)}`;

export const facebookShareHref = (url: string) =>
  `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;

export const whatsappShareHref = (text: string) =>
  `https://wa.me/?text=${encodeURIComponent(text)}`;

export const viberShareHref = (text: string) =>
  `viber://forward?text=${encodeURIComponent(text)}`;

/** The message that pre-fills when a renter taps WhatsApp on a listing. */
export function enquiryMessage(l: Listing): string {
  return `Namaste! I saw "${l.title}" on SK Real Estate (${listingUrl(l)}). Is it still available? I'd like to know more.`;
}

export function visitMessage(l: Listing, name: string, date: string, slot: string, note?: string): string {
  return [
    `Namaste! I'd like to visit "${l.title}" (${l.area}, ${l.city}).`,
    `Name: ${name}`,
    `Preferred date: ${date}`,
    `Preferred time: ${slot}`,
    note ? `Note: ${note}` : '',
    listingUrl(l),
  ].filter(Boolean).join('\n');
}

/**
 * Native share sheet where it exists, clipboard everywhere else.
 * Returns what actually happened so the UI can show the right toast.
 */
export async function nativeShare(l: Listing): Promise<'shared' | 'copied' | 'failed'> {
  const url = listingUrl(l);
  const data = { title: l.title, text: `${summaryLine(l)} — ${npr(l.price)}`, url };

  if (typeof navigator !== 'undefined' && navigator.share) {
    try {
      await navigator.share(data);
      return 'shared';
    } catch (err) {
      // The user dismissing the sheet is not a failure worth reporting.
      if (err instanceof DOMException && err.name === 'AbortError') return 'shared';
    }
  }
  return (await copyToClipboard(url)) ? 'copied' : 'failed';
}

export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    /* fall through to the legacy path */
  }
  try {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.cssText = 'position:fixed;opacity:0;pointer-events:none';
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(ta);
    return ok;
  } catch {
    return false;
  }
}
