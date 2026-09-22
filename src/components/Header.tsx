import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useLang } from '../lib/i18n';
import { useStore } from '../lib/store';
import { Icon } from './Icon';
import { Logo } from './Icon';
import { cx } from './ui';

const NAV = [
  { to: '/listings?for=rent', label: 'nav.rent' as const, match: '/listings' },
  { to: '/listings?for=sale', label: 'nav.buy' as const, match: null },
  { to: '/about', label: 'nav.about' as const, match: '/about' },
  { to: '/contact', label: 'nav.contact' as const, match: '/contact' },
];

export function Header() {
  const { t, lang, setLang } = useLang();
  const { saved } = useStore();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [q, setQ] = useState('');
  const loc = useLocation();
  const nav = useNavigate();

  useEffect(() => setOpen(false), [loc.pathname, loc.search]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Redundant where the page already owns a prominent search field.
  const showInlineSearch = loc.pathname !== '/' && loc.pathname !== '/listings';

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    nav(`/listings?q=${encodeURIComponent(q.trim())}`);
  };

  return (
    <>
      <header
        className={cx(
          'sticky top-0 z-50 bg-white/95 backdrop-blur-md transition-shadow no-print',
          scrolled ? 'shadow-card border-b border-brick-200' : 'border-b border-transparent',
        )}
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="h-16 flex items-center gap-3 sm:gap-5">
            <Link to="/" className="flex items-center gap-2.5 shrink-0" aria-label="SK Real Estate home">
              <Logo className="h-8 w-12 sm:h-9 sm:w-14" />
              <span className="leading-none">
                <span className="block font-display font-bold text-[15px] sm:text-[17px] text-navy-900 whitespace-nowrap">SK Real Estate</span>
                <span className="hidden sm:block text-[10px] tracking-[0.18em] text-brick-600 font-semibold mt-0.5">
                  PVT. LTD.
                </span>
              </span>
            </Link>

            {showInlineSearch && (
              <form onSubmit={submit} className="hidden md:flex flex-1 max-w-md relative">
                <Icon name="search" className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-brick-500" />
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder={t('search.placeholder')}
                  aria-label={t('search.placeholder')}
                  className="field !pl-10 !py-2 !rounded-full bg-brick-50 !text-sm"
                />
              </form>
            )}

            <nav className="hidden lg:flex items-center gap-1 ml-auto">
              {NAV.map((n) => (
                <NavLink
                  key={n.to}
                  to={n.to}
                  className={({ isActive }) =>
                    cx(
                      'px-3 py-2 rounded-lg text-[14.5px] font-semibold transition-colors',
                      isActive && n.match ? 'text-crimson-700 bg-crimson-50' : 'text-navy-800 hover:bg-brick-100',
                    )
                  }
                >
                  {t(n.label)}
                </NavLink>
              ))}
            </nav>

            <div className="flex items-center gap-1.5 ml-auto lg:ml-0">
              {/* Language toggle — a real need, not decoration. */}
              <div className="hidden sm:flex items-center rounded-full bg-brick-100 p-0.5 text-[12px] font-bold">
                {(['en', 'ne'] as const).map((l) => (
                  <button
                    key={l}
                    onClick={() => setLang(l)}
                    aria-pressed={lang === l}
                    className={cx(
                      'px-2.5 py-1 rounded-full transition-colors',
                      lang === l ? 'bg-white text-navy-900 shadow-sm' : 'text-brick-600 hover:text-navy-800',
                    )}
                  >
                    {l === 'en' ? 'EN' : 'नेप'}
                  </button>
                ))}
              </div>

              <Link to="/saved" className="btn-ghost !px-2.5 relative" aria-label={t('nav.saved')}>
                <Icon name="heart" className="w-5 h-5" />
                {saved.length > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 bg-crimson-600 text-white text-[10px] font-bold rounded-full w-[18px] h-[18px] grid place-items-center">
                    {saved.length > 9 ? '9+' : saved.length}
                  </span>
                )}
              </Link>

              <Link to="/post" className="btn-primary btn-sm sm:btn hidden sm:inline-flex">
                <Icon name="plus" className="w-4 h-4" strokeWidth={2.4} />
                <span className="hidden md:inline">{t('nav.post')}</span>
                <span className="md:hidden">Post</span>
              </Link>

              <button
                onClick={() => setOpen((o) => !o)}
                className="btn-ghost !px-2.5 lg:hidden"
                aria-label="Menu"
                aria-expanded={open}
              >
                <Icon name={open ? 'x' : 'menu'} className="w-6 h-6" />
              </button>
            </div>
          </div>
        </div>

        {/* ---- mobile drawer ----------------------------------------- */}
        {open && (
          <div className="lg:hidden border-t border-brick-200 bg-white animate-fade-in">
            <div className="px-4 py-4 space-y-1">
              <form onSubmit={submit} className="relative mb-3">
                <Icon name="search" className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-brick-500" />
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder={t('search.placeholder')}
                  aria-label={t('search.placeholder')}
                  className="field !pl-10"
                />
              </form>
              {NAV.map((n) => (
                <Link key={n.to} to={n.to} className="block px-3 py-3 rounded-xl font-semibold hover:bg-brick-100">
                  {t(n.label)}
                </Link>
              ))}
              <Link to="/saved" className="block px-3 py-3 rounded-xl font-semibold hover:bg-brick-100">
                {t('nav.saved')} {saved.length > 0 && `(${saved.length})`}
              </Link>
              <Link to="/admin" className="block px-3 py-3 rounded-xl font-semibold hover:bg-brick-100">
                {t('nav.admin')}
              </Link>
              <div className="flex items-center gap-2 px-3 pt-3">
                <span className="text-[13px] text-brick-600 font-medium">Language</span>
                {(['en', 'ne'] as const).map((l) => (
                  <button
                    key={l}
                    onClick={() => setLang(l)}
                    className={lang === l ? 'chip-on' : 'chip-off'}
                  >
                    {l === 'en' ? 'English' : 'नेपाली'}
                  </button>
                ))}
              </div>
              <Link to="/post" className="btn-primary w-full mt-3">
                <Icon name="plus" className="w-4 h-4" strokeWidth={2.4} /> {t('nav.post')}
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* ---- mobile bottom bar -------------------------------------- */}
      <nav className="sm:hidden fixed bottom-0 inset-x-0 z-40 bg-white border-t border-brick-200 no-print pb-[env(safe-area-inset-bottom)]">
        <div className="grid grid-cols-4">
          {[
            { to: '/', icon: 'house' as const, label: 'Home' },
            { to: '/listings', icon: 'search' as const, label: 'Search' },
            { to: '/post', icon: 'plus' as const, label: 'Post' },
            { to: '/saved', icon: 'heart' as const, label: 'Saved' },
          ].map((item) => {
            const active = loc.pathname === item.to;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cx(
                  'flex flex-col items-center gap-0.5 py-2.5 text-[10.5px] font-semibold transition-colors',
                  active ? 'text-crimson-600' : 'text-brick-600',
                )}
              >
                <Icon name={item.icon} className="w-[22px] h-[22px]" strokeWidth={active ? 2.2 : 1.7} />
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
