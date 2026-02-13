"use client";

import { useState, useEffect, useCallback } from "react";
import { OrderCard, type OrderData } from "@/components/orders/order-card";
import { ReviewCard } from "@/components/reviews/review-card";
import { StarRating } from "@/components/reviews/star-rating";
import { BottomNav } from "@/components/shared/bottom-nav";
import { PageTransition } from "@/components/shared/page-transition";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";
import { Plus } from "lucide-react";

interface ReviewData {
  id: number;
  userId: number;
  dishId: number;
  orderId: number | null;
  rating: number;
  comment: string | null;
  createdAt: string;
  userName: string | null;
  dishName: string | null;
  photos: Array<{ id: number; imageUrl: string; thumbnailUrl: string | null }>;
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<OrderData[]>([]);
  const [reviews, setReviews] = useState<ReviewData[]>([]);
  const [loading, setLoading] = useState(true);
  const { userId, role } = useAuth();

  // Review dialog state (from order)
  const [reviewOrder, setReviewOrder] = useState<OrderData | null>(null);
  const [dishRatings, setDishRatings] = useState<Record<number, number>>({});
  const [reviewComment, setReviewComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);

  // Standalone review dialog state
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState("");
  const [standaloneRatings, setStandaloneRatings] = useState<Record<number, number>>({});
  const [standaloneComment, setStandaloneComment] = useState("");
  const [submittingStandalone, setSubmittingStandalone] = useState(false);

  const canReview = role === "hugo" || role === "yuge";

  const fetchOrders = useCallback(() => {
    if (!userId) return;
    const url = role === "hugo" ? "/api/orders" : `/api/orders?userId=${userId}`;
    fetch(url)
      .then((r) => r.json())
      .then((data) => { setOrders(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [userId, role]);

  const fetchReviews = useCallback(() => {
    fetch("/api/reviews")
      .then((r) => r.json())
      .then((data) => setReviews(data))
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetchOrders();
    fetchReviews();
    const interval = setInterval(fetchOrders, 10000);
    return () => clearInterval(interval);
  }, [fetchOrders, fetchReviews]);

  const handleUpdateStatus = async (orderId: number, status: string) => {
    try {
      const res = await fetch("/api/orders", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, status }),
      });
      if (!res.ok) throw new Error();
      toast.success(`Order #${orderId} → ${status}`);
      fetchOrders();
    } catch {
      toast.error("Failed to update order");
    }
  };

  const handleReview = (order: OrderData) => {
    const ratings: Record<number, number> = {};
    for (const item of order.items) {
      if (item.dishId) ratings[item.dishId] = 5;
    }
    setDishRatings(ratings);
    setReviewComment("");
    setReviewOrder(order);
  };

  const submitReview = async () => {
    if (!reviewOrder || !userId) return;
    setSubmittingReview(true);
    try {
      for (const item of reviewOrder.items) {
        if (!item.dishId) continue;
        await fetch("/api/reviews", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId,
            dishId: item.dishId,
            orderId: reviewOrder.id,
            rating: dishRatings[item.dishId] || 5,
            comment: reviewComment || undefined,
          }),
        });
      }
      toast.success("Review submitted!");
      setReviewOrder(null);
      fetchReviews();
    } catch {
      toast.error("Failed to submit review");
    } finally {
      setSubmittingReview(false);
    }
  };

  // Standalone review form
  const completedOrders = orders.filter((o) => o.status === "completed");
  const reviewedOrderIds = new Set(reviews.map((r) => r.orderId).filter(Boolean));
  const unreviewedOrders = completedOrders.filter((o) => !reviewedOrderIds.has(o.id));
  const currentStandaloneOrder = completedOrders.find((o) => o.id.toString() === selectedOrder);

  const handleOrderChange = (val: string) => {
    setSelectedOrder(val);
    const order = completedOrders.find((o) => o.id.toString() === val);
    if (order) {
      const ratings: Record<number, number> = {};
      for (const item of order.items) {
        if (item.dishId) ratings[item.dishId] = 5;
      }
      setStandaloneRatings(ratings);
    }
  };

  const submitStandaloneReview = async () => {
    if (!currentStandaloneOrder || !userId) return;
    setSubmittingStandalone(true);
    try {
      for (const item of currentStandaloneOrder.items) {
        if (!item.dishId) continue;
        await fetch("/api/reviews", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId,
            dishId: item.dishId,
            orderId: currentStandaloneOrder.id,
            rating: standaloneRatings[item.dishId] || 5,
            comment: standaloneComment || undefined,
          }),
        });
      }
      toast.success("Review submitted!");
      setIsReviewOpen(false);
      setSelectedOrder("");
      setStandaloneRatings({});
      setStandaloneComment("");
      fetchReviews();
    } catch {
      toast.error("Failed to submit review");
    } finally {
      setSubmittingStandalone(false);
    }
  };

  const active = orders.filter((o) => ["pending", "cooking", "ready"].includes(o.status));
  const past = orders.filter((o) => ["completed", "cancelled"].includes(o.status));

  return (
    <PageTransition>
      <div className="min-h-dvh pb-20">
        <div className="px-4 pt-6">
          <h1 className="text-2xl font-bold">Orders</h1>
        </div>

        <Tabs defaultValue={active.length > 0 ? "active" : "history"} className="mt-4 px-4">
          <TabsList className="w-full">
            <TabsTrigger value="active" className="flex-1">
              Active{active.length > 0 ? ` (${active.length})` : ""}
            </TabsTrigger>
            <TabsTrigger value="history" className="flex-1">
              History
            </TabsTrigger>
            <TabsTrigger value="reviews" className="flex-1">
              Reviews
            </TabsTrigger>
          </TabsList>

          <TabsContent value="active" className="mt-4 space-y-3">
            {loading ? (
              Array.from({ length: 2 }).map((_, i) => (
                <Skeleton key={i} className="h-32 rounded-2xl" />
              ))
            ) : active.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground">
                <p className="text-sm">No active orders</p>
                <p className="text-xs mt-1">
                  {canReview ? "Go to the menu to place an order" : "Waiting for orders..."}
                </p>
              </div>
            ) : (
              active.map((order) => (
                <OrderCard
                  key={order.id}
                  order={order}
                  role={role}
                  onUpdateStatus={handleUpdateStatus}
                  onReview={handleReview}
                />
              ))
            )}
          </TabsContent>

          <TabsContent value="history" className="mt-4 space-y-3">
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-32 rounded-2xl" />
              ))
            ) : past.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground">
                <p className="text-sm">No order history yet</p>
              </div>
            ) : (
              past.map((order) => (
                <OrderCard
                  key={order.id}
                  order={order}
                  role={role}
                  onUpdateStatus={handleUpdateStatus}
                  onReview={handleReview}
                />
              ))
            )}
          </TabsContent>

          <TabsContent value="reviews" className="mt-4">
            {/* Review button */}
            {canReview && (
              <div className="flex justify-end mb-3">
                <Dialog open={isReviewOpen} onOpenChange={(open) => { setIsReviewOpen(open); if (!open) { setSelectedOrder(""); setStandaloneRatings({}); setStandaloneComment(""); } }}>
                  <DialogTrigger asChild>
                    <Button size="sm" variant="outline" className="rounded-full">
                      <Plus size={14} className="mr-1" />
                      Review
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-h-[85vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Review an Order</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 mt-2">
                      {unreviewedOrders.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-4">
                          No completed orders to review yet
                        </p>
                      ) : (
                        <>
                          <Select value={selectedOrder} onValueChange={handleOrderChange}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a completed order" />
                            </SelectTrigger>
                            <SelectContent>
                              {unreviewedOrders.map((o) => (
                                <SelectItem key={o.id} value={o.id.toString()}>
                                  Order #{o.id} — {new Date(o.createdAt).toLocaleDateString()} ({o.items.length} dishes)
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>

                          {currentStandaloneOrder && (
                            <>
                              <div className="space-y-3">
                                <p className="text-sm font-medium">Rate each dish:</p>
                                {currentStandaloneOrder.items.map((item) => (
                                  item.dishId ? (
                                    <div key={item.dishId} className="flex items-center justify-between gap-2 rounded-xl border p-3">
                                      <span className="text-sm font-medium flex-1">
                                        {item.quantity}x {item.dishName}
                                      </span>
                                      <StarRating
                                        rating={standaloneRatings[item.dishId] || 5}
                                        onRate={(r) => setStandaloneRatings((prev) => ({ ...prev, [item.dishId!]: r }))}
                                        size={18}
                                      />
                                    </div>
                                  ) : null
                                ))}
                              </div>
                              <Textarea
                                placeholder="Any thoughts..."
                                value={standaloneComment}
                                onChange={(e) => setStandaloneComment(e.target.value)}
                                rows={3}
                              />
                              <Button
                                onClick={submitStandaloneReview}
                                className="w-full rounded-full"
                                disabled={submittingStandalone}
                              >
                                {submittingStandalone ? "Submitting..." : "Submit Review"}
                              </Button>
                            </>
                          )}
                        </>
                      )}
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            )}

            {/* Reviews list */}
            <div className="space-y-3">
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-24 rounded-2xl" />
                ))
              ) : reviews.length === 0 ? (
                <div className="py-12 text-center text-muted-foreground">
                  <p className="text-sm">No reviews yet</p>
                  <p className="text-xs mt-1">Complete an order to leave a review</p>
                </div>
              ) : (
                reviews.map((review) => <ReviewCard key={review.id} review={review} />)
              )}
            </div>
          </TabsContent>
        </Tabs>

        {/* Review Dialog — opens when confirming a ready order */}
        <Dialog open={!!reviewOrder} onOpenChange={(open) => { if (!open) setReviewOrder(null); }}>
          <DialogContent className="max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>How was Order #{reviewOrder?.id}?</DialogTitle>
            </DialogHeader>
            {reviewOrder && (
              <div className="space-y-4 mt-2">
                <div className="space-y-3">
                  <p className="text-sm font-medium">Rate each dish:</p>
                  {reviewOrder.items.map((item) => (
                    item.dishId ? (
                      <div key={item.dishId} className="flex items-center justify-between gap-2 rounded-xl border p-3">
                        <span className="text-sm font-medium flex-1">
                          {item.quantity}x {item.dishName}
                        </span>
                        <StarRating
                          rating={dishRatings[item.dishId] || 5}
                          onRate={(r) => setDishRatings((prev) => ({ ...prev, [item.dishId!]: r }))}
                          size={18}
                        />
                      </div>
                    ) : null
                  ))}
                </div>
                <Textarea
                  placeholder="Any thoughts..."
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  rows={3}
                />
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1 rounded-full"
                    onClick={() => setReviewOrder(null)}
                  >
                    Skip
                  </Button>
                  <Button
                    className="flex-1 rounded-full"
                    onClick={submitReview}
                    disabled={submittingReview}
                  >
                    {submittingReview ? "Submitting..." : "Submit Review"}
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        <BottomNav />
      </div>
    </PageTransition>
  );
}
