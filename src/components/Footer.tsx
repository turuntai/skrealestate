import { Link } from 'react-router-dom';
import { CITIES, POPULAR_AREAS } from '../lib/taxonomy';
import { Icon, LogoLockup } from './Icon';

const OFFICE = {
  line1: 'Kupondole Height, Ward 10',
  line2: 'Lalitpur, Bagmati Province, Nepal',
  phone: '01-5520987',
  mobile: '9851410559',
  email: 'info@skrealestate.com.np',
  hours: 'Sunday – Friday, 10 AM – 6 PM',
};

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-navy-900 text-navy-100 mt-20 no-print">
      {/* marigold rule — the same accent as the brand mark */}
      <div className="h-1 bg-gradient-to-r from-crimson-600 via-marigold-400 to-jade-600" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-14">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4">
          {/* ---- brand ------------------------------------------- */}
          <div>
            {/* The mark's navy would disappear against this footer, so the
                full lockup sits on a white tile instead of being inverted. */}
            <div className="inline-flex bg-white rounded-2xl px-4 py-3 mb-4 shadow-card">
              <LogoLockup className="h-12" />
            </div>
            <div className="text-[10px] tracking-[0.18em] text-marigold-300 font-semibold mb-3">
              PVT. LTD. · EST. 2020
            </div>
            <p className="text-[14px] leading-relaxed text-navy-200">
              Houses, flats and land across Kathmandu Valley — listed by owners and
              checked by our team before they go live. No broker commission from tenants.
            </p>
            <div className="flex gap-2 mt-5">
              <a
                href="https://www.facebook.com/"
                target="_blank"
                rel="noreferrer noopener"
                aria-label="SK Real Estate on Facebook"
                className="w-9 h-9 rounded-lg bg-navy-800 hover:bg-navy-700 grid place-items-center transition-colors"
              >
                <Icon name="facebook" className="w-4.5 h-4.5" filled />
              </a>
              <a
                href={`https://wa.me/977${OFFICE.mobile}`}
                target="_blank"
                rel="noreferrer noopener"
                aria-label="SK Real Estate on WhatsApp"
                className="w-9 h-9 rounded-lg bg-navy-800 hover:bg-jade-700 grid place-items-center transition-colors"
              >
                <Icon name="whatsapp" className="w-4.5 h-4.5" />
              </a>
              <a
                href={`mailto:${OFFICE.email}`}
                aria-label="Email SK Real Estate"
                className="w-9 h-9 rounded-lg bg-navy-800 hover:bg-navy-700 grid place-items-center transition-colors"
              >
                <Icon name="mail" className="w-4.5 h-4.5" />
              </a>
            </div>
          </div>

          {/* ---- browse ------------------------------------------ */}
          <div>
            <h3 className="text-white font-bold text-[15px] mb-4">Browse</h3>
            <ul className="space-y-2.5 text-[14px]">
              <li><Link to="/listings?for=rent" className="hover:text-marigold-300 transition-colors">Houses & flats for rent</Link></li>
              <li><Link to="/listings?for=sale" className="hover:text-marigold-300 transition-colors">Property for sale</Link></li>
              <li><Link to="/listings?types=room" className="hover:text-marigold-300 transition-colors">Rooms & RK</Link></li>
              <li><Link to="/listings?types=shutter,office" className="hover:text-marigold-300 transition-colors">Shutters & office space</Link></li>
              <li><Link to="/listings?types=land" className="hover:text-marigold-300 transition-colors">Land</Link></li>
              <li><Link to="/post" className="hover:text-marigold-300 transition-colors">Post your property</Link></li>
            </ul>
          </div>

          {/* ---- areas ------------------------------------------- */}
          <div>
            <h3 className="text-white font-bold text-[15px] mb-4">Popular areas</h3>
            <div className="flex flex-wrap gap-1.5">
              {POPULAR_AREAS.map((a) => (
                <Link
                  key={a}
                  to={`/listings?areas=${encodeURIComponent(a)}`}
                  className="text-[12.5px] px-2.5 py-1 rounded-full bg-navy-800 hover:bg-navy-700 transition-colors"
                >
                  {a}
                </Link>
              ))}
            </div>
            <div className="mt-5 text-[13px] text-navy-300">
              We cover {CITIES.map((c) => c.name).join(', ')}.
            </div>
          </div>

          {/* ---- office ------------------------------------------ */}
          <div>
            <h3 className="text-white font-bold text-[15px] mb-4">Office</h3>
            <ul className="space-y-3 text-[14px]">
              <li className="flex gap-2.5">
                <Icon name="pin" className="w-4 h-4 shrink-0 mt-0.5 text-marigold-300" />
                <span>{OFFICE.line1}<br />{OFFICE.line2}</span>
              </li>
              <li className="flex gap-2.5">
                <Icon name="phone" className="w-4 h-4 shrink-0 mt-0.5 text-marigold-300" />
                <span>
                  <a href={`tel:+977${OFFICE.mobile}`} className="hover:text-marigold-300">{OFFICE.mobile}</a>
                  <span className="text-navy-400"> · </span>
                  <a href="tel:+97715520987" className="hover:text-marigold-300">{OFFICE.phone}</a>
                </span>
              </li>
              <li className="flex gap-2.5">
                <Icon name="mail" className="w-4 h-4 shrink-0 mt-0.5 text-marigold-300" />
                <a href={`mailto:${OFFICE.email}`} className="hover:text-marigold-300 break-all">{OFFICE.email}</a>
              </li>
              <li className="flex gap-2.5">
                <Icon name="clock" className="w-4 h-4 shrink-0 mt-0.5 text-marigold-300" />
                <span>{OFFICE.hours}</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-7 border-t border-navy-800 flex flex-col sm:flex-row gap-4 items-center justify-between text-[13px] text-navy-300">
          <p>© {year} SK Real Estate Pvt. Ltd. · Company Reg. 1234567/078/079 · All rights reserved.</p>
          <div className="flex gap-5">
            <Link to="/about" className="hover:text-marigold-300">About</Link>
            <Link to="/contact" className="hover:text-marigold-300">Contact</Link>
            <Link to="/admin" className="hover:text-marigold-300">Admin</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
