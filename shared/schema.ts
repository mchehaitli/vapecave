import { pgTable, text, serial, integer, boolean, varchar, timestamp, json, numeric } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User authentication table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  isAdmin: boolean("is_admin").default(false).notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  isAdmin: true,
});

// Brand categories table
export const brandCategories = pgTable("brand_categories", {
  id: serial("id").primaryKey(),
  category: text("category").notNull(),
  bgClass: text("bg_class").default("bg-gradient-to-br from-gray-900 to-gray-800"),
  displayOrder: integer("display_order").default(0),
  intervalMs: integer("interval_ms").default(5000),
});

export const insertBrandCategorySchema = createInsertSchema(brandCategories).pick({
  category: true,
  bgClass: true,
  displayOrder: true,
  intervalMs: true,
});

// Brands table
export const brands = pgTable("brands", {
  id: serial("id").primaryKey(),
  categoryId: integer("category_id").notNull(),
  name: text("name").notNull(),
  image: text("image").notNull(),
  description: text("description").notNull(),
  displayOrder: integer("display_order").default(0),
  // Note: imageSize field is handled in memory only
});

// Add imageSize to the insert schema even though it's not in the database
// We'll handle it in memory in the storage implementation
export const insertBrandSchema = createInsertSchema(brands)
  .pick({
    categoryId: true,
    name: true,
    image: true,
    description: true,
    displayOrder: true,
  })
  .extend({
    imageSize: z.string().optional(),
  });

// Define session table
export const sessions = pgTable("sessions", {
  sid: varchar("sid", { length: 255 }).primaryKey(),
  sess: text("sess").notNull(),
  expire: timestamp("expire").notNull(),
});

// Type exports
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertBrandCategory = z.infer<typeof insertBrandCategorySchema>;
export type BrandCategory = typeof brandCategories.$inferSelect;

export type InsertBrand = z.infer<typeof insertBrandSchema>;
// Extend the Brand type to include imageSize which is handled in memory
export type Brand = typeof brands.$inferSelect & {
  imageSize?: string;
};

// Blog posts table
export const blogPosts = pgTable("blog_posts", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  slug: text("slug").notNull().unique(),
  summary: text("summary").notNull(),
  content: text("content").notNull(),
  featured_image: text("featured_image").default(""),
  is_published: boolean("is_published").default(true),
  is_featured: boolean("is_featured").default(false),
  meta_title: text("meta_title").default(""),
  meta_description: text("meta_description").default(""),
  jsonld_schema: text("jsonld_schema").default(""),
  view_count: integer("view_count").default(0),
  created_at: timestamp("created_at").notNull().defaultNow(),
  updated_at: timestamp("updated_at").notNull().defaultNow(),
});

export const insertBlogPostSchema = createInsertSchema(blogPosts).pick({
  title: true,
  slug: true,
  summary: true,
  content: true,
  featured_image: true,
  is_published: true,
  is_featured: true,
  meta_title: true,
  meta_description: true,
  jsonld_schema: true,
});

export type InsertBlogPost = z.infer<typeof insertBlogPostSchema>;
export type BlogPost = typeof blogPosts.$inferSelect;

// Store locations table
export const storeLocations = pgTable("store_locations", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  city: text("city").notNull(),
  address: text("address").notNull(),
  full_address: text("full_address").notNull(),
  phone: text("phone").notNull(),
  hours: text("hours").notNull(),
  closed_days: text("closed_days").default(""),
  image: text("image").notNull(),
  lat: text("lat").notNull(),
  lng: text("lng").notNull(),
  google_place_id: text("google_place_id").default(""),
  apple_maps_link: text("apple_maps_link").default(""),
  map_embed: text("map_embed").notNull(),
  email: text("email").default(""),
  store_code: text("store_code").default(""),
  opening_hours: json("opening_hours").notNull().$type<Record<string, string>>(),
  services: json("services").notNull().$type<string[]>(),
  accepted_payments: json("accepted_payments").notNull().$type<string[]>(),
  area_served: json("area_served").notNull().$type<string[]>(),
  public_transit: text("public_transit").default(""),
  parking: text("parking").default(""),
  year_established: integer("year_established").notNull(),
  price_range: text("price_range").notNull(),
  social_profiles: json("social_profiles").$type<{
    facebook?: string;
    instagram?: string;
    twitter?: string;
    yelp?: string;
  }>(),
  description: text("description").notNull(),
  neighborhood_info: text("neighborhood_info").default(""),
  amenities: json("amenities").notNull().$type<string[]>(),
  created_at: timestamp("created_at").notNull().defaultNow(),
  updated_at: timestamp("updated_at").notNull().defaultNow(),
});

export const insertStoreLocationSchema = createInsertSchema(storeLocations)
  .pick({
    name: true,
    city: true,
    address: true,
    full_address: true,
    phone: true,
    hours: true,
    closed_days: true,
    image: true,
    lat: true,
    lng: true,
    google_place_id: true,
    apple_maps_link: true,
    map_embed: true,
    email: true,
    store_code: true,
    opening_hours: true,
    services: true,
    accepted_payments: true,
    area_served: true,
    public_transit: true,
    parking: true,
    year_established: true,
    price_range: true,
    social_profiles: true,
    description: true,
    neighborhood_info: true,
    amenities: true,
  });

export type InsertStoreLocation = z.infer<typeof insertStoreLocationSchema>;
export type StoreLocation = typeof storeLocations.$inferSelect;

// Product categories table
export const productCategories = pgTable("product_categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description").default(""),
  display_order: integer("display_order").default(0),
  created_at: timestamp("created_at").notNull().defaultNow(),
  updated_at: timestamp("updated_at").notNull().defaultNow(),
});

export const insertProductCategorySchema = createInsertSchema(productCategories).pick({
  name: true,
  slug: true,
  description: true,
  display_order: true,
});

export type InsertProductCategory = z.infer<typeof insertProductCategorySchema>;
export type ProductCategory = typeof productCategories.$inferSelect;

// Products table
export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  price: text("price"), // Now optional
  hidePrice: boolean("hide_price").default(false), // Option to hide the price on the customer UI
  image: text("image").notNull(),
  category: text("category").notNull(), // This is the slug of the category for backward compatibility
  categoryId: integer("category_id"), // New field to link to product_categories table
  featured: boolean("featured").default(false),
  featuredLabel: text("featured_label").default(""),
  stock: integer("stock").default(0),
  created_at: timestamp("created_at").notNull().defaultNow(),
  updated_at: timestamp("updated_at").notNull().defaultNow(),
});

export const insertProductSchema = createInsertSchema(products)
  .pick({
    name: true,
    description: true,
    image: true,
    category: true,
    featured: true,
    featuredLabel: true,
    stock: true,
    hidePrice: true, // Add hidePrice field
  })
  .extend({
    price: z.string().optional(), // Make price optional in the schema
    categoryId: z.number().optional(), // Make categoryId available for form handling
  });

export type InsertProduct = z.infer<typeof insertProductSchema>;
export type Product = typeof products.$inferSelect;

// Newsletter Subscriptions table
export const newsletterSubscriptions = pgTable("newsletter_subscriptions", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  subscribed_at: timestamp("subscribed_at").notNull().defaultNow(),
  is_active: boolean("is_active").default(true).notNull(),
  source: text("source").default("website"),
  ip_address: text("ip_address").default(""),
  last_updated: timestamp("last_updated").notNull().defaultNow(),
});

export const insertNewsletterSubscriptionSchema = createInsertSchema(newsletterSubscriptions).pick({
  email: true,
  source: true,
  ip_address: true,
});

export type InsertNewsletterSubscription = z.infer<typeof insertNewsletterSubscriptionSchema>;
export type NewsletterSubscription = typeof newsletterSubscriptions.$inferSelect;

// Delivery Customers table (with email/password authentication and approval workflow)
export const deliveryCustomers = pgTable("delivery_customers", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash"), // Bcrypt hashed password (nullable until set)
  fullName: text("full_name").notNull(),
  phone: text("phone").notNull(),
  address: text("address").notNull(),
  city: text("city").notNull(),
  state: text("state").notNull(),
  zipCode: text("zip_code").notNull(),
  lat: numeric("lat").notNull(),
  lng: numeric("lng").notNull(),
  photoIdUrl: text("photo_id_url").notNull(),
  approvalStatus: text("approval_status").notNull().default("pending"), // pending, approved, rejected
  approvedBy: integer("approved_by"), // admin user id
  approvedAt: timestamp("approved_at"),
  rejectionReason: text("rejection_reason"),
  passwordSetupToken: text("password_setup_token"), // One-time token for setting password after approval
  passwordSetupTokenExpiry: timestamp("password_setup_token_expiry"), // Expiry time for setup token (48 hours)
  passwordResetToken: text("password_reset_token"), // Token for password reset
  passwordResetExpiry: timestamp("password_reset_expiry"), // Expiry time for reset token
  mustChangePassword: boolean("must_change_password").default(false), // Flag to force password change on next login
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertDeliveryCustomerSchema = createInsertSchema(deliveryCustomers).pick({
  email: true,
  passwordHash: true,
  fullName: true,
  phone: true,
  address: true,
  city: true,
  state: true,
  zipCode: true,
  lat: true,
  lng: true,
  photoIdUrl: true,
});

// Schema for signup request (backend will hash the password)
export const deliverySignupSchema = z.object({
  email: z.string().email(),
  fullName: z.string().min(1),
  phone: z.string().min(1),
  address: z.string().min(1),
  city: z.string().min(1),
  state: z.string().min(1),
  zipCode: z.string().min(1),
  lat: z.string(),
  lng: z.string(),
  photoIdBase64: z.string(), // Base64 encoded photo
});

export type InsertDeliveryCustomer = z.infer<typeof insertDeliveryCustomerSchema>;
export type DeliveryCustomer = typeof deliveryCustomers.$inferSelect;

// Delivery Windows table
export const deliveryWindows = pgTable("delivery_windows", {
  id: serial("id").primaryKey(),
  date: text("date").notNull(), // YYYY-MM-DD format
  startTime: text("start_time").notNull(), // HH:MM format
  endTime: text("end_time").notNull(), // HH:MM format
  capacity: integer("capacity").notNull().default(10),
  currentBookings: integer("current_bookings").notNull().default(0),
  enabled: boolean("enabled").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertDeliveryWindowSchema = createInsertSchema(deliveryWindows).pick({
  date: true,
  startTime: true,
  endTime: true,
  capacity: true,
  enabled: true,
});

export type InsertDeliveryWindow = z.infer<typeof insertDeliveryWindowSchema>;
export type DeliveryWindow = typeof deliveryWindows.$inferSelect;

// Weekly Delivery Window Templates (for recurring schedules)
export const weeklyDeliveryTemplates = pgTable("weekly_delivery_templates", {
  id: serial("id").primaryKey(),
  dayOfWeek: integer("day_of_week").notNull(), // 0=Sunday, 1=Monday, ..., 6=Saturday
  startTime: text("start_time").notNull(), // HH:MM format
  endTime: text("end_time").notNull(), // HH:MM format
  capacity: integer("capacity").notNull().default(10),
  enabled: boolean("enabled").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertWeeklyDeliveryTemplateSchema = createInsertSchema(weeklyDeliveryTemplates).pick({
  dayOfWeek: true,
  startTime: true,
  endTime: true,
  capacity: true,
  enabled: true,
});

export type InsertWeeklyDeliveryTemplate = z.infer<typeof insertWeeklyDeliveryTemplateSchema>;
export type WeeklyDeliveryTemplate = typeof weeklyDeliveryTemplates.$inferSelect;

// Site Settings table for admin-editable global settings (concept1)
export const siteSettings = pgTable("site_settings", {
  id: serial("id").primaryKey(),
  infoBarMessage: text("info_bar_message").default("Free delivery on orders over $100!"),
  infoBarEnabled: boolean("info_bar_enabled").default(true),
  freeDeliveryThreshold: numeric("free_delivery_threshold", { precision: 10, scale: 2 }).default("100"),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertSiteSettingsSchema = createInsertSchema(siteSettings).pick({
  infoBarMessage: true,
  infoBarEnabled: true,
  freeDeliveryThreshold: true,
});

export type InsertSiteSettings = z.infer<typeof insertSiteSettingsSchema>;
export type SiteSettings = typeof siteSettings.$inferSelect;

// Hero Carousel Slides table (concept1) - supports video and image
export const heroSlides = pgTable("hero_slides", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  subtitle: text("subtitle"),
  mediaType: text("media_type").notNull().default("image"), // 'image' or 'video'
  mediaUrl: text("media_url").notNull(), // URL to image or video
  image: text("image"), // Deprecated - use mediaUrl instead
  buttonText: text("button_text"),
  buttonLink: text("button_link"),
  displayOrder: integer("display_order").default(0),
  enabled: boolean("enabled").default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertHeroSlideSchema = createInsertSchema(heroSlides).pick({
  title: true,
  subtitle: true,
  mediaType: true,
  mediaUrl: true,
  image: true,
  buttonText: true,
  buttonLink: true,
  displayOrder: true,
  enabled: true,
}).extend({
  image: z.string().optional().nullable(),
});

export type InsertHeroSlide = z.infer<typeof insertHeroSlideSchema>;
export type HeroSlide = typeof heroSlides.$inferSelect;

// Delivery Categories for customer UI navigation
export const deliveryCategories = pgTable("delivery_categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  image: text("image"), // Category image for display
  displayOrder: integer("display_order").default(0),
  isActive: boolean("is_active").default(true),
  featuredProductIds: json("featured_product_ids").$type<number[]>().default([]), // Featured products for carousel
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertDeliveryCategorySchema = createInsertSchema(deliveryCategories).pick({
  name: true,
  slug: true,
  image: true,
  displayOrder: true,
  isActive: true,
  featuredProductIds: true,
}).extend({
  image: z.string().optional().nullable(),
  featuredProductIds: z.array(z.number()).optional().nullable(),
});

export type InsertDeliveryCategory = z.infer<typeof insertDeliveryCategorySchema>;
export type DeliveryCategory = typeof deliveryCategories.$inferSelect;

// Delivery Brands - brands within categories
export const deliveryBrands = pgTable("delivery_brands", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  categoryId: integer("category_id").notNull(), // Links to deliveryCategories
  logo: text("logo"), // Brand logo image
  displayOrder: integer("display_order").default(0),
  isActive: boolean("is_active").default(true),
  featuredProductIds: json("featured_product_ids").$type<number[]>().default([]), // Featured products for carousel
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertDeliveryBrandSchema = createInsertSchema(deliveryBrands).pick({
  name: true,
  slug: true,
  categoryId: true,
  logo: true,
  displayOrder: true,
  isActive: true,
  featuredProductIds: true,
}).extend({
  logo: z.string().optional().nullable(),
  featuredProductIds: z.array(z.number()).optional().nullable(),
});

export type InsertDeliveryBrand = z.infer<typeof insertDeliveryBrandSchema>;
export type DeliveryBrand = typeof deliveryBrands.$inferSelect;

// Category Banners table - featured banners on delivery home page
export const categoryBanners = pgTable("category_banners", {
  id: serial("id").primaryKey(),
  categoryId: integer("category_id").notNull(), // Links to deliveryCategories
  title: text("title"), // Optional
  subtitle: text("subtitle"), // Optional
  image: text("image").notNull(), // Required - banner image URL
  buttonText: text("button_text").default("Shop Now"), // Optional, default "Shop Now"
  buttonLink: text("button_link"), // Optional
  displayOrder: integer("display_order").default(0),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertCategoryBannerSchema = createInsertSchema(categoryBanners).pick({
  categoryId: true,
  title: true,
  subtitle: true,
  image: true,
  buttonText: true,
  buttonLink: true,
  displayOrder: true,
  isActive: true,
}).extend({
  title: z.string().optional().nullable(),
  subtitle: z.string().optional().nullable(),
  buttonLink: z.string().optional().nullable(),
});

export type InsertCategoryBanner = z.infer<typeof insertCategoryBannerSchema>;
export type CategoryBanner = typeof categoryBanners.$inferSelect;

// Delivery Product Lines table - subcategories within brands (e.g., GeekBar has Meloso Mini, Pulse, Pulse X)
export const deliveryProductLines = pgTable("delivery_product_lines", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  brandId: integer("brand_id").notNull(), // Links to deliveryBrands
  logo: text("logo"), // Product line logo/image
  displayOrder: integer("display_order").default(0),
  isActive: boolean("is_active").default(true),
  featuredProductIds: json("featured_product_ids").$type<number[]>().default([]), // Featured products for carousel
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertDeliveryProductLineSchema = createInsertSchema(deliveryProductLines).pick({
  name: true,
  slug: true,
  brandId: true,
  logo: true,
  displayOrder: true,
  isActive: true,
  featuredProductIds: true,
}).extend({
  logo: z.string().optional().nullable(),
  featuredProductIds: z.array(z.number()).optional().nullable(),
});

export type InsertDeliveryProductLine = z.infer<typeof insertDeliveryProductLineSchema>;
export type DeliveryProductLine = typeof deliveryProductLines.$inferSelect;

// Delivery Products table (concept1 enhanced with multiple images, sale price)
export const deliveryProducts = pgTable("delivery_products", {
  id: serial("id").primaryKey(),
  cloverItemId: text("clover_item_id").unique(), // Nullable for manual products
  name: text("name").notNull(),
  brand: text("brand"), // Concept1: brand filter support (legacy text field)
  brandId: integer("brand_id"), // Links to deliveryBrands table
  productLineId: integer("product_line_id"), // Links to deliveryProductLines table (subcategory within brand)
  price: numeric("price", { precision: 10, scale: 2 }).notNull(),
  salePrice: numeric("sale_price", { precision: 10, scale: 2 }), // Concept1: sale pricing
  image: text("image"), // Primary image
  images: json("images").$type<string[]>().default([]), // Concept1: multiple product images
  description: text("description"),
  category: text("category"),
  badge: text("badge"), // popular, new, sale, or null (concept1)
  displayOrder: integer("display_order").default(0),
  isFeaturedSlideshow: boolean("is_featured_slideshow").default(false),
  slideshowPosition: integer("slideshow_position").default(0),
  showOnHomePage: boolean("show_on_home_page").default(false),
  homePageOrder: integer("home_page_order").default(0),
  stockQuantity: numeric("stock_quantity").default("0"),
  enabled: boolean("enabled").default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertDeliveryProductSchema = createInsertSchema(deliveryProducts).pick({
  cloverItemId: true,
  name: true,
  brand: true,
  brandId: true,
  productLineId: true,
  price: true,
  salePrice: true,
  image: true,
  images: true,
  description: true,
  category: true,
  badge: true,
  displayOrder: true,
  isFeaturedSlideshow: true,
  slideshowPosition: true,
  showOnHomePage: true,
  homePageOrder: true,
  stockQuantity: true,
  enabled: true,
}).extend({
  cloverItemId: z.string().optional().nullable(), // Optional for manual products
  brand: z.string().optional().nullable(), // Optional for manual products
  brandId: z.number().optional().nullable(), // Links to deliveryBrands
  productLineId: z.number().optional().nullable(), // Links to deliveryProductLines
  salePrice: z.string().optional().nullable(), // Optional for sale pricing
  image: z.string().optional().nullable(), // Optional for manual products
  images: z.array(z.string()).optional().nullable(), // Optional, can be null
  description: z.string().optional().nullable(), // Optional
  category: z.string().optional().nullable(), // Optional
  badge: z.string().optional().nullable(), // Optional
});

export type InsertDeliveryProduct = z.infer<typeof insertDeliveryProductSchema>;
export type DeliveryProduct = typeof deliveryProducts.$inferSelect;

// Cart Items table
export const cartItems = pgTable("cart_items", {
  id: serial("id").primaryKey(),
  customerId: integer("customer_id").notNull(),
  productId: integer("product_id").notNull(),
  quantity: integer("quantity").notNull().default(1),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertCartItemSchema = createInsertSchema(cartItems).pick({
  customerId: true,
  productId: true,
  quantity: true,
});

export type InsertCartItem = z.infer<typeof insertCartItemSchema>;
export type CartItem = typeof cartItems.$inferSelect;

// Cart reminder tracking table
export const cartReminders = pgTable("cart_reminders", {
  id: serial("id").primaryKey(),
  customerId: integer("customer_id").notNull().unique(),
  lastReminderSent: timestamp("last_reminder_sent"),
  reminderCount: integer("reminder_count").notNull().default(0),
  cartLastUpdated: timestamp("cart_last_updated"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertCartReminderSchema = createInsertSchema(cartReminders).pick({
  customerId: true,
  lastReminderSent: true,
  reminderCount: true,
  cartLastUpdated: true,
});

export type InsertCartReminder = z.infer<typeof insertCartReminderSchema>;
export type CartReminder = typeof cartReminders.$inferSelect;

// Orders table
export const deliveryOrders = pgTable("delivery_orders", {
  id: serial("id").primaryKey(),
  customerId: integer("customer_id").notNull(),
  deliveryWindowId: integer("delivery_window_id").notNull(),
  deliveryAddress: text("delivery_address").notNull(),
  billingAddress: text("billing_address"), // Billing address if different from delivery
  billingCity: text("billing_city"),
  billingState: text("billing_state"),
  billingZipCode: text("billing_zip_code"),
  sameAsDelivery: boolean("same_as_delivery").default(true),
  subtotal: numeric("subtotal", { precision: 10, scale: 2 }).notNull(),
  discount: numeric("discount", { precision: 10, scale: 2 }).notNull().default("0"),
  promoCode: text("promo_code"),
  promotionId: integer("promotion_id"),
  tax: numeric("tax", { precision: 10, scale: 2 }).notNull().default("0"),
  deliveryFee: numeric("delivery_fee", { precision: 10, scale: 2 }).notNull().default("0"),
  total: numeric("total", { precision: 10, scale: 2 }).notNull(),
  status: text("status").notNull().default("pending"), // pending, confirmed, preparing, out_for_delivery, delivered, cancelled
  paymentMethod: text("payment_method").notNull().default("cash"), // cash, credit_card
  paymentStatus: text("payment_status").notNull().default("pending"), // pending, paid, failed, refunded
  cloverPaymentId: text("clover_payment_id"),
  cloverChargeId: text("clover_charge_id"),
  cardLast4: text("card_last_4"),
  cardBrand: text("card_brand"),
  notes: text("notes"),
  refundAmount: numeric("refund_amount", { precision: 10, scale: 2 }),
  refundReason: text("refund_reason"),
  refundedAt: timestamp("refunded_at"),
  cloverRefundId: text("clover_refund_id"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertDeliveryOrderSchema = createInsertSchema(deliveryOrders).pick({
  customerId: true,
  deliveryWindowId: true,
  deliveryAddress: true,
  billingAddress: true,
  billingCity: true,
  billingState: true,
  billingZipCode: true,
  sameAsDelivery: true,
  subtotal: true,
  discount: true,
  promoCode: true,
  promotionId: true,
  tax: true,
  deliveryFee: true,
  total: true,
  status: true,
  paymentMethod: true,
  paymentStatus: true,
  cloverPaymentId: true,
  cloverChargeId: true,
  cardLast4: true,
  cardBrand: true,
  notes: true,
});

export type InsertDeliveryOrder = z.infer<typeof insertDeliveryOrderSchema>;
export type DeliveryOrder = typeof deliveryOrders.$inferSelect;

// Order Items table
export const deliveryOrderItems = pgTable("delivery_order_items", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").notNull(),
  productId: integer("product_id").notNull(),
  quantity: integer("quantity").notNull(),
  price: numeric("price", { precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertDeliveryOrderItemSchema = createInsertSchema(deliveryOrderItems).pick({
  orderId: true,
  productId: true,
  quantity: true,
  price: true,
});

export type InsertDeliveryOrderItem = z.infer<typeof insertDeliveryOrderItemSchema>;
export type DeliveryOrderItem = typeof deliveryOrderItems.$inferSelect;

// Settings table for configurable app settings
export const settings = pgTable("settings", {
  id: serial("id").primaryKey(),
  key: text("key").notNull().unique(),
  value: text("value").notNull(),
  description: text("description"),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertSettingSchema = createInsertSchema(settings).pick({
  key: true,
  value: true,
  description: true,
});

export type InsertSetting = z.infer<typeof insertSettingSchema>;
export type Setting = typeof settings.$inferSelect;

// Clover OAuth tokens table
export const cloverOAuthTokens = pgTable("clover_oauth_tokens", {
  id: serial("id").primaryKey(),
  merchantId: text("merchant_id").notNull().unique(),
  accessToken: text("access_token").notNull(),
  refreshToken: text("refresh_token").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertCloverOAuthTokenSchema = createInsertSchema(cloverOAuthTokens).pick({
  merchantId: true,
  accessToken: true,
  refreshToken: true,
  expiresAt: true,
});

export type InsertCloverOAuthToken = z.infer<typeof insertCloverOAuthTokenSchema>;
export type CloverOAuthToken = typeof cloverOAuthTokens.$inferSelect;

// Promotions/Promo Codes table
export const promotions = pgTable("promotions", {
  id: serial("id").primaryKey(),
  code: text("code").notNull().unique(),
  description: text("description"),
  discountType: text("discount_type").notNull(), // 'percentage' or 'fixed'
  discountValue: numeric("discount_value", { precision: 10, scale: 2 }).notNull(),
  minimumOrderAmount: numeric("minimum_order_amount", { precision: 10, scale: 2 }).default("0"),
  maxUsageCount: integer("max_usage_count"), // null = unlimited
  currentUsageCount: integer("current_usage_count").notNull().default(0),
  maxUsagePerCustomer: integer("max_usage_per_customer").default(1),
  validFrom: timestamp("valid_from").notNull(),
  validUntil: timestamp("valid_until").notNull(),
  enabled: boolean("enabled").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertPromotionSchema = createInsertSchema(promotions).pick({
  code: true,
  description: true,
  discountType: true,
  discountValue: true,
  minimumOrderAmount: true,
  maxUsageCount: true,
  maxUsagePerCustomer: true,
  validFrom: true,
  validUntil: true,
  enabled: true,
});

export type InsertPromotion = z.infer<typeof insertPromotionSchema>;
export type Promotion = typeof promotions.$inferSelect;

// Promotion Usage tracking table
export const promotionUsages = pgTable("promotion_usages", {
  id: serial("id").primaryKey(),
  promotionId: integer("promotion_id").notNull(),
  customerId: integer("customer_id").notNull(),
  orderId: integer("order_id").notNull(),
  discountAmount: numeric("discount_amount", { precision: 10, scale: 2 }).notNull(),
  usedAt: timestamp("used_at").notNull().defaultNow(),
});

export const insertPromotionUsageSchema = createInsertSchema(promotionUsages).pick({
  promotionId: true,
  customerId: true,
  orderId: true,
  discountAmount: true,
});

export type InsertPromotionUsage = z.infer<typeof insertPromotionUsageSchema>;
export type PromotionUsage = typeof promotionUsages.$inferSelect;
