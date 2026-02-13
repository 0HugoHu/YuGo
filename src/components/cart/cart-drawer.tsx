"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { X, Plus, Minus, Trash2, ShoppingCart } from "lucide-react";
import { useCart } from "@/hooks/use-cart";
import { useAuth } from "@/hooks/use-auth";
import { useState } from "react";

interface CartDrawerProps {
  onPlaceOrder: (notes: string) => Promise<void>;
  isPlacing: boolean;
}

export function CartDrawer({ onPlaceOrder, isPlacing }: CartDrawerProps) {
  const { items, updateQuantity, removeItem, totalItems, isOpen, setIsOpen } = useCart();
  const { userId } = useAuth();
  const [orderNotes, setOrderNotes] = useState("");

  // Group items by dishId to show combined view
  const groupedItems = items.reduce<
    Record<number, { dishId: number; name: string; entries: typeof items }>
  >((acc, item) => {
    if (!acc[item.dishId]) {
      acc[item.dishId] = { dishId: item.dishId, name: item.name, entries: [] };
    }
    acc[item.dishId].entries.push(item);
    return acc;
  }, {});

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-black/60"
            onClick={() => setIsOpen(false)}
          />
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed inset-x-0 bottom-0 z-[60] max-h-[85vh] overflow-y-auto rounded-t-3xl bg-background"
          >
            {/* Handle */}
            <div className="flex justify-center pt-3">
              <div className="h-1 w-10 rounded-full bg-muted-foreground/30" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between p-4 pb-2">
              <h2 className="flex items-center gap-2 text-xl font-bold">
                <ShoppingCart size={22} />
                Cart ({totalItems})
              </h2>
              <button onClick={() => setIsOpen(false)} className="p-2">
                <X size={20} />
              </button>
            </div>

            {items.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                <p className="text-4xl mb-2">🛒</p>
                <p>Your cart is empty</p>
                <p className="text-sm mt-1">Browse the menu to add some dishes!</p>
              </div>
            ) : (
              <>
                {/* Items */}
                <div className="space-y-3 px-4">
                  {Object.values(groupedItems).map((group) => (
                    <motion.div
                      key={group.dishId}
                      layout
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      className="rounded-xl border p-3"
                    >
                      <div className="flex items-start gap-2 mb-1">
                        <p className="font-medium text-sm flex-1">{group.name}</p>
                        <div className="flex gap-1 flex-shrink-0">
                          {Array.from(new Set(group.entries.map((e) => e.addedByName))).map(
                            (name) => (
                              <span
                                key={name}
                                className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${
                                  name === "Hugo"
                                    ? "bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300"
                                    : name === "Yuge"
                                    ? "bg-stone-200 text-stone-600 dark:bg-stone-700 dark:text-stone-300"
                                    : "bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-300"
                                }`}
                              >
                                {name}
                              </span>
                            )
                          )}
                        </div>
                      </div>

                      {/* Per-user entries */}
                      {group.entries.map((item) => (
                        <div key={item.id} className="flex items-center gap-2 mt-2">
                          {group.entries.length > 1 && (
                            <span
                              className={`text-[9px] font-medium px-1 py-0.5 rounded ${
                                item.addedByName === "Hugo"
                                  ? "text-slate-500 bg-slate-100 dark:text-slate-400 dark:bg-slate-800"
                                  : item.addedByName === "Yuge"
                                  ? "text-stone-500 bg-stone-100 dark:text-stone-400 dark:bg-stone-800"
                                  : "text-gray-500 bg-gray-100 dark:text-gray-400 dark:bg-gray-800"
                              }`}
                            >
                              {item.addedByName}
                            </span>
                          )}
                          {item.specialNotes && (
                            <span className="text-xs text-muted-foreground italic flex-1 truncate">
                              {item.specialNotes}
                            </span>
                          )}
                          <div className="flex items-center gap-2 ml-auto">
                            {item.userId === userId ? (
                              <>
                                <button
                                  onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                  className="rounded-full border p-1"
                                >
                                  <Minus size={14} />
                                </button>
                                <span className="w-5 text-center text-sm font-semibold">
                                  {item.quantity}
                                </span>
                                <button
                                  onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                  className="rounded-full border p-1"
                                >
                                  <Plus size={14} />
                                </button>
                                <button
                                  onClick={() => removeItem(item.id)}
                                  className="ml-1 rounded-full p-1 text-destructive"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </>
                            ) : (
                              <span className="text-sm text-muted-foreground">
                                x{item.quantity}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </motion.div>
                  ))}
                </div>

                {/* Notes */}
                <div className="px-4 mt-4">
                  <Textarea
                    placeholder="Add a note for Hugo... (e.g., extra spicy please!)"
                    value={orderNotes}
                    onChange={(e) => setOrderNotes(e.target.value)}
                    className="rounded-xl resize-none"
                    rows={2}
                  />
                </div>

                {/* Place Order */}
                <div className="p-4 pb-8">
                  <Button
                    className="w-full rounded-full text-base h-12"
                    size="lg"
                    onClick={() => onPlaceOrder(orderNotes)}
                    disabled={isPlacing}
                  >
                    {isPlacing ? "Placing Order..." : "Place Order"}
                  </Button>
                </div>
              </>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
