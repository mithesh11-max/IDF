import { useState } from 'react';
import { Minus, Plus, ShoppingBag } from 'lucide-react';
import type { Item } from '../data/catalog';
import { useCart } from '../context/CartContext';
import { inr, waLink } from '../lib/constants';
import StockBadge from './StockBadge';

export default function ProductCard({ item }: { item: Item }) {
  const { add } = useCart();
  const [metres, setMetres] = useState(item.minMetres);
  const soldOut = item.stock === 'out';

  return (
    <article
      className={`group flex flex-col overflow-hidden rounded-[3px] bg-chocolate/40 ring-1 ring-gold/15 transition-all duration-500 ease-lux hover:ring-gold/50 ${
        soldOut ? 'opacity-75' : ''
      }`}
    >
      <div className="relative overflow-hidden">
        <img
          src={item.image}
          alt={item.name}
          loading="lazy"
          decoding="async"
          className={`img-zoom aspect-[4/5] w-full object-cover ${soldOut ? 'grayscale-[0.6]' : ''}`}
        />
        <div className="absolute left-3 top-3">
          <StockBadge stock={item.stock} />
        </div>
        {item.mrp && !soldOut && (
          <div className="absolute right-3 top-3 rounded-full bg-maroon px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-ivory">
            Save {inr(item.mrp - item.pricePerMetre)}
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col p-4 sm:p-5">
        <p className="text-[10px] uppercase tracking-[0.24em] text-gold/70">{item.category}</p>
        <h3 className="mt-2 font-serif text-lg leading-snug text-ivory sm:text-xl">{item.name}</h3>
        <p className="mt-2 line-clamp-2 text-[13px] leading-relaxed text-ivory/55">{item.blurb}</p>
        <p className="mt-3 text-[11px] uppercase tracking-[0.16em] text-ivory/40">
          {item.composition} · {item.width}
        </p>

        <div className="mt-4 flex items-baseline gap-2">
          <span className="font-serif text-2xl text-gold">{inr(item.pricePerMetre)}</span>
          <span className="text-[12px] text-ivory/45">/ metre</span>
          {item.mrp && (
            <span className="text-[12px] text-ivory/35 line-through">{inr(item.mrp)}</span>
          )}
        </div>

        <div className="mt-auto pt-5">
          {soldOut ? (
            <div className="space-y-2">
              <button
                type="button"
                disabled
                className="w-full cursor-not-allowed rounded-[2px] border border-ivory/15 py-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-ivory/40"
              >
                Unavailable right now
              </button>
              <a
                href={waLink(`Hello! Please notify me when "${item.name}" is back in stock.`)}
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full py-1 text-center text-[11px] font-semibold uppercase tracking-[0.16em] text-gold transition-colors hover:text-gold-light"
              >
                Notify me when back →
              </a>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between rounded-[2px] border border-ivory/15 px-2">
                <button
                  type="button"
                  aria-label="Decrease metres"
                  onClick={() => setMetres((m) => Math.max(item.minMetres, m - 1))}
                  className="flex h-11 w-11 items-center justify-center text-ivory/70 transition-colors hover:text-gold"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <span className="text-[13px] tracking-wide text-ivory">
                  {metres} <span className="text-ivory/50">metres</span>
                </span>
                <button
                  type="button"
                  aria-label="Increase metres"
                  onClick={() => setMetres((m) => m + 1)}
                  className="flex h-11 w-11 items-center justify-center text-ivory/70 transition-colors hover:text-gold"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
              <button
                type="button"
                onClick={() => add(item.id, metres)}
                className="btn btn-gold btn-sheen w-full"
              >
                <ShoppingBag className="h-4 w-4" /> Add · {inr(item.pricePerMetre * metres)}
              </button>
              <p className="text-center text-[10px] uppercase tracking-[0.16em] text-ivory/35">
                Min {item.minMetres} m · cut to order
              </p>
            </div>
          )}
        </div>
      </div>
    </article>
  );
}
