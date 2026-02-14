import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

const isDevMode = process.env.DEV_MODE === "true";

export async function POST(req: NextRequest) {
  const { role, fingerprint } = await req.json();

  if (!role || !fingerprint) {
    return NextResponse.json({ error: "Missing role or fingerprint" }, { status: 400 });
  }

  // Check if fingerprint already registered
  const existing = db.select().from(users).where(eq(users.fingerprint, fingerprint)).get();
  if (existing) {
    return NextResponse.json({
      userId: existing.id,
      name: existing.name,
      role: existing.role,
      isWhitelisted: existing.isWhitelisted,
    });
  }

  // For hugo/yuge roles, find the user and register fingerprint
  if (role === "hugo" || role === "yuge") {
    const user = db.select().from(users).where(eq(users.role, role)).get();
    if (user) {
      // If the user already has a fingerprint registered and this is a different device,
      // reject in production mode (only the registered device can log in)
      if (user.fingerprint && user.fingerprint !== fingerprint && !isDevMode) {
        return NextResponse.json(
          { error: "This role is already registered to another device. Access denied." },
          { status: 403 }
        );
      }

      db.update(users)
        .set({ fingerprint, isWhitelisted: true })
        .where(eq(users.id, user.id))
        .run();
      return NextResponse.json({
        userId: user.id,
        name: user.name,
        role: user.role,
        isWhitelisted: true,
      });
    }
  }

  // Create visitor user
  const result = db.insert(users).values({
    name: "Visitor",
    role: "visitor",
    fingerprint,
    isWhitelisted: false,
  }).returning().get();

  return NextResponse.json({
    userId: result.id,
    name: result.name,
    role: result.role,
    isWhitelisted: false,
  });
}

export async function GET(req: NextRequest) {
  const fp = req.nextUrl.searchParams.get("fingerprint");
  if (!fp) {
    return NextResponse.json({ error: "Missing fingerprint" }, { status: 400 });
  }

  const user = db.select().from(users).where(eq(users.fingerprint, fp)).get();
  if (!user) {
    return NextResponse.json({ authenticated: false });
  }

  return NextResponse.json({
    authenticated: true,
    userId: user.id,
    name: user.name,
    role: user.role,
    isWhitelisted: user.isWhitelisted,
  });
}
