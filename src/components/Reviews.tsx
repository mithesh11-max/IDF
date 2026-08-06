import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Star, X } from 'lucide-react';
import { REVIEWS, type Review } from '../data/reviews';
import { BUSINESS } from '../lib/constants';
import Reveal from './Reveal';
import SectionHeading from './SectionHeading';

const LOCAL_KEY = 'idlf_my_reviews_v1';

function Stars({ n, size = 'h-3.5 w-3.5' }: { n: number; size?: string }) {
  return (
    <div className="flex gap-0.5" aria-label={`${n} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={`${size} ${i <= n ? 'fill-gold text-gold' : 'text-ivory/20'}`}
          strokeWidth={1.5}
        />
      ))}
    </div>
  );
}

export default function Reviews() {
  const [mine, setMine] = useState<Review[]>([]);
  const [formOpen, setFormOpen] = useState(false);
  const [rating, setRating] = useState(5);
  const [name, setName] = useState('');
  const [city, setCity] = useState('');
  const [text, setText] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    try {
      const raw = localStorage.getItem(LOCAL_KEY);
      if (raw) setMine(JSON.parse(raw) as Review[]);
    } catch {
      /* storage unavailable */
    }
  }, []);

  const all = [...mine, ...REVIEWS];
  const avg = (all.reduce((s, r) => s + r.rating, 0) / all.length).toFixed(1);

  const submit = () => {
    if (name.trim().length < 2) return setError('Please enter your name');
    if (text.trim().length < 12) return setError('Please write a little more about your experience');
    setError('');

    const review: Review = {
      name: name.trim(),
      city: city.trim() || BUSINESS.city,
      rating,
      text: text.trim(),
      date: new Date().toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }),
    };

    const next = [review, ...mine];
    setMine(next);
    try {
      localStorage.setItem(LOCAL_KEY, JSON.stringify(next));
    } catch {
      /* storage unavailable */
    }

    const msg = `*NEW REVIEW* for ${BUSINESS.name}\n\n${'★'.repeat(rating)}${'☆'.repeat(
      5 - rating,
    )} (${rating}/5)\n*From:* ${review.name}, ${review.city}\n\n"${review.text}"\n\n— submitted from the website`;
    window.open(
      `https://wa.me/${BUSINESS.whatsappNumber}?text=${encodeURIComponent(msg)}`,
      '_blank',
      'noopener',
    );

    setFormOpen(false);
    setName('');
    setCity('');
    setText('');
    setRating(5);
  };

  return (
    <section id="reviews" className="scroll-mt-20 bg-cream py-16 sm:py-24 lg:py-28">
      <div className="container-lux">
        <SectionHeading
          kicker="Customer Reviews"
          title="What our customers say"
          sub="Real words from brides, boutique owners and tailors who buy here."
        />

        <Reveal className="mt-8 flex flex-col items-center gap-3">
          <div className="flex items-center gap-3">
            <span className="font-serif text-4xl text-gold-dark">{avg}</span>
            <div>
              <Stars n={Math.round(Number(avg))} size="h-4 w-4" />
              <p className="mt-1 text-[11px] uppercase tracking-[0.16em] text-muted">
                {all.length} reviews
              </p>
            </div>
          </div>
          <button type="button" onClick={() => setFormOpen(true)} className="btn btn-ghost-dark mt-2">
            Write a Review
          </button>
        </Reveal>

        <div className="mt-10 grid gap-4 sm:mt-12 sm:grid-cols-2 lg:grid-cols-3">
          {all.slice(0, 6).map((r, i) => (
            <Reveal key={`${r.name}-${i}`} delay={(i % 3) * 0.08}>
              <figure className="flex h-full flex-col rounded-[3px] border border-walnut/15 bg-ivory p-5">
                <Stars n={r.rating} />
                <blockquote className="mt-3 flex-1 text-[14px] leading-relaxed text-ink/80">
                  {r.text}
                </blockquote>
                <figcaption className="mt-4 border-t border-walnut/10 pt-3">
                  <p className="text-[13px] font-semibold text-ink">{r.name}</p>
                  <p className="mt-0.5 text-[11px] uppercase tracking-[0.14em] text-muted">
                    {r.city} · {r.date}
                  </p>
                </figcaption>
              </figure>
            </Reveal>
          ))}
        </div>
      </div>

      {/* Review form */}
      <AnimatePresence>
        {formOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[95] flex items-end justify-center bg-night/85 backdrop-blur-sm sm:items-center sm:p-6"
            role="dialog"
            aria-modal="true"
            aria-label="Write a review"
          >
            <motion.div
              initial={{ y: '4%', opacity: 0.6 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: '4%', opacity: 0 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              className="w-full max-w-md rounded-t-[6px] bg-chocolate p-5 sm:rounded-[4px]"
            >
              <div className="flex items-center justify-between">
                <h3 className="font-serif text-xl text-ivory">Write a Review</h3>
                <button
                  type="button"
                  onClick={() => setFormOpen(false)}
                  aria-label="Close review form"
                  className="flex h-10 w-10 items-center justify-center text-ivory/70 hover:text-gold"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="mt-5 space-y-4">
                <div>
                  <p className="mb-2 text-[12px] uppercase tracking-[0.16em] text-ivory/60">
                    Your rating
                  </p>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setRating(i)}
                        aria-label={`Rate ${i} of 5`}
                        className="p-1"
                      >
                        <Star
                          className={`h-7 w-7 transition-colors ${
                            i <= rating ? 'fill-gold text-gold' : 'text-ivory/25'
                          }`}
                          strokeWidth={1.5}
                        />
                      </button>
                    ))}
                  </div>
                </div>

                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                  className="w-full rounded-[2px] border border-ivory/15 bg-night/40 px-3.5 py-3 text-[14px] text-ivory placeholder-ivory/30 outline-none focus:border-gold"
                />
                <input
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="City (optional)"
                  className="w-full rounded-[2px] border border-ivory/15 bg-night/40 px-3.5 py-3 text-[14px] text-ivory placeholder-ivory/30 outline-none focus:border-gold"
                />
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  rows={4}
                  placeholder="Tell others about the fabric, service and experience…"
                  className="w-full rounded-[2px] border border-ivory/15 bg-night/40 px-3.5 py-3 text-[14px] text-ivory placeholder-ivory/30 outline-none focus:border-gold"
                />

                {error && <p className="text-[12px] text-maroon">{error}</p>}

                <button type="button" onClick={submit} className="btn btn-gold btn-sheen w-full">
                  Submit Review
                </button>
                <p className="text-center text-[11px] leading-relaxed text-ivory/40">
                  Your review appears here right away and is sent to the showroom for publishing to
                  all visitors.
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
