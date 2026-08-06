import { useEffect, useState } from 'react';
import { MotionConfig } from 'framer-motion';

import { CartProvider } from './context/CartContext';
import { CatalogProvider } from './context/CatalogContext';
import AdminPanel from './admin/AdminPanel';
import Preloader from './components/Preloader';
import ScrollProgress from './components/ScrollProgress';
import OfferBar from './components/OfferBar';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import Marquee from './components/Marquee';
import Collections from './components/Collections';
import Shop from './components/Shop';
import Atelier from './components/Atelier';
import StatsStrip from './components/StatsStrip';
import Gallery from './components/Gallery';
import Reviews from './components/Reviews';
import Testimonials from './components/Testimonials';
import Visit from './components/Visit';
import Footer from './components/Footer';
import FloatingWhatsApp from './components/FloatingWhatsApp';
import CartDrawer from './components/CartDrawer';
import PendingOrderBanner from './components/PendingOrderBanner';

/**
 * The shop editor lives behind the #/admin hash rather than a router, so it
 * works on every host — including plain Apache — with no rewrite rules and no
 * extra dependency.
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
      <CatalogProvider>
        <CartProvider>
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
            <Hero />
            <Marquee />
            <Collections />
            <Shop />
            <Atelier />
            <StatsStrip />
            <Gallery />
            <Reviews />
            <Testimonials />
            <Visit />
          </main>
          <Footer />
          <FloatingWhatsApp />
          <CartDrawer />
          <PendingOrderBanner />
        </CartProvider>
      </CatalogProvider>
    </MotionConfig>
  );
}
