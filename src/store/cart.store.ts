import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export interface CartItem {
  variantId: string;
  productId: string;
  productName: string;
  productSlug: string;
  sku: string;
  sizeName: string;
  colorName: string;
  colorHex: string;
  unitPrice: number;
  quantity: number;
  maxStock: number;
  imageUrl: string | null;
}

interface CartState {
  items: CartItem[];
  isOpen: boolean;
}

interface CartActions {
  addItem: (item: Omit<CartItem, "quantity"> & { quantity?: number }) => void;
  removeItem: (variantId: string) => void;
  updateQuantity: (variantId: string, quantity: number) => void;
  clearCart: () => void;
  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;
  getTotalItems: () => number;
  getSubtotal: () => number;
}

export type CartStore = CartState & CartActions;

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,

      addItem: (incomingItem) => {
        const quantityToAdd = incomingItem.quantity ?? 1;
        if (quantityToAdd <= 0 || incomingItem.maxStock <= 0) return;

        set((state) => {
          const existingIndex = state.items.findIndex(
            (i) => i.variantId === incomingItem.variantId
          );

          if (existingIndex > -1) {
            const updatedItems = [...state.items];
            const currentItem = updatedItems[existingIndex];
            const nextQuantity = Math.min(
              currentItem.quantity + quantityToAdd,
              incomingItem.maxStock
            );

            updatedItems[existingIndex] = {
              ...currentItem,
              quantity: nextQuantity,
              maxStock: incomingItem.maxStock,
              unitPrice: incomingItem.unitPrice,
              imageUrl: incomingItem.imageUrl ?? currentItem.imageUrl,
            };

            return { items: updatedItems, isOpen: true };
          }

          const newItem: CartItem = {
            ...incomingItem,
            quantity: Math.min(quantityToAdd, incomingItem.maxStock),
          };

          return {
            items: [...state.items, newItem],
            isOpen: true,
          };
        });
      },

      removeItem: (variantId) => {
        set((state) => ({
          items: state.items.filter((item) => item.variantId !== variantId),
        }));
      },

      updateQuantity: (variantId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(variantId);
          return;
        }

        set((state) => ({
          items: state.items.map((item) =>
            item.variantId === variantId
              ? {
                  ...item,
                  quantity: Math.min(quantity, item.maxStock),
                }
              : item
          ),
        }));
      },

      clearCart: () => set({ items: [] }),

      openCart: () => set({ isOpen: true }),
      closeCart: () => set({ isOpen: false }),
      toggleCart: () => set((state) => ({ isOpen: !state.isOpen })),

      getTotalItems: () =>
        get().items.reduce((acc, item) => acc + item.quantity, 0),

      getSubtotal: () =>
        get().items.reduce(
          (acc, item) => acc + item.unitPrice * item.quantity,
          0
        ),
    }),
    {
      name: "olecommerce-cart-storage",
      storage: createJSONStorage(() => localStorage),
      // Persistimos únicamente los ítems en localStorage, excluyendo el flag visual isOpen
      partialize: (state) => ({ items: state.items }),
    }
  )
);
