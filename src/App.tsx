import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { MotionConfig } from 'framer-motion';

import { CartProvider } from './context/CartContext';
import { CatalogProvider } from './context/CatalogContext';
import { AuthProvider } from './context/AuthContext';
import AdminPanel from './admin/AdminPanel';
import Preloader from './components/Preloader';
import ScrollProgress from './components/ScrollProgress';
import OfferBar from './components/OfferBar';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import FloatingWhatsApp from './components/FloatingWhatsApp';
import CartDrawer from './components/CartDrawer';
import PendingOrderBanner from './components/PendingOrderBanner';
import HomePage from './pages/HomePage';
import ProductPage from './pages/ProductPage';

/**
 * The shop editor lives behind the #/admin hash rather than a router path, so
 * it keeps working even on hosts with no SPA rewrite rule configured — it
 * never depends on the server sending index.html for an unknown path.
 */
function useIsAdminRoute() {
  const [isAdmin, setIsAdmin] = useState(() => window.location.hash.startsWith('#/admin'));
  useEffect(() => {
    const onHash = () => setIsAdmin(window.location.hash.startsWith('#/admin'));
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);
  return isAdmin;
}

/** Scrolls to top on every real page change (not on in-page hash jumps). */
function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

function SiteChrome() {
  return (
    <>
      <ScrollToTop />
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[110] focus:bg-gold focus:px-4 focus:py-2 focus:text-xs focus:font-semibold focus:uppercase focus:tracking-widest focus:text-night"
      >
        Skip to content
      </a>
      <Preloader />
      <ScrollProgress />
      <OfferBar />
      <Navbar />
      <main id="main">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/product/:id" element={<ProductPage />} />
        </Routes>
      </main>
      <Footer />
      <FloatingWhatsApp />
      <CartDrawer />
      <PendingOrderBanner />
    </>
  );
}

export default function App() {
  const isAdmin = useIsAdminRoute();

  if (isAdmin) {
    return (
      <MotionConfig reducedMotion="user">
        <AdminPanel />
      </MotionConfig>
    );
  }

  return (
    <MotionConfig reducedMotion="user">
      <BrowserRouter>
        <CatalogProvider>
          <AuthProvider>
            <CartProvider>
              <SiteChrome />
            </CartProvider>
          </AuthProvider>
        </CatalogProvider>
      </BrowserRouter>
    </MotionConfig>
  );
}
