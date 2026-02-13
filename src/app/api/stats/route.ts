import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { orders, orderItems, dishes, reviews, users } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";

export async function GET() {
  // Total orders
  const totalOrders = db.select({ count: sql<number>`count(*)` }).from(orders).get()?.count || 0;

  // Completed orders
  const completedOrders = db
    .select({ count: sql<number>`count(*)` })
    .from(orders)
    .where(eq(orders.status, "completed"))
    .get()?.count || 0;

  // Total dishes served
  const totalDishesServed = db
    .select({ total: sql<number>`coalesce(sum(${orderItems.quantity}), 0)` })
    .from(orderItems)
    .leftJoin(orders, eq(orderItems.orderId, orders.id))
    .where(eq(orders.status, "completed"))
    .get()?.total || 0;

  // Average rating
  const avgRating = db
    .select({ avg: sql<number>`coalesce(avg(${reviews.rating}), 0)` })
    .from(reviews)
    .get()?.avg || 0;

  // Most ordered dishes (top 5)
  const topDishes = db
    .select({
      dishId: orderItems.dishId,
      dishName: dishes.name,
      totalOrdered: sql<number>`sum(${orderItems.quantity})`,
    })
    .from(orderItems)
    .leftJoin(dishes, eq(orderItems.dishId, dishes.id))
    .groupBy(orderItems.dishId)
    .orderBy(sql`sum(${orderItems.quantity}) desc`)
    .limit(5)
    .all();

  // Best rated dish (global)
  const bestRated = db
    .select({
      dishId: reviews.dishId,
      dishName: dishes.name,
      avgRating: sql<number>`avg(${reviews.rating})`,
      reviewCount: sql<number>`count(*)`,
    })
    .from(reviews)
    .leftJoin(dishes, eq(reviews.dishId, dishes.id))
    .groupBy(reviews.dishId)
    .orderBy(sql`avg(${reviews.rating}) desc`)
    .limit(1)
    .get();

  // Days together (hardcoded from July 27, 2025)
  const startDate = new Date("2025-07-27");
  const daysTogether = Math.floor((Date.now() - startDate.getTime()) / (1000 * 60 * 60 * 24));

  // Orders by category
  const categoryStats = db
    .select({
      category: dishes.category,
      count: sql<number>`sum(${orderItems.quantity})`,
    })
    .from(orderItems)
    .leftJoin(dishes, eq(orderItems.dishId, dishes.id))
    .groupBy(dishes.category)
    .all();

  // Orders by day of week
  const ordersByDay = db
    .select({
      day: sql<string>`strftime('%w', ${orders.createdAt})`,
      count: sql<number>`count(*)`,
    })
    .from(orders)
    .groupBy(sql`strftime('%w', ${orders.createdAt})`)
    .all();

  // Hugo's favorite (most ordered by userId=1)
  const hugoFavorite = db
    .select({
      dishName: dishes.name,
      totalOrdered: sql<number>`sum(${orderItems.quantity})`,
    })
    .from(orderItems)
    .leftJoin(orders, eq(orderItems.orderId, orders.id))
    .leftJoin(dishes, eq(orderItems.dishId, dishes.id))
    .where(eq(orders.userId, 1))
    .groupBy(orderItems.dishId)
    .orderBy(sql`sum(${orderItems.quantity}) desc`)
    .limit(1)
    .get();

  // Yuge's favorite (most ordered by userId=2)
  const yugeFavorite = db
    .select({
      dishName: dishes.name,
      totalOrdered: sql<number>`sum(${orderItems.quantity})`,
    })
    .from(orderItems)
    .leftJoin(orders, eq(orderItems.orderId, orders.id))
    .leftJoin(dishes, eq(orderItems.dishId, dishes.id))
    .where(eq(orders.userId, 2))
    .groupBy(orderItems.dishId)
    .orderBy(sql`sum(${orderItems.quantity}) desc`)
    .limit(1)
    .get();

  // Worst rated dish (global, min 1 review)
  const worstRated = db
    .select({
      dishId: reviews.dishId,
      dishName: dishes.name,
      avgRating: sql<number>`avg(${reviews.rating})`,
      reviewCount: sql<number>`count(*)`,
    })
    .from(reviews)
    .leftJoin(dishes, eq(reviews.dishId, dishes.id))
    .groupBy(reviews.dishId)
    .orderBy(sql`avg(${reviews.rating}) asc`)
    .limit(1)
    .get();

  // Spice trend: avg spice per order, grouped by order
  const spiceTrend = db
    .select({
      orderId: orders.id,
      userId: orders.userId,
      userName: users.name,
      date: orders.createdAt,
      avgSpice: sql<number>`avg(${dishes.spiceLevel})`,
    })
    .from(orders)
    .leftJoin(orderItems, eq(orderItems.orderId, orders.id))
    .leftJoin(dishes, eq(orderItems.dishId, dishes.id))
    .leftJoin(users, eq(orders.userId, users.id))
    .groupBy(orders.id)
    .orderBy(orders.createdAt)
    .all();

  return NextResponse.json({
    totalOrders,
    completedOrders,
    totalDishesServed,
    averageRating: Math.round(avgRating * 10) / 10,
    topDishes,
    bestRated,
    daysTogether,
    categoryStats,
    ordersByDay,
    hugoFavorite,
    yugeFavorite,
    worstRated,
    spiceTrend: spiceTrend.map((s) => ({
      ...s,
      avgSpice: Math.round((s.avgSpice || 0) * 10) / 10,
    })),
  });
}
