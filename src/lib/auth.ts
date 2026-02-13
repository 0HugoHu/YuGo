import { db } from "./db";
import { users } from "./db/schema";
import { eq } from "drizzle-orm";

export type UserRole = "hugo" | "yuge" | "visitor";

export interface AuthUser {
  id: number;
  name: string;
  role: UserRole;
  fingerprint: string | null;
  isWhitelisted: boolean;
}

export async function getUserByFingerprint(fingerprint: string): Promise<AuthUser | null> {
  const result = db
    .select()
    .from(users)
    .where(eq(users.fingerprint, fingerprint))
    .get();

  if (!result) return null;
  return {
    id: result.id,
    name: result.name,
    role: result.role as UserRole,
    fingerprint: result.fingerprint,
    isWhitelisted: result.isWhitelisted,
  };
}

export async function registerFingerprint(
  userId: number,
  fingerprint: string,
  deviceName?: string
): Promise<void> {
  db.update(users)
    .set({ fingerprint, deviceName: deviceName || null })
    .where(eq(users.id, userId))
    .run();
}

export async function getAllUsers() {
  return db.select().from(users).all();
}

export async function setWhitelisted(userId: number, whitelisted: boolean) {
  db.update(users)
    .set({ isWhitelisted: whitelisted })
    .where(eq(users.id, userId))
    .run();
}

export function isAdmin(role: string): boolean {
  return role === "hugo";
}

export function canOrder(role: string, isWhitelisted: boolean): boolean {
  return (role === "hugo" || role === "yuge") && isWhitelisted;
}
