import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import AuthGate from './AuthGate';

interface Props {
  open: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
}

export default function AuthModal({
  open,
  onClose,
  title = 'Sign In',
  subtitle = 'Verified accounts only — for genuine reviews and secure orders.',
}: Props) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[96] flex items-end justify-center bg-night/85 backdrop-blur-sm sm:items-center sm:p-6"
          role="dialog"
          aria-modal="true"
          aria-label={title}
          onClick={(e) => e.target === e.currentTarget && onClose()}
        >
          <motion.div
            initial={{ y: '4%', opacity: 0.6 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '4%', opacity: 0 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="w-full max-w-sm rounded-t-[6px] bg-cream p-6 sm:rounded-[4px]"
          >
            <div className="flex items-start justify-between">
              <div>
                <h2 className="font-serif text-xl text-ink">{title}</h2>
                <p className="mt-1 text-[12.5px] leading-relaxed text-muted">{subtitle}</p>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="flex h-9 w-9 shrink-0 items-center justify-center text-muted hover:text-ink"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="mt-5">
              <AuthGate compact />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
