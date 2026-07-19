/**
 * Script to approve all pending users
 * Run with: pnpm --filter scripts exec tsx src/approve-all-users.ts
 */

import { ConvexHttpClient } from "convex/browser";
import { api } from "../../convex/_generated/api";

const CONVEX_URL = process.env.CONVEX_URL || process.env.CONVEX_DEPLOYMENT_URL;

if (!CONVEX_URL) {
  console.error("❌ Error: CONVEX_URL environment variable is not set");
  console.error("Please set it in your .env.local file");
  process.exit(1);
}

const client = new ConvexHttpClient(CONVEX_URL);

async function approveAllUsers() {
  console.log("🔍 Fetching all users...\n");

  try {
    // Get all users
    const users = await client.query(api.users.listAll) as any[];

    console.log(`Found ${users.length} users:\n`);

    for (const user of users) {
      console.log(`📧 ${user.email}`);
      console.log(`   Role: ${user.role}`);
      console.log(`   Approved: ${user.approved ? '✅' : '❌'}`);
      console.log(`   Name: ${user.name}`);

      if (!user.approved) {
        console.log(`   ⏳ Approving user...`);
        
        try {
          await client.mutation(api.users.approveUser, {
            userId: user._id,
          });
          console.log(`   ✅ User approved!\n`);
        } catch (error) {
          console.log(`   ❌ Failed to approve: ${error}\n`);
        }
      } else {
        console.log(`   Already approved\n`);
      }
    }

    console.log("✅ All users processed!");
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
}

approveAllUsers();
