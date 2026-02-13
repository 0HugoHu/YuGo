import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { cartItems, dishes, users } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

export async function GET() {
  const items = db
    .select({
      id: cartItems.id,
      userId: cartItems.userId,
      dishId: cartItems.dishId,
      quantity: cartItems.quantity,
      specialNotes: cartItems.specialNotes,
      addedAt: cartItems.addedAt,
      dishName: dishes.name,
      dishPrice: dishes.price,
      dishThumbnail: dishes.thumbnailUrl,
      userName: users.name,
    })
    .from(cartItems)
    .leftJoin(dishes, eq(cartItems.dishId, dishes.id))
    .leftJoin(users, eq(cartItems.userId, users.id))
    .all();

  return NextResponse.json(items);
}

export async function POST(req: NextRequest) {
  const { userId, dishId, quantity, specialNotes } = await req.json();

  if (!userId || !dishId) {
    return NextResponse.json({ error: "Missing userId or dishId" }, { status: 400 });
  }

  // Check if this user already has this dish in cart
  const existing = db
    .select()
    .from(cartItems)
    .where(and(eq(cartItems.userId, userId), eq(cartItems.dishId, dishId)))
    .get();

  if (existing) {
    db.update(cartItems)
      .set({ quantity: existing.quantity + (quantity || 1) })
      .where(eq(cartItems.id, existing.id))
      .run();
  } else {
    db.insert(cartItems)
      .values({
        userId,
        dishId,
        quantity: quantity || 1,
        specialNotes: specialNotes || null,
      })
      .run();
  }

  return NextResponse.json({ ok: true });
}

export async function PUT(req: NextRequest) {
  const { cartItemId, quantity } = await req.json();

  if (!cartItemId || quantity === undefined) {
    return NextResponse.json({ error: "Missing cartItemId or quantity" }, { status: 400 });
  }

  if (quantity <= 0) {
    db.delete(cartItems).where(eq(cartItems.id, cartItemId)).run();
  } else {
    db.update(cartItems).set({ quantity }).where(eq(cartItems.id, cartItemId)).run();
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const url = new URL(req.url);
  const all = url.searchParams.get("all");
  const cartItemId = url.searchParams.get("id");

  if (all === "true") {
    db.delete(cartItems).run();
  } else if (cartItemId) {
    db.delete(cartItems).where(eq(cartItems.id, parseInt(cartItemId))).run();
  } else {
    return NextResponse.json({ error: "Missing id or all param" }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
