import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "../shared/schema";
import * as dotenv from "dotenv";

dotenv.config();

const OLD_DB_URL = process.env.OLD_DATABASE_URL;
const NEW_DB_URL = process.env.DATABASE_URL;

if (!OLD_DB_URL || !NEW_DB_URL) {
  console.error("❌ Missing database URLs. Make sure OLD_DATABASE_URL and DATABASE_URL are set in secrets.");
  process.exit(1);
}

console.log("🔄 Starting database migration...\n");

const oldClient = postgres(OLD_DB_URL);
const newClient = postgres(NEW_DB_URL);

const oldDb = drizzle(oldClient, { schema });
const newDb = drizzle(newClient, { schema });

async function migrateTable(tableName: string, table: any) {
  try {
    console.log(`📦 Migrating ${tableName}...`);
    
    // Read all data from old database
    const data = await oldDb.select().from(table);
    
    if (data.length === 0) {
      console.log(`   ⚠️  No data found in ${tableName}`);
      return;
    }
    
    // Insert into new database in batches to avoid parameter limits
    const BATCH_SIZE = 100;
    let migrated = 0;
    
    for (let i = 0; i < data.length; i += BATCH_SIZE) {
      const batch = data.slice(i, i + BATCH_SIZE);
      await newDb.insert(table).values(batch);
      migrated += batch.length;
    }
    
    console.log(`   ✅ Migrated ${migrated} records from ${tableName}`);
  } catch (error: any) {
    console.error(`   ❌ Error migrating ${tableName}:`, error.message);
    throw error;
  }
}

async function clearNewDatabase() {
  console.log("🗑️  Clearing new database...\n");
  
  try {
    // Delete in reverse order to respect foreign key constraints
    await newDb.delete(schema.deliveryOrderItems);
    await newDb.delete(schema.deliveryOrders);
    await newDb.delete(schema.cartItems);
    await newDb.delete(schema.deliveryProducts);
    await newDb.delete(schema.heroSlides);
    await newDb.delete(schema.siteSettings);
    await newDb.delete(schema.weeklyDeliveryTemplates);
    await newDb.delete(schema.deliveryWindows);
    await newDb.delete(schema.deliveryCustomers);
    await newDb.delete(schema.newsletterSubscriptions);
    await newDb.delete(schema.blogPosts);
    await newDb.delete(schema.products);
    await newDb.delete(schema.productCategories);
    await newDb.delete(schema.storeLocations);
    await newDb.delete(schema.brands);
    await newDb.delete(schema.brandCategories);
    await newDb.delete(schema.users);
    await newDb.delete(schema.settings);
    await newDb.delete(schema.cloverOAuthTokens);
    
    console.log("   ✅ New database cleared\n");
  } catch (error: any) {
    console.error("   ❌ Error clearing database:", error.message);
    throw error;
  }
}

async function migrate() {
  try {
    // Clear the new database first
    await clearNewDatabase();
    
    // Migrate in order to respect foreign key relationships
    
    // Step 1: Users (no dependencies)
    await migrateTable("users", schema.users);
    
    // Step 2: Brand Categories (no dependencies)
    await migrateTable("brand_categories", schema.brandCategories);
    
    // Step 3: Brands (depends on brand_categories)
    await migrateTable("brands", schema.brands);
    
    // Step 4: Store Locations (no dependencies)
    await migrateTable("store_locations", schema.storeLocations);
    
    // Step 5: Product Categories (no dependencies)
    await migrateTable("product_categories", schema.productCategories);
    
    // Step 6: Products (depends on product_categories)
    await migrateTable("products", schema.products);
    
    // Step 7: Blog Posts (no dependencies)
    await migrateTable("blog_posts", schema.blogPosts);
    
    // Step 8: Newsletter Subscriptions (no dependencies)
    await migrateTable("newsletter_subscriptions", schema.newsletterSubscriptions);
    
    // Step 9: Delivery Customers (no dependencies)
    await migrateTable("delivery_customers", schema.deliveryCustomers);
    
    // Step 10: Delivery Windows (no dependencies)
    await migrateTable("delivery_windows", schema.deliveryWindows);
    
    // Step 11: Weekly Delivery Templates (no dependencies)
    await migrateTable("weekly_delivery_templates", schema.weeklyDeliveryTemplates);
    
    // Step 12: Site Settings (no dependencies)
    await migrateTable("site_settings", schema.siteSettings);
    
    // Step 13: Hero Slides (no dependencies)
    await migrateTable("hero_slides", schema.heroSlides);
    
    // Step 14: Delivery Products (no dependencies)
    await migrateTable("delivery_products", schema.deliveryProducts);
    
    // Step 15: Cart Items (depends on delivery_customers and delivery_products)
    await migrateTable("cart_items", schema.cartItems);
    
    // Step 16: Delivery Orders (depends on delivery_customers and delivery_windows)
    await migrateTable("delivery_orders", schema.deliveryOrders);
    
    // Step 17: Delivery Order Items (depends on delivery_orders and delivery_products)
    await migrateTable("delivery_order_items", schema.deliveryOrderItems);
    
    // Step 18: Settings (no dependencies)
    await migrateTable("settings", schema.settings);
    
    // Step 19: Clover OAuth Tokens (no dependencies)
    await migrateTable("clover_oauth_tokens", schema.cloverOAuthTokens);
    
    console.log("\n✨ Migration completed successfully!");
    
    // Show summary
    console.log("\n📊 Migration Summary:");
    const userCount = await newDb.select().from(schema.users);
    const customerCount = await newDb.select().from(schema.deliveryCustomers);
    const productCount = await newDb.select().from(schema.deliveryProducts);
    const orderCount = await newDb.select().from(schema.deliveryOrders);
    
    console.log(`   👥 Admin Users: ${userCount.length}`);
    console.log(`   🛒 Delivery Customers: ${customerCount.length}`);
    console.log(`   📦 Delivery Products: ${productCount.length}`);
    console.log(`   📋 Orders: ${orderCount.length}`);
    
  } catch (error) {
    console.error("\n❌ Migration failed:", error);
    throw error;
  } finally {
    await oldClient.end();
    await newClient.end();
  }
}

migrate()
  .then(() => {
    console.log("\n🎉 You can now log in with your admin credentials from the old site!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n💥 Migration error:", error);
    process.exit(1);
  });
