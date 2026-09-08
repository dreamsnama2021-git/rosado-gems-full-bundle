import { create } from "zustand";
import { persist } from "zustand/middleware";

export type CartItem = {
  id: string;
  slug: string;
  name: string;
  price: number;
  image: string;
  qty: number;
  metal?: string | null;
  gemstone?: string | null;
  variant_id?: string | null;
  sku?: string | null;
  variantLabel?: string | null;
  maxStock?: number | null;
};

const capQty = (qty: number, max?: number | null) =>
  Math.max(1, max && max > 0 ? Math.min(qty, max) : qty);

type CartState = {
  items: CartItem[];
  isOpen: boolean;
  add: (item: Omit<CartItem, "qty">, qty?: number) => void;
  remove: (id: string) => void;
  setQty: (id: string, qty: number) => void;
  clear: () => void;
  open: () => void;
  close: () => void;
  toggle: () => void;
  subtotal: () => number;
  count: () => number;
};

export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,
      add: (item, qty = 1) => set((s) => {
        const existing = s.items.find((i) => i.id === item.id);
        if (existing) return { items: s.items.map((i) => i.id === item.id ? { ...i, qty: capQty(i.qty + qty, item.maxStock ?? i.maxStock) } : i), isOpen: true };
        return { items: [...s.items, { ...item, qty: capQty(qty, item.maxStock) }], isOpen: true };
      }),
      remove: (id) => set((s) => ({ items: s.items.filter((i) => i.id !== id) })),
      setQty: (id, qty) => set((s) => ({ items: s.items.map((i) => i.id === id ? { ...i, qty: capQty(qty, i.maxStock) } : i) })),
      clear: () => set({ items: [] }),
      open: () => set({ isOpen: true }),
      close: () => set({ isOpen: false }),
      toggle: () => set((s) => ({ isOpen: !s.isOpen })),
      subtotal: () => get().items.reduce((s, i) => s + i.price * i.qty, 0),
      count: () => get().items.reduce((s, i) => s + i.qty, 0),
    }),
    { name: "rosado-cart", partialize: (s) => ({ items: s.items }) as never },
  ),
);

export const formatINR = (n: number) => "₹" + n.toLocaleString("en-IN");
