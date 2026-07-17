/**
 * Seed script — inserts an admin user and 6 products into Convex.
 * Usage: node scripts/seed-convex.mjs
 *
 * Requires: CONVEX_URL and CONVEX_DEPLOY_KEY env vars to be set.
 */
import { ConvexHttpClient } from "convex/browser";
import bcrypt from "bcryptjs";

const CONVEX_URL = process.env.CONVEX_URL;
const CONVEX_DEPLOY_KEY = process.env.CONVEX_DEPLOY_KEY;

if (!CONVEX_URL) throw new Error("CONVEX_URL is required");
if (!CONVEX_DEPLOY_KEY) throw new Error("CONVEX_DEPLOY_KEY is required");

const client = new ConvexHttpClient(CONVEX_URL);

// ── Helper: call Convex mutations using HTTP API directly (bypasses auth) ──────
async function callMutation(name, args) {
  const url = `${CONVEX_URL}/api/mutation`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Convex ${CONVEX_DEPLOY_KEY}`,
    },
    body: JSON.stringify({ path: name, args }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Mutation ${name} failed: ${res.status} ${body}`);
  }
  return (await res.json()).value;
}

async function callQuery(name, args) {
  const url = `${CONVEX_URL}/api/query`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Convex ${CONVEX_DEPLOY_KEY}`,
    },
    body: JSON.stringify({ path: name, args }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Query ${name} failed: ${res.status} ${body}`);
  }
  return (await res.json()).value;
}

// ── Seed admin user ────────────────────────────────────────────────────────────
async function seedAdmin() {
  const existing = await callQuery("users:getByEmail", { email: "admin@ariwater.co.ke" });
  if (existing) {
    console.log("Admin user already exists:", existing._id);
    return existing;
  }
  const passwordHash = await bcrypt.hash("Admin@123!", 10);
  const user = await callMutation("users:create", {
    name: "Ari Admin",
    email: "admin@ariwater.co.ke",
    phone: "+254726432689",
    passwordHash,
    role: "admin",
  });
  console.log("Created admin user:", user._id);
  return user;
}

// ── Seed products ──────────────────────────────────────────────────────────────
const PRODUCTS = [
  { name: "Ari Water 500ml (Carton of 24)", sku: "AW-500ML-24", packSize: "24 × 500 ml",  priceKes: 520,  stockQuantity: 200, imageUrl: "/bottle-500ml.png", category: "Bottled Water",  description: "Crisp and pure mineral water in convenient 500 ml bottles. Ideal for on-the-go hydration." },
  { name: "Ari Water 1 L (Carton of 12)",   sku: "AW-1L-12",    packSize: "12 × 1 L",      priceKes: 480,  stockQuantity: 150, imageUrl: "/bottle-1l.png",    category: "Bottled Water",  description: "Refreshing 1-litre mineral water for desk, gym, or family use." },
  { name: "Ari Water 5 L (Pack of 4)",       sku: "AW-5L-4",     packSize: "4 × 5 L",       priceKes: 800,  stockQuantity: 80,  imageUrl: "/bottle-5l.png",    category: "Bottled Water",  description: "Generous 5-litre bottles for households and small offices." },
  { name: "Ari Water 10 L Refill",           sku: "AW-10L-REF",  packSize: "1 × 10 L",      priceKes: 350,  stockQuantity: 100, imageUrl: "/bottle-5l.png",    category: "Refill",         description: "Eco-friendly 10-litre refill service — return your empty bottle and save." },
  { name: "Ari Water 20 L Refill",           sku: "AW-20L-REF",  packSize: "1 × 20 L",      priceKes: 550,  stockQuantity: 60,  imageUrl: "/bottle-5l.png",    category: "Refill",         description: "Office-size 20-litre refill, perfect for water dispensers." },
  { name: "Ari Water Dispenser (Hot & Cold)","sku": "AW-DISP-HC", packSize: "1 unit",        priceKes: 12500,stockQuantity: 15,  imageUrl: "/bottle-500ml.png", category: "Equipment",      description: "Sleek hot-and-cold floor-standing dispenser with stainless-steel taps." },
];

async function seedProducts() {
  for (const p of PRODUCTS) {
    try {
      const product = await callMutation("products:create", { ...p, isActive: true });
      console.log(`Created product: ${product.name} (${product._id})`);
    } catch (err) {
      if (err.message.includes("already exists")) {
        console.log(`Product already exists: ${p.sku}`);
      } else {
        console.error(`Error seeding ${p.sku}:`, err.message);
      }
    }
  }
}

async function main() {
  console.log("\n🌊 Seeding Ari Water Convex database…\n");
  await seedAdmin();
  await seedProducts();
  console.log("\n✅ Seed complete.\n");
  console.log("Admin credentials:");
  console.log("  Email:    admin@ariwater.co.ke");
  console.log("  Password: Admin@123!");
}

main().catch((err) => { console.error(err); process.exit(1); });
