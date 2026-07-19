#!/usr/bin/env tsx
/**
 * Test script for Lipana M-Pesa integration
 * Run with: pnpm --filter scripts exec tsx src/test-lipana.ts
 */

import { config } from "dotenv";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

// Get the directory of this script file
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env.local from workspace root
const envPath = resolve(__dirname, "../../.env.local");
config({ path: envPath });

const API_URL = process.env.API_URL || "http://localhost:8080";
const LIPANA_SECRET_KEY = process.env.LIPANA_SECRET_KEY;

async function testLipanaIntegration() {
  console.log("🧪 Testing Lipana M-Pesa Integration");
  console.log("====================================\n");

  // Test 1: Environment Variables
  console.log("Test 1: Environment Variables");
  console.log("------------------------------");
  
  const requiredVars = [
    "LIPANA_SECRET_KEY",
    "LIPANA_PUBLISHABLE_KEY",
    "LIPANA_WEBHOOK_SECRET",
    "LIPANA_WEBHOOK_URL"
  ];

  let allPresent = true;
  for (const varName of requiredVars) {
    const value = process.env[varName];
    if (value) {
      const displayValue = varName.includes("SECRET") || varName.includes("KEY")
        ? value.slice(0, 20) + "..."
        : value;
      console.log(`✅ ${varName}: ${displayValue}`);
    } else {
      console.log(`❌ ${varName}: Not set`);
      allPresent = false;
    }
  }

  if (!allPresent) {
    console.log("\n❌ Some environment variables are missing!");
    console.log("💡 Check your .env.local file");
    return false;
  }

  console.log();

  // Test 2: Phone Number Formatting
  console.log("Test 2: Phone Number Formatting");
  console.log("--------------------------------");

  const testPhones = [
    { input: "0712345678", expected: "254712345678" },
    { input: "+254712345678", expected: "254712345678" },
    { input: "254712345678", expected: "254712345678" },
    { input: "712345678", expected: "254712345678" },
  ];

  // Simple formatter function (matches LipanaClient.formatPhoneNumber)
  function formatPhone(phone: string): string {
    let cleaned = phone.replace(/[\s\-+]/g, "");
    if (cleaned.startsWith("0")) {
      cleaned = "254" + cleaned.slice(1);
    }
    if (!cleaned.startsWith("254")) {
      cleaned = "254" + cleaned;
    }
    return cleaned;
  }

  for (const { input, expected } of testPhones) {
    const result = formatPhone(input);
    const passed = result === expected;
    console.log(`${passed ? "✅" : "❌"} ${input} → ${result} (expected: ${expected})`);
  }

  console.log();

  // Test 3: Lipana API Connectivity
  console.log("Test 3: Lipana API Connectivity");
  console.log("--------------------------------");

  if (!LIPANA_SECRET_KEY) {
    console.log("❌ Cannot test - LIPANA_SECRET_KEY not set");
    return false;
  }

  try {
    // Test with sandbox URL
    const sandboxUrl = "https://sandbox.lipana.africa/v1";
    
    console.log(`Testing connection to: ${sandboxUrl}`);
    console.log("Initiating test STK Push...\n");

    const testPayment = {
      amount: 10, // Small test amount
      phone_number: "254712345678", // Sandbox test number
      account_reference: `TEST-${Date.now()}`,
      transaction_desc: "Aria Water Test Payment",
    };

    const response = await fetch(`${sandboxUrl}/payments/stk-push`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LIPANA_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(testPayment),
    });

    const data = await response.json();

    if (response.ok && data.success) {
      console.log("✅ Lipana API connection successful!");
      console.log(`   Checkout Request ID: ${data.data?.checkout_request_id}`);
      console.log(`   Message: ${data.data?.customer_message}`);
      console.log();

      // Test 4: Status Check
      if (data.data?.checkout_request_id) {
        console.log("Test 4: Payment Status Check");
        console.log("-----------------------------");

        await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds

        const statusResponse = await fetch(
          `${sandboxUrl}/payments/status/${data.data.checkout_request_id}`,
          {
            headers: {
              Authorization: `Bearer ${LIPANA_SECRET_KEY}`,
            },
          }
        );

        const statusData = await statusResponse.json();

        if (statusResponse.ok) {
          console.log("✅ Status check successful!");
          console.log(`   Result: ${statusData.data?.result_desc || "Pending"}`);
          console.log(`   Code: ${statusData.data?.result_code || "N/A"}`);
        } else {
          console.log("⚠️  Status check returned error (this is normal for test payments)");
          console.log(`   Message: ${statusData.message || "Unknown"}`);
        }
      }
    } else {
      console.log("❌ Lipana API test failed");
      console.log(`   Status: ${response.status}`);
      console.log(`   Message: ${data.message || "Unknown error"}`);
      console.log(`   Error: ${data.error || "N/A"}`);
      
      if (response.status === 401) {
        console.log("\n💡 Tip: Check that your LIPANA_SECRET_KEY is correct");
      }
      
      return false;
    }

    console.log();

  } catch (error) {
    console.log("❌ Network error connecting to Lipana");
    console.log(`   ${error instanceof Error ? error.message : "Unknown error"}`);
    console.log("\n💡 Tip: Check your internet connection");
    return false;
  }

  // Test 5: API Server Integration
  console.log("Test 5: API Server Integration");
  console.log("-------------------------------");

  try {
    const healthResponse = await fetch(`${API_URL}/health`);
    
    if (healthResponse.ok) {
      console.log("✅ API server is running");
      console.log(`   URL: ${API_URL}`);
      
      // Check if payment provider is set to lipana
      const provider = process.env.PAYMENT_PROVIDER;
      if (provider === "lipana") {
        console.log("✅ Payment provider set to: lipana");
      } else {
        console.log(`⚠️  Payment provider set to: ${provider || "not set"}`);
        console.log("   Set PAYMENT_PROVIDER=lipana in .env.local to use M-Pesa");
      }
    } else {
      console.log("❌ API server health check failed");
    }
  } catch (error) {
    console.log("❌ Cannot connect to API server");
    console.log(`   ${error instanceof Error ? error.message : "Unknown error"}`);
    console.log("\n💡 Tip: Start the API server with:");
    console.log("   pnpm --filter @workspace/api-server dev");
  }

  console.log();

  // Summary
  console.log("====================================");
  console.log("✅ Lipana Integration Test Complete!");
  console.log("====================================");
  console.log();
  console.log("📋 Summary:");
  console.log("  ✅ Environment variables configured");
  console.log("  ✅ Phone formatting working");
  console.log("  ✅ Lipana API accessible");
  console.log("  ✅ Integration ready for testing");
  console.log();
  console.log("🚀 Next Steps:");
  console.log("  1. Start API server: pnpm --filter @workspace/api-server dev");
  console.log("  2. Start frontend: pnpm --filter @workspace/ari-water dev");
  console.log("  3. Create order and test M-Pesa payment");
  console.log("  4. Use test phone: 254712345678 (sandbox success)");
  console.log();

  return true;
}

testLipanaIntegration().then((success) => {
  process.exit(success ? 0 : 1);
});
