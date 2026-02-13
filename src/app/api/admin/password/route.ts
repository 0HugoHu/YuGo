import { NextRequest, NextResponse } from "next/server";
import { verifyAdminToken, getOrCreateAdminPassword } from "@/lib/admin-auth";
import { db } from "@/lib/db";
import { visitorSettings } from "@/lib/db/schema";
import crypto from "crypto";

export async function GET(req: NextRequest) {
  const token = req.cookies.get("admin_token")?.value;
  if (!token || !verifyAdminToken(token)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const password = getOrCreateAdminPassword();
  return NextResponse.json({ password });
}

export async function POST(req: NextRequest) {
  const token = req.cookies.get("admin_token")?.value;
  if (!token || !verifyAdminToken(token)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Generate new password
  const newPassword = crypto.randomBytes(6).toString("base64url");
  db.insert(visitorSettings)
    .values({ key: "admin_password", value: newPassword })
    .onConflictDoUpdate({ target: visitorSettings.key, set: { value: newPassword } })
    .run();

  return NextResponse.json({ password: newPassword });
}
