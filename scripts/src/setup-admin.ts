#!/usr/bin/env tsx
/**
 * Setup script to create the initial admin user
 * Run with: pnpm --filter scripts exec tsx src/setup-admin.ts
 */

import { config } from "dotenv";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../convex/_generated/api";
import bcrypt from "bcryptjs";

// Get the directory of this script file
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env.local from workspace root (two levels up from scripts/src)
const envPath = resolve(__dirname, "../../.env.local");
console.log(`Loading environment from: ${envPath}`);
config({ path: envPath });

async function setupAdmin() {
  const convexUrl = process.env.CONVEX_URL ?? process.env.CONVEX_DEPLOYMENT_URL;
  if (!convexUrl) {
    console.error("❌ CONVEX_URL or CONVEX_DEPLOYMENT_URL must be set");
    process.exit(1);
  }

  const adminEmail = process.env.ADMIN_EMAIL || "admin@ariwater.co.ke";
  const adminPassword = process.env.ADMIN_PASSWORD || "Admin@123!";

  console.log("🔧 Setting up admin user...");
  console.log(`📧 Admin email: ${adminEmail}`);
  console.log(`🔗 Convex URL: ${convexUrl}`);

  const client = new ConvexHttpClient(convexUrl);

  try {
    // Check if admin already exists
    console.log("🔍 Checking if admin exists...");
    const existingAdmin = await client.query(api.users.getByEmail, {
      email: adminEmail,
    });

    if (existingAdmin) {
      console.log("✅ Admin user already exists");
      console.log(`   ID: ${existingAdmin._id}`);
      console.log(`   Name: ${existingAdmin.name}`);
      console.log(`   Role: ${existingAdmin.role}`);
      console.log(`   Approved: ${existingAdmin.approved}`);
      
      // Update if not approved
      if (!existingAdmin.approved) {
        console.log("⚠️  Admin is not approved, updating...");
        await client.mutation(api.users.update, {
          id: existingAdmin._id,
          approved: true,
        });
        console.log("✅ Admin approved successfully");
      }
      
      return;
    }

    // Create new admin
    console.log("📝 Creating new admin user...");
    const passwordHash = await bcrypt.hash(adminPassword, 10);

    const admin = await client.mutation(api.users.create, {
      name: "System Admin",
      email: adminEmail,
      passwordHash,
      role: "admin",
      approved: true,
    });

    console.log("✅ Admin user created successfully!");
    console.log(`   ID: ${admin._id}`);
    console.log(`   Email: ${adminEmail}`);
    console.log(`   Password: ${adminPassword}`);
    console.log("");
    console.log("⚠️  IMPORTANT: Change the admin password after first login!");
  } catch (error) {
    console.error("❌ Error setting up admin:");
    if (error instanceof Error) {
      console.error(`   Message: ${error.message}`);
      console.error(`   Stack: ${error.stack}`);
    } else {
      console.error(`   ${error}`);
    }
    console.log("");
    console.log("💡 Troubleshooting tips:");
    console.log("   1. Ensure Convex deployment is active");
    console.log("   2. Check CONVEX_URL is correct in .env.local");
    console.log("   3. Verify you have network connectivity");
    console.log("   4. Try running: npx convex dev");
    process.exit(1);
  }
}

setupAdmin();
