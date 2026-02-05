import { storage } from "./storage";
import * as dotenv from "dotenv";

dotenv.config();

async function createAdmin() {
  try {
    // Create admin user with default credentials
    const admin = await storage.createUser({
      username: "admin",
      password: "VapeCave2024!",
      isAdmin: true
    });
    
    console.log("Admin user created successfully!");
    console.log("Username: admin");
    console.log("Password: VapeCave2024!");
    console.log("\nPlease change this password after your first login.");
    
    process.exit(0);
  } catch (error) {
    console.error("Error creating admin user:", error);
    process.exit(1);
  }
}

createAdmin();
