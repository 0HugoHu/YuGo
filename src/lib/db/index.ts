import Database from "better-sqlite3";
import { drizzle, type BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import * as schema from "./schema";
import path from "path";
import fs from "fs";

let _db: BetterSQLite3Database<typeof schema> | null = null;

function getDb(): BetterSQLite3Database<typeof schema> {
  if (_db) return _db;

  const dbPath = process.env.DATABASE_PATH || path.join(process.cwd(), "data", "yugo-eats.db");

  // Ensure data directory exists
  const dir = path.dirname(dbPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const sqlite = new Database(dbPath);
  sqlite.pragma("journal_mode = WAL");
  sqlite.pragma("foreign_keys = ON");
  sqlite.pragma("busy_timeout = 10000");
  sqlite.pragma("cache_size = -16000"); // 16MB page cache (default ~2MB)

  _db = drizzle(sqlite, { schema });
  return _db;
}

// Proxy that lazily initializes the DB on first use
export const db = new Proxy({} as BetterSQLite3Database<typeof schema>, {
  get(_target, prop) {
    const real = getDb();
    const val = (real as unknown as Record<string | symbol, unknown>)[prop];
    if (typeof val === "function") {
      return val.bind(real);
    }
    return val;
  },
});

export { schema };
