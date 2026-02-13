const Database = require("better-sqlite3");
const path = require("path");
const fs = require("fs");

const dbPath = "/app/data/yugo-eats.db";
const dir = path.dirname(dbPath);
if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

const db = new Database(dbPath);
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

// Create tables
db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'visitor',
  fingerprint TEXT,
  device_name TEXT,
  is_whitelisted INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS dishes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  price REAL NOT NULL,
  category TEXT NOT NULL,
  image_url TEXT,
  thumbnail_url TEXT,
  is_available INTEGER NOT NULL DEFAULT 1,
  spice_level INTEGER NOT NULL DEFAULT 0,
  prep_time INTEGER NOT NULL DEFAULT 15,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS cart_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id),
  dish_id INTEGER NOT NULL REFERENCES dishes(id),
  quantity INTEGER NOT NULL DEFAULT 1,
  special_notes TEXT,
  added_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id),
  status TEXT NOT NULL DEFAULT 'pending',
  total_price REAL NOT NULL,
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  completed_at TEXT
);

CREATE TABLE IF NOT EXISTS order_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id INTEGER NOT NULL REFERENCES orders(id),
  dish_id INTEGER NOT NULL REFERENCES dishes(id),
  quantity INTEGER NOT NULL,
  price_at_order REAL NOT NULL,
  special_notes TEXT,
  added_by INTEGER REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS reviews (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id),
  dish_id INTEGER NOT NULL REFERENCES dishes(id),
  order_id INTEGER REFERENCES orders(id),
  rating INTEGER NOT NULL,
  comment TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS review_photos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  review_id INTEGER NOT NULL REFERENCES reviews(id),
  image_url TEXT NOT NULL,
  thumbnail_url TEXT
);

CREATE TABLE IF NOT EXISTS visitor_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS stats_cache (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
`);

// Seed users
db.exec(`
INSERT OR IGNORE INTO users (id, name, role, is_whitelisted) VALUES (1, 'Hugo', 'hugo', 1);
INSERT OR IGNORE INTO users (id, name, role, is_whitelisted) VALUES (2, 'Yuge', 'yuge', 1);
`);

// Only seed data if no dishes exist yet (prevents duplicates on restart)
const existingDishes = db.prepare("SELECT count(*) as c FROM dishes").get();
if (existingDishes.c > 0) {
  console.log("Data already seeded, skipping...");
} else {

const insertDish = db.prepare(
  "INSERT INTO dishes (name, description, price, category, spice_level, prep_time) VALUES (?, ?, ?, ?, ?, ?)"
);

const dishes = [
  ["Mapo Tofu", "Silky tofu in a fiery, numbing chili-bean sauce with minced pork. A Sichuan classic.", 0, "Mains", 4, 25],
  ["Tomato Egg Stir-fry", "Fluffy scrambled eggs with sweet, tangy tomatoes. Simple perfection.", 0, "Mains", 0, 10],
  ["Kung Pao Chicken", "Tender chicken with peanuts, dried chilies, and Sichuan peppercorns.", 0, "Mains", 3, 20],
  ["Steamed Dumplings", "Handmade dumplings filled with juicy pork and chives.", 0, "Appetizers", 0, 30],
  ["Scallion Pancakes", "Crispy, flaky layers of dough swirled with fragrant scallions.", 0, "Appetizers", 0, 15],
  ["Hot & Sour Soup", "Tangy, peppery broth with tofu, mushrooms, and bamboo shoots.", 0, "Soups", 2, 15],
  ["Egg Fried Rice", "Wok-tossed rice with fluffy eggs, scallions, and soy sauce.", 0, "Sides", 0, 10],
  ["Garlic Bok Choy", "Baby bok choy flash-sauteed with garlic and oyster sauce.", 0, "Sides", 0, 8],
  ["Dan Dan Noodles", "Springy noodles in a creamy, spicy sesame-peanut sauce with chili oil.", 0, "Noodles", 3, 15],
  ["Mango Pudding", "Silky smooth mango pudding topped with fresh fruit.", 0, "Desserts", 0, 5],
  ["Red Bean Soup", "Warm, sweet red bean soup - a traditional dessert.", 0, "Desserts", 0, 20],
  ["Jasmine Tea", "Fragrant jasmine-scented green tea. Refreshing and calming.", 0, "Drinks", 0, 3],
];

for (const d of dishes) {
  insertDish.run(...d);
}

// Seed orders — spread across different days of the week from Jul-Dec 2025
// Yuge orders
db.exec(`
INSERT OR IGNORE INTO orders (id, user_id, status, total_price, created_at, completed_at) VALUES (1, 2, 'completed', 0, '2025-07-28 18:30:00', '2025-07-28 19:00:00');
INSERT OR IGNORE INTO orders (id, user_id, status, total_price, created_at, completed_at) VALUES (2, 2, 'completed', 0, '2025-08-05 19:00:00', '2025-08-05 19:25:00');
INSERT OR IGNORE INTO orders (id, user_id, status, total_price, created_at, completed_at) VALUES (3, 2, 'completed', 0, '2025-08-20 18:00:00', '2025-08-20 18:20:00');
INSERT OR IGNORE INTO orders (id, user_id, status, total_price, created_at, completed_at) VALUES (4, 2, 'completed', 0, '2025-09-14 19:30:00', '2025-09-14 20:05:00');
INSERT OR IGNORE INTO orders (id, user_id, status, total_price, created_at, completed_at) VALUES (5, 2, 'completed', 0, '2025-10-03 18:15:00', '2025-10-03 18:50:00');
INSERT OR IGNORE INTO orders (id, user_id, status, total_price, created_at, completed_at) VALUES (6, 2, 'completed', 0, '2025-11-08 19:00:00', '2025-11-08 19:30:00');
INSERT OR IGNORE INTO orders (id, user_id, status, total_price, created_at, completed_at) VALUES (7, 2, 'completed', 0, '2025-12-01 18:45:00', '2025-12-01 19:10:00');
`);

// Hugo orders
db.exec(`
INSERT OR IGNORE INTO orders (id, user_id, status, total_price, created_at, completed_at) VALUES (8, 1, 'completed', 0, '2025-08-12 12:00:00', '2025-08-12 12:30:00');
INSERT OR IGNORE INTO orders (id, user_id, status, total_price, created_at, completed_at) VALUES (9, 1, 'completed', 0, '2025-09-06 13:00:00', '2025-09-06 13:25:00');
INSERT OR IGNORE INTO orders (id, user_id, status, total_price, created_at, completed_at) VALUES (10, 1, 'completed', 0, '2025-09-25 19:00:00', '2025-09-25 19:35:00');
INSERT OR IGNORE INTO orders (id, user_id, status, total_price, created_at, completed_at) VALUES (11, 1, 'completed', 0, '2025-10-18 12:30:00', '2025-10-18 13:00:00');
INSERT OR IGNORE INTO orders (id, user_id, status, total_price, created_at, completed_at) VALUES (12, 1, 'completed', 0, '2025-11-22 18:00:00', '2025-11-22 18:30:00');
INSERT OR IGNORE INTO orders (id, user_id, status, total_price, created_at, completed_at) VALUES (13, 1, 'completed', 0, '2025-12-15 19:00:00', '2025-12-15 19:25:00');
INSERT OR IGNORE INTO orders (id, user_id, status, total_price, created_at, completed_at) VALUES (14, 2, 'pending', 0, datetime('now'), NULL);
`);

// Order items — Yuge's orders (added_by=2)
db.exec(`
INSERT OR IGNORE INTO order_items (order_id, dish_id, quantity, price_at_order, added_by) VALUES (1, 1, 2, 0, 2);
INSERT OR IGNORE INTO order_items (order_id, dish_id, quantity, price_at_order, added_by) VALUES (1, 7, 1, 0, 2);
INSERT OR IGNORE INTO order_items (order_id, dish_id, quantity, price_at_order, added_by) VALUES (1, 12, 2, 0, 2);
INSERT OR IGNORE INTO order_items (order_id, dish_id, quantity, price_at_order, added_by) VALUES (2, 4, 3, 0, 2);
INSERT OR IGNORE INTO order_items (order_id, dish_id, quantity, price_at_order, added_by) VALUES (2, 3, 1, 0, 2);
INSERT OR IGNORE INTO order_items (order_id, dish_id, quantity, price_at_order, added_by) VALUES (2, 10, 1, 0, 2);
INSERT OR IGNORE INTO order_items (order_id, dish_id, quantity, price_at_order, added_by) VALUES (3, 9, 2, 0, 2);
INSERT OR IGNORE INTO order_items (order_id, dish_id, quantity, price_at_order, added_by) VALUES (3, 6, 1, 0, 2);
INSERT OR IGNORE INTO order_items (order_id, dish_id, quantity, price_at_order, added_by) VALUES (3, 5, 1, 0, 2);
INSERT OR IGNORE INTO order_items (order_id, dish_id, quantity, price_at_order, added_by) VALUES (4, 1, 1, 0, 2);
INSERT OR IGNORE INTO order_items (order_id, dish_id, quantity, price_at_order, added_by) VALUES (4, 2, 1, 0, 2);
INSERT OR IGNORE INTO order_items (order_id, dish_id, quantity, price_at_order, added_by) VALUES (4, 8, 1, 0, 2);
INSERT OR IGNORE INTO order_items (order_id, dish_id, quantity, price_at_order, added_by) VALUES (4, 11, 1, 0, 2);
INSERT OR IGNORE INTO order_items (order_id, dish_id, quantity, price_at_order, added_by) VALUES (5, 3, 2, 0, 2);
INSERT OR IGNORE INTO order_items (order_id, dish_id, quantity, price_at_order, added_by) VALUES (5, 7, 1, 0, 2);
INSERT OR IGNORE INTO order_items (order_id, dish_id, quantity, price_at_order, added_by) VALUES (5, 12, 1, 0, 2);
INSERT OR IGNORE INTO order_items (order_id, dish_id, quantity, price_at_order, added_by) VALUES (6, 9, 1, 0, 2);
INSERT OR IGNORE INTO order_items (order_id, dish_id, quantity, price_at_order, added_by) VALUES (6, 1, 1, 0, 2);
INSERT OR IGNORE INTO order_items (order_id, dish_id, quantity, price_at_order, added_by) VALUES (6, 4, 2, 0, 2);
INSERT OR IGNORE INTO order_items (order_id, dish_id, quantity, price_at_order, added_by) VALUES (7, 2, 2, 0, 2);
INSERT OR IGNORE INTO order_items (order_id, dish_id, quantity, price_at_order, added_by) VALUES (7, 10, 1, 0, 2);
INSERT OR IGNORE INTO order_items (order_id, dish_id, quantity, price_at_order, added_by) VALUES (7, 6, 1, 0, 2);
`);

// Order items — Hugo's orders (added_by=1)
db.exec(`
INSERT OR IGNORE INTO order_items (order_id, dish_id, quantity, price_at_order, added_by) VALUES (8, 1, 1, 0, 1);
INSERT OR IGNORE INTO order_items (order_id, dish_id, quantity, price_at_order, added_by) VALUES (8, 3, 1, 0, 1);
INSERT OR IGNORE INTO order_items (order_id, dish_id, quantity, price_at_order, added_by) VALUES (8, 7, 1, 0, 1);
INSERT OR IGNORE INTO order_items (order_id, dish_id, quantity, price_at_order, added_by) VALUES (9, 9, 2, 0, 1);
INSERT OR IGNORE INTO order_items (order_id, dish_id, quantity, price_at_order, added_by) VALUES (9, 6, 1, 0, 1);
INSERT OR IGNORE INTO order_items (order_id, dish_id, quantity, price_at_order, added_by) VALUES (9, 12, 1, 0, 1);
INSERT OR IGNORE INTO order_items (order_id, dish_id, quantity, price_at_order, added_by) VALUES (10, 1, 2, 0, 1);
INSERT OR IGNORE INTO order_items (order_id, dish_id, quantity, price_at_order, added_by) VALUES (10, 5, 1, 0, 1);
INSERT OR IGNORE INTO order_items (order_id, dish_id, quantity, price_at_order, added_by) VALUES (10, 4, 1, 0, 1);
INSERT OR IGNORE INTO order_items (order_id, dish_id, quantity, price_at_order, added_by) VALUES (11, 3, 2, 0, 1);
INSERT OR IGNORE INTO order_items (order_id, dish_id, quantity, price_at_order, added_by) VALUES (11, 8, 1, 0, 1);
INSERT OR IGNORE INTO order_items (order_id, dish_id, quantity, price_at_order, added_by) VALUES (11, 10, 1, 0, 1);
INSERT OR IGNORE INTO order_items (order_id, dish_id, quantity, price_at_order, added_by) VALUES (12, 1, 1, 0, 1);
INSERT OR IGNORE INTO order_items (order_id, dish_id, quantity, price_at_order, added_by) VALUES (12, 9, 1, 0, 1);
INSERT OR IGNORE INTO order_items (order_id, dish_id, quantity, price_at_order, added_by) VALUES (12, 2, 1, 0, 1);
INSERT OR IGNORE INTO order_items (order_id, dish_id, quantity, price_at_order, added_by) VALUES (13, 6, 2, 0, 1);
INSERT OR IGNORE INTO order_items (order_id, dish_id, quantity, price_at_order, added_by) VALUES (13, 4, 1, 0, 1);
INSERT OR IGNORE INTO order_items (order_id, dish_id, quantity, price_at_order, added_by) VALUES (13, 11, 1, 0, 1);
INSERT OR IGNORE INTO order_items (order_id, dish_id, quantity, price_at_order, added_by) VALUES (14, 3, 2, 0, 2);
INSERT OR IGNORE INTO order_items (order_id, dish_id, quantity, price_at_order, added_by) VALUES (14, 7, 1, 0, 2);
`);

// Seed reviews — Yuge's reviews
db.exec(`
INSERT OR IGNORE INTO reviews (user_id, dish_id, order_id, rating, comment, created_at) VALUES (2, 1, 1, 5, 'So spicy and delicious! My absolute favorite!', '2025-07-29 10:00:00');
INSERT OR IGNORE INTO reviews (user_id, dish_id, order_id, rating, comment, created_at) VALUES (2, 4, 2, 5, 'The dumplings were perfect - so juicy inside!', '2025-08-06 09:00:00');
INSERT OR IGNORE INTO reviews (user_id, dish_id, order_id, rating, comment, created_at) VALUES (2, 3, 2, 4, 'Great flavor, could use a tiny bit more peanuts', '2025-08-06 09:05:00');
INSERT OR IGNORE INTO reviews (user_id, dish_id, order_id, rating, comment, created_at) VALUES (2, 9, 3, 5, 'Dan Dan noodles are AMAZING. Want this every day!', '2025-08-21 08:00:00');
INSERT OR IGNORE INTO reviews (user_id, dish_id, order_id, rating, comment, created_at) VALUES (2, 2, 4, 4, 'Simple but so comforting. Reminds me of home.', '2025-09-15 10:00:00');
INSERT OR IGNORE INTO reviews (user_id, dish_id, order_id, rating, comment, created_at) VALUES (2, 10, 2, 5, 'Best mango pudding ever!! So smooth and sweet.', '2025-08-07 14:00:00');
INSERT OR IGNORE INTO reviews (user_id, dish_id, order_id, rating, comment, created_at) VALUES (2, 6, 7, 4, 'Love the tanginess! Perfect winter soup.', '2025-12-02 10:00:00');
`);

// Hugo's reviews
db.exec(`
INSERT OR IGNORE INTO reviews (user_id, dish_id, order_id, rating, comment, created_at) VALUES (1, 1, 8, 5, 'My signature dish! Extra numbing peppercorns next time.', '2025-08-13 10:00:00');
INSERT OR IGNORE INTO reviews (user_id, dish_id, order_id, rating, comment, created_at) VALUES (1, 9, 9, 4, 'The sauce turned out great, needs more chili oil though.', '2025-09-07 09:00:00');
INSERT OR IGNORE INTO reviews (user_id, dish_id, order_id, rating, comment, created_at) VALUES (1, 3, 11, 5, 'Kung Pao was on point today. Perfectly balanced.', '2025-10-19 10:00:00');
INSERT OR IGNORE INTO reviews (user_id, dish_id, order_id, rating, comment, created_at) VALUES (1, 4, 13, 5, 'Dumplings came out perfect. Thin wrappers!', '2025-12-16 09:00:00');
INSERT OR IGNORE INTO reviews (user_id, dish_id, order_id, rating, comment, created_at) VALUES (1, 6, 13, 4, 'Good soup but could be more sour next time.', '2025-12-16 09:05:00');
`);

} // end of "if no dishes" guard

// Visitor settings
db.exec(`
INSERT OR IGNORE INTO visitor_settings (key, value) VALUES ('show_menu', 'true');
INSERT OR IGNORE INTO visitor_settings (key, value) VALUES ('show_stats', 'false');
INSERT OR IGNORE INTO visitor_settings (key, value) VALUES ('show_reviews', 'false');
`);

// Admin password
const crypto = require("crypto");
const existingPw = db.prepare("SELECT value FROM visitor_settings WHERE key = 'admin_password'").get();
if (!existingPw) {
  const password = crypto.randomBytes(6).toString("base64url");
  db.prepare("INSERT OR IGNORE INTO visitor_settings (key, value) VALUES ('admin_password', ?)").run(password);
  console.log("");
  console.log("===================================");
  console.log("  Admin Password: " + password);
  console.log("  Admin URL: http://localhost:3000/admin");
  console.log("===================================");
  console.log("");
} else {
  console.log("");
  console.log("===================================");
  console.log("  Admin Password: " + existingPw.value);
  console.log("  Admin URL: http://localhost:3000/admin");
  console.log("===================================");
  console.log("");
}

console.log("Seeded: 2 users, 12 dishes, 14 orders, 12 reviews, visitor settings, admin password");
db.close();
