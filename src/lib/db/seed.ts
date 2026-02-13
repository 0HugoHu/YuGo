import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "./schema";
import path from "path";
import fs from "fs";

const dbPath = process.env.DATABASE_PATH || path.join(process.cwd(), "data", "yugo-eats.db");
const dir = path.dirname(dbPath);
if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir, { recursive: true });
}

const sqlite = new Database(dbPath);
sqlite.pragma("journal_mode = WAL");
sqlite.pragma("foreign_keys = ON");
const db = drizzle(sqlite, { schema });

async function seed() {
  console.log("🌱 Seeding database...");

  // Create Hugo user
  db.insert(schema.users).values({
    name: "Hugo",
    role: "hugo",
    isWhitelisted: true,
    deviceName: "Hugo's Device",
  }).run();

  // Create Yuge user
  db.insert(schema.users).values({
    name: "Yuge",
    role: "yuge",
    isWhitelisted: true,
    deviceName: "Yuge's Device",
  }).run();

  // Seed dishes
  const dishData = [
    { name: "Mapo Tofu", description: "Silky tofu in a fiery, numbing chili-bean sauce with minced pork. A Sichuan classic that'll warm your soul.", price: 0, category: "Mains", spiceLevel: 4, prepTime: 25 },
    { name: "Tomato Egg Stir-fry", description: "The ultimate comfort dish — fluffy scrambled eggs with sweet, tangy tomatoes. Simple perfection.", price: 0, category: "Mains", spiceLevel: 0, prepTime: 10 },
    { name: "Kung Pao Chicken", description: "Tender chicken with peanuts, dried chilies, and Sichuan peppercorns in a sweet-savory glaze.", price: 0, category: "Mains", spiceLevel: 3, prepTime: 20 },
    { name: "Steamed Dumplings", description: "Handmade dumplings filled with juicy pork and chives, steamed to translucent perfection.", price: 0, category: "Appetizers", spiceLevel: 0, prepTime: 30 },
    { name: "Scallion Pancakes", description: "Crispy, flaky layers of dough swirled with fragrant scallions. Irresistibly crunchy.", price: 0, category: "Appetizers", spiceLevel: 0, prepTime: 15 },
    { name: "Hot & Sour Soup", description: "A warming bowl of tangy, peppery broth with tofu, mushrooms, and bamboo shoots.", price: 0, category: "Soups", spiceLevel: 2, prepTime: 15 },
    { name: "Egg Fried Rice", description: "Wok-tossed rice with fluffy eggs, scallions, and a kiss of soy sauce. The perfect side.", price: 0, category: "Sides", spiceLevel: 0, prepTime: 10 },
    { name: "Garlic Bok Choy", description: "Fresh baby bok choy flash-sautéed with garlic and a splash of oyster sauce.", price: 0, category: "Sides", spiceLevel: 0, prepTime: 8 },
    { name: "Dan Dan Noodles", description: "Springy noodles swimming in a creamy, spicy sesame-peanut sauce with chili oil.", price: 0, category: "Noodles", spiceLevel: 3, prepTime: 15 },
    { name: "Mango Pudding", description: "Silky smooth mango pudding topped with fresh fruit. A sweet tropical finale.", price: 0, category: "Desserts", spiceLevel: 0, prepTime: 5 },
    { name: "Red Bean Soup", description: "Warm, sweet red bean soup — a traditional dessert that feels like a cozy hug.", price: 0, category: "Desserts", spiceLevel: 0, prepTime: 20 },
    { name: "Jasmine Tea", description: "Fragrant jasmine-scented green tea. Refreshing and calming.", price: 0, category: "Drinks", spiceLevel: 0, prepTime: 3 },
  ];

  for (const dish of dishData) {
    db.insert(schema.dishes).values(dish).run();
  }

  // Default visitor settings
  db.insert(schema.visitorSettings).values({ key: "show_menu", value: "true" }).run();
  db.insert(schema.visitorSettings).values({ key: "show_stats", value: "false" }).run();
  db.insert(schema.visitorSettings).values({ key: "show_reviews", value: "false" }).run();

  console.log("✅ Seed complete! Created 2 users, " + dishData.length + " dishes, and default settings.");
}

seed();
