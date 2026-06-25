import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useProducts } from "@/lib/queries";

export type CartItem = {
  productId: string;
  slug: string;
  title: string;
  price: number;
  variant: string;
  quantity: number;
  imageUrl?: string | null;
};

type CartContextValue = {
  items: CartItem[];
  /** True after items were removed because their drop is no longer live. */
  dropExpiredNotice: boolean;
  dismissDropExpiredNotice: () => void;
  add: (item: CartItem) => void;
  remove: (productId: string, variant: string) => void;
  updateQty: (productId: string, variant: string, qty: number) => void;
  clear: () => void;
  count: number;
  subtotal: number;
};

const CartContext = createContext<CartContextValue | null>(null);
const STORAGE_KEY = "pixellato.cart.v1";

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [dropExpiredNotice, setDropExpiredNotice] = useState(false);
  const { data: products = [], isSuccess: productsLoaded } = useProducts();

  useEffect(() => {
    try {
      const raw = typeof window !== "undefined" ? window.localStorage.getItem(STORAGE_KEY) : null;
      if (raw) setItems(JSON.parse(raw));
    } catch {}
    setHydrated(true);
  }, []);

  // Drop ended — evicted products are deleted server-side; drop stale lines from the bag.
  useEffect(() => {
    if (!productsLoaded || !hydrated) return;
    const liveIds = new Set(products.filter((p) => p.status === "live").map((p) => p.id));
    setItems((prev) => {
      const next = prev.filter((i) => liveIds.has(i.productId));
      if (next.length < prev.length) setDropExpiredNotice(true);
      return next.length === prev.length ? prev : next;
    });
  }, [products, productsLoaded, hydrated]);

  useEffect(() => {
    try {
      if (typeof window !== "undefined") window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {}
  }, [items]);

  const value = useMemo<CartContextValue>(() => ({
    items,
    dropExpiredNotice,
    dismissDropExpiredNotice: () => setDropExpiredNotice(false),
    add: (item) => {
      setDropExpiredNotice(false);
      setItems((prev) => {
        const key = (i: CartItem) => i.productId + "::" + i.variant;
        const existing = prev.find((i) => key(i) === key(item));
        if (existing) {
          return prev.map((i) => (key(i) === key(item) ? { ...i, quantity: i.quantity + item.quantity } : i));
        }
        return [...prev, item];
      });
    },
    remove: (productId, variant) =>
      setItems((prev) => prev.filter((i) => !(i.productId === productId && i.variant === variant))),
    updateQty: (productId, variant, qty) =>
      setItems((prev) => prev.map((i) => (i.productId === productId && i.variant === variant ? { ...i, quantity: Math.max(1, qty) } : i))),
    clear: () => {
      setDropExpiredNotice(false);
      setItems([]);
    },
    count: items.reduce((n, i) => n + i.quantity, 0),
    subtotal: items.reduce((n, i) => n + i.quantity * i.price, 0),
  }), [items, dropExpiredNotice]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
