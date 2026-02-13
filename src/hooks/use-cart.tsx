"use client";

import { createContext, useContext, useState, useCallback, useEffect, useRef, type ReactNode } from "react";
import { useAuth } from "./use-auth";

export interface CartItem {
  id: number;
  userId: number;
  dishId: number;
  name: string;
  price: number;
  quantity: number;
  specialNotes?: string;
  thumbnailUrl?: string;
  addedByName: string;
}

interface CartContextValue {
  items: CartItem[];
  addItem: (item: { dishId: number; name: string; price: number; quantity?: number; specialNotes?: string; thumbnailUrl?: string }) => void;
  removeItem: (cartItemId: number) => void;
  updateQuantity: (cartItemId: number, quantity: number) => void;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  refreshCart: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const { userId } = useAuth();
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchCart = useCallback(async () => {
    try {
      const res = await fetch("/api/cart");
      if (!res.ok) return;
      const data = await res.json();
      setItems(
        data.map((item: Record<string, unknown>) => ({
          id: item.id,
          userId: item.userId,
          dishId: item.dishId,
          name: item.dishName || "Unknown",
          price: item.dishPrice || 0,
          quantity: item.quantity,
          specialNotes: item.specialNotes,
          thumbnailUrl: item.dishThumbnail,
          addedByName: item.userName || "Unknown",
        }))
      );
    } catch {
      /* ignore */
    }
  }, []);

  // Fetch on mount + poll every 5s
  useEffect(() => {
    fetchCart();
    pollRef.current = setInterval(fetchCart, 5000);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [fetchCart]);

  const addItem = useCallback(
    async (item: { dishId: number; name: string; price: number; quantity?: number; specialNotes?: string; thumbnailUrl?: string }) => {
      if (!userId) return;
      await fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          dishId: item.dishId,
          quantity: item.quantity || 1,
          specialNotes: item.specialNotes,
        }),
      });
      fetchCart();
    },
    [userId, fetchCart]
  );

  const removeItem = useCallback(
    async (cartItemId: number) => {
      await fetch(`/api/cart?id=${cartItemId}`, { method: "DELETE" });
      fetchCart();
    },
    [fetchCart]
  );

  const updateQuantity = useCallback(
    async (cartItemId: number, quantity: number) => {
      await fetch("/api/cart", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cartItemId, quantity }),
      });
      fetchCart();
    },
    [fetchCart]
  );

  const clearCart = useCallback(async () => {
    await fetch("/api/cart?all=true", { method: "DELETE" });
    fetchCart();
  }, [fetchCart]);

  const totalItems = items.reduce((sum, i) => sum + i.quantity, 0);
  const totalPrice = items.reduce((sum, i) => sum + i.price * i.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        items, addItem, removeItem, updateQuantity,
        clearCart, totalItems, totalPrice, isOpen, setIsOpen,
        refreshCart: fetchCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
