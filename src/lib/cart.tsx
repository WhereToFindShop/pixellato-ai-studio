import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

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

  useEffect(() => {
    try {
      const raw = typeof window !== "undefined" ? window.localStorage.getItem(STORAGE_KEY) : null;
      if (raw) setItems(JSON.parse(raw));
    } catch {}
  }, []);

  useEffect(() => {
    try {
      if (typeof window !== "undefined") window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {}
  }, [items]);

  const value = useMemo<CartContextValue>(() => ({
    items,
    add: (item) => setItems((prev) => {
      const key = (i: CartItem) => i.productId + "::" + i.variant;
      const existing = prev.find((i) => key(i) === key(item));
      if (existing) {
        return prev.map((i) => (key(i) === key(item) ? { ...i, quantity: i.quantity + item.quantity } : i));
      }
      return [...prev, item];
    }),
    remove: (productId, variant) =>
      setItems((prev) => prev.filter((i) => !(i.productId === productId && i.variant === variant))),
    updateQty: (productId, variant, qty) =>
      setItems((prev) => prev.map((i) => (i.productId === productId && i.variant === variant ? { ...i, quantity: Math.max(1, qty) } : i))),
    clear: () => setItems([]),
    count: items.reduce((n, i) => n + i.quantity, 0),
    subtotal: items.reduce((n, i) => n + i.quantity * i.price, 0),
  }), [items]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
