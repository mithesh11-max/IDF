import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { CATALOG, type Item } from '../data/catalog';
import {
  EMPTY_OFFER,
  loadCatalog,
  type CatalogOrigin,
  type Offer,
} from '../lib/catalogSource';

interface CatalogValue {
  items: Item[];
  /** Only what a customer can actually buy right now. */
  available: Item[];
  offer: Offer;
  byId: (id: string) => Item | undefined;
  loading: boolean;
  origin: CatalogOrigin;
  updatedAt?: string;
}

const Ctx = createContext<CatalogValue | null>(null);

export function CatalogProvider({ children }: { children: ReactNode }) {
  // Start from the bundled catalog so the page renders instantly, then swap in
  // the live one. The shop never sees an empty grid while a fetch is in flight.
  const [items, setItems] = useState<Item[]>(CATALOG);
  const [offer, setOffer] = useState<Offer>(EMPTY_OFFER);
  const [origin, setOrigin] = useState<CatalogOrigin>('bundled');
  const [updatedAt, setUpdatedAt] = useState<string | undefined>();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    loadCatalog()
      .then((c) => {
        if (cancelled) return;
        setItems(c.items);
        setOffer(c.offer);
        setOrigin(c.origin);
        setUpdatedAt(c.updatedAt);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const value = useMemo<CatalogValue>(() => {
    const map = new Map(items.map((i) => [i.id, i]));
    return {
      items,
      available: items.filter((i) => i.stock !== 'out'),
      offer,
      byId: (id: string) => map.get(id),
      loading,
      origin,
      updatedAt,
    };
  }, [items, offer, loading, origin, updatedAt]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useCatalog() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useCatalog must be used inside CatalogProvider');
  return ctx;
}
