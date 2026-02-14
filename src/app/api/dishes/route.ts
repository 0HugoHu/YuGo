import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { dishes, reviews, orderItems } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";

export async function GET(req: NextRequest) {
  const category = req.nextUrl.searchParams.get("category");
  const availableOnly = req.nextUrl.searchParams.get("available") !== "false";

  const allDishes = db.select().from(dishes).all().filter((d) => {
    if (availableOnly && !d.isAvailable) return false;
    if (category && d.category !== category) return false;
    return true;
  });

  // Get avg ratings per dish
  const ratings = db
    .select({
      dishId: reviews.dishId,
      avgRating: sql<number>`avg(${reviews.rating})`,
      reviewCount: sql<number>`count(*)`,
    })
    .from(reviews)
    .groupBy(reviews.dishId)
    .all();

  const ratingMap = new Map(ratings.map((r) => [r.dishId, r]));

  // Get times ordered per dish
  const orderCounts = db
    .select({
      dishId: orderItems.dishId,
      timesOrdered: sql<number>`sum(${orderItems.quantity})`,
    })
    .from(orderItems)
    .groupBy(orderItems.dishId)
    .all();

  const orderCountMap = new Map(orderCounts.map((o) => [o.dishId, o.timesOrdered]));

  const result = allDishes.map((d) => {
    const r = ratingMap.get(d.id);
    return {
      ...d,
      avgRating: r ? Math.round(r.avgRating * 10) / 10 : null,
      reviewCount: r ? r.reviewCount : 0,
      timesOrdered: orderCountMap.get(d.id) || 0,
    };
  });

  return NextResponse.json(result);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { name, description, price, category, imageUrl, thumbnailUrl, spiceLevel, prepTime, isRecommended } = body;

  if (!name || !category) {
    return NextResponse.json({ error: "Name and category are required" }, { status: 400 });
  }

  const dish = db.insert(dishes).values({
    name,
    description: description || "",
    price: price || 0,
    category,
    imageUrl: imageUrl || null,
    thumbnailUrl: thumbnailUrl || null,
    isRecommended: isRecommended || false,
    spiceLevel: spiceLevel || 0,
    prepTime: prepTime || 15,
  }).returning().get();

  return NextResponse.json(dish);
}

export async function PUT(req: NextRequest) {
  const body = await req.json();
  const { id, ...updates } = body;

  if (!id) {
    return NextResponse.json({ error: "Dish ID is required" }, { status: 400 });
  }

  db.update(dishes).set(updates).where(eq(dishes.id, id)).run();
  const updated = db.select().from(dishes).where(eq(dishes.id, id)).get();

  return NextResponse.json(updated);
}

export async function DELETE(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "Dish ID is required" }, { status: 400 });
  }

  db.delete(dishes).where(eq(dishes.id, parseInt(id))).run();
  return NextResponse.json({ success: true });
}
