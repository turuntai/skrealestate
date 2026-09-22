import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Starts every page at the top.
 *
 * A client-side router keeps the scroll position across navigations, so
 * following a link from halfway down the listings grid would drop you halfway
 * down the next page. This resets on `pathname` only — the search string
 * changes on every filter toggle, and jumping to the top each time you tick a
 * checkbox would be worse than the problem it fixes.
 *
 * The jump is explicitly instant: `html { scroll-behavior: smooth }` is set for
 * in-page anchors, and without this override navigation would animate a long
 * scroll back to the top.
 */
export function ScrollToTop() {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    // An anchored link should land on its target, not the top of the page.
    if (hash) {
      const el = document.getElementById(hash.slice(1));
      if (el) {
        el.scrollIntoView();
        return;
      }
    }
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior });
  }, [pathname, hash]);

  return null;
}
