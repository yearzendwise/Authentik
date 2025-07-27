import { config } from "dotenv";
config(); // Load environment variables

import { db } from "./server/db";
import { users, tenants } from "./shared/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

async function createTestUser() {
  try {
    console.log("🔧 Creating test user...");

    // First, get the default tenant
    const [defaultTenant] = await db
      .select()
      .from(tenants)
      .where(eq(tenants.slug, "default"))
      .limit(1);

    if (!defaultTenant) {
      console.error("❌ Default tenant not found");
      return;
    }

    console.log("📝 Found default tenant:", defaultTenant.id);

    // Hash the password
    const hashedPassword = await bcrypt.hash("TestPass123", 12);

    // Create the test user
    const [user] = await db
      .insert(users)
      .values({
        tenantId: defaultTenant.id,
        email: "testuser@example.com",
        password: hashedPassword,
        firstName: "Test",
        lastName: "User",
        role: "Employee",
        emailVerified: true,
        isActive: true,
      })
      .returning();

    if (user) {
      console.log("✅ Successfully created test user:");
      console.log("📊 User details:", {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        tenantId: user.tenantId,
        emailVerified: user.emailVerified
      });
      console.log("🔑 Password: TestPass123");
    } else {
      console.error("❌ Failed to create test user");
    }

  } catch (error) {
    console.error("❌ Error creating test user:", error);
    throw error;
  }
}

// Run the creation if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  createTestUser()
    .then(() => {
      console.log("✅ Test user creation completed");
      process.exit(0);
    })
    .catch((error) => {
      console.error("❌ Test user creation failed:", error);
      process.exit(1);
    });
}

export { createTestUser };