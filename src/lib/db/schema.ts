import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  role: text("role", { enum: ["hugo", "yuge", "visitor"] }).notNull().default("visitor"),
  fingerprint: text("fingerprint"),
  deviceName: text("device_name"),
  isWhitelisted: integer("is_whitelisted", { mode: "boolean" }).notNull().default(false),
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
});

export const dishes = sqliteTable("dishes", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  description: text("description").notNull().default(""),
  price: real("price").notNull(),
  category: text("category").notNull(),
  imageUrl: text("image_url"),
  thumbnailUrl: text("thumbnail_url"),
  isAvailable: integer("is_available", { mode: "boolean" }).notNull().default(true),
  isRecommended: integer("is_recommended", { mode: "boolean" }).notNull().default(false),
  spiceLevel: integer("spice_level").notNull().default(0),
  prepTime: integer("prep_time").notNull().default(15),
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
});

export const cartItems = sqliteTable("cart_items", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id").notNull().references(() => users.id),
  dishId: integer("dish_id").notNull().references(() => dishes.id),
  quantity: integer("quantity").notNull().default(1),
  specialNotes: text("special_notes"),
  addedAt: text("added_at").notNull().default(sql`(datetime('now'))`),
});

export const orders = sqliteTable("orders", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id").notNull().references(() => users.id),
  status: text("status", { enum: ["pending", "cooking", "ready", "completed", "cancelled"] }).notNull().default("pending"),
  totalPrice: real("total_price").notNull(),
  notes: text("notes"),
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
  completedAt: text("completed_at"),
});

export const orderItems = sqliteTable("order_items", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  orderId: integer("order_id").notNull().references(() => orders.id),
  dishId: integer("dish_id").notNull().references(() => dishes.id),
  quantity: integer("quantity").notNull(),
  priceAtOrder: real("price_at_order").notNull(),
  specialNotes: text("special_notes"),
  addedBy: integer("added_by").references(() => users.id),
});

export const reviews = sqliteTable("reviews", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id").notNull().references(() => users.id),
  dishId: integer("dish_id").notNull().references(() => dishes.id),
  orderId: integer("order_id").references(() => orders.id),
  rating: integer("rating").notNull(),
  comment: text("comment"),
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
});

export const reviewPhotos = sqliteTable("review_photos", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  reviewId: integer("review_id").notNull().references(() => reviews.id),
  imageUrl: text("image_url").notNull(),
  thumbnailUrl: text("thumbnail_url"),
});

export const visitorSettings = sqliteTable("visitor_settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
});

export const statsCache = sqliteTable("stats_cache", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
  updatedAt: text("updated_at").notNull().default(sql`(datetime('now'))`),
});
