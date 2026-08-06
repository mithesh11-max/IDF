import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

/** Brief brand reveal on first visit of a session. */
export default function Preloader() {
  const [show, setShow] = useState(() => {
    try {
      return !sessionStorage.getItem('idlf_seen');
    } catch {
      return true;
    }
  });

  useEffect(() => {
    if (!show) return;
    const t = setTimeout(() => {
      setShow(false);
      try {
        sessionStorage.setItem('idlf_seen', '1');
      } catch {
        /* storage unavailable */
      }
    }, 1350);
    return () => clearTimeout(t);
  }, [show]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          exit={{ opacity: 0, transition: { duration: 0.55, ease: 'easeInOut' } }}
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-night"
          aria-hidden="true"
        >
          <motion.p
            initial={{ opacity: 0, letterSpacing: '0.12em', y: 8 }}
            animate={{ opacity: 1, letterSpacing: '0.3em', y: 0 }}
            transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
            className="font-serif text-2xl uppercase text-ivory sm:text-3xl"
          >
            In Design
          </motion.p>
          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ delay: 0.35, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="mt-4 h-px w-28 origin-center bg-gold"
          />
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.5 }}
            className="mt-3.5 text-[10px] font-semibold uppercase tracking-[0.5em] text-gold"
          >
            Luxury Fabrics
          </motion.p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
