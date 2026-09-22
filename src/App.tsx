import { Component, type ErrorInfo, type ReactNode } from 'react';
import { Route, Routes } from 'react-router-dom';
import { Footer } from './components/Footer';
import { Header } from './components/Header';
import { Icon } from './components/Icon';
import { ScrollToTop } from './components/ScrollToTop';
import { About } from './pages/About';
import { Admin } from './pages/Admin';
import { Contact } from './pages/Contact';
import { Home } from './pages/Home';
import { ListingDetail } from './pages/ListingDetail';
import { Listings } from './pages/Listings';
import { NotFound } from './pages/NotFound';
import { PostProperty } from './pages/PostProperty';
import { Saved } from './pages/Saved';

/** Keeps one broken page from blanking the whole site. */
class ErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null as Error | null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Unhandled error in SK Real Estate UI', error, info);
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="mx-auto max-w-lg px-4 py-24 text-center">
        <div className="w-16 h-16 rounded-2xl bg-crimson-50 text-crimson-600 grid place-items-center mx-auto mb-5">
          <Icon name="alert" className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-bold mb-3">Something went wrong</h1>
        <p className="text-brick-700 mb-7 text-[15px]">
          Reloading usually clears it. If it keeps happening, the demo data in this browser
          may be corrupt — the Reset button on the admin page will fix it.
        </p>
        <button onClick={() => window.location.reload()} className="btn-primary btn-lg">
          Reload the page
        </button>
      </div>
    );
  }
}

export default function App() {
  return (
    <div className="min-h-screen flex flex-col">
      <ScrollToTop />
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:z-[100] focus:top-3 focus:left-3 focus:btn-primary"
      >
        Skip to content
      </a>

      <Header />

      <main id="main" className="grow">
        <ErrorBoundary>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/listings" element={<Listings />} />
            <Route path="/property/:slug" element={<ListingDetail />} />
            <Route path="/post" element={<PostProperty />} />
            <Route path="/saved" element={<Saved />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </ErrorBoundary>
      </main>

      <Footer />
      {/* clears the fixed bottom bar on phones */}
      <div className="h-14 sm:hidden no-print" aria-hidden="true" />
    </div>
  );
}
