import { useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import type { Media } from '../lib/types';
import { Icon } from './Icon';
import { cx } from './ui';
import { Photo } from './Photo';

interface Props {
  photos: Media[];
  video?: string;
  title: string;
}

/**
 * Mosaic on desktop (one hero + four tiles, the Zillow/Airbnb pattern), a
 * swipeable strip on phones. Both open the same full-screen lightbox.
 */
export function Gallery({ photos, video, title }: Props) {
  const [lightbox, setLightbox] = useState<number | null>(null);
  const [active, setActive] = useState(0);

  // The video, when present, rides along as the last slide.
  const slides: { kind: 'photo' | 'video'; media: Media }[] = [
    ...photos.map((p) => ({ kind: 'photo' as const, media: p })),
    ...(video ? [{ kind: 'video' as const, media: { src: video, alt: `${title} — walkthrough` } }] : []),
  ];

  const open = (i: number) => setLightbox(i);
  const close = useCallback(() => setLightbox(null), []);

  const step = useCallback(
    (delta: number) => setLightbox((i) => (i === null ? i : (i + delta + slides.length) % slides.length)),
    [slides.length],
  );

  useEffect(() => {
    if (lightbox === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowRight') step(1);
      if (e.key === 'ArrowLeft') step(-1);
    };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [lightbox, close, step]);

  if (!slides.length) {
    return <div className="aspect-[16/10] rounded-2xl bg-brick-200 grid place-items-center text-brick-600">No photos yet</div>;
  }

  const hero = slides[0];
  const tiles = slides.slice(1, 5);
  const extra = slides.length - 5;

  return (
    <>
      {/* ---- mobile: scroll-snap strip ------------------------------ */}
      <div className="sm:hidden -mx-4">
        <div
          className="flex overflow-x-auto snap-x snap-mandatory no-scrollbar"
          onScroll={(e) => {
            const el = e.currentTarget;
            setActive(Math.round(el.scrollLeft / el.clientWidth));
          }}
        >
          {slides.map((s, i) => (
            <button
              key={i}
              onClick={() => open(i)}
              className="snap-center shrink-0 w-full aspect-[4/3] bg-brick-200 relative"
              aria-label={`Open photo ${i + 1} of ${slides.length}`}
            >
              <Photo src={s.media.src} alt={s.media.alt} className="w-full h-full object-cover" loading={i === 0 ? 'eager' : 'lazy'} />
              {s.kind === 'video' && <PlayOverlay />}
            </button>
          ))}
        </div>
        <div className="flex justify-center gap-1.5 py-3">
          {slides.map((_, i) => (
            <span key={i} className={cx('h-1.5 rounded-full transition-all', i === active ? 'w-5 bg-crimson-600' : 'w-1.5 bg-brick-300')} />
          ))}
        </div>
      </div>

      {/* ---- desktop: mosaic ---------------------------------------- */}
      <div className="hidden sm:grid grid-cols-4 grid-rows-2 gap-2 h-[26rem] lg:h-[30rem] rounded-2xl overflow-hidden">
        <button
          onClick={() => open(0)}
          className={cx('relative bg-brick-200 group', tiles.length ? 'col-span-2 row-span-2' : 'col-span-4 row-span-2')}
          aria-label="Open photo 1"
        >
          <Photo src={hero.media.src} alt={hero.media.alt} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.03]" />
          {hero.kind === 'video' && <PlayOverlay />}
        </button>

        {tiles.map((s, i) => (
          <button key={i} onClick={() => open(i + 1)} className="relative bg-brick-200 group" aria-label={`Open photo ${i + 2}`}>
            <Photo src={s.media.src} alt={s.media.alt} loading="lazy" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.04]" />
            {s.kind === 'video' && <PlayOverlay small />}
            {i === tiles.length - 1 && extra > 0 && (
              <span className="absolute inset-0 bg-navy-950/60 grid place-items-center text-white font-bold text-lg">
                +{extra} more
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="hidden sm:flex justify-end mt-3">
        <button onClick={() => open(0)} className="btn-outline btn-sm">
          <Icon name="camera" className="w-4 h-4" /> View all {slides.length}
        </button>
      </div>

      {/* ---- lightbox ------------------------------------------------ */}
      {lightbox !== null &&
        createPortal(
          <div className="fixed inset-0 z-[90] bg-navy-950 flex flex-col animate-fade-in">
            <div className="flex items-center justify-between px-4 py-3.5 text-white shrink-0">
              <span className="text-sm font-medium tabular-nums">{lightbox + 1} / {slides.length}</span>
              <span className="text-sm font-medium truncate px-4 hidden sm:block">{title}</span>
              <button onClick={close} className="p-2 -mr-2 hover:bg-white/10 rounded-full" aria-label="Close gallery">
                <Icon name="x" className="w-6 h-6" />
              </button>
            </div>

            <div className="grow relative grid place-items-center px-2 sm:px-16 pb-4 min-h-0">
              <Photo
                src={slides[lightbox].media.src}
                alt={slides[lightbox].media.alt}
                className="max-w-full max-h-full object-contain rounded-lg"
              />
              {slides.length > 1 && (
                <>
                  <NavBtn side="left" onClick={() => step(-1)} />
                  <NavBtn side="right" onClick={() => step(1)} />
                </>
              )}
            </div>

            <div className="shrink-0 px-4 pb-5">
              <p className="text-center text-navy-200 text-sm mb-3">{slides[lightbox].media.alt}</p>
              <div className="flex gap-2 overflow-x-auto no-scrollbar justify-start sm:justify-center">
                {slides.map((s, i) => (
                  <button
                    key={i}
                    onClick={() => setLightbox(i)}
                    className={cx(
                      'w-16 h-12 rounded-md overflow-hidden shrink-0 transition-all',
                      i === lightbox ? 'ring-2 ring-marigold-400 opacity-100' : 'opacity-50 hover:opacity-85',
                    )}
                    aria-label={`Go to photo ${i + 1}`}
                  >
                    <Photo src={s.media.src} alt="" className="w-full h-full object-cover" loading="lazy" />
                  </button>
                ))}
              </div>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}

function PlayOverlay({ small = false }: { small?: boolean }) {
  return (
    <span className="absolute inset-0 grid place-items-center bg-navy-950/25">
      <span className={cx('rounded-full bg-white/92 grid place-items-center text-navy-900 shadow-lift', small ? 'w-11 h-11' : 'w-16 h-16')}>
        <Icon name="play" className={small ? 'w-6 h-6' : 'w-8 h-8'} strokeWidth={1.6} />
      </span>
    </span>
  );
}

function NavBtn({ side, onClick }: { side: 'left' | 'right'; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      aria-label={side === 'left' ? 'Previous photo' : 'Next photo'}
      className={cx(
        'absolute top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/12 hover:bg-white/22',
        'grid place-items-center text-white backdrop-blur transition-colors',
        side === 'left' ? 'left-2 sm:left-5' : 'right-2 sm:right-5',
      )}
    >
      <Icon name={side === 'left' ? 'chevron-left' : 'chevron-right'} className="w-6 h-6" strokeWidth={2} />
    </button>
  );
}
