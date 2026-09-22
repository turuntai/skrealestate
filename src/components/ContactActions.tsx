import { useState } from 'react';
import { prettyPhone, toISODate } from '../lib/format';
import {
  copyToClipboard, enquiryMessage, facebookShareHref, listingUrl, nativeShare,
  telHref, viberHref, viberShareHref, visitMessage, whatsappHref, whatsappShareHref, shareText,
} from '../lib/share';
import { useStore } from '../lib/store';
import { REPORT_REASONS, VISIT_SLOTS } from '../lib/taxonomy';
import type { Listing } from '../lib/types';
import { Icon } from './Icon';
import { Modal, useToast, cx } from './ui';

/* ==================== Call / WhatsApp / Viber ======================== */

export function ContactButtons({ listing: l, size = 'lg' }: { listing: Listing; size?: 'lg' | 'sm' }) {
  const cls = size === 'lg' ? 'btn-lg' : 'btn-sm';
  return (
    <div className="grid grid-cols-2 gap-2.5">
      <a href={telHref(l.phone)} className={cx('btn-navy', cls, 'w-full')}>
        <Icon name="phone" className="w-4.5 h-4.5" strokeWidth={2} />
        {size === 'lg' ? prettyPhone(l.phone) : 'Call'}
      </a>
      {l.whatsapp ? (
        <a
          href={whatsappHref(l.whatsapp, enquiryMessage(l))}
          target="_blank"
          rel="noreferrer noopener"
          className={cx('btn-jade', cls, 'w-full')}
        >
          <Icon name="whatsapp" className="w-4.5 h-4.5" filled />
          WhatsApp
        </a>
      ) : (
        <a href={telHref(l.phone)} className={cx('btn-outline', cls, 'w-full')}>
          <Icon name="phone" className="w-4.5 h-4.5" /> Call owner
        </a>
      )}
      {l.viber && (
        <a
          href={viberHref(l.viber)}
          className={cx('btn-outline', cls, 'w-full col-span-2 !text-[#7360F2] !border-[#7360F2]/35 hover:!bg-[#7360F2]/10')}
        >
          <Icon name="viber" className="w-4.5 h-4.5" filled /> Viber
        </a>
      )}
    </div>
  );
}

/* ==================== Request a visit ================================ */

export function VisitModal({ listing: l, open, onClose }: { listing: Listing; open: boolean; onClose: () => void }) {
  const { addVisit } = useStore();
  const toast = useToast();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [date, setDate] = useState(toISODate(new Date(Date.now() + 86_400_000)));
  const [slot, setSlot] = useState(VISIT_SLOTS[0]);
  const [note, setNote] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const e: Record<string, string> = {};
    if (name.trim().length < 2) e.name = 'Please enter your name';
    if (!/^9\d{9}$/.test(phone.replace(/\D/g, ''))) e.phone = 'Enter a 10-digit Nepali mobile starting with 9';
    if (!date) e.date = 'Pick a date';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    addVisit({ listingId: l.id, name: name.trim(), phone: phone.trim(), date, slot, note: note.trim() || undefined });

    // Hand the request straight to the owner on the channel they actually use.
    const msg = visitMessage(l, name.trim(), date, slot, note.trim() || undefined);
    if (l.whatsapp) window.open(whatsappHref(l.whatsapp, msg), '_blank', 'noopener');

    toast('Visit request sent. The owner will confirm by phone.', 'ok');
    onClose();
    setName(''); setPhone(''); setNote(''); setErrors({});
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Request a visit"
      footer={
        <button type="submit" form="visit-form" className="btn-primary btn-lg w-full">
          <Icon name="calendar" className="w-4.5 h-4.5" /> Send request
        </button>
      }
    >
      <div className="flex gap-3 p-3 rounded-xl bg-brick-50 border border-brick-200 mb-5">
        <img src={l.photos[0]?.src} alt="" className="w-16 h-14 rounded-lg object-cover shrink-0" />
        <div className="min-w-0">
          <div className="font-semibold text-[14.5px] line-clamp-1">{l.title}</div>
          <div className="text-[13px] text-brick-700">{l.area}, {l.city}</div>
        </div>
      </div>

      <form id="visit-form" onSubmit={submit} className="space-y-4" noValidate>
        <div>
          <label className="label" htmlFor="v-name">Your name</label>
          <input
            id="v-name" data-autofocus value={name} onChange={(e) => setName(e.target.value)}
            className={cx('field', errors.name && 'field-err')} placeholder="Suman Thapa" autoComplete="name"
          />
          {errors.name && <p className="err"><Icon name="alert" className="w-3.5 h-3.5 mt-px" />{errors.name}</p>}
        </div>

        <div>
          <label className="label" htmlFor="v-phone">Mobile number</label>
          <input
            id="v-phone" value={phone} onChange={(e) => setPhone(e.target.value)} inputMode="numeric"
            className={cx('field', errors.phone && 'field-err')} placeholder="98XXXXXXXX" autoComplete="tel"
          />
          {errors.phone && <p className="err"><Icon name="alert" className="w-3.5 h-3.5 mt-px" />{errors.phone}</p>}
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="label" htmlFor="v-date">Preferred date</label>
            <input
              id="v-date" type="date" value={date} min={toISODate(new Date())}
              onChange={(e) => setDate(e.target.value)}
              className={cx('field', errors.date && 'field-err')}
            />
          </div>
          <div>
            <label className="label" htmlFor="v-slot">Preferred time</label>
            <select id="v-slot" value={slot} onChange={(e) => setSlot(e.target.value)} className="field">
              {VISIT_SLOTS.map((s) => <option key={s}>{s}</option>)}
            </select>
          </div>
        </div>

        <div>
          <label className="label" htmlFor="v-note">Anything to add <span className="font-normal text-brick-600">(optional)</span></label>
          <textarea
            id="v-note" value={note} onChange={(e) => setNote(e.target.value)} rows={3}
            className="field resize-none" placeholder="Family of four, looking to move in by Mangsir."
          />
        </div>

        <p className="hint flex items-start gap-1.5">
          <Icon name="info" className="w-3.5 h-3.5 shrink-0 mt-0.5" />
          Your request opens in WhatsApp so the owner gets it straight away. SK Real Estate never charges tenants a fee.
        </p>
      </form>
    </Modal>
  );
}

/* ==================== Report a listing ============================== */

export function ReportModal({ listing: l, open, onClose }: { listing: Listing; open: boolean; onClose: () => void }) {
  const { addReport } = useStore();
  const toast = useToast();
  const [reason, setReason] = useState(REPORT_REASONS[0]);
  const [detail, setDetail] = useState('');

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    addReport({ listingId: l.id, reason, detail: detail.trim() || undefined });
    toast('Thanks — our team will check this listing.', 'ok');
    onClose();
    setDetail('');
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Report this listing"
      size="sm"
      footer={
        <div className="flex gap-2.5">
          <button onClick={onClose} className="btn-outline flex-1">Cancel</button>
          <button type="submit" form="report-form" className="btn-primary flex-1">Submit report</button>
        </div>
      }
    >
      <form id="report-form" onSubmit={submit}>
        <fieldset>
          <legend className="label mb-3">What is wrong with it?</legend>
          <div className="space-y-2">
            {REPORT_REASONS.map((r) => (
              <label
                key={r}
                className={cx(
                  'flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-colors',
                  reason === r ? 'border-crimson-500 bg-crimson-50' : 'border-brick-200 hover:border-brick-400',
                )}
              >
                <input
                  type="radio" name="reason" value={r} checked={reason === r}
                  onChange={() => setReason(r)} className="mt-1 accent-crimson-600"
                />
                <span className="text-[14.5px]">{r}</span>
              </label>
            ))}
          </div>
        </fieldset>

        <div className="mt-4">
          <label className="label" htmlFor="r-detail">More detail <span className="font-normal text-brick-600">(optional)</span></label>
          <textarea
            id="r-detail" value={detail} onChange={(e) => setDetail(e.target.value)} rows={3}
            className="field resize-none" placeholder="I called on 12 Asoj and was told it was taken."
          />
        </div>
      </form>
    </Modal>
  );
}

/* ==================== Share ========================================== */

export function ShareModal({ listing: l, open, onClose }: { listing: Listing; open: boolean; onClose: () => void }) {
  const toast = useToast();
  const url = listingUrl(l);
  const text = shareText(l);

  const copy = async () => {
    const ok = await copyToClipboard(url);
    toast(ok ? 'Link copied' : 'Could not copy — select the link and copy it', ok ? 'ok' : 'err');
  };

  const channels = [
    { label: 'WhatsApp', icon: 'whatsapp' as const, href: whatsappShareHref(text), tone: 'bg-jade-600 text-white', filled: true },
    { label: 'Facebook', icon: 'facebook' as const, href: facebookShareHref(url), tone: 'bg-[#1877F2] text-white', filled: true },
    { label: 'Viber', icon: 'viber' as const, href: viberShareHref(text), tone: 'bg-[#7360F2] text-white', filled: true },
    { label: 'Email', icon: 'mail' as const, href: `mailto:?subject=${encodeURIComponent(l.title)}&body=${encodeURIComponent(text)}`, tone: 'bg-navy-800 text-white', filled: false },
  ];

  return (
    <Modal open={open} onClose={onClose} title="Share this property" size="sm">
      <div className="flex gap-3 p-3 rounded-xl bg-brick-50 border border-brick-200 mb-5">
        <img src={l.photos[0]?.src} alt="" className="w-20 h-16 rounded-lg object-cover shrink-0" />
        <div className="min-w-0">
          <div className="font-semibold text-[14.5px] line-clamp-2 leading-snug">{l.title}</div>
          <div className="text-[13px] text-brick-700 mt-0.5">{l.area}, {l.city}</div>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-2.5 mb-5">
        {channels.map((c) => (
          <a
            key={c.label}
            href={c.href}
            target="_blank"
            rel="noreferrer noopener"
            className="flex flex-col items-center gap-2 group"
          >
            <span className={cx('w-12 h-12 rounded-2xl grid place-items-center transition-transform group-hover:scale-105', c.tone)}>
              <Icon name={c.icon} className="w-6 h-6" filled={c.filled} />
            </span>
            <span className="text-[12px] font-medium text-navy-800">{c.label}</span>
          </a>
        ))}
      </div>

      <label className="label" htmlFor="share-url">Listing link</label>
      <div className="flex gap-2">
        <input id="share-url" readOnly value={url} onFocus={(e) => e.currentTarget.select()} className="field font-mono !text-[13px]" />
        <button onClick={copy} className="btn-navy shrink-0" aria-label="Copy link">
          <Icon name="link" className="w-4 h-4" />
        </button>
      </div>
      <p className="hint">
        This link shows a photo, the price and the location when it is pasted into
        Facebook, Messenger, WhatsApp or Viber.
      </p>
    </Modal>
  );
}

/* ==================== Save + Share + Report row ====================== */

export function ActionRow({ listing: l }: { listing: Listing }) {
  const { isSaved, toggleSave } = useStore();
  const toast = useToast();
  const [shareOpen, setShareOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const saved = isSaved(l.id);

  const onShare = async () => {
    const result = await nativeShare(l);
    if (result === 'copied') toast('Link copied to clipboard', 'ok');
    else if (result === 'failed') setShareOpen(true);
  };

  return (
    <>
      <div className="flex items-center gap-1 flex-wrap">
        <button
          onClick={() => { toggleSave(l.id); toast(saved ? 'Removed from saved' : 'Saved', 'info'); }}
          className={cx('btn-ghost btn-sm', saved && 'text-crimson-600')}
          aria-pressed={saved}
        >
          <Icon name="heart" className="w-4.5 h-4.5" filled={saved} /> {saved ? 'Saved' : 'Save'}
        </button>
        <button onClick={onShare} className="btn-ghost btn-sm">
          <Icon name="share" className="w-4.5 h-4.5" /> Share
        </button>
        <button onClick={() => setShareOpen(true)} className="btn-ghost btn-sm hidden sm:inline-flex">
          <Icon name="link" className="w-4.5 h-4.5" /> Copy link
        </button>
        <button onClick={() => setReportOpen(true)} className="btn-ghost btn-sm text-brick-600 ml-auto">
          <Icon name="flag" className="w-4.5 h-4.5" /> Report
        </button>
      </div>
      <ShareModal listing={l} open={shareOpen} onClose={() => setShareOpen(false)} />
      <ReportModal listing={l} open={reportOpen} onClose={() => setReportOpen(false)} />
    </>
  );
}
