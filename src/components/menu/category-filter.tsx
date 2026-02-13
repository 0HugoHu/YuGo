"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface CategoryFilterProps {
  categories: string[];
  selected: string | null;
  onSelect: (category: string | null) => void;
}

export function CategoryFilter({ categories, selected, onSelect }: CategoryFilterProps) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
      <button
        onClick={() => onSelect(null)}
        className={cn(
          "relative shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
          !selected ? "text-primary-foreground" : "text-muted-foreground hover:text-foreground"
        )}
      >
        {!selected && (
          <motion.div
            layoutId="category-pill"
            className="absolute inset-0 rounded-full bg-primary"
            transition={{ type: "spring", stiffness: 500, damping: 30 }}
          />
        )}
        <span className="relative z-10">All</span>
      </button>
      {categories.map((cat) => (
        <button
          key={cat}
          onClick={() => onSelect(cat)}
          className={cn(
            "relative shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
            selected === cat ? "text-primary-foreground" : "text-muted-foreground hover:text-foreground"
          )}
        >
          {selected === cat && (
            <motion.div
              layoutId="category-pill"
              className="absolute inset-0 rounded-full bg-primary"
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
            />
          )}
          <span className="relative z-10">{cat}</span>
        </button>
      ))}
    </div>
  );
}
