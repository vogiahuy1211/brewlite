import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { CartItem, Topping, ItemSize, Product } from '@/types/product';

export const SIZE_SURCHARGES: Record<ItemSize, number> = {
  S: 0,
  M: 5000,
  L: 10000,
};

interface CartStore {
  items: CartItem[];
  addItem: (product: Product, size: ItemSize, toppings: Topping[], qty?: number) => void;
  updateQty: (cartItemId: string, delta: number) => void;
  removeItem: (cartItemId: string) => void;
  clearCart: () => void;
  getTotalItems: () => number;
  getTotalPrice: () => number;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (product, size, toppings, qty = 1) => {
        const sortedToppingIds = toppings.map((t) => t.id).sort().join('-');
        const cartItemId = `${product.id}-${size}-${sortedToppingIds}`;
        const toppingTotal = toppings.reduce((sum, t) => sum + t.price, 0);
        const unitPrice = product.price + SIZE_SURCHARGES[size] + toppingTotal;

        set((state) => {
          const existing = state.items.find((i) => i.id === cartItemId);
          if (existing) {
            return {
              items: state.items.map((i) =>
                i.id === cartItemId ? { ...i, qty: i.qty + qty } : i
              ),
            };
          }
          return {
            items: [
              ...state.items,
              {
                id: cartItemId,
                productId: product.id,
                name: product.name,
                price: unitPrice,
                imageUrl: product.imageUrl,
                size,
                toppings,
                qty,
              },
            ],
          };
        });
      },

      updateQty: (cartItemId, delta) => {
        set((state) => ({
          items: state.items
            .map((item) => {
              if (item.id === cartItemId) {
                const newQty = item.qty + delta;
                return newQty > 0 ? { ...item, qty: newQty } : null;
              }
              return item;
            })
            .filter(Boolean) as CartItem[],
        }));
      },

      removeItem: (cartItemId) => {
        set((state) => ({
          items: state.items.filter((item) => item.id !== cartItemId),
        }));
      },

      clearCart: () => set({ items: [] }),

      getTotalItems: () => {
        return get().items.reduce((total, item) => total + item.qty, 0);
      },

      getTotalPrice: () => {
        return get().items.reduce((total, item) => total + item.price * item.qty, 0);
      },
    }),
    {
      name: 'brewlite_cart_storage',
    }
  )
);
