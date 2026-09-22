import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Icon } from '../components/Icon';
import { Logo } from '../components/Icon';
import { applyMeta } from '../lib/seo';

export function NotFound() {
  useEffect(() => {
    applyMeta({ title: 'Page not found', description: 'That page does not exist on SK Real Estate.' });
  }, []);

  return (
    <div className="mx-auto max-w-lg px-4 py-24 sm:py-32 text-center">
      <Logo className="h-12 w-20 mx-auto mb-6 opacity-90" />
      <div className="font-display text-7xl font-bold text-brick-300 mb-4">404</div>
      <h1 className="text-2xl sm:text-3xl font-bold mb-3">We cannot find that page</h1>
      <p className="text-brick-700 text-[15.5px] leading-relaxed">
        The link may be mistyped, or the listing it pointed to has been taken down.
      </p>
      <div className="flex flex-wrap gap-3 justify-center mt-8">
        <Link to="/listings" className="btn-primary btn-lg">
          <Icon name="search" className="w-4.5 h-4.5" /> Browse properties
        </Link>
        <Link to="/" className="btn-outline btn-lg">Go home</Link>
      </div>
    </div>
  );
}
