"use client";

import { motion } from "framer-motion";
import { Star } from "lucide-react";

interface StarRatingProps {
  rating: number;
  onRate?: (rating: number) => void;
  size?: number;
  readonly?: boolean;
}

export function StarRating({ rating, onRate, size = 20, readonly = false }: StarRatingProps) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <motion.button
          key={star}
          type="button"
          whileTap={readonly ? {} : { scale: 1.3 }}
          onClick={() => !readonly && onRate?.(star)}
          className={readonly ? "cursor-default" : "cursor-pointer"}
          disabled={readonly}
        >
          <Star
            size={size}
            className={
              star <= rating
                ? "fill-yellow-400 text-yellow-400"
                : "text-muted-foreground/30"
            }
          />
        </motion.button>
      ))}
    </div>
  );
}
