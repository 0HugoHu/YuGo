import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { reviews, reviewPhotos, dishes, users } from "@/lib/db/schema";
import { eq, desc, and } from "drizzle-orm";

export async function GET(req: NextRequest) {
  const dishId = req.nextUrl.searchParams.get("dishId");

  let allReviews = db
    .select({
      id: reviews.id,
      userId: reviews.userId,
      dishId: reviews.dishId,
      orderId: reviews.orderId,
      rating: reviews.rating,
      comment: reviews.comment,
      createdAt: reviews.createdAt,
      userName: users.name,
      dishName: dishes.name,
    })
    .from(reviews)
    .leftJoin(users, eq(reviews.userId, users.id))
    .leftJoin(dishes, eq(reviews.dishId, dishes.id))
    .orderBy(desc(reviews.createdAt))
    .all();

  if (dishId) {
    allReviews = allReviews.filter((r) => r.dishId === parseInt(dishId));
  }

  // Attach photos
  const result = allReviews.map((review) => {
    const photos = db
      .select()
      .from(reviewPhotos)
      .where(eq(reviewPhotos.reviewId, review.id))
      .all();
    return { ...review, photos };
  });

  return NextResponse.json(result);
}

export async function POST(req: NextRequest) {
  const { userId, dishId, orderId, rating, comment, photoUrls } = await req.json();

  if (!userId || !dishId || !rating) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  // Check for duplicate: same user, same dish, same order
  if (orderId) {
    const existing = db
      .select()
      .from(reviews)
      .where(eq(reviews.userId, userId))
      .all()
      .find((r) => r.dishId === dishId && r.orderId === orderId);
    if (existing) {
      // Update existing review instead of creating duplicate
      db.update(reviews)
        .set({ rating: Math.min(5, Math.max(1, rating)), comment: comment || null })
        .where(eq(reviews.id, existing.id))
        .run();
      const updated = db.select().from(reviews).where(eq(reviews.id, existing.id)).get();
      return NextResponse.json(updated);
    }
  }

  const review = db.insert(reviews).values({
    userId,
    dishId,
    orderId: orderId || null,
    rating: Math.min(5, Math.max(1, rating)),
    comment: comment || null,
  }).returning().get();

  // Add photos if provided
  if (photoUrls && Array.isArray(photoUrls)) {
    for (const photo of photoUrls) {
      db.insert(reviewPhotos).values({
        reviewId: review.id,
        imageUrl: photo.imageUrl,
        thumbnailUrl: photo.thumbnailUrl || null,
      }).run();
    }
  }

  return NextResponse.json(review);
}

export async function DELETE(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "Missing review id" }, { status: 400 });
  }

  const reviewId = parseInt(id);

  // Delete photos first
  db.delete(reviewPhotos).where(eq(reviewPhotos.reviewId, reviewId)).run();

  // Delete the review
  db.delete(reviews).where(eq(reviews.id, reviewId)).run();

  return NextResponse.json({ success: true });
}
