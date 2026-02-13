"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { DishCard, type DishData } from "@/components/menu/dish-card";
import { CategoryFilter } from "@/components/menu/category-filter";
import { DishDetail } from "@/components/menu/dish-detail";
import { CartDrawer } from "@/components/cart/cart-drawer";
import { BottomNav } from "@/components/shared/bottom-nav";
import { PageTransition } from "@/components/shared/page-transition";
import { Skeleton } from "@/components/ui/skeleton";
import { ShoppingCart } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useCart } from "@/hooks/use-cart";
import { toast } from "sonner";
import confetti from "canvas-confetti";

export default function MenuPage() {
  const [dishes, setDishes] = useState<DishData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedDish, setSelectedDish] = useState<DishData | null>(null);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const { userId, role } = useAuth();
  const { items, clearCart, setIsOpen, totalItems } = useCart();

  useEffect(() => {
    fetch("/api/dishes")
      .then((r) => r.json())
      .then((data) => {
        setDishes(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const categories = [...new Set(dishes.map((d) => d.category))];
  const filteredDishes = selectedCategory
    ? dishes.filter((d) => d.category === selectedCategory)
    : dishes;

  const handlePlaceOrder = useCallback(async (notes: string) => {
    if (!userId || items.length === 0) return;
    setIsPlacingOrder(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          notes: notes || undefined,
          items: items.map((i) => ({
            dishId: i.dishId,
            quantity: i.quantity,
            specialNotes: i.specialNotes,
            addedBy: i.userId,
          })),
        }),
      });
      if (!res.ok) throw new Error("Order failed");

      clearCart();
      setIsOpen(false);
      toast.success("Order placed! Hugo will get cooking!");

      // Confetti!
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ["#f97316", "#ef4444", "#eab308", "#22c55e"],
      });
    } catch {
      toast.error("Failed to place order");
    } finally {
      setIsPlacingOrder(false);
    }
  }, [userId, items, clearCart, setIsOpen]);

  return (
    <PageTransition>
      <div className="min-h-dvh pb-20">
        {/* Header */}
        <div className="sticky top-0 z-30 bg-background/95 backdrop-blur px-4 pt-6 pb-3">
          <h1 className="text-2xl font-bold">Menu</h1>
          <div className="mt-3">
            <CategoryFilter
              categories={categories}
              selected={selectedCategory}
              onSelect={setSelectedCategory}
            />
          </div>
        </div>

        {/* Dish Grid */}
        <div className="px-4">
          {loading ? (
            <div className="grid grid-cols-2 gap-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="aspect-[4/3] rounded-2xl" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              ))}
            </div>
          ) : (
            <motion.div layout className="grid grid-cols-2 gap-3">
              <AnimatePresence mode="popLayout">
                {filteredDishes.map((dish) => (
                  <DishCard
                    key={dish.id}
                    dish={dish}
                    onSelect={setSelectedDish}
                  />
                ))}
              </AnimatePresence>
            </motion.div>
          )}

          {!loading && filteredDishes.length === 0 && (
            <div className="mt-12 text-center text-muted-foreground">
              <p className="text-4xl mb-2">🍃</p>
              <p>No dishes in this category yet</p>
            </div>
          )}
        </div>

        {/* Dish Detail Modal */}
        <DishDetail dish={selectedDish} onClose={() => setSelectedDish(null)} />

        {/* Cart FAB */}
        {(role === "hugo" || role === "yuge") && (
          <button
            onClick={() => setIsOpen(true)}
            className="fixed bottom-20 right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg active:scale-95 transition-transform"
          >
            <ShoppingCart size={22} />
            {totalItems > 0 && (
              <motion.span
                key={totalItems}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[11px] font-bold text-white"
              >
                {totalItems}
              </motion.span>
            )}
          </button>
        )}

        {/* Cart Drawer */}
        <CartDrawer onPlaceOrder={handlePlaceOrder} isPlacing={isPlacingOrder} />

        {/* Bottom Nav */}
        <BottomNav />
      </div>
    </PageTransition>
  );
}
