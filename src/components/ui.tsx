import {
  createContext, useCallback, useContext, useEffect, useMemo, useRef, useState,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';
import { Icon, type IconName } from './Icon';

export const cx = (...parts: (string | false | null | undefined)[]) =>
  parts.filter(Boolean).join(' ');

/* ==================== Badge ========================================== */

export function Badge({
  children, tone = 'bg-navy-100 text-navy-800', icon, className,
}: { children: ReactNode; tone?: string; icon?: IconName; className?: string }) {
  return (
    <span className={cx('badge', tone, className)}>
      {icon && <Icon name={icon} className="w-3 h-3" strokeWidth={2.4} />}
      {children}
    </span>
  );
}

/* ==================== Modal ========================================== */
/* Full-screen sheet on phones, centred dialog on desktop. Traps focus,
   restores it on close, and locks body scroll while open. */

export function Modal({
  open, onClose, title, children, footer, size = 'md',
}: {
  open: boolean; onClose: () => void; title: string;
  children: ReactNode; footer?: ReactNode; size?: 'sm' | 'md' | 'lg';
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  const restoreRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;
    restoreRef.current = document.activeElement as HTMLElement;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { onClose(); return; }
      if (e.key !== 'Tab' || !panelRef.current) return;
      const focusable = panelRef.current.querySelectorAll<HTMLElement>(
        'a[href],button:not([disabled]),textarea,input,select,[tabindex]:not([tabindex="-1"])',
      );
      if (!focusable.length) return;
      const first = focusable[0], last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    };

    document.addEventListener('keydown', onKey);
    const raf = requestAnimationFrame(() => {
      panelRef.current?.querySelector<HTMLElement>('[data-autofocus]')?.focus()
        ?? panelRef.current?.focus();
    });

    return () => {
      document.removeEventListener('keydown', onKey);
      cancelAnimationFrame(raf);
      document.body.style.overflow = prevOverflow;
      restoreRef.current?.focus?.();
    };
  }, [open, onClose]);

  if (!open) return null;

  const width = { sm: 'sm:max-w-md', md: 'sm:max-w-xl', lg: 'sm:max-w-3xl' }[size];

  return createPortal(
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-navy-950/55 backdrop-blur-[2px] animate-fade-in" onClick={onClose} />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        className={cx(
          'relative w-full bg-white shadow-lift flex flex-col max-h-[92vh]',
          'rounded-t-3xl sm:rounded-2xl animate-slide-up sm:animate-scale-in',
          width,
        )}
      >
        <div className="flex items-start justify-between gap-4 px-5 sm:px-6 pt-5 pb-4 border-b border-brick-200">
          <h2 className="text-xl font-display font-bold">{title}</h2>
          <button onClick={onClose} className="btn-ghost -mr-2 -mt-1 !p-2 rounded-full" aria-label="Close">
            <Icon name="x" className="w-5 h-5" />
          </button>
        </div>
        <div className="overflow-y-auto px-5 sm:px-6 py-5 grow">{children}</div>
        {footer && (
          <div className="px-5 sm:px-6 py-4 border-t border-brick-200 bg-brick-50 rounded-b-none sm:rounded-b-2xl">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}

/* ==================== Toast ========================================== */

type Toast = { id: number; msg: string; tone: 'ok' | 'err' | 'info' };
const ToastCtx = createContext<(msg: string, tone?: Toast['tone']) => void>(() => {});

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<Toast[]>([]);
  const seq = useRef(0);

  const push = useCallback((msg: string, tone: Toast['tone'] = 'ok') => {
    const id = ++seq.current;
    setItems((p) => [...p, { id, msg, tone }]);
    setTimeout(() => setItems((p) => p.filter((t) => t.id !== id)), 3200);
  }, []);

  const tones = {
    ok: 'bg-jade-700 text-white',
    err: 'bg-crimson-700 text-white',
    info: 'bg-navy-900 text-white',
  };
  const icons: Record<Toast['tone'], IconName> = { ok: 'check-circle', err: 'alert', info: 'info' };

  return (
    <ToastCtx.Provider value={push}>
      {children}
      <div
        className="fixed z-[80] bottom-24 sm:bottom-6 left-1/2 -translate-x-1/2 flex flex-col gap-2 items-center w-[calc(100%-2rem)] sm:w-auto pointer-events-none"
        role="status"
        aria-live="polite"
      >
        {items.map((t) => (
          <div
            key={t.id}
            className={cx('flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-lift text-sm font-medium animate-fade-up max-w-sm', tones[t.tone])}
          >
            <Icon name={icons[t.tone]} className="w-4.5 h-4.5 shrink-0" strokeWidth={2} />
            <span>{t.msg}</span>
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}

export const useToast = () => useContext(ToastCtx);

/* ==================== Small building blocks =========================== */

export function Spec({ icon, label, value }: { icon: IconName; label: string; value: ReactNode }) {
  return (
    <div className="flex items-start gap-3">
      <span className="shrink-0 w-9 h-9 rounded-xl bg-brick-100 text-navy-700 grid place-items-center mt-0.5">
        <Icon name={icon} className="w-[18px] h-[18px]" />
      </span>
      <div className="min-w-0">
        <div className="text-[12px] uppercase tracking-wide text-brick-600 font-semibold">{label}</div>
        <div className="text-[15px] font-medium text-navy-900 leading-snug">{value}</div>
      </div>
    </div>
  );
}

export function SectionHeading({
  title, sub, action,
}: { title: string; sub?: string; action?: ReactNode }) {
  return (
    <div className="flex items-end justify-between gap-4 mb-6">
      <div>
        <h2 className="text-2xl sm:text-3xl font-bold">{title}</h2>
        {sub && <p className="text-brick-700 mt-1.5 text-[15px]">{sub}</p>}
      </div>
      {action}
    </div>
  );
}

export function EmptyState({
  icon = 'search', title, body, action,
}: { icon?: IconName; title: string; body: string; action?: ReactNode }) {
  return (
    <div className="text-center py-16 px-6">
      <div className="w-16 h-16 rounded-2xl bg-brick-100 grid place-items-center mx-auto mb-5 text-brick-500">
        <Icon name={icon} className="w-8 h-8" />
      </div>
      <h3 className="text-xl font-bold mb-2">{title}</h3>
      <p className="text-brick-700 max-w-sm mx-auto text-[15px] leading-relaxed">{body}</p>
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}

/** Tick-box that looks like a chip. Used across filters and the post form. */
export function CheckChip({
  checked, onChange, children, icon,
}: { checked: boolean; onChange: (v: boolean) => void; children: ReactNode; icon?: IconName }) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={checked ? 'chip-on' : 'chip-off'}
    >
      {icon && <Icon name={icon} className="w-3.5 h-3.5" />}
      {children}
      {checked && <Icon name="check" className="w-3 h-3" strokeWidth={3} />}
    </button>
  );
}

/** Auto-dismissing disclosure used for the filter panels. */
export function Collapsible({
  label, children, defaultOpen = true, count,
}: { label: string; children: ReactNode; defaultOpen?: boolean; count?: number }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-brick-200 last:border-0 py-4">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center justify-between w-full text-left group"
        aria-expanded={open}
      >
        <span className="font-semibold text-[15px] flex items-center gap-2">
          {label}
          {!!count && (
            <span className="text-[11px] font-bold bg-crimson-600 text-white rounded-full px-1.5 py-0.5 min-w-[18px] text-center">
              {count}
            </span>
          )}
        </span>
        <Icon
          name="chevron-down"
          className={cx('w-4 h-4 text-brick-600 transition-transform', open && 'rotate-180')}
        />
      </button>
      {open && <div className="mt-3.5 animate-fade-in">{children}</div>}
    </div>
  );
}

/** Hook: true once the element has been scrolled into view at least once. */
export function useInView<T extends HTMLElement>(rootMargin = '120px') {
  const ref = useRef<T>(null);
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || seen) return;
    if (typeof IntersectionObserver === 'undefined') { setSeen(true); return; }
    const io = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setSeen(true); io.disconnect(); } },
      { rootMargin },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [seen, rootMargin]);
  return [ref, seen] as const;
}

/** Debounce for the search box so filtering doesn't run on every keystroke. */
export function useDebounced<T>(value: T, delay = 250): T {
  const [v, setV] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setV(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return v;
}

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia(query).matches : false,
  );
  useEffect(() => {
    const mq = window.matchMedia(query);
    const on = () => setMatches(mq.matches);
    on();
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, [query]);
  return matches;
}

export const useIsDesktop = () => useMediaQuery('(min-width: 1024px)');

/** Memoised so the filter/sort lists don't recompute on unrelated renders. */
export function useStable<T>(factory: () => T, deps: unknown[]): T {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useMemo(factory, deps);
}
