#!/usr/bin/env tsx
/**
 * Setup script to create the initial admin user via API
 * This requires the API server to be running
 * Run with: pnpm --filter scripts exec tsx src/setup-admin-via-api.ts
 */

import { config } from "dotenv";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

// Get the directory of this script file
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env.local from workspace root
const envPath = resolve(__dirname, "../../.env.local");
console.log(`Loading environment from: ${envPath}`);
config({ path: envPath });

const API_URL = process.env.API_URL || "http://localhost:8080";
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "admin@ariwater.co.ke";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "Admin@123!";

async function setupAdmin() {
  console.log("🔧 Setting up admin user via API...");
  console.log(`🔗 API URL: ${API_URL}`);
  console.log(`📧 Admin email: ${ADMIN_EMAIL}\n`);

  try {
    // Try to login first to see if admin already exists
    console.log("🔍 Checking if admin can login...");
    const loginResponse = await fetch(`${API_URL}/api/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD,
      }),
    });

    if (loginResponse.ok) {
      const user = await loginResponse.json();
      console.log("✅ Admin user already exists and can login!");
      console.log(`   ID: ${user.id}`);
      console.log(`   Name: ${user.name}`);
      console.log(`   Role: ${user.role}`);
      console.log(`   Email: ${user.email}\n`);
      console.log("✅ Login system is working correctly!");
      return;
    }

    const loginError = await loginResponse.json().catch(() => ({ error: "Unknown error" }));
    
    if (loginResponse.status === 403 && loginError.error?.includes("pending admin approval")) {
      console.log("⚠️  Admin account exists but needs approval.");
      console.log("   This requires database access through Convex CLI.");
      console.log("\n💡 To approve the admin:");
      console.log("   1. Go to: https://dashboard.convex.dev/");
      console.log("   2. Select your project");
      console.log("   3. Go to Data tab");
      console.log("   4. Find the users table");
      console.log("   5. Set 'approved' to true for the admin user");
      return;
    }

    if (loginResponse.status === 401) {
      console.log("❌ Admin user not found or wrong password");
      console.log("\n📝 Creating admin user...");
      console.log("⚠️  Note: This is not possible without the API server running");
      console.log("   or direct database access through Convex dashboard.");
      console.log("\n💡 Please create the admin user manually:");
      console.log("   1. Start the API server: pnpm --filter @workspace/api-server dev");
      console.log("   2. Use the /api/auth/register endpoint");
      console.log("   3. Then approve the user in Convex dashboard");
      return;
    }

    console.log(`❌ Unexpected response: ${loginResponse.status}`);
    console.log(`   Error: ${JSON.stringify(loginError)}`);

  } catch (error) {
    console.error("❌ Error connecting to API server:");
    if (error instanceof Error) {
      console.error(`   ${error.message}`);
    }
    console.log("\n💡 Make sure the API server is running:");
    console.log(`   pnpm --filter @workspace/api-server dev`);
    console.log(`\n   Expected at: ${API_URL}`);
  }
}

setupAdmin();
