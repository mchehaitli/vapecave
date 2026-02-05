import { db } from "./storage";
import { users } from "@shared/schema";
import { eq } from "drizzle-orm";
import * as bcrypt from "bcryptjs";
import * as dotenv from "dotenv";
import pg from "pg";
import { drizzle } from "drizzle-orm/node-postgres";

dotenv.config();

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
});

const database = drizzle(pool);

async function resetAdminPassword() {
  try {
    const newPassword = "VapeCave2024!";
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    const result = await database
      .update(users)
      .set({ password: hashedPassword })
      .where(eq(users.username, "admin"))
      .returning();
    
    if (result.length > 0) {
      console.log("✓ Admin password reset successfully!");
      console.log("\nLogin Credentials:");
      console.log("==================");
      console.log("Username: admin");
      console.log("Password: VapeCave2024!");
      console.log("\nYou can now log in at: /admin/login");
      console.log("\nPlease change this password after your first login.");
    } else {
      console.log("No admin user found to update.");
    }
    
    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error("Error resetting admin password:", error);
    process.exit(1);
  }
}

resetAdminPassword();
