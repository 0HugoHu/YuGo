import { NextRequest, NextResponse } from "next/server";
import { verifyAdminToken } from "@/lib/admin-auth";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

function checkAuth(req: NextRequest) {
  const token = req.cookies.get("admin_token")?.value;
  return token && verifyAdminToken(token);
}

export async function GET(req: NextRequest) {
  if (!checkAuth(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const allUsers = db.select().from(users).all();
  return NextResponse.json(allUsers);
}

export async function PUT(req: NextRequest) {
  if (!checkAuth(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id, isWhitelisted, role, name, fingerprint } = await req.json();

  if (!id) {
    return NextResponse.json({ error: "User ID required" }, { status: 400 });
  }

  const updates: Record<string, unknown> = {};
  if (isWhitelisted !== undefined) updates.isWhitelisted = isWhitelisted;
  if (role !== undefined) updates.role = role;
  if (name !== undefined) updates.name = name;
  if (fingerprint !== undefined) updates.fingerprint = fingerprint;

  db.update(users).set(updates).where(eq(users.id, id)).run();
  const updated = db.select().from(users).where(eq(users.id, id)).get();

  return NextResponse.json(updated);
}

export async function DELETE(req: NextRequest) {
  if (!checkAuth(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const id = req.nextUrl.searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "User ID required" }, { status: 400 });
  }

  db.delete(users).where(eq(users.id, parseInt(id))).run();
  return NextResponse.json({ success: true });
}
