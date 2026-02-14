"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { DishCard, type DishData } from "@/components/menu/dish-card";
import { CategoryFilter } from "@/components/menu/category-filter";
import { DishDetail } from "@/components/menu/dish-detail";
import { CartDrawer } from "@/components/cart/cart-drawer";
import { BottomNav } from "@/components/shared/bottom-nav";
import { PageTransition } from "@/components/shared/page-transition";
import { Skeleton } from "@/components/ui/skeleton";
import { ShoppingCart, Search, X } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useCart } from "@/hooks/use-cart";
import { toast } from "sonner";
import confetti from "canvas-confetti";
import { haptic } from "@/lib/haptics";

type SortOption = "default" | "price-asc" | "price-desc" | "rating-desc" | "rating-asc" | "prepTime-asc" | "prepTime-desc" | "timesOrdered-desc" | "timesOrdered-asc";

const sortLabels: Record<SortOption, string> = {
  default: "Sort",
  "price-asc": "\u2191 Price",
  "price-desc": "\u2193 Price",
  "rating-desc": "\u2193 Stars",
  "rating-asc": "\u2191 Stars",
  "prepTime-asc": "\u2191 Fast",
  "prepTime-desc": "\u2193 Slow",
  "timesOrdered-desc": "\u2193 Popular",
  "timesOrdered-asc": "\u2191 Popular",
};

export default function MenuPage() {
  const [dishes, setDishes] = useState<DishData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedDish, setSelectedDish] = useState<DishData | null>(null);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("default");
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

  const filteredDishes = useMemo(() => {
    let result = dishes;

    // Filter by category
    if (selectedCategory) {
      result = result.filter((d) => d.category === selectedCategory);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (d) => d.name.toLowerCase().includes(q) || d.description.toLowerCase().includes(q)
      );
    }

    // Sort
    if (sortBy !== "default") {
      const [field, direction] = sortBy.split("-") as [string, string];
      const dir = direction === "asc" ? 1 : -1;
      result = [...result].sort((a, b) => {
        switch (field) {
          case "price":
            return (a.price - b.price) * dir;
          case "rating":
            return ((a.avgRating ?? 0) - (b.avgRating ?? 0)) * dir;
          case "prepTime":
            return (a.prepTime - b.prepTime) * dir;
          case "timesOrdered":
            return (a.timesOrdered - b.timesOrdered) * dir;
          default:
            return 0;
        }
      });
    }

    return result;
  }, [dishes, selectedCategory, searchQuery, sortBy]);

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
      haptic("heavy");
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

          {/* Search */}
          <div className="mt-3 relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search dishes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              suppressHydrationWarning
              className="w-full rounded-full border bg-muted/50 py-2 pl-9 pr-9 text-sm placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Categories + Sort inline */}
          <div className="mt-2 flex items-center gap-2">
            <div className="flex-1 min-w-0 overflow-x-auto scrollbar-hide">
              <CategoryFilter
                categories={categories}
                selected={selectedCategory}
                onSelect={setSelectedCategory}
              />
            </div>

            <div className="shrink-0 border-l pl-2">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="appearance-none rounded-full border bg-muted/50 py-1.5 pl-2 pr-4 text-[10px] font-medium text-muted-foreground outline-none focus:outline-none focus:ring-0 active:bg-muted/50 bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%228%22%20height%3D%228%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%23999%22%20stroke-width%3D%222%22%3E%3Cpath%20d%3D%22m6%209%206%206%206-6%22%2F%3E%3C%2Fsvg%3E')] bg-no-repeat bg-[position:right_3px_center] [-webkit-tap-highlight-color:transparent]"
              >
                {(Object.keys(sortLabels) as SortOption[]).map((key) => (
                  <option key={key} value={key}>
                    {sortLabels[key]}
                  </option>
                ))}
              </select>
            </div>
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
            style={{ bottom: "calc(5rem + env(safe-area-inset-bottom, 8px))" }}
            className="fixed right-4 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg active:scale-95 transition-transform"
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
