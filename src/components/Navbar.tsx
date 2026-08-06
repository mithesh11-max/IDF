import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Menu, ShoppingBag, X } from 'lucide-react';
import { NAV_LINKS, WA_DEFAULT } from '../lib/constants';
import { useCart } from '../context/CartContext';
import Wordmark from './Wordmark';

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const { items, setOpen: setCartOpen } = useCart();
  const count = items.reduce((s, i) => s + i.metres, 0);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 36);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-500 ease-lux ${
        scrolled
          ? 'border-b border-gold/20 bg-night/90 py-2.5 backdrop-blur-md'
          : 'border-b border-transparent bg-transparent py-4 sm:py-5'
      }`}
    >
      <div className="container-lux flex items-center justify-between gap-3">
        <a href="#top" aria-label="In Design Luxury Fabrics — back to top" className="shrink-0">
          <Wordmark tone="light" />
        </a>

        <nav className="hidden items-center gap-6 xl:flex" aria-label="Primary">
          {NAV_LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="group relative pb-1 text-[12px] font-medium uppercase tracking-[0.18em] text-ivory/80 transition-colors duration-300 hover:text-ivory"
            >
              {l.label}
              <span
                className="absolute bottom-0 left-0 h-px w-0 bg-gold transition-all duration-500 ease-lux group-hover:w-full"
                aria-hidden="true"
              />
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-1 sm:gap-2">
          <a
            href={WA_DEFAULT}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-gold btn-sheen hidden !px-5 !py-2.5 !text-[11px] xl:inline-flex"
          >
            WhatsApp Us
          </a>

          <button
            type="button"
            onClick={() => setCartOpen(true)}
            aria-label={`Open order — ${count} metres`}
            className="relative flex h-11 w-11 items-center justify-center text-ivory transition-colors hover:text-gold"
          >
            <ShoppingBag className="h-5 w-5" strokeWidth={1.7} />
            {count > 0 && (
              <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-gold px-1 text-[9px] font-bold text-night">
                {count}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-label="Open menu"
            className="flex h-11 w-11 items-center justify-center text-ivory xl:hidden"
          >
            <Menu className="h-6 w-6" />
          </button>
        </div>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-[60] flex flex-col overflow-y-auto bg-night xl:hidden"
          >
            <div className="container-lux flex shrink-0 items-center justify-between py-4">
              <Wordmark tone="light" />
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close menu"
                className="flex h-11 w-11 items-center justify-center text-ivory"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            <nav className="container-lux flex flex-1 flex-col py-4" aria-label="Mobile primary">
              {NAV_LINKS.map((l, i) => (
                <motion.a
                  key={l.href}
                  href={l.href}
                  onClick={() => setOpen(false)}
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 + i * 0.06, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                  className="border-b border-ivory/10 py-4 font-serif text-[27px] text-ivory transition-colors hover:text-gold sm:text-3xl"
                >
                  {l.label}
                </motion.a>
              ))}
              <motion.a
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + NAV_LINKS.length * 0.06, duration: 0.5 }}
                href={WA_DEFAULT}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setOpen(false)}
                className="btn btn-gold btn-sheen mt-7 w-full"
              >
                WhatsApp Us
              </motion.a>
              <p className="py-7 text-[10px] uppercase tracking-[0.36em] text-ivory/40">
                Commercial Street · Bengaluru
              </p>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
