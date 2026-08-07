import { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  Check,
  Copy,
  Download,
  Plus,
  Search,
  Star,
  Tag as TagIcon,
  Trash2,
} from 'lucide-react';
import {
  CATALOG,
  STOCK_LABELS,
  STOCK_VALUES,
  TAG_LABELS,
  TAG_VALUES,
  CATEGORY_VALUES,
  type Item,
  type Stock,
  type Tag,
} from '../data/catalog';
import { type Review } from '../data/reviews';
import { loadCatalog, EMPTY_OFFER, type Offer } from '../lib/catalogSource';
import { loadReviews } from '../lib/reviewSource';
import { ADMIN_PIN, inr } from '../lib/constants';

/**
 * THE SHOP'S DAILY EDITOR
 *
 * Prices move, stock runs out and offers change every week — editing a
 * TypeScript file and rebuilding the site for that is not realistic for a
 * showroom. This screen lets anyone change prices, mark fabrics sold out and
 * switch offers on from a phone, then download two small files to upload.
 *
 * What it deliberately does NOT do: write to the live site by itself. With no
 * backend there is nowhere to write to, and any "save" button that pretended
 * otherwise would be lying. The download-and-upload step is the honest version
 * of saving, and it also means a mistake here can never break the live site
 * until someone chooses to publish it.
 */

type TabId = 'catalog' | 'offer' | 'reviews';

const blankItem = (): Item => ({
  id: `new-${Math.random().toString(36).slice(2, 7)}`,
  name: 'New fabric',
  category: 'Contemporary',
  composition: '',
  width: '44 in',
  pricePerMetre: 1000,
  minMetres: 1,
  stock: 'in',
  tags: [],
  image: '/images/fabrics/f01.jpg',
  blurb: '',
});

function download(filename: string, data: unknown) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * On a phone, downloading a file and then finding it again to re-upload is
 * miserable. Copying the text and pasting it straight into GitHub's web editor
 * is far less friction, so both routes are offered.
 */
async function copyJson(data: unknown): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(JSON.stringify(data, null, 2));
    return true;
  } catch {
    return false;
  }
}

/* ------------------------------------------------------------------ */

export default function AdminPanel() {
  const [pin, setPin] = useState('');
  const [unlocked, setUnlocked] = useState(false);
  const [tab, setTab] = useState<TabId>('catalog');

  const [items, setItems] = useState<Item[]>(CATALOG);
  const [offer, setOffer] = useState<Offer>(EMPTY_OFFER);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [query, setQuery] = useState('');
  const [openId, setOpenId] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);
  const [copied, setCopied] = useState<'catalog' | 'reviews' | null>(null);

  useEffect(() => {
    if (!unlocked) return;
    loadCatalog().then((c) => {
      setItems(c.items);
      setOffer(c.offer);
    });
    loadReviews().then(setReviews);
  }, [unlocked]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? items.filter((i) => i.name.toLowerCase().includes(q)) : items;
  }, [items, query]);

  const patch = (id: string, changes: Partial<Item>) => {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, ...changes } : i)));
    setDirty(true);
  };

  const toggleTag = (id: string, tag: Tag) => {
    const item = items.find((i) => i.id === id);
    if (!item) return;
    patch(id, {
      tags: item.tags.includes(tag) ? item.tags.filter((t) => t !== tag) : [...item.tags, tag],
    });
  };

  const publishCatalog = () => {
    download('catalog.json', catalogPayload());
    setDirty(false);
  };

  const reviewsPayload = () => ({ updatedAt: new Date().toISOString(), reviews });
  const catalogPayload = () => ({ updatedAt: new Date().toISOString(), offer, items });

  const publishReviews = () => download('reviews.json', reviewsPayload());

  const flashCopied = (which: 'catalog' | 'reviews') => {
    setCopied(which);
    setTimeout(() => setCopied(null), 2400);
  };

  /* ---------------- PIN gate ---------------- */

  if (!unlocked) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-night px-5">
        <div className="w-full max-w-xs text-center">
          <h1 className="font-serif text-2xl text-ivory">Shop Editor</h1>
          <p className="mt-2 text-[13px] text-ivory/50">Enter the shop PIN to continue</p>
          <input
            type="password"
            inputMode="numeric"
            value={pin}
            autoFocus
            onChange={(e) => setPin(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && setUnlocked(pin === ADMIN_PIN)}
            placeholder="PIN"
            className="mt-5 w-full rounded-[2px] border border-ivory/15 bg-chocolate px-4 py-3 text-center text-lg tracking-[0.4em] text-ivory outline-none focus:border-gold"
          />
          <button
            type="button"
            onClick={() => setUnlocked(pin === ADMIN_PIN)}
            className="btn btn-gold btn-sheen mt-4 w-full"
          >
            Unlock
          </button>
          {pin && pin !== ADMIN_PIN && (
            <p className="mt-3 text-[12px] text-maroon">That PIN is not correct</p>
          )}
          <a href="/" className="mt-6 inline-block text-[12px] text-ivory/40 hover:text-gold">
            ← Back to the website
          </a>
        </div>
      </div>
    );
  }

  /* ---------------- Editor ---------------- */

  const tabs: { id: TabId; label: string }[] = [
    { id: 'catalog', label: 'Fabrics' },
    { id: 'offer', label: 'Offer Banner' },
    { id: 'reviews', label: 'Reviews' },
  ];

  return (
    <div className="min-h-screen bg-night pb-32">
      <header className="sticky top-0 z-20 border-b border-gold/20 bg-night/95 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-5 py-3.5">
          <a href="/" className="flex items-center gap-2 text-[13px] text-ivory/60 hover:text-gold">
            <ArrowLeft className="h-4 w-4" />
            Website
          </a>
          <h1 className="font-serif text-lg text-ivory">Shop Editor</h1>
          <span className="text-[11px] uppercase tracking-[0.14em] text-gold/70">
            {items.length} items
          </span>
        </div>
        <div className="mx-auto flex max-w-3xl gap-1 px-5 pb-2.5">
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`rounded-full px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.14em] transition-colors ${
                tab === t.id ? 'bg-gold text-night' : 'text-ivory/50 hover:text-ivory'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-5 py-5">
        {/* ============ FABRICS ============ */}
        {tab === 'catalog' && (
          <>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ivory/30" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search fabrics…"
                className="w-full rounded-[2px] border border-ivory/15 bg-chocolate py-3 pl-10 pr-3 text-[14px] text-ivory placeholder-ivory/30 outline-none focus:border-gold"
              />
            </div>

            <div className="mt-4 space-y-2">
              {filtered.map((item) => {
                const isOpen = openId === item.id;
                return (
                  <div
                    key={item.id}
                    className="overflow-hidden rounded-[3px] border border-ivory/12 bg-chocolate"
                  >
                    {/* Row summary */}
                    <button
                      type="button"
                      onClick={() => setOpenId(isOpen ? null : item.id)}
                      className="flex w-full items-center gap-3 p-3 text-left"
                    >
                      <img
                        src={item.image}
                        alt=""
                        className={`h-12 w-12 shrink-0 rounded-[2px] object-cover ${
                          item.stock === 'out' ? 'opacity-35 grayscale' : ''
                        }`}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[14px] font-medium text-ivory">{item.name}</p>
                        <p className="mt-0.5 text-[12px] text-ivory/50">
                          {inr(item.pricePerMetre)}/m ·{' '}
                          <span
                            className={
                              item.stock === 'out'
                                ? 'text-maroon'
                                : item.stock === 'low'
                                  ? 'text-gold'
                                  : 'text-ivory/50'
                            }
                          >
                            {STOCK_LABELS[item.stock]}
                          </span>
                        </p>
                      </div>
                      {item.tags.length > 0 && (
                        <TagIcon className="h-3.5 w-3.5 shrink-0 text-gold/60" />
                      )}
                    </button>

                    {/* Expanded editor */}
                    {isOpen && (
                      <div className="space-y-4 border-t border-ivory/10 p-4">
                        <label className="block">
                          <span className="text-[11px] uppercase tracking-[0.14em] text-ivory/45">
                            Name
                          </span>
                          <input
                            value={item.name}
                            onChange={(e) => patch(item.id, { name: e.target.value })}
                            className="mt-1.5 w-full rounded-[2px] border border-ivory/15 bg-night/50 px-3 py-2.5 text-[14px] text-ivory outline-none focus:border-gold"
                          />
                        </label>

                        <div className="grid grid-cols-2 gap-3">
                          <label className="block">
                            <span className="text-[11px] uppercase tracking-[0.14em] text-ivory/45">
                              Price / metre
                            </span>
                            <input
                              type="number"
                              inputMode="numeric"
                              value={item.pricePerMetre}
                              onChange={(e) =>
                                patch(item.id, { pricePerMetre: Number(e.target.value) || 0 })
                              }
                              className="mt-1.5 w-full rounded-[2px] border border-ivory/15 bg-night/50 px-3 py-2.5 text-[14px] text-ivory outline-none focus:border-gold"
                            />
                          </label>
                          <label className="block">
                            <span className="text-[11px] uppercase tracking-[0.14em] text-ivory/45">
                              Was / MRP
                            </span>
                            <input
                              type="number"
                              inputMode="numeric"
                              value={item.mrp ?? ''}
                              placeholder="none"
                              onChange={(e) => {
                                const v = Number(e.target.value);
                                patch(item.id, { mrp: v > 0 ? v : undefined });
                              }}
                              className="mt-1.5 w-full rounded-[2px] border border-ivory/15 bg-night/50 px-3 py-2.5 text-[14px] text-ivory placeholder-ivory/25 outline-none focus:border-gold"
                            />
                          </label>
                        </div>

                        {item.mrp && item.mrp > item.pricePerMetre && (
                          <p className="text-[12px] text-gold">
                            Shows a “Save {inr(item.mrp - item.pricePerMetre)}” badge
                          </p>
                        )}

                        <div>
                          <span className="text-[11px] uppercase tracking-[0.14em] text-ivory/45">
                            Availability
                          </span>
                          <div className="mt-1.5 grid grid-cols-3 gap-2">
                            {STOCK_VALUES.map((s: Stock) => (
                              <button
                                key={s}
                                type="button"
                                onClick={() => patch(item.id, { stock: s })}
                                className={`rounded-[2px] border px-2 py-2.5 text-[11px] font-semibold uppercase tracking-[0.1em] transition-colors ${
                                  item.stock === s
                                    ? 'border-gold bg-gold/10 text-gold'
                                    : 'border-ivory/15 text-ivory/50'
                                }`}
                              >
                                {s === 'in' ? 'In stock' : s === 'low' ? 'Few left' : 'Sold out'}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div>
                          <span className="text-[11px] uppercase tracking-[0.14em] text-ivory/45">
                            Show under
                          </span>
                          <div className="mt-1.5 flex flex-wrap gap-2">
                            {TAG_VALUES.map((t: Tag) => (
                              <button
                                key={t}
                                type="button"
                                onClick={() => toggleTag(item.id, t)}
                                className={`rounded-full border px-3 py-1.5 text-[11px] tracking-wide transition-colors ${
                                  item.tags.includes(t)
                                    ? 'border-gold bg-gold/10 text-gold'
                                    : 'border-ivory/15 text-ivory/45'
                                }`}
                              >
                                {TAG_LABELS[t]}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <label className="block">
                            <span className="text-[11px] uppercase tracking-[0.14em] text-ivory/45">
                              Category
                            </span>
                            <select
                              value={item.category}
                              onChange={(e) =>
                                patch(item.id, {
                                  category: e.target.value as Item['category'],
                                })
                              }
                              className="mt-1.5 w-full rounded-[2px] border border-ivory/15 bg-night/50 px-3 py-2.5 text-[14px] text-ivory outline-none focus:border-gold"
                            >
                              {CATEGORY_VALUES.map((c) => (
                                <option key={c} value={c}>
                                  {c}
                                </option>
                              ))}
                            </select>
                          </label>
                          <label className="block">
                            <span className="text-[11px] uppercase tracking-[0.14em] text-ivory/45">
                              Min metres
                            </span>
                            <input
                              type="number"
                              inputMode="numeric"
                              value={item.minMetres}
                              onChange={(e) =>
                                patch(item.id, { minMetres: Math.max(1, Number(e.target.value) || 1) })
                              }
                              className="mt-1.5 w-full rounded-[2px] border border-ivory/15 bg-night/50 px-3 py-2.5 text-[14px] text-ivory outline-none focus:border-gold"
                            />
                          </label>
                        </div>

                        <label className="block">
                          <span className="text-[11px] uppercase tracking-[0.14em] text-ivory/45">
                            Description
                          </span>
                          <textarea
                            value={item.blurb}
                            rows={2}
                            onChange={(e) => patch(item.id, { blurb: e.target.value })}
                            className="mt-1.5 w-full rounded-[2px] border border-ivory/15 bg-night/50 px-3 py-2.5 text-[14px] text-ivory outline-none focus:border-gold"
                          />
                        </label>

                        <label className="block">
                          <span className="text-[11px] uppercase tracking-[0.14em] text-ivory/45">
                            Photo path
                          </span>
                          <input
                            value={item.image}
                            onChange={(e) => patch(item.id, { image: e.target.value })}
                            className="mt-1.5 w-full rounded-[2px] border border-ivory/15 bg-night/50 px-3 py-2.5 text-[13px] text-ivory outline-none focus:border-gold"
                          />
                        </label>

                        <button
                          type="button"
                          onClick={() => {
                            setItems((prev) => prev.filter((i) => i.id !== item.id));
                            setDirty(true);
                            setOpenId(null);
                          }}
                          className="flex items-center gap-2 text-[12px] text-maroon hover:text-maroon/80"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          Remove this fabric
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <button
              type="button"
              onClick={() => {
                const item = blankItem();
                setItems((prev) => [item, ...prev]);
                setOpenId(item.id);
                setQuery('');
                setDirty(true);
              }}
              className="btn btn-ghost-light mt-4 w-full"
            >
              <Plus className="h-4 w-4" />
              Add a fabric
            </button>
          </>
        )}

        {/* ============ OFFER ============ */}
        {tab === 'offer' && (
          <div className="space-y-4">
            <p className="text-[13px] leading-relaxed text-ivory/55">
              A strip across the top of the website. Use it for festive discounts, new stock or
              wholesale weeks. Switch it off when the offer ends.
            </p>

            <button
              type="button"
              onClick={() => {
                setOffer((o) => ({ ...o, active: !o.active }));
                setDirty(true);
              }}
              className={`flex w-full items-center justify-between rounded-[3px] border px-4 py-3.5 transition-colors ${
                offer.active ? 'border-gold bg-gold/10' : 'border-ivory/15'
              }`}
            >
              <span className="text-[14px] text-ivory">
                {offer.active ? 'Offer is showing on the site' : 'Offer is switched off'}
              </span>
              <span
                className={`flex h-6 w-11 items-center rounded-full px-0.5 transition-colors ${
                  offer.active ? 'bg-gold' : 'bg-ivory/20'
                }`}
              >
                <span
                  className={`h-5 w-5 rounded-full bg-night transition-transform ${
                    offer.active ? 'translate-x-5' : ''
                  }`}
                />
              </span>
            </button>

            <label className="block">
              <span className="text-[11px] uppercase tracking-[0.14em] text-ivory/45">Headline</span>
              <input
                value={offer.headline}
                onChange={(e) => {
                  setOffer((o) => ({ ...o, headline: e.target.value }));
                  setDirty(true);
                }}
                placeholder="Festive Week — 10% off all Bridal silks"
                className="mt-1.5 w-full rounded-[2px] border border-ivory/15 bg-chocolate px-3 py-2.5 text-[14px] text-ivory placeholder-ivory/25 outline-none focus:border-gold"
              />
            </label>

            <label className="block">
              <span className="text-[11px] uppercase tracking-[0.14em] text-ivory/45">
                Small print (optional)
              </span>
              <input
                value={offer.detail ?? ''}
                onChange={(e) => {
                  setOffer((o) => ({ ...o, detail: e.target.value }));
                  setDirty(true);
                }}
                placeholder="Until 30 September · in store and online"
                className="mt-1.5 w-full rounded-[2px] border border-ivory/15 bg-chocolate px-3 py-2.5 text-[14px] text-ivory placeholder-ivory/25 outline-none focus:border-gold"
              />
            </label>

            {offer.headline && (
              <div className="rounded-[3px] border border-gold/30 bg-gold/10 px-4 py-3 text-center">
                <p className="text-[11px] uppercase tracking-[0.14em] text-gold/60">Preview</p>
                <p className="mt-1.5 text-[13px] font-semibold text-gold">{offer.headline}</p>
                {offer.detail && <p className="mt-0.5 text-[12px] text-ivory/55">{offer.detail}</p>}
              </div>
            )}
          </div>
        )}

        {/* ============ REVIEWS ============ */}
        {tab === 'reviews' && (
          <div className="space-y-4">
            <p className="text-[13px] leading-relaxed text-ivory/55">
              Reviews customers submit arrive on WhatsApp. Add the ones you want on the website here,
              then publish. Keep the star rating a customer actually gave — the site works out the
              average from what is shown, so changing stars would put a wrong number on your shop.
            </p>

            {reviews.map((r, idx) => (
              <div key={idx} className="space-y-3 rounded-[3px] border border-ivory/12 bg-chocolate p-4">
                <div className="flex items-center justify-between">
                  <div className="flex gap-0.5">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() =>
                          setReviews((prev) =>
                            prev.map((x, j) => (j === idx ? { ...x, rating: i } : x)),
                          )
                        }
                        aria-label={`Set ${i} stars`}
                      >
                        <Star
                          className={`h-5 w-5 ${
                            i <= r.rating ? 'fill-gold text-gold' : 'text-ivory/20'
                          }`}
                          strokeWidth={1.5}
                        />
                      </button>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={() => setReviews((prev) => prev.filter((_, j) => j !== idx))}
                    className="flex items-center gap-1.5 text-[12px] text-maroon"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Remove
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <input
                    value={r.name}
                    placeholder="Name"
                    onChange={(e) =>
                      setReviews((prev) =>
                        prev.map((x, j) => (j === idx ? { ...x, name: e.target.value } : x)),
                      )
                    }
                    className="rounded-[2px] border border-ivory/15 bg-night/50 px-3 py-2.5 text-[14px] text-ivory outline-none focus:border-gold"
                  />
                  <input
                    value={r.city}
                    placeholder="City"
                    onChange={(e) =>
                      setReviews((prev) =>
                        prev.map((x, j) => (j === idx ? { ...x, city: e.target.value } : x)),
                      )
                    }
                    className="rounded-[2px] border border-ivory/15 bg-night/50 px-3 py-2.5 text-[14px] text-ivory outline-none focus:border-gold"
                  />
                </div>

                <textarea
                  value={r.text}
                  rows={3}
                  placeholder="What the customer wrote"
                  onChange={(e) =>
                    setReviews((prev) =>
                      prev.map((x, j) => (j === idx ? { ...x, text: e.target.value } : x)),
                    )
                  }
                  className="w-full rounded-[2px] border border-ivory/15 bg-night/50 px-3 py-2.5 text-[14px] text-ivory outline-none focus:border-gold"
                />

                <input
                  value={r.date}
                  placeholder="Mar 2026"
                  onChange={(e) =>
                    setReviews((prev) =>
                      prev.map((x, j) => (j === idx ? { ...x, date: e.target.value } : x)),
                    )
                  }
                  className="w-full rounded-[2px] border border-ivory/15 bg-night/50 px-3 py-2.5 text-[13px] text-ivory outline-none focus:border-gold"
                />
              </div>
            ))}

            <button
              type="button"
              onClick={() =>
                setReviews((prev) => [
                  {
                    name: '',
                    city: '',
                    rating: 5,
                    text: '',
                    date: new Date().toLocaleDateString('en-IN', {
                      month: 'short',
                      year: 'numeric',
                    }),
                  },
                  ...prev,
                ])
              }
              className="btn btn-ghost-light w-full"
            >
              <Plus className="h-4 w-4" />
              Add a review
            </button>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={async () => {
                  if (await copyJson(reviewsPayload())) flashCopied('reviews');
                }}
                className="btn btn-ghost-light"
              >
                {copied === 'reviews' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                {copied === 'reviews' ? 'Copied' : 'Copy'}
              </button>
              <button type="button" onClick={publishReviews} className="btn btn-gold btn-sheen">
                <Download className="h-4 w-4" />
                Download
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Publish bar */}
      {tab !== 'reviews' && (
        <div className="fixed inset-x-0 bottom-0 border-t border-gold/25 bg-chocolate/98 backdrop-blur">
          <div className="mx-auto max-w-3xl px-5 py-3.5">
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={async () => {
                  if (await copyJson(catalogPayload())) {
                    flashCopied('catalog');
                    setDirty(false);
                  }
                }}
                className="btn btn-ghost-light"
              >
                {copied === 'catalog' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                {copied === 'catalog' ? 'Copied' : 'Copy text'}
              </button>
              <button type="button" onClick={publishCatalog} className="btn btn-gold btn-sheen">
                {dirty ? <Download className="h-4 w-4" /> : <Check className="h-4 w-4" />}
                Download
              </button>
            </div>
            <p className="mt-2 text-center text-[11px] leading-relaxed text-ivory/40">
              On a phone, <span className="text-ivory/60">Copy text</span> then paste over
              public/catalog.json on GitHub — easier than handling a downloaded file.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
