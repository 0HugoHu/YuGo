import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { orders, orderItems, dishes, cartItems, users, reviews, reviewPhotos } from "@/lib/db/schema";
import { eq, desc, and } from "drizzle-orm";
import { sendOrderNotification } from "@/lib/sms";
import { cache } from "@/lib/cache";

export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get("userId");
  const status = req.nextUrl.searchParams.get("status");
  const cacheKey = userId ? `orders:user:${userId}` : "orders:list";

  const cached = cache.get(cacheKey);
  if (cached) {
    const filtered = status
      ? (cached as Record<string, unknown>[]).filter((o: Record<string, unknown>) => o.status === status)
      : cached;
    return NextResponse.json(filtered);
  }

  let allOrders = db.select().from(orders).orderBy(desc(orders.createdAt)).all();

  if (userId) {
    allOrders = allOrders.filter((o) => o.userId === parseInt(userId));
  }
  if (status) {
    allOrders = allOrders.filter((o) => o.status === status);
  }

  // Attach items to each order
  const result = allOrders.map((order) => {
    const items = db
      .select({
        id: orderItems.id,
        dishId: orderItems.dishId,
        quantity: orderItems.quantity,
        priceAtOrder: orderItems.priceAtOrder,
        specialNotes: orderItems.specialNotes,
        dishName: dishes.name,
        dishThumbnail: dishes.thumbnailUrl,
        addedBy: orderItems.addedBy,
        addedByName: users.name,
      })
      .from(orderItems)
      .leftJoin(dishes, eq(orderItems.dishId, dishes.id))
      .leftJoin(users, eq(orderItems.addedBy, users.id))
      .where(eq(orderItems.orderId, order.id))
      .all();

    return { ...order, items };
  });

  cache.set(cacheKey, result, 30 * 1000); // 30 seconds

  const filtered = status ? result.filter((o) => o.status === status) : result;
  return NextResponse.json(filtered);
}

export async function POST(req: NextRequest) {
  const { userId, notes, items: cartData } = await req.json();

  if (!userId || !cartData || cartData.length === 0) {
    return NextResponse.json({ error: "Missing userId or items" }, { status: 400 });
  }

  // Calculate total
  let totalPrice = 0;
  const resolvedItems = [];

  for (const item of cartData) {
    const dish = db.select().from(dishes).where(eq(dishes.id, item.dishId)).get();
    if (!dish) continue;

    const price = dish.price;
    totalPrice += price * item.quantity;
    resolvedItems.push({
      dishId: item.dishId,
      quantity: item.quantity,
      priceAtOrder: price,
      specialNotes: item.specialNotes || null,
      addedBy: item.addedBy || userId,
    });
  }

  // Create order
  const order = db.insert(orders).values({
    userId,
    totalPrice,
    notes: notes || null,
    status: "pending",
  }).returning().get();

  // Create order items
  for (const item of resolvedItems) {
    db.insert(orderItems).values({
      orderId: order.id,
      ...item,
    }).run();
  }

  // Clear all cart items (shared cart)
  db.delete(cartItems).run();

  cache.invalidate("orders");
  cache.invalidate("cart");
  cache.invalidate("stats");

  // Send SMS notification
  try {
    await sendOrderNotification(resolvedItems.length, notes);
  } catch (e) {
    console.error("SMS failed:", e);
  }

  return NextResponse.json(order);
}

export async function PUT(req: NextRequest) {
  const { orderId, status } = await req.json();

  if (!orderId || !status) {
    return NextResponse.json({ error: "Missing orderId or status" }, { status: 400 });
  }

  const updates: Record<string, unknown> = { status };
  if (status === "completed") {
    updates.completedAt = new Date().toISOString();
  }

  db.update(orders).set(updates).where(eq(orders.id, orderId)).run();
  const updated = db.select().from(orders).where(eq(orders.id, orderId)).get();

  cache.invalidate("orders");
  cache.invalidate("stats");

  return NextResponse.json(updated);
}

export async function DELETE(req: NextRequest) {
  const orderId = req.nextUrl.searchParams.get("id");

  if (!orderId) {
    return NextResponse.json({ error: "Missing order id" }, { status: 400 });
  }

  const id = parseInt(orderId);

  // Delete review photos for reviews on this order
  const orderReviews = db.select({ id: reviews.id }).from(reviews).where(eq(reviews.orderId, id)).all();
  for (const review of orderReviews) {
    db.delete(reviewPhotos).where(eq(reviewPhotos.reviewId, review.id)).run();
  }

  // Delete reviews for this order
  db.delete(reviews).where(eq(reviews.orderId, id)).run();

  // Delete order items
  db.delete(orderItems).where(eq(orderItems.orderId, id)).run();

  // Delete the order
  db.delete(orders).where(eq(orders.id, id)).run();

  cache.invalidate("orders");
  cache.invalidate("reviews");
  cache.invalidate("stats");

  return NextResponse.json({ success: true });
}
