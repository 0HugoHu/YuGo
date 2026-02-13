import { db } from "./db";
import { visitorSettings } from "./db/schema";
import { eq } from "drizzle-orm";
import crypto from "crypto";

const ADMIN_PASSWORD_KEY = "admin_password";
const ADMIN_TOKEN_KEY = "admin_token";

export function getOrCreateAdminPassword(): string {
  const existing = db
    .select()
    .from(visitorSettings)
    .where(eq(visitorSettings.key, ADMIN_PASSWORD_KEY))
    .get();

  if (existing) return existing.value;

  // Generate a random 12-character password
  const password = crypto.randomBytes(6).toString("base64url");

  db.insert(visitorSettings)
    .values({ key: ADMIN_PASSWORD_KEY, value: password })
    .onConflictDoUpdate({ target: visitorSettings.key, set: { value: password } })
    .run();

  console.log(`\n===================================`);
  console.log(`  YuGo Eats Admin Password: ${password}`);
  console.log(`===================================\n`);

  return password;
}

export function verifyAdminPassword(password: string): boolean {
  const stored = db
    .select()
    .from(visitorSettings)
    .where(eq(visitorSettings.key, ADMIN_PASSWORD_KEY))
    .get();

  if (!stored) return false;
  return stored.value === password;
}

export function createAdminToken(): string {
  const token = crypto.randomBytes(32).toString("hex");

  db.insert(visitorSettings)
    .values({ key: ADMIN_TOKEN_KEY, value: token })
    .onConflictDoUpdate({ target: visitorSettings.key, set: { value: token } })
    .run();

  return token;
}

export function verifyAdminToken(token: string): boolean {
  if (!token) return false;
  const stored = db
    .select()
    .from(visitorSettings)
    .where(eq(visitorSettings.key, ADMIN_TOKEN_KEY))
    .get();

  if (!stored) return false;
  return stored.value === token;
}
