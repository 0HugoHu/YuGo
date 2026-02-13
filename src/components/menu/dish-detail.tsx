"use client";

import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X, Plus, Minus, Flame, Clock, Star } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useCart } from "@/hooks/use-cart";
import { useState, useEffect } from "react";
import type { DishData } from "./dish-card";

interface ReviewData {
  id: number;
  userName: string | null;
  rating: number;
  comment: string | null;
  createdAt: string;
}

interface DishDetailProps {
  dish: DishData | null;
  onClose: () => void;
}

export function DishDetail({ dish, onClose }: DishDetailProps) {
  const { role } = useAuth();
  const { addItem } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [dishReviews, setDishReviews] = useState<ReviewData[]>([]);
  const canOrder = role === "hugo" || role === "yuge";

  useEffect(() => {
    if (dish) {
      setQuantity(1);
      fetch(`/api/reviews?dishId=${dish.id}`)
        .then((r) => r.json())
        .then((data) => setDishReviews(data))
        .catch(() => setDishReviews([]));
    } else {
      setDishReviews([]);
    }
  }, [dish]);

  return (
    <AnimatePresence>
      {dish && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-black/60"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, y: "100%" }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed inset-x-0 bottom-0 z-[60] max-h-[85vh] overflow-y-auto rounded-t-3xl bg-background"
          >
            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute right-4 top-4 z-10 rounded-full bg-background/80 p-2 backdrop-blur"
            >
              <X size={20} />
            </button>

            {/* Image */}
            <div className="relative aspect-video overflow-hidden rounded-t-3xl bg-muted">
              {dish.imageUrl || dish.thumbnailUrl ? (
                <Image
                  src={dish.imageUrl || dish.thumbnailUrl!}
                  alt={dish.name}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-6xl">🍜</div>
              )}
            </div>

            {/* Content */}
            <div className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-2xl font-bold">{dish.name}</h2>
                  <Badge variant="secondary" className="mt-1">{dish.category}</Badge>
                </div>
                {dish.avgRating !== null && (
                  <div className="flex items-center gap-1 text-sm">
                    <Star size={16} className="text-amber-400 fill-amber-400" />
                    <span className="font-semibold">{dish.avgRating}</span>
                    <span className="text-muted-foreground">({dish.reviewCount})</span>
                  </div>
                )}
              </div>

              <p className="mt-3 text-muted-foreground">{dish.description}</p>

              <div className="mt-4 flex items-center gap-4 text-sm text-muted-foreground">
                {dish.spiceLevel > 0 && (
                  <span className="flex items-center gap-1">
                    <Flame size={16} className="text-muted-foreground" />
                    Spice: {dish.spiceLevel}/5
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Clock size={16} />
                  ~{dish.prepTime} min
                </span>
              </div>

              {/* Add to cart */}
              {canOrder && dish.isAvailable && (
                <div className="mt-6 flex items-center gap-4">
                  <div className="flex items-center gap-3 rounded-full border px-2">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="p-2"
                    >
                      <Minus size={16} />
                    </button>
                    <span className="w-6 text-center font-semibold">{quantity}</span>
                    <button
                      onClick={() => setQuantity(quantity + 1)}
                      className="p-2"
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                  <Button
                    className="flex-1 rounded-full"
                    size="lg"
                    onClick={() => {
                      addItem({
                        dishId: dish.id,
                        name: dish.name,
                        price: dish.price,
                        quantity,
                        thumbnailUrl: dish.thumbnailUrl || undefined,
                      });
                      setQuantity(1);
                      onClose();
                    }}
                  >
                    <Plus size={16} className="mr-2" />
                    Add to Cart
                  </Button>
                </div>
              )}

              {!dish.isAvailable && (
                <p className="mt-6 text-center text-muted-foreground">
                  This dish is currently unavailable
                </p>
              )}

              {/* Reviews */}
              {dishReviews.length > 0 && (
                <div className="mt-6 border-t pt-4">
                  <h3 className="text-sm font-semibold mb-3">
                    Reviews ({dishReviews.length})
                  </h3>
                  <div className="space-y-3">
                    {dishReviews.map((review) => (
                      <div key={review.id} className="rounded-xl border p-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-muted-foreground">
                            {review.userName} &middot; {new Date(review.createdAt).toLocaleDateString()}
                          </span>
                          <div className="flex items-center gap-0.5">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <Star
                                key={i}
                                size={11}
                                className={i < review.rating ? "text-yellow-500 fill-yellow-500" : "text-muted-foreground/30"}
                              />
                            ))}
                          </div>
                        </div>
                        {review.comment && (
                          <p className="mt-1.5 text-xs text-muted-foreground">{review.comment}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="h-4" />
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
