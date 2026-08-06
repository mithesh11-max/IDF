import { MotionConfig } from 'framer-motion';

import { CartProvider } from './context/CartContext';
import Preloader from './components/Preloader';
import ScrollProgress from './components/ScrollProgress';
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

export default function App() {
  return (
    <MotionConfig reducedMotion="user">
      <CartProvider>
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[110] focus:bg-gold focus:px-4 focus:py-2 focus:text-xs focus:font-semibold focus:uppercase focus:tracking-widest focus:text-night"
        >
          Skip to content
        </a>
        <Preloader />
        <ScrollProgress />
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
      </CartProvider>
    </MotionConfig>
  );
}
