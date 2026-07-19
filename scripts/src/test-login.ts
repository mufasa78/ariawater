#!/usr/bin/env tsx
/**
 * Test script to verify login functionality
 * Run with: pnpm --filter scripts exec tsx src/test-login.ts
 */

import { config } from "dotenv";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

// Get the directory of this script file
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env.local from workspace root (two levels up from scripts/src)
const envPath = resolve(__dirname, "../../.env.local");
config({ path: envPath });

const API_URL = process.env.API_URL || "http://localhost:8080";
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "admin@ariwater.co.ke";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "Admin@123!";

interface LoginResponse {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: string;
}

interface ErrorResponse {
  error: string;
}

async function testLogin() {
  console.log("🧪 Testing Login Functionality");
  console.log("================================\n");

  // Test 1: Login with valid credentials
  console.log("Test 1: Login with admin credentials");
  console.log(`API URL: ${API_URL}/api/auth/login`);
  console.log(`Email: ${ADMIN_EMAIL}`);
  console.log(`Password: ${"*".repeat(ADMIN_PASSWORD.length)}\n`);

  try {
    const loginResponse = await fetch(`${API_URL}/api/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD,
      }),
      credentials: "include",
    });

    const loginData = await loginResponse.json();

    if (!loginResponse.ok) {
      console.log(`❌ Login failed: ${loginResponse.status} ${loginResponse.statusText}`);
      console.log(`   Error: ${(loginData as ErrorResponse).error || JSON.stringify(loginData)}`);
      
      if (loginResponse.status === 403) {
        console.log("\n💡 Tip: The account may need admin approval. Run setup-admin script first.");
      } else if (loginResponse.status === 401) {
        console.log("\n💡 Tip: Check if the admin user exists and credentials are correct.");
      }
      
      return false;
    }

    console.log("✅ Login successful!");
    console.log(`   User ID: ${(loginData as LoginResponse).id}`);
    console.log(`   Name: ${(loginData as LoginResponse).name}`);
    console.log(`   Email: ${(loginData as LoginResponse).email}`);
    console.log(`   Role: ${(loginData as LoginResponse).role}`);

    // Extract cookie
    const setCookie = loginResponse.headers.get("set-cookie");
    if (!setCookie) {
      console.log("\n⚠️  Warning: No authentication cookie received");
      return false;
    }

    console.log(`   Cookie: ${setCookie.split(";")[0]}`);

    // Test 2: Verify /me endpoint with cookie
    console.log("\nTest 2: Verify /me endpoint");
    
    const meResponse = await fetch(`${API_URL}/api/auth/me`, {
      method: "GET",
      headers: {
        Cookie: setCookie,
      },
    });

    const meData = await meResponse.json();

    if (!meResponse.ok) {
      console.log(`❌ /me endpoint failed: ${meResponse.status} ${meResponse.statusText}`);
      console.log(`   Error: ${(meData as ErrorResponse).error || JSON.stringify(meData)}`);
      return false;
    }

    console.log("✅ /me endpoint successful!");
    console.log(`   User ID: ${(meData as LoginResponse).id}`);
    console.log(`   Name: ${(meData as LoginResponse).name}`);
    console.log(`   Role: ${(meData as LoginResponse).role}`);

    // Test 3: Test invalid login
    console.log("\nTest 3: Login with invalid credentials");
    
    const invalidResponse = await fetch(`${API_URL}/api/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: ADMIN_EMAIL,
        password: "wrongpassword",
      }),
    });

    const invalidData = await invalidResponse.json();

    if (invalidResponse.status === 401) {
      console.log("✅ Invalid login correctly rejected");
      console.log(`   Error: ${(invalidData as ErrorResponse).error}`);
    } else {
      console.log(`❌ Invalid login should return 401, got ${invalidResponse.status}`);
      return false;
    }

    // Test 4: Test logout
    console.log("\nTest 4: Logout");
    
    const logoutResponse = await fetch(`${API_URL}/api/auth/logout`, {
      method: "POST",
      headers: {
        Cookie: setCookie,
      },
    });

    if (logoutResponse.ok) {
      console.log("✅ Logout successful");
    } else {
      console.log(`⚠️  Logout returned ${logoutResponse.status}`);
    }

    console.log("\n================================");
    console.log("✅ All login tests passed!");
    console.log("================================\n");

    return true;

  } catch (error) {
    console.log(`\n❌ Test failed with error: ${error}`);
    
    if (error instanceof Error && error.message.includes("fetch")) {
      console.log("\n💡 Tip: Make sure the API server is running at", API_URL);
      console.log("   Start it with: pnpm --filter @workspace/api-server dev");
    }
    
    return false;
  }
}

testLogin().then((success) => {
  process.exit(success ? 0 : 1);
});
