import {
  createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode,
} from 'react';
import { SEED_LISTINGS, SEED_VERSION } from '../data/seed';
import { renew as renewListing } from './expiry';
import { KEYS, read, resetAll, uid, write } from './storage';
import type { Listing, Report, VisitRequest } from './types';

interface Store {
  listings: Listing[];
  saved: string[];
  visits: VisitRequest[];
  reports: Report[];
  recent: string[];

  bySlug: (slug: string) => Listing | undefined;
  byId: (id: string) => Listing | undefined;

  addListing: (l: Listing) => void;
  updateListing: (id: string, patch: Partial<Listing>) => void;
  deleteListing: (id: string) => void;
  markRented: (id: string, rented: boolean) => void;
  renew: (id: string, days?: number) => void;

  toggleSave: (id: string) => void;
  isSaved: (id: string) => boolean;

  addVisit: (v: Omit<VisitRequest, 'id' | 'createdAt'>) => void;
  addReport: (r: Omit<Report, 'id' | 'createdAt'>) => void;
  trackView: (id: string) => void;

  resetDemoData: () => void;
}

const StoreContext = createContext<Store | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [listings, setListings] = useState<Listing[]>(() => {
    // Re-seed when the bundled catalogue is newer than what's in the browser,
    // so a deploy with new demo data isn't masked by a stale localStorage copy.
    const storedVersion = read<number>(KEYS.seedVersion, 0);
    if (storedVersion !== SEED_VERSION) {
      write(KEYS.listings, SEED_LISTINGS);
      write(KEYS.seedVersion, SEED_VERSION);
      return SEED_LISTINGS;
    }
    return read<Listing[]>(KEYS.listings, SEED_LISTINGS);
  });

  const [saved, setSaved] = useState<string[]>(() => read<string[]>(KEYS.saved, []));
  const [visits, setVisits] = useState<VisitRequest[]>(() => read<VisitRequest[]>(KEYS.visits, []));
  const [reports, setReports] = useState<Report[]>(() => read<Report[]>(KEYS.reports, []));
  const [recent, setRecent] = useState<string[]>(() => read<string[]>(KEYS.recent, []));

  useEffect(() => { write(KEYS.listings, listings); }, [listings]);
  useEffect(() => { write(KEYS.saved, saved); }, [saved]);
  useEffect(() => { write(KEYS.visits, visits); }, [visits]);
  useEffect(() => { write(KEYS.reports, reports); }, [reports]);
  useEffect(() => { write(KEYS.recent, recent); }, [recent]);

  // Keep two tabs of the same site in step.
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === KEYS.listings && e.newValue) {
        try { setListings(JSON.parse(e.newValue)); } catch { /* ignore bad payload */ }
      }
      if (e.key === KEYS.saved && e.newValue) {
        try { setSaved(JSON.parse(e.newValue)); } catch { /* ignore bad payload */ }
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const bySlug = useCallback((slug: string) => listings.find((l) => l.slug === slug), [listings]);
  const byId = useCallback((id: string) => listings.find((l) => l.id === id), [listings]);

  const addListing = useCallback((l: Listing) => setListings((prev) => [l, ...prev]), []);

  const updateListing = useCallback((id: string, patch: Partial<Listing>) => {
    setListings((prev) =>
      prev.map((l) => (l.id === id ? { ...l, ...patch, updatedAt: new Date().toISOString() } : l)),
    );
  }, []);

  const deleteListing = useCallback((id: string) => {
    setListings((prev) => prev.filter((l) => l.id !== id));
    setSaved((prev) => prev.filter((s) => s !== id));
  }, []);

  const markRented = useCallback((id: string, rented: boolean) => {
    setListings((prev) =>
      prev.map((l) =>
        l.id === id
          ? { ...l, status: rented ? 'rented' : 'active', updatedAt: new Date().toISOString() }
          : l,
      ),
    );
  }, []);

  const renew = useCallback((id: string, days?: number) => {
    setListings((prev) => prev.map((l) => (l.id === id ? renewListing(l, days ?? l.durationDays) : l)));
  }, []);

  const toggleSave = useCallback((id: string) => {
    setSaved((prev) => (prev.includes(id) ? prev.filter((s) => s !== id) : [id, ...prev]));
  }, []);

  const isSaved = useCallback((id: string) => saved.includes(id), [saved]);

  const addVisit = useCallback((v: Omit<VisitRequest, 'id' | 'createdAt'>) => {
    setVisits((prev) => [{ ...v, id: uid('visit'), createdAt: new Date().toISOString() }, ...prev]);
  }, []);

  const addReport = useCallback((r: Omit<Report, 'id' | 'createdAt'>) => {
    setReports((prev) => [{ ...r, id: uid('report'), createdAt: new Date().toISOString() }, ...prev]);
  }, []);

  const trackView = useCallback((id: string) => {
    setListings((prev) => prev.map((l) => (l.id === id ? { ...l, views: l.views + 1 } : l)));
    setRecent((prev) => [id, ...prev.filter((r) => r !== id)].slice(0, 8));
  }, []);

  const resetDemoData = useCallback(() => {
    resetAll();
    setListings(SEED_LISTINGS);
    setSaved([]); setVisits([]); setReports([]); setRecent([]);
    write(KEYS.seedVersion, SEED_VERSION);
  }, []);

  const value = useMemo<Store>(
    () => ({
      listings, saved, visits, reports, recent,
      bySlug, byId, addListing, updateListing, deleteListing, markRented, renew,
      toggleSave, isSaved, addVisit, addReport, trackView, resetDemoData,
    }),
    [listings, saved, visits, reports, recent, bySlug, byId, addListing, updateListing,
     deleteListing, markRented, renew, toggleSave, isSaved, addVisit, addReport,
     trackView, resetDemoData],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): Store {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used inside <StoreProvider>');
  return ctx;
}
