import { useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Icon } from '../components/Icon';
import { ListingCard, ListingMini } from '../components/ListingCard';
import { EmptyState, SectionHeading } from '../components/ui';
import { applyMeta } from '../lib/seo';
import { useStore } from '../lib/store';

export function Saved() {
  const { listings, saved, recent } = useStore();

  useEffect(() => {
    applyMeta({
      title: 'Saved properties',
      description: 'The properties you have shortlisted on SK Real Estate.',
    });
  }, []);

  // Keep the order the user saved them in, newest first.
  const items = useMemo(
    () => saved.map((id) => listings.find((l) => l.id === id)).filter(Boolean) as typeof listings,
    [saved, listings],
  );

  const recentlyViewed = useMemo(
    () => recent
      .filter((id) => !saved.includes(id))
      .map((id) => listings.find((l) => l.id === id))
      .filter(Boolean)
      .slice(0, 5) as typeof listings,
    [recent, saved, listings],
  );

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8 sm:py-10">
      <SectionHeading
        title="Saved properties"
        sub={
          items.length
            ? `${items.length} shortlisted. They stay here on this device until you remove them.`
            : 'Tap the heart on any listing to shortlist it.'
        }
      />

      {items.length === 0 ? (
        <div className="card">
          <EmptyState
            icon="heart"
            title="Nothing saved yet"
            body="As you browse, tap the heart on the places worth a second look. Your shortlist lives on this device — no account needed."
            action={<Link to="/listings" className="btn-primary btn-lg">Browse properties</Link>}
          />
        </div>
      ) : (
        <div className="grid gap-4 sm:gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((l) => <ListingCard key={l.id} listing={l} />)}
        </div>
      )}

      {recentlyViewed.length > 0 && (
        <section className="mt-14">
          <h2 className="text-xl font-bold mb-5 flex items-center gap-2">
            <Icon name="clock" className="w-5 h-5 text-brick-600" /> Recently viewed
          </h2>
          <div className="card p-4 sm:p-5 grid sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-3">
            {recentlyViewed.map((l) => <ListingMini key={l.id} listing={l} />)}
          </div>
        </section>
      )}
    </div>
  );
}
