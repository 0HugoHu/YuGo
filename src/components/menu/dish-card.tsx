"use client";

import { useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus, Flame, Clock, Star, Check } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useCart } from "@/hooks/use-cart";
import { haptic } from "@/lib/haptics";

export interface DishData {
  id: number;
  name: string;
  description: string;
  price: number;
  category: string;
  imageUrl: string | null;
  thumbnailUrl: string | null;
  spiceLevel: number;
  prepTime: number;
  isAvailable: boolean;
  isRecommended?: boolean;
  avgRating: number | null;
  reviewCount: number;
  timesOrdered: number;
}

interface DishCardProps {
  dish: DishData;
  onSelect?: (dish: DishData) => void;
}

export function DishCard({ dish, onSelect }: DishCardProps) {
  const { role } = useAuth();
  const { addItem } = useCart();
  const canOrder = role === "hugo" || role === "yuge";
  const [justAdded, setJustAdded] = useState(false);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      whileTap={{ scale: 0.98 }}
      className="group relative overflow-hidden rounded-2xl border bg-card shadow-sm transition-shadow hover:shadow-md"
      onClick={() => onSelect?.(dish)}
    >
      {/* Image */}
      <div className="relative aspect-[4/3] overflow-hidden bg-muted">
        {dish.thumbnailUrl || dish.imageUrl ? (
          <Image
            src={dish.thumbnailUrl || dish.imageUrl!}
            alt={dish.name}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 640px) 50vw, 33vw"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-4xl">
            🍜
          </div>
        )}
        {dish.isRecommended && (
          <div className="absolute top-2 left-2 z-10">
            <Badge className="bg-amber-500 text-white border-0 text-[10px] gap-0.5 px-1.5 py-0.5 shadow-sm">
              <Star size={10} className="fill-white" /> Chef&apos;s Pick
            </Badge>
          </div>
        )}
        {!dish.isAvailable && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50">
            <Badge variant="secondary" className="text-sm">Unavailable</Badge>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-3">
        <h3 className="font-semibold text-sm leading-tight">{dish.name}</h3>
        <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
          {dish.description}
        </p>

        <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
          {dish.avgRating !== null && (
            <span className="flex items-center gap-0.5">
              <Star size={12} className="text-amber-400 fill-amber-400" />
              {dish.avgRating}
            </span>
          )}
          {dish.spiceLevel > 0 && (
            <span className="flex items-center gap-0.5">
              <Flame size={12} className="text-muted-foreground" />
              {dish.spiceLevel}/5
            </span>
          )}
          <span className="flex items-center gap-0.5">
            <Clock size={12} />
            {dish.prepTime}m
          </span>
        </div>

        {canOrder && dish.isAvailable && (
          <Button
            size="sm"
            className="mt-2 h-8 w-full rounded-full text-xs"
            onClick={(e) => {
              e.stopPropagation();
              haptic("medium");
              addItem({
                dishId: dish.id,
                name: dish.name,
                price: dish.price,
                thumbnailUrl: dish.thumbnailUrl || undefined,
              });
              setJustAdded(true);
              setTimeout(() => setJustAdded(false), 500);
            }}
          >
            {justAdded ? (
              <>
                <Check size={14} className="mr-1" />
                Added
              </>
            ) : (
              <>
                <Plus size={14} className="mr-1" />
                Add
              </>
            )}
          </Button>
        )}
      </div>
    </motion.div>
  );
}
