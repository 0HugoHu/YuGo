"use client";

import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, ChefHat, CheckCircle2, XCircle, Timer, Star } from "lucide-react";

interface OrderItem {
  id: number;
  dishId?: number;
  dishName: string | null;
  quantity: number;
  priceAtOrder: number;
  specialNotes?: string | null;
  addedBy?: number | null;
  addedByName?: string | null;
}

export interface OrderData {
  id: number;
  userId: number;
  status: string;
  totalPrice: number;
  notes?: string | null;
  createdAt: string;
  completedAt?: string | null;
  items: OrderItem[];
}

interface OrderCardProps {
  order: OrderData;
  role?: string;
  onUpdateStatus?: (orderId: number, status: string) => void;
  onReview?: (order: OrderData) => void;
}

const statusConfig: Record<string, { color: string; icon: React.ReactNode; label: string }> = {
  pending: { color: "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400", icon: <Clock size={14} />, label: "Pending" },
  cooking: { color: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300", icon: <ChefHat size={14} />, label: "Cooking" },
  ready: { color: "bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-400", icon: <Timer size={14} />, label: "Ready" },
  completed: { color: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400", icon: <CheckCircle2 size={14} />, label: "Completed" },
  cancelled: { color: "bg-stone-100 text-stone-500 dark:bg-stone-800 dark:text-stone-400", icon: <XCircle size={14} />, label: "Cancelled" },
};

export function OrderCard({ order, role, onUpdateStatus, onReview }: OrderCardProps) {
  const config = statusConfig[order.status] || statusConfig.pending;
  const time = new Date(order.createdAt).toLocaleString();

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border bg-card p-4 shadow-sm"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-muted-foreground">
          Order #{order.id}
        </span>
        <Badge className={`${config.color} gap-1 border-0`}>
          {config.icon}
          {config.label}
        </Badge>
      </div>

      {/* Items */}
      <div className="mt-3 space-y-1">
        {order.items.map((item) => (
          <div key={item.id} className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-1.5">
              {item.quantity}x {item.dishName || "Unknown"}
              {item.addedByName && (
                <span
                  className={`text-[9px] font-medium px-1.5 py-0.5 rounded-full ${
                    item.addedByName === "Hugo"
                      ? "bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300"
                      : item.addedByName === "Yuge"
                      ? "bg-stone-200 text-stone-600 dark:bg-stone-700 dark:text-stone-300"
                      : "bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-300"
                  }`}
                >
                  {item.addedByName}
                </span>
              )}
            </span>
            {item.specialNotes && (
              <span className="text-xs text-muted-foreground italic ml-2 truncate max-w-[120px]">
                {item.specialNotes}
              </span>
            )}
          </div>
        ))}
      </div>

      {order.notes && (
        <p className="mt-2 text-xs text-muted-foreground italic">
          Note: {order.notes}
        </p>
      )}

      {/* Footer */}
      <div className="mt-3 flex items-center justify-between border-t pt-3">
        <span className="text-xs text-muted-foreground">{time}</span>
      </div>

      {/* Actions based on role */}
      {onUpdateStatus && (
        <div className="mt-3 flex flex-wrap gap-2">
          {/* Hugo: can start cooking and mark ready */}
          {role === "hugo" && order.status === "pending" && (
            <>
              <Button size="sm" className="flex-1 rounded-full" onClick={() => onUpdateStatus(order.id, "cooking")}>
                <ChefHat size={14} className="mr-1" /> Start Cooking
              </Button>
              <Button size="sm" variant="outline" className="rounded-full text-muted-foreground" onClick={() => onUpdateStatus(order.id, "cancelled")}>
                <XCircle size={14} className="mr-1" /> Cancel
              </Button>
            </>
          )}
          {role === "hugo" && order.status === "cooking" && (
            <>
              <Button size="sm" className="flex-1 rounded-full" onClick={() => onUpdateStatus(order.id, "ready")}>
                <Timer size={14} className="mr-1" /> Mark Ready
              </Button>
              <Button size="sm" variant="outline" className="rounded-full text-muted-foreground" onClick={() => onUpdateStatus(order.id, "cancelled")}>
                <XCircle size={14} className="mr-1" /> Cancel
              </Button>
            </>
          )}

          {/* Yuge: can confirm receipt + review when ready */}
          {role === "yuge" && order.status === "ready" && (
            <Button size="sm" className="flex-1 rounded-full" onClick={() => {
              onUpdateStatus(order.id, "completed");
              if (onReview) onReview(order);
            }}>
              <CheckCircle2 size={14} className="mr-1" /> Received & Review
            </Button>
          )}

          {/* Both can review completed orders */}
          {(role === "hugo" || role === "yuge") && order.status === "completed" && onReview && (
            <Button size="sm" variant="outline" className="flex-1 rounded-full" onClick={() => onReview(order)}>
              <Star size={14} className="mr-1" /> Leave Review
            </Button>
          )}
        </div>
      )}
    </motion.div>
  );
}
