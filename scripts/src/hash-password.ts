#!/usr/bin/env tsx
/**
 * Generate bcrypt hash for a password
 * Run with: pnpm --filter scripts exec tsx src/hash-password.ts "YourPassword"
 */

import bcrypt from "bcryptjs";

const password = process.argv[2] || "Admin@123!";

console.log("🔐 Generating password hash...\n");
console.log(`Password: ${password}`);

bcrypt.hash(password, 10, (err, hash) => {
  if (err) {
    console.error("❌ Error:", err);
    process.exit(1);
  }
  console.log(`Hash: ${hash}`);
  console.log("\n✅ Copy this hash to use in Convex dashboard");
  console.log("\nJSON format for Convex:");
  console.log(JSON.stringify({
    name: "System Admin",
    email: "admin@ariwater.co.ke",
    passwordHash: hash,
    role: "admin",
    approved: true
  }, null, 2));
});
