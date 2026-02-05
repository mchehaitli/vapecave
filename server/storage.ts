import { 
  users, type User, type InsertUser,
  brands, type Brand, type InsertBrand, 
  brandCategories, type BrandCategory, type InsertBrandCategory,
  blogPosts, type BlogPost, type InsertBlogPost,
  storeLocations, type StoreLocation, type InsertStoreLocation,
  products, type Product, type InsertProduct,
  productCategories, type ProductCategory, type InsertProductCategory,
  newsletterSubscriptions, type NewsletterSubscription, type InsertNewsletterSubscription,
  deliveryCustomers, type DeliveryCustomer, type InsertDeliveryCustomer,
  deliveryProducts, type DeliveryProduct, type InsertDeliveryProduct,
  deliveryWindows, type DeliveryWindow, type InsertDeliveryWindow,
  weeklyDeliveryTemplates, type WeeklyDeliveryTemplate, type InsertWeeklyDeliveryTemplate,
  cartItems, type CartItem, type InsertCartItem,
  cartReminders, type CartReminder, type InsertCartReminder,
  deliveryOrders, type DeliveryOrder, type InsertDeliveryOrder,
  deliveryOrderItems, type DeliveryOrderItem, type InsertDeliveryOrderItem,
  settings, type Setting, type InsertSetting,
  siteSettings, type SiteSettings, type InsertSiteSettings,
  heroSlides, type HeroSlide, type InsertHeroSlide,
  deliveryCategories, type DeliveryCategory, type InsertDeliveryCategory,
  deliveryBrands, type DeliveryBrand, type InsertDeliveryBrand,
  deliveryProductLines, type DeliveryProductLine, type InsertDeliveryProductLine,
  cloverOAuthTokens, type CloverOAuthToken, type InsertCloverOAuthToken,
  promotions, type Promotion, type InsertPromotion,
  promotionUsages, type PromotionUsage, type InsertPromotionUsage,
  categoryBanners, type CategoryBanner, type InsertCategoryBanner
} from "@shared/schema";
import { eq, and, or, asc, desc, sql, ilike, lt, gt, isNull, isNotNull, lte } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as bcrypt from "bcryptjs";
import * as dotenv from "dotenv";

dotenv.config();

// Create a PostgreSQL connection pool with resilience settings
const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

// Handle pool errors gracefully to prevent crashes on transient failures
pool.on('error', (err) => {
  console.error('[Database Pool] Unexpected error on idle client:', err.message);
});

// Initialize drizzle with the pool
const db = drizzle(pool);

// Storage interface defining all database operations
export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  validateUser(username: string, password: string): Promise<User | null>;
  getAllAdminUsers(): Promise<User[]>;
  updateUserPassword(userId: number, currentPassword: string, newPassword: string): Promise<User | null>;
  updateUserUsername(userId: number, newUsername: string): Promise<User | undefined>;

  // Brand category operations
  getAllBrandCategories(): Promise<BrandCategory[]>;
  getBrandCategory(id: number): Promise<BrandCategory | undefined>;
  createBrandCategory(category: InsertBrandCategory): Promise<BrandCategory>;
  updateBrandCategory(id: number, category: Partial<InsertBrandCategory>): Promise<BrandCategory | undefined>;
  deleteBrandCategory(id: number): Promise<boolean>;

  // Brand operations
  getAllBrands(): Promise<Brand[]>;
  getBrandsByCategory(categoryId: number): Promise<Brand[]>;
  getBrand(id: number): Promise<Brand | undefined>;
  createBrand(brand: InsertBrand): Promise<Brand>;
  updateBrand(id: number, brand: Partial<InsertBrand>): Promise<Brand | undefined>;
  deleteBrand(id: number): Promise<boolean>;
  
  // Blog post operations (uncategorized)
  getAllBlogPosts(includeUnpublished?: boolean): Promise<BlogPost[]>;
  getFeaturedBlogPosts(limit?: number): Promise<BlogPost[]>;
  getBlogPost(id: number): Promise<BlogPost | undefined>;
  getBlogPostBySlug(slug: string): Promise<BlogPost | undefined>;
  createBlogPost(post: InsertBlogPost): Promise<BlogPost>;
  updateBlogPost(id: number, post: Partial<InsertBlogPost>): Promise<BlogPost | undefined>;
  deleteBlogPost(id: number): Promise<boolean>;
  incrementBlogPostViewCount(id: number): Promise<void>;

  // Store location operations
  getAllStoreLocations(): Promise<StoreLocation[]>;
  getStoreLocation(id: number): Promise<StoreLocation | undefined>;
  getStoreLocationByCity(city: string): Promise<StoreLocation | undefined>;
  createStoreLocation(location: InsertStoreLocation): Promise<StoreLocation>;
  updateStoreLocation(id: number, location: Partial<InsertStoreLocation>): Promise<StoreLocation | undefined>;
  deleteStoreLocation(id: number): Promise<boolean>;
  
  // Product category operations
  getAllProductCategories(): Promise<ProductCategory[]>;
  getProductCategory(id: number): Promise<ProductCategory | undefined>;
  getProductCategoryBySlug(slug: string): Promise<ProductCategory | undefined>;
  createProductCategory(category: InsertProductCategory): Promise<ProductCategory>;
  updateProductCategory(id: number, category: Partial<InsertProductCategory>): Promise<ProductCategory | undefined>;
  deleteProductCategory(id: number): Promise<boolean>;
  
  // Product operations
  getAllProducts(): Promise<Product[]>;
  getFeaturedProducts(limit?: number): Promise<Product[]>;
  getProductsByCategory(category: string): Promise<Product[]>;
  getProduct(id: number): Promise<Product | undefined>;
  createProduct(product: InsertProduct): Promise<Product>;
  updateProduct(id: number, product: Partial<InsertProduct>): Promise<Product | undefined>;
  deleteProduct(id: number): Promise<boolean>;
  
  // Newsletter subscription operations
  getAllNewsletterSubscriptions(): Promise<NewsletterSubscription[]>;
  getNewsletterSubscriptionByEmail(email: string): Promise<NewsletterSubscription | undefined>;
  createNewsletterSubscription(subscription: InsertNewsletterSubscription): Promise<NewsletterSubscription>;
  updateNewsletterSubscription(id: number, subscription: Partial<InsertNewsletterSubscription>): Promise<NewsletterSubscription | undefined>;
  toggleNewsletterSubscriptionStatus(id: number, isActive: boolean): Promise<NewsletterSubscription | undefined>;
  deleteNewsletterSubscription(id: number): Promise<boolean>;

  // Delivery customer operations
  createDeliveryCustomer(customer: InsertDeliveryCustomer): Promise<DeliveryCustomer>;
  getDeliveryCustomerById(id: number): Promise<DeliveryCustomer | undefined>;
  getDeliveryCustomerByEmail(email: string): Promise<DeliveryCustomer | undefined>;
  validateDeliveryCustomer(email: string, password: string): Promise<DeliveryCustomer | null>;
  getAllDeliveryCustomers(): Promise<DeliveryCustomer[]>;
  getPendingDeliveryCustomers(): Promise<DeliveryCustomer[]>;
  updateDeliveryCustomerApproval(id: number, approvalStatus: string, approvedBy?: number, rejectionReason?: string): Promise<DeliveryCustomer | undefined>;
  updateDeliveryCustomerPassword(id: number, passwordHash: string | null, mustChangePassword: boolean): Promise<DeliveryCustomer | undefined>;
  setPasswordSetupToken(id: number, token: string, expiryDate: Date): Promise<DeliveryCustomer | undefined>;
  getDeliveryCustomerByPasswordSetupToken(token: string): Promise<DeliveryCustomer | undefined>;
  setDeliveryCustomerPassword(id: number, passwordHash: string): Promise<DeliveryCustomer | undefined>;
  deleteDeliveryCustomer(id: number): Promise<boolean>;
  updateDeliveryCustomer(id: number, data: Partial<Pick<DeliveryCustomer, 'fullName' | 'phone' | 'address' | 'city' | 'state' | 'zipCode'>>): Promise<DeliveryCustomer | undefined>;

  // Delivery product operations
  getAllDeliveryProducts(filters?: {
    search?: string;
    category?: string;
    enabled?: boolean | 'all';
    limit?: number;
    offset?: number;
  }): Promise<{products: DeliveryProduct[]; totalCount: number}>;
  getDeliveryProduct(id: number): Promise<DeliveryProduct | undefined>;
  getEnabledDeliveryProducts(): Promise<DeliveryProduct[]>;
  getDeliveryProductByCloverItemId(cloverItemId: string): Promise<DeliveryProduct | undefined>;
  createDeliveryProduct(product: InsertDeliveryProduct): Promise<DeliveryProduct>;
  updateDeliveryProduct(id: number, product: Partial<InsertDeliveryProduct>): Promise<DeliveryProduct | undefined>;
  deleteDeliveryProduct(id: number): Promise<boolean>;
  bulkUpdateDeliveryProducts(productIds: number[], updates: Partial<InsertDeliveryProduct>): Promise<{updated: number}>;
  bulkDeleteDeliveryProducts(productIds: number[]): Promise<{deleted: number}>;
  syncProductsFromClover(products: Array<Partial<InsertDeliveryProduct>>): Promise<{synced: number, updated: number, created: number, deleted: number}>;
  refreshProductStockAndPrice(cloverItemId: string, stockQuantity: string, price: string): Promise<DeliveryProduct | undefined>;

  // Delivery window operations
  getAllDeliveryWindows(): Promise<DeliveryWindow[]>;
  getDeliveryWindowById(id: number): Promise<DeliveryWindow | undefined>;
  getDeliveryWindowsByDate(date: string): Promise<DeliveryWindow[]>;
  createDeliveryWindow(window: InsertDeliveryWindow): Promise<DeliveryWindow>;
  updateDeliveryWindow(id: number, window: Partial<InsertDeliveryWindow>): Promise<DeliveryWindow | undefined>;
  deleteDeliveryWindow(id: number): Promise<boolean>;

  // Weekly delivery template operations
  getAllWeeklyDeliveryTemplates(): Promise<WeeklyDeliveryTemplate[]>;
  getWeeklyDeliveryTemplateByDay(dayOfWeek: number): Promise<WeeklyDeliveryTemplate[]>;
  createWeeklyDeliveryTemplate(template: InsertWeeklyDeliveryTemplate): Promise<WeeklyDeliveryTemplate>;
  updateWeeklyDeliveryTemplate(id: number, template: Partial<InsertWeeklyDeliveryTemplate>): Promise<WeeklyDeliveryTemplate | undefined>;
  deleteWeeklyDeliveryTemplate(id: number): Promise<boolean>;
  generateWindowsFromTemplates(daysAhead: number): Promise<{ created: number; skipped: number }>;

  // Cart operations
  getCartItems(customerId: number): Promise<CartItem[]>;
  addToCart(item: InsertCartItem): Promise<CartItem>;
  updateCartItemQuantity(id: number, quantity: number): Promise<CartItem | undefined>;
  removeFromCart(id: number): Promise<boolean>;
  clearCart(customerId: number): Promise<boolean>;

  // Cart reminder operations
  getCartReminder(customerId: number): Promise<CartReminder | undefined>;
  upsertCartReminder(customerId: number, updates: { lastReminderSent?: Date; reminderCount?: number; cartLastUpdated?: Date }): Promise<CartReminder>;
  getAbandonedCarts(hoursThreshold: number): Promise<Array<{ customerId: number; cartLastUpdated: Date; lastReminderSent: Date | null; reminderCount: number }>>;
  getCustomersWithAbandonedCarts(hoursThreshold: number, maxReminders: number): Promise<Array<{ customer: DeliveryCustomer; cartItems: CartItem[]; cartValue: number }>>;

  // Delivery order operations
  createDeliveryOrder(order: InsertDeliveryOrder): Promise<DeliveryOrder>;
  getDeliveryOrderById(id: number): Promise<DeliveryOrder | undefined>;
  getOrdersByCustomer(customerId: number): Promise<DeliveryOrder[]>;
  getAllDeliveryOrders(): Promise<DeliveryOrder[]>;
  updateDeliveryOrderStatus(id: number, status: string): Promise<DeliveryOrder | undefined>;
  updateDeliveryOrderCloverInfo(id: number, cloverChargeId: string, paymentStatus?: string): Promise<DeliveryOrder | undefined>;
  processRefund(id: number, refundAmount: string, refundReason: string, cloverRefundId?: string): Promise<DeliveryOrder | undefined>;
  deleteDeliveryOrder(id: number): Promise<boolean>;
  
  // Order items operations
  createDeliveryOrderItem(item: InsertDeliveryOrderItem): Promise<DeliveryOrderItem>;
  getDeliveryOrderItems(orderId: number): Promise<Array<DeliveryOrderItem & { product?: DeliveryProduct }>>;

  // Settings operations
  getSetting(key: string): Promise<Setting | undefined>;
  getAllSettings(): Promise<Setting[]>;
  upsertSetting(key: string, value: string, description?: string): Promise<Setting>;

  // Site Settings operations (concept1)
  getSiteSettings(): Promise<SiteSettings>;
  updateSiteSettings(updates: Partial<InsertSiteSettings>): Promise<SiteSettings>;

  // Hero Slides operations (concept1)
  getAllHeroSlides(): Promise<HeroSlide[]>;
  getEnabledHeroSlides(): Promise<HeroSlide[]>;
  getHeroSlide(id: number): Promise<HeroSlide | undefined>;
  createHeroSlide(slide: InsertHeroSlide): Promise<HeroSlide>;
  updateHeroSlide(id: number, slide: Partial<InsertHeroSlide>): Promise<HeroSlide | undefined>;
  deleteHeroSlide(id: number): Promise<boolean>;

  // Category Banners operations
  getAllCategoryBanners(): Promise<CategoryBanner[]>;
  getActiveCategoryBanners(): Promise<CategoryBanner[]>;
  getCategoryBanner(id: number): Promise<CategoryBanner | undefined>;
  createCategoryBanner(banner: InsertCategoryBanner): Promise<CategoryBanner>;
  updateCategoryBanner(id: number, banner: Partial<InsertCategoryBanner>): Promise<CategoryBanner | undefined>;
  deleteCategoryBanner(id: number): Promise<boolean>;

  // Delivery Categories operations
  getAllDeliveryCategories(): Promise<DeliveryCategory[]>;
  getActiveDeliveryCategories(): Promise<DeliveryCategory[]>;
  getDeliveryCategory(id: number): Promise<DeliveryCategory | undefined>;
  getDeliveryCategoryBySlug(slug: string): Promise<DeliveryCategory | undefined>;
  createDeliveryCategory(category: InsertDeliveryCategory): Promise<DeliveryCategory>;
  updateDeliveryCategory(id: number, category: Partial<InsertDeliveryCategory>): Promise<DeliveryCategory | undefined>;
  deleteDeliveryCategory(id: number): Promise<boolean>;
  reorderDeliveryCategories(orderedIds: number[]): Promise<boolean>;

  // Delivery Brands operations
  getAllDeliveryBrands(): Promise<DeliveryBrand[]>;
  getActiveDeliveryBrands(): Promise<DeliveryBrand[]>;
  getDeliveryBrandsByCategory(categoryId: number): Promise<DeliveryBrand[]>;
  getDeliveryBrand(id: number): Promise<DeliveryBrand | undefined>;
  getDeliveryBrandBySlug(slug: string): Promise<DeliveryBrand | undefined>;
  createDeliveryBrand(brand: InsertDeliveryBrand): Promise<DeliveryBrand>;
  updateDeliveryBrand(id: number, brand: Partial<InsertDeliveryBrand>): Promise<DeliveryBrand | undefined>;
  deleteDeliveryBrand(id: number): Promise<boolean>;
  reorderDeliveryBrands(categoryId: number, orderedIds: number[]): Promise<boolean>;

  // Delivery Product Lines operations (subcategories within brands)
  getAllDeliveryProductLines(): Promise<DeliveryProductLine[]>;
  getActiveDeliveryProductLines(): Promise<DeliveryProductLine[]>;
  getDeliveryProductLinesByBrand(brandId: number): Promise<DeliveryProductLine[]>;
  getDeliveryProductLine(id: number): Promise<DeliveryProductLine | undefined>;
  getDeliveryProductLineBySlug(slug: string): Promise<DeliveryProductLine | undefined>;
  createDeliveryProductLine(productLine: InsertDeliveryProductLine): Promise<DeliveryProductLine>;
  updateDeliveryProductLine(id: number, productLine: Partial<InsertDeliveryProductLine>): Promise<DeliveryProductLine | undefined>;
  deleteDeliveryProductLine(id: number): Promise<boolean>;
  reorderDeliveryProductLines(brandId: number, orderedIds: number[]): Promise<boolean>;

  // Clover OAuth token operations
  getCloverOAuthToken(merchantId: string): Promise<CloverOAuthToken | undefined>;
  upsertCloverOAuthToken(token: InsertCloverOAuthToken): Promise<CloverOAuthToken>;
  deleteCloverOAuthToken(merchantId: string): Promise<boolean>;

  // Promotion operations
  getAllPromotions(): Promise<Promotion[]>;
  getPromotion(id: number): Promise<Promotion | undefined>;
  getPromotionByCode(code: string): Promise<Promotion | undefined>;
  createPromotion(promotion: InsertPromotion): Promise<Promotion>;
  updatePromotion(id: number, promotion: Partial<InsertPromotion>): Promise<Promotion | undefined>;
  deletePromotion(id: number): Promise<boolean>;
  incrementPromotionUsage(id: number): Promise<Promotion | undefined>;
  validatePromoCode(code: string, customerId: number, orderSubtotal: number): Promise<{valid: boolean; promotion?: Promotion; errorMessage?: string; discountAmount?: number}>;
  
  // Promotion usage operations
  createPromotionUsage(usage: InsertPromotionUsage): Promise<PromotionUsage>;
  getPromotionUsagesByCustomer(customerId: number): Promise<PromotionUsage[]>;
  getPromotionUsageCount(promotionId: number, customerId: number): Promise<number>;
}

// Database implementation of the storage interface
export class DbStorage implements IStorage {
  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id));
    return result[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.username, username));
    return result[0];
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    // Hash the password before storing
    const hashedPassword = await bcrypt.hash(insertUser.password, 10);
    
    const result = await db.insert(users).values({
      ...insertUser,
      password: hashedPassword
    }).returning();
    
    return result[0];
  }

  async validateUser(username: string, password: string): Promise<User | null> {
    const user = await this.getUserByUsername(username);
    
    if (!user) {
      return null;
    }
    
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return null;
    }
    
    return user;
  }

  async getAllAdminUsers(): Promise<User[]> {
    const result = await db.select().from(users).where(eq(users.isAdmin, true));
    return result;
  }

  async updateUserPassword(userId: number, currentPassword: string, newPassword: string): Promise<User | null> {
    const user = await this.getUser(userId);
    
    if (!user) {
      return null;
    }
    
    // Verify current password
    const isValid = await bcrypt.compare(currentPassword, user.password);
    if (!isValid) {
      return null;
    }
    
    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    // Update password
    const result = await db
      .update(users)
      .set({ password: hashedPassword })
      .where(eq(users.id, userId))
      .returning();
    
    return result[0] || null;
  }

  async updateUserUsername(userId: number, newUsername: string): Promise<User | undefined> {
    const result = await db
      .update(users)
      .set({ username: newUsername })
      .where(eq(users.id, userId))
      .returning();
    
    return result[0];
  }

  // Brand category operations
  async getAllBrandCategories(): Promise<BrandCategory[]> {
    return db.select().from(brandCategories).orderBy(asc(brandCategories.displayOrder));
  }

  async getBrandCategory(id: number): Promise<BrandCategory | undefined> {
    const result = await db.select().from(brandCategories).where(eq(brandCategories.id, id));
    return result[0];
  }

  async createBrandCategory(category: InsertBrandCategory): Promise<BrandCategory> {
    const result = await db.insert(brandCategories).values(category).returning();
    return result[0];
  }

  async updateBrandCategory(id: number, category: Partial<InsertBrandCategory>): Promise<BrandCategory | undefined> {
    const result = await db
      .update(brandCategories)
      .set(category)
      .where(eq(brandCategories.id, id))
      .returning();
    
    return result[0];
  }

  async deleteBrandCategory(id: number): Promise<boolean> {
    const result = await db
      .delete(brandCategories)
      .where(eq(brandCategories.id, id))
      .returning();
    
    return result.length > 0;
  }

  // Brand operations
  async getAllBrands(): Promise<Brand[]> {
    // Select only existing columns from the database
    const rows = await db.select({
      id: brands.id,
      categoryId: brands.categoryId,
      name: brands.name,
      image: brands.image,
      description: brands.description,
      displayOrder: brands.displayOrder,
    })
    .from(brands)
    .orderBy(asc(brands.displayOrder));
    
    // Add the imageSize field with a default value
    return rows.map(row => {
      const brandWithSize = row as Brand;
      brandWithSize.imageSize = "medium";
      return brandWithSize;
    });
  }

  async getBrandsByCategory(categoryId: number): Promise<Brand[]> {
    // Select only existing columns from the database
    const rows = await db
      .select({
        id: brands.id,
        categoryId: brands.categoryId,
        name: brands.name,
        image: brands.image,
        description: brands.description,
        displayOrder: brands.displayOrder,
      })
      .from(brands)
      .where(eq(brands.categoryId, categoryId))
      .orderBy(asc(brands.displayOrder));
    
    // Add the imageSize field with a default value
    return rows.map(row => {
      const brandWithSize = row as Brand;
      brandWithSize.imageSize = "medium";
      return brandWithSize;
    });
  }

  async getBrand(id: number): Promise<Brand | undefined> {
    // Select only existing columns from the database
    const result = await db
      .select({
        id: brands.id,
        categoryId: brands.categoryId,
        name: brands.name,
        image: brands.image,
        description: brands.description,
        displayOrder: brands.displayOrder,
      })
      .from(brands)
      .where(eq(brands.id, id));
    
    if (result.length === 0) {
      return undefined;
    }
    
    // Add imageSize field with default value
    const brandWithSize = result[0] as Brand;
    brandWithSize.imageSize = "medium";
    return brandWithSize;
  }

  async createBrand(brand: InsertBrand): Promise<Brand> {
    // Extract imageSize from the input but don't include it in DB operation
    const { imageSize, ...dbFields } = brand;
    
    // Insert the brand without the imageSize field
    const result = await db
      .insert(brands)
      .values({
        categoryId: dbFields.categoryId,
        name: dbFields.name,
        image: dbFields.image,
        description: dbFields.description,
        displayOrder: dbFields.displayOrder || 0
      })
      .returning({
        id: brands.id,
        categoryId: brands.categoryId,
        name: brands.name,
        image: brands.image,
        description: brands.description,
        displayOrder: brands.displayOrder
      });
    
    // Return the result with the imageSize field added
    const brandWithSize = result[0] as Brand;
    brandWithSize.imageSize = imageSize || "medium";
    return brandWithSize;
  }

  async updateBrand(id: number, brand: Partial<InsertBrand>): Promise<Brand | undefined> {
    // Extract imageSize from the input but don't include it in DB operation
    const { imageSize, ...updateProps } = brand;
    
    // Create a new object with just the fields we need to update
    const updateFields: {
      categoryId?: number;
      name?: string;
      image?: string;
      description?: string;
      displayOrder?: number;
    } = {};
    
    // Only add fields that are defined
    if (updateProps.categoryId !== undefined) updateFields.categoryId = updateProps.categoryId;
    if (updateProps.name !== undefined) updateFields.name = updateProps.name;
    if (updateProps.image !== undefined) updateFields.image = updateProps.image;
    if (updateProps.description !== undefined) updateFields.description = updateProps.description;
    if (updateProps.displayOrder !== undefined) {
      // Handle the null vs undefined case - convert null to undefined
      updateFields.displayOrder = updateProps.displayOrder === null ? undefined : updateProps.displayOrder;
    }
    
    // Only include fields that are actually in the database
    const result = await db
      .update(brands)
      .set(updateFields)
      .where(eq(brands.id, id))
      .returning({
        id: brands.id,
        categoryId: brands.categoryId,
        name: brands.name,
        image: brands.image,
        description: brands.description,
        displayOrder: brands.displayOrder,
      });
    
    if (result.length === 0) {
      return undefined;
    }
    
    // Return the result with the imageSize field added
    const brandWithSize = result[0] as Brand;
    brandWithSize.imageSize = imageSize || "medium";
    return brandWithSize;
  }

  async deleteBrand(id: number): Promise<boolean> {
    const result = await db
      .delete(brands)
      .where(eq(brands.id, id))
      .returning();
    
    return result.length > 0;
  }
  
  // Blog category operations have been removed

  // Blog post operations
  async getAllBlogPosts(includeUnpublished: boolean = false): Promise<BlogPost[]> {
    if (includeUnpublished) {
      return db.select().from(blogPosts).orderBy(desc(blogPosts.created_at));
    } else {
      return db.select()
        .from(blogPosts)
        .where(eq(blogPosts.is_published, true))
        .orderBy(desc(blogPosts.created_at));
    }
  }

  async getFeaturedBlogPosts(limit: number = 5): Promise<BlogPost[]> {
    return db
      .select()
      .from(blogPosts)
      .where(and(
        eq(blogPosts.is_featured, true),
        eq(blogPosts.is_published, true)
      ))
      .orderBy(desc(blogPosts.created_at))
      .limit(limit);
  }

  async getBlogPost(id: number): Promise<BlogPost | undefined> {
    const result = await db.select().from(blogPosts).where(eq(blogPosts.id, id));
    return result[0];
  }

  async getBlogPostBySlug(slug: string): Promise<BlogPost | undefined> {
    const result = await db.select().from(blogPosts).where(eq(blogPosts.slug, slug));
    return result[0];
  }

  async createBlogPost(post: InsertBlogPost): Promise<BlogPost> {
    const result = await db.insert(blogPosts).values(post).returning();
    return result[0];
  }

  async updateBlogPost(id: number, post: Partial<InsertBlogPost>): Promise<BlogPost | undefined> {
    // Create a clean update object with only fields that exist in the schema
    const updateData: Partial<Omit<BlogPost, 'id'>> = {};
    
    // Explicitly map allowed fields from post to updateData using snake_case property names
    if (post.title !== undefined) updateData.title = post.title;
    if (post.slug !== undefined) updateData.slug = post.slug;
    if (post.summary !== undefined) updateData.summary = post.summary;
    if (post.content !== undefined) updateData.content = post.content;
    if (post.featured_image !== undefined) updateData.featured_image = post.featured_image;
    if (post.meta_title !== undefined) updateData.meta_title = post.meta_title;
    if (post.meta_description !== undefined) updateData.meta_description = post.meta_description;
    if (post.is_featured !== undefined) updateData.is_featured = post.is_featured;
    if (post.is_published !== undefined) updateData.is_published = post.is_published;
    
    // Always update the updated_at field
    updateData.updated_at = new Date();
    
    const result = await db
      .update(blogPosts)
      .set(updateData)
      .where(eq(blogPosts.id, id))
      .returning();
    
    return result[0];
  }

  async deleteBlogPost(id: number): Promise<boolean> {
    const result = await db
      .delete(blogPosts)
      .where(eq(blogPosts.id, id))
      .returning();
    
    return result.length > 0;
  }
  
  async incrementBlogPostViewCount(id: number): Promise<void> {
    await db
      .update(blogPosts)
      .set({
        view_count: sql`${blogPosts.view_count} + 1`
      })
      .where(eq(blogPosts.id, id));
  }

  // Store location operations
  async getAllStoreLocations(): Promise<StoreLocation[]> {
    return db.select().from(storeLocations);
  }

  async getStoreLocation(id: number): Promise<StoreLocation | undefined> {
    const result = await db.select().from(storeLocations).where(eq(storeLocations.id, id));
    return result[0];
  }

  async getStoreLocationByCity(city: string): Promise<StoreLocation | undefined> {
    const result = await db.select().from(storeLocations).where(eq(storeLocations.city, city));
    return result[0];
  }

  async createStoreLocation(location: InsertStoreLocation): Promise<StoreLocation> {
    const result = await db.insert(storeLocations).values(location).returning();
    return result[0];
  }

  async updateStoreLocation(id: number, location: Partial<InsertStoreLocation>): Promise<StoreLocation | undefined> {
    // Create a clean update object
    const updateData: Partial<Omit<StoreLocation, 'id'>> = {};
    
    // Map fields to the update data object
    Object.keys(location).forEach(key => {
      if (location[key as keyof InsertStoreLocation] !== undefined) {
        updateData[key as keyof Omit<StoreLocation, 'id'>] = location[key as keyof InsertStoreLocation];
      }
    });
    
    // Always update the updated_at field
    updateData.updated_at = new Date();
    
    const result = await db
      .update(storeLocations)
      .set(updateData)
      .where(eq(storeLocations.id, id))
      .returning();
    
    return result[0];
  }

  async deleteStoreLocation(id: number): Promise<boolean> {
    const result = await db
      .delete(storeLocations)
      .where(eq(storeLocations.id, id))
      .returning();
    
    return result.length > 0;
  }
  
  // Product category operations
  async getAllProductCategories(): Promise<ProductCategory[]> {
    return db.select().from(productCategories).orderBy(asc(productCategories.display_order));
  }
  
  async getProductCategory(id: number): Promise<ProductCategory | undefined> {
    const result = await db.select().from(productCategories).where(eq(productCategories.id, id));
    return result[0];
  }
  
  async getProductCategoryBySlug(slug: string): Promise<ProductCategory | undefined> {
    const result = await db.select().from(productCategories).where(eq(productCategories.slug, slug));
    return result[0];
  }
  
  async createProductCategory(category: InsertProductCategory): Promise<ProductCategory> {
    const result = await db.insert(productCategories).values(category).returning();
    return result[0];
  }
  
  async updateProductCategory(id: number, category: Partial<InsertProductCategory>): Promise<ProductCategory | undefined> {
    // Create a clean update object
    const updateData: Partial<Omit<ProductCategory, 'id'>> = {};
    
    // Map fields from category to updateData
    if (category.name !== undefined) updateData.name = category.name;
    if (category.slug !== undefined) updateData.slug = category.slug;
    if (category.description !== undefined) updateData.description = category.description;
    if (category.display_order !== undefined) updateData.display_order = category.display_order;
    
    // Always update the updated_at field
    updateData.updated_at = new Date();
    
    const result = await db
      .update(productCategories)
      .set(updateData)
      .where(eq(productCategories.id, id))
      .returning();
    
    return result[0];
  }
  
  async deleteProductCategory(id: number): Promise<boolean> {
    const result = await db
      .delete(productCategories)
      .where(eq(productCategories.id, id))
      .returning();
    
    return result.length > 0;
  }
  
  // Product operations
  async getAllProducts(): Promise<Product[]> {
    return db.select({
      id: products.id,
      name: products.name,
      description: products.description,
      price: products.price,
      hidePrice: products.hidePrice,
      image: products.image,
      category: products.category,
      categoryId: products.categoryId,
      featured: products.featured,
      featuredLabel: products.featuredLabel,
      stock: products.stock,
      created_at: products.created_at,
      updated_at: products.updated_at
    }).from(products).orderBy(asc(products.name));
  }
  
  async getFeaturedProducts(limit: number = 10): Promise<Product[]> {
    return db
      .select({
        id: products.id,
        name: products.name,
        description: products.description,
        price: products.price,
        hidePrice: products.hidePrice,
        image: products.image,
        category: products.category,
        categoryId: products.categoryId,
        featured: products.featured,
        featuredLabel: products.featuredLabel,
        stock: products.stock,
        created_at: products.created_at,
        updated_at: products.updated_at
      })
      .from(products)
      .where(eq(products.featured, true))
      .orderBy(asc(products.name))
      .limit(limit);
  }
  
  async getProductsByCategory(category: string): Promise<Product[]> {
    // First check if the category input is actually a numeric ID
    const categoryId = !isNaN(parseInt(category)) ? parseInt(category) : null;
    
    if (categoryId) {
      // If it's a valid category ID, filter by categoryId
      return db
        .select({
          id: products.id,
          name: products.name,
          description: products.description,
          price: products.price,
          hidePrice: products.hidePrice,
          image: products.image,
          category: products.category,
          categoryId: products.categoryId,
          featured: products.featured,
          featuredLabel: products.featuredLabel,
          stock: products.stock,
          created_at: products.created_at,
          updated_at: products.updated_at
        })
        .from(products)
        .where(eq(products.categoryId, categoryId))
        .orderBy(asc(products.name));
    } else {
      // Otherwise filter by category slug
      return db
        .select({
          id: products.id,
          name: products.name,
          description: products.description,
          price: products.price,
          hidePrice: products.hidePrice,
          image: products.image,
          category: products.category,
          categoryId: products.categoryId,
          featured: products.featured,
          featuredLabel: products.featuredLabel,
          stock: products.stock,
          created_at: products.created_at,
          updated_at: products.updated_at
        })
        .from(products)
        .where(eq(products.category, category))
        .orderBy(asc(products.name));
    }
  }
  
  async getProduct(id: number): Promise<Product | undefined> {
    const result = await db.select({
      id: products.id,
      name: products.name,
      description: products.description,
      price: products.price,
      hidePrice: products.hidePrice,
      image: products.image,
      category: products.category,
      categoryId: products.categoryId,
      featured: products.featured,
      featuredLabel: products.featuredLabel,
      stock: products.stock,
      created_at: products.created_at,
      updated_at: products.updated_at
    }).from(products).where(eq(products.id, id));
    return result[0];
  }
  
  async createProduct(product: InsertProduct): Promise<Product> {
    // Create a product object with all fields from the form
    const productData: any = { ...product };
    
    // If no category ID provided but we have a category slug, try to find the category ID
    if (!productData.categoryId && productData.category) {
      try {
        const category = await this.getProductCategoryBySlug(productData.category);
        if (category) {
          productData.categoryId = category.id;
        }
      } catch (error) {
        console.error("Error finding category ID for slug:", error);
      }
    }
    
    const result = await db.insert(products).values(productData).returning();
    return result[0];
  }
  
  async updateProduct(id: number, product: Partial<InsertProduct>): Promise<Product | undefined> {
    // Create a clean update object
    const updateData: Partial<Omit<Product, 'id'>> = {};
    
    // Make a copy of the product data
    const productData = { ...product };
    
    // If category has changed, try to update categoryId to match
    if (productData.category && !productData.categoryId) {
      try {
        const category = await this.getProductCategoryBySlug(productData.category);
        if (category) {
          productData.categoryId = category.id;
        }
      } catch (error) {
        console.error("Error finding category ID for slug:", error);
      }
    }
    
    // Map fields to the update data object
    Object.keys(productData).forEach(key => {
      if (productData[key as keyof InsertProduct] !== undefined) {
        updateData[key as keyof Omit<Product, 'id'>] = productData[key as keyof InsertProduct];
      }
    });
    
    // Always update the updated_at field
    updateData.updated_at = new Date();
    
    const result = await db
      .update(products)
      .set(updateData)
      .where(eq(products.id, id))
      .returning();
    
    return result[0];
  }
  
  async deleteProduct(id: number): Promise<boolean> {
    const result = await db
      .delete(products)
      .where(eq(products.id, id))
      .returning();
    
    return result.length > 0;
  }
  
  // Newsletter subscription operations
  async getAllNewsletterSubscriptions(): Promise<NewsletterSubscription[]> {
    return db.select().from(newsletterSubscriptions).orderBy(desc(newsletterSubscriptions.subscribed_at));
  }
  
  async getNewsletterSubscriptionByEmail(email: string): Promise<NewsletterSubscription | undefined> {
    const result = await db.select().from(newsletterSubscriptions).where(eq(newsletterSubscriptions.email, email));
    return result[0];
  }
  
  async createNewsletterSubscription(subscription: InsertNewsletterSubscription): Promise<NewsletterSubscription> {
    // Check if the email already exists
    const existing = await this.getNewsletterSubscriptionByEmail(subscription.email);
    
    if (existing) {
      // If it exists but is inactive, reactivate it
      if (!existing.is_active) {
        const updated = await this.toggleNewsletterSubscriptionStatus(existing.id, true);
        if (updated) {
          return updated;
        }
      }
      // Otherwise just return the existing one
      return existing;
    }
    
    // Create new subscription if it doesn't exist
    const result = await db.insert(newsletterSubscriptions).values({
      ...subscription,
      subscribed_at: new Date(),
      last_updated: new Date()
    }).returning();
    
    return result[0];
  }
  
  async updateNewsletterSubscription(id: number, subscription: Partial<InsertNewsletterSubscription>): Promise<NewsletterSubscription | undefined> {
    // Create update data object
    const updateData: Partial<NewsletterSubscription> = {
      ...subscription,
      last_updated: new Date()
    };
    
    const result = await db
      .update(newsletterSubscriptions)
      .set(updateData)
      .where(eq(newsletterSubscriptions.id, id))
      .returning();
    
    return result[0];
  }
  
  async toggleNewsletterSubscriptionStatus(id: number, isActive: boolean): Promise<NewsletterSubscription | undefined> {
    const result = await db
      .update(newsletterSubscriptions)
      .set({ 
        is_active: isActive,
        last_updated: new Date()
      })
      .where(eq(newsletterSubscriptions.id, id))
      .returning();
    
    return result[0];
  }
  
  async deleteNewsletterSubscription(id: number): Promise<boolean> {
    const result = await db
      .delete(newsletterSubscriptions)
      .where(eq(newsletterSubscriptions.id, id))
      .returning();
    
    return result.length > 0;
  }

  // Delivery customer operations
  async createDeliveryCustomer(customer: InsertDeliveryCustomer): Promise<DeliveryCustomer> {
    const result = await db.insert(deliveryCustomers).values({
      ...customer,
      approvalStatus: "pending",
      createdAt: new Date(),
      updatedAt: new Date()
    }).returning();
    return result[0];
  }

  async getDeliveryCustomerById(id: number): Promise<DeliveryCustomer | undefined> {
    const result = await db.select().from(deliveryCustomers).where(eq(deliveryCustomers.id, id));
    return result[0];
  }

  async validateDeliveryCustomer(email: string, password: string): Promise<DeliveryCustomer | null> {
    const customer = await this.getDeliveryCustomerByEmail(email);
    if (!customer || !customer.passwordHash) {
      return null;
    }
    
    const isValid = await bcrypt.compare(password, customer.passwordHash);
    return isValid ? customer : null;
  }

  async getDeliveryCustomerByEmail(email: string): Promise<DeliveryCustomer | undefined> {
    const result = await db.select().from(deliveryCustomers).where(eq(deliveryCustomers.email, email));
    return result[0];
  }

  async getAllDeliveryCustomers(): Promise<DeliveryCustomer[]> {
    return db.select().from(deliveryCustomers).orderBy(desc(deliveryCustomers.createdAt));
  }

  async getPendingDeliveryCustomers(): Promise<DeliveryCustomer[]> {
    return db.select().from(deliveryCustomers).where(eq(deliveryCustomers.approvalStatus, "pending")).orderBy(desc(deliveryCustomers.createdAt));
  }

  async updateDeliveryCustomerApproval(id: number, approvalStatus: string, approvedBy?: number, rejectionReason?: string): Promise<DeliveryCustomer | undefined> {
    const updateData: Partial<DeliveryCustomer> = {
      approvalStatus,
      updatedAt: new Date()
    };
    
    if (approvalStatus === "approved") {
      updateData.approvedBy = approvedBy;
      updateData.approvedAt = new Date();
      updateData.rejectionReason = null;
    } else if (approvalStatus === "rejected") {
      updateData.rejectionReason = rejectionReason || null;
      updateData.approvedBy = approvedBy;
      updateData.approvedAt = null;
    }

    const result = await db
      .update(deliveryCustomers)
      .set(updateData)
      .where(eq(deliveryCustomers.id, id))
      .returning();
    
    return result[0];
  }

  async updateDeliveryCustomerPassword(id: number, passwordHash: string | null, mustChangePassword: boolean): Promise<DeliveryCustomer | undefined> {
    const updateData = {
      passwordHash,
      mustChangePassword,
      updatedAt: new Date()
    };

    const result = await db
      .update(deliveryCustomers)
      .set(updateData)
      .where(eq(deliveryCustomers.id, id))
      .returning();
    
    return result[0];
  }

  async setPasswordSetupToken(id: number, token: string, expiryDate: Date): Promise<DeliveryCustomer | undefined> {
    const result = await db
      .update(deliveryCustomers)
      .set({
        passwordSetupToken: token,
        passwordSetupTokenExpiry: expiryDate,
        updatedAt: new Date()
      })
      .where(eq(deliveryCustomers.id, id))
      .returning();
    
    return result[0];
  }

  async getDeliveryCustomerByPasswordSetupToken(token: string): Promise<DeliveryCustomer | undefined> {
    const result = await db
      .select()
      .from(deliveryCustomers)
      .where(eq(deliveryCustomers.passwordSetupToken, token));
    
    return result[0];
  }

  async setDeliveryCustomerPassword(id: number, passwordHash: string): Promise<DeliveryCustomer | undefined> {
    const result = await db
      .update(deliveryCustomers)
      .set({
        passwordHash,
        passwordSetupToken: null,
        passwordSetupTokenExpiry: null,
        mustChangePassword: false,
        updatedAt: new Date()
      })
      .where(eq(deliveryCustomers.id, id))
      .returning();
    
    return result[0];
  }

  async deleteDeliveryCustomer(id: number): Promise<boolean> {
    const result = await db
      .delete(deliveryCustomers)
      .where(eq(deliveryCustomers.id, id))
      .returning();
    
    return result.length > 0;
  }

  async updateDeliveryCustomer(id: number, data: Partial<Pick<DeliveryCustomer, 'fullName' | 'phone' | 'address' | 'city' | 'state' | 'zipCode'>>): Promise<DeliveryCustomer | undefined> {
    const updateData = {
      ...data,
      updatedAt: new Date()
    };

    const result = await db
      .update(deliveryCustomers)
      .set(updateData)
      .where(eq(deliveryCustomers.id, id))
      .returning();
    
    return result[0];
  }

  // Delivery product operations
  async getAllDeliveryProducts(filters?: {
    search?: string;
    category?: string;
    enabled?: boolean | 'all';
    limit?: number;
    offset?: number;
  }): Promise<{products: DeliveryProduct[]; totalCount: number}> {
    let query = db.select().from(deliveryProducts);
    const conditions = [];

    if (filters?.search) {
      const searchLower = `%${filters.search.toLowerCase()}%`;
      conditions.push(
        or(
          ilike(deliveryProducts.name, searchLower),
          ilike(deliveryProducts.description, searchLower),
          ilike(deliveryProducts.cloverItemId, searchLower)
        )
      );
    }

    if (filters?.category) {
      conditions.push(eq(deliveryProducts.category, filters.category));
    }

    if (filters?.enabled !== undefined && filters.enabled !== 'all') {
      conditions.push(eq(deliveryProducts.enabled, filters.enabled));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }

    const allProducts = await query.orderBy(asc(deliveryProducts.displayOrder));
    const totalCount = allProducts.length;

    const offset = filters?.offset || 0;
    const limit = filters?.limit || totalCount;
    const products = allProducts.slice(offset, offset + limit);

    return { products, totalCount };
  }

  async getDeliveryProduct(id: number): Promise<DeliveryProduct | undefined> {
    const result = await db.select().from(deliveryProducts).where(eq(deliveryProducts.id, id));
    return result[0];
  }

  async getEnabledDeliveryProducts(): Promise<DeliveryProduct[]> {
    return db.select().from(deliveryProducts).where(eq(deliveryProducts.enabled, true)).orderBy(asc(deliveryProducts.displayOrder));
  }

  async getDeliveryProductByCloverItemId(cloverItemId: string): Promise<DeliveryProduct | undefined> {
    const result = await db.select().from(deliveryProducts).where(eq(deliveryProducts.cloverItemId, cloverItemId));
    return result[0];
  }

  async createDeliveryProduct(product: InsertDeliveryProduct): Promise<DeliveryProduct> {
    const result = await db.insert(deliveryProducts).values({
      ...product,
      createdAt: new Date(),
      updatedAt: new Date()
    }).returning();
    return result[0];
  }

  async updateDeliveryProduct(id: number, product: Partial<InsertDeliveryProduct>): Promise<DeliveryProduct | undefined> {
    const updateData = {
      ...product,
      updatedAt: new Date()
    };

    const result = await db
      .update(deliveryProducts)
      .set(updateData)
      .where(eq(deliveryProducts.id, id))
      .returning();
    
    return result[0];
  }

  async deleteDeliveryProduct(id: number): Promise<boolean> {
    const result = await db
      .delete(deliveryProducts)
      .where(eq(deliveryProducts.id, id))
      .returning();
    
    return result.length > 0;
  }

  async bulkUpdateDeliveryProducts(productIds: number[], updates: Partial<InsertDeliveryProduct>): Promise<{updated: number}> {
    if (productIds.length === 0) {
      return { updated: 0 };
    }

    const updateData = {
      ...updates,
      updatedAt: new Date()
    };

    const result = await db
      .update(deliveryProducts)
      .set(updateData)
      .where(sql`${deliveryProducts.id} = ANY(ARRAY[${sql.raw(productIds.join(','))}])`)
      .returning();
    
    return { updated: result.length };
  }

  async bulkDeleteDeliveryProducts(productIds: number[]): Promise<{deleted: number}> {
    if (productIds.length === 0) {
      return { deleted: 0 };
    }

    const result = await db
      .delete(deliveryProducts)
      .where(sql`${deliveryProducts.id} = ANY(ARRAY[${sql.raw(productIds.join(','))}])`)
      .returning();
    
    return { deleted: result.length };
  }

  async syncProductsFromClover(products: Array<Partial<InsertDeliveryProduct>>): Promise<{synced: number, updated: number, created: number, deleted: number}> {
    let synced = 0;
    let updated = 0;
    let created = 0;
    let deleted = 0;
    
    // Track processed cloverItemIds to handle duplicates from Clover API
    const processedIds = new Set<string>();

    for (const product of products) {
      if (!product.cloverItemId) continue;
      
      // Skip duplicates in the Clover response
      if (processedIds.has(product.cloverItemId)) {
        continue;
      }
      processedIds.add(product.cloverItemId);

      try {
        const existing = await this.getDeliveryProductByCloverItemId(product.cloverItemId);
        
        if (existing) {
          // Update existing product but preserve admin settings
          await this.updateDeliveryProduct(existing.id, {
            name: product.name,
            price: product.price,
            image: product.image,
            description: product.description,
            category: product.category,
            stockQuantity: product.stockQuantity,
            // Keep existing admin settings: enabled, badge, displayOrder, isFeaturedSlideshow, slideshowPosition
          });
          updated++;
        } else {
          // Create new product
          await this.createDeliveryProduct(product as InsertDeliveryProduct);
          created++;
        }
        synced++;
      } catch (error: any) {
        console.error(`[Sync] Error processing product ${product.cloverItemId}:`, error?.message);
        // Continue with other products even if one fails
      }
    }

    // Remove products that exist in our database but not in Clover anymore
    try {
      const allLocalProducts = await db.select().from(deliveryProducts).where(isNotNull(deliveryProducts.cloverItemId));
      
      for (const localProduct of allLocalProducts) {
        if (localProduct.cloverItemId && !processedIds.has(localProduct.cloverItemId)) {
          // This product exists locally but not in Clover - delete it
          await db.delete(deliveryProducts).where(eq(deliveryProducts.id, localProduct.id));
          deleted++;
          console.log(`[Sync] Deleted product no longer in Clover: ${localProduct.name} (${localProduct.cloverItemId})`);
        }
      }
    } catch (error: any) {
      console.error(`[Sync] Error cleaning up deleted products:`, error?.message);
    }

    return { synced, updated, created, deleted };
  }

  async refreshProductStockAndPrice(cloverItemId: string, stockQuantity: string, price: string): Promise<DeliveryProduct | undefined> {
    const existing = await this.getDeliveryProductByCloverItemId(cloverItemId);
    if (!existing) return undefined;

    return this.updateDeliveryProduct(existing.id, { stockQuantity, price });
  }

  // Delivery window operations
  async getAllDeliveryWindows(): Promise<DeliveryWindow[]> {
    return db.select().from(deliveryWindows).where(eq(deliveryWindows.enabled, true)).orderBy(asc(deliveryWindows.date), asc(deliveryWindows.startTime));
  }

  async getDeliveryWindowById(id: number): Promise<DeliveryWindow | undefined> {
    const result = await db.select().from(deliveryWindows).where(eq(deliveryWindows.id, id));
    return result[0];
  }

  async getDeliveryWindowsByDate(date: string): Promise<DeliveryWindow[]> {
    return db.select().from(deliveryWindows).where(and(eq(deliveryWindows.date, date), eq(deliveryWindows.enabled, true))).orderBy(asc(deliveryWindows.startTime));
  }

  async createDeliveryWindow(window: InsertDeliveryWindow): Promise<DeliveryWindow> {
    const result = await db.insert(deliveryWindows).values({
      ...window,
      currentBookings: 0,
      createdAt: new Date()
    }).returning();
    return result[0];
  }

  async updateDeliveryWindow(id: number, window: Partial<InsertDeliveryWindow>): Promise<DeliveryWindow | undefined> {
    const result = await db
      .update(deliveryWindows)
      .set(window)
      .where(eq(deliveryWindows.id, id))
      .returning();
    
    return result[0];
  }

  async deleteDeliveryWindow(id: number): Promise<boolean> {
    const result = await db
      .delete(deliveryWindows)
      .where(eq(deliveryWindows.id, id))
      .returning();
    
    return result.length > 0;
  }

  // Weekly delivery template operations
  async getAllWeeklyDeliveryTemplates(): Promise<WeeklyDeliveryTemplate[]> {
    return db.select().from(weeklyDeliveryTemplates).orderBy(asc(weeklyDeliveryTemplates.dayOfWeek), asc(weeklyDeliveryTemplates.startTime));
  }

  async getWeeklyDeliveryTemplateByDay(dayOfWeek: number): Promise<WeeklyDeliveryTemplate[]> {
    return db.select().from(weeklyDeliveryTemplates).where(eq(weeklyDeliveryTemplates.dayOfWeek, dayOfWeek)).orderBy(asc(weeklyDeliveryTemplates.startTime));
  }

  async createWeeklyDeliveryTemplate(template: InsertWeeklyDeliveryTemplate): Promise<WeeklyDeliveryTemplate> {
    const result = await db.insert(weeklyDeliveryTemplates).values({
      ...template,
      createdAt: new Date(),
      updatedAt: new Date()
    }).returning();
    return result[0];
  }

  async updateWeeklyDeliveryTemplate(id: number, template: Partial<InsertWeeklyDeliveryTemplate>): Promise<WeeklyDeliveryTemplate | undefined> {
    const result = await db
      .update(weeklyDeliveryTemplates)
      .set({
        ...template,
        updatedAt: new Date()
      })
      .where(eq(weeklyDeliveryTemplates.id, id))
      .returning();
    
    return result[0];
  }

  async deleteWeeklyDeliveryTemplate(id: number): Promise<boolean> {
    const result = await db
      .delete(weeklyDeliveryTemplates)
      .where(eq(weeklyDeliveryTemplates.id, id))
      .returning();
    
    return result.length > 0;
  }

  async generateWindowsFromTemplates(daysAhead: number = 4): Promise<{ created: number; skipped: number }> {
    let created = 0;
    let skipped = 0;
    
    const templates = await this.getAllWeeklyDeliveryTemplates();
    if (templates.length === 0) {
      return { created, skipped };
    }
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    for (let dayOffset = 0; dayOffset <= daysAhead; dayOffset++) {
      const targetDate = new Date(today);
      targetDate.setDate(today.getDate() + dayOffset);
      const dayOfWeek = targetDate.getDay();
      
      const year = targetDate.getFullYear();
      const month = String(targetDate.getMonth() + 1).padStart(2, '0');
      const day = String(targetDate.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;
      
      const templatesForDay = templates.filter(t => t.dayOfWeek === dayOfWeek && t.enabled);
      
      for (const template of templatesForDay) {
        const existingWindows = await this.getDeliveryWindowsByDate(dateStr);
        const alreadyExists = existingWindows.some(
          w => w.startTime === template.startTime && w.endTime === template.endTime
        );
        
        if (alreadyExists) {
          skipped++;
          continue;
        }
        
        await this.createDeliveryWindow({
          date: dateStr,
          startTime: template.startTime,
          endTime: template.endTime,
          capacity: template.capacity,
          enabled: true,
        });
        created++;
      }
    }
    
    return { created, skipped };
  }

  // Cart operations
  async getCartItems(customerId: number): Promise<CartItem[]> {
    return db.select().from(cartItems).where(eq(cartItems.customerId, customerId)).orderBy(desc(cartItems.createdAt));
  }

  async addToCart(item: InsertCartItem): Promise<CartItem> {
    const result = await db.insert(cartItems).values({
      ...item,
      createdAt: new Date(),
      updatedAt: new Date()
    }).returning();
    
    // Track cart activity for abandoned cart detection
    await this.upsertCartReminder(item.customerId, { cartLastUpdated: new Date(), reminderCount: 0 });
    
    return result[0];
  }

  async updateCartItemQuantity(id: number, quantity: number): Promise<CartItem | undefined> {
    const result = await db
      .update(cartItems)
      .set({ 
        quantity,
        updatedAt: new Date()
      })
      .where(eq(cartItems.id, id))
      .returning();
    
    // Track cart activity for abandoned cart detection
    if (result[0]) {
      await this.upsertCartReminder(result[0].customerId, { cartLastUpdated: new Date(), reminderCount: 0 });
    }
    
    return result[0];
  }

  async removeFromCart(id: number): Promise<boolean> {
    const result = await db
      .delete(cartItems)
      .where(eq(cartItems.id, id))
      .returning();
    
    return result.length > 0;
  }

  async clearCart(customerId: number): Promise<boolean> {
    const result = await db
      .delete(cartItems)
      .where(eq(cartItems.customerId, customerId))
      .returning();
    
    // Clear cart reminder when cart is emptied (e.g., after checkout)
    if (result.length > 0) {
      await db.delete(cartReminders).where(eq(cartReminders.customerId, customerId));
    }
    
    return result.length > 0;
  }

  // Cart reminder operations
  async getCartReminder(customerId: number): Promise<CartReminder | undefined> {
    const result = await db.select().from(cartReminders).where(eq(cartReminders.customerId, customerId));
    return result[0];
  }

  async upsertCartReminder(customerId: number, updates: { lastReminderSent?: Date; reminderCount?: number; cartLastUpdated?: Date }): Promise<CartReminder> {
    const existing = await this.getCartReminder(customerId);
    
    if (existing) {
      const result = await db
        .update(cartReminders)
        .set({
          lastReminderSent: updates.lastReminderSent || existing.lastReminderSent,
          reminderCount: updates.reminderCount !== undefined ? updates.reminderCount : existing.reminderCount,
          cartLastUpdated: updates.cartLastUpdated || existing.cartLastUpdated,
        })
        .where(eq(cartReminders.customerId, customerId))
        .returning();
      return result[0];
    } else {
      const result = await db.insert(cartReminders).values({
        customerId,
        lastReminderSent: updates.lastReminderSent || null,
        reminderCount: updates.reminderCount || 0,
        cartLastUpdated: updates.cartLastUpdated || null,
      }).returning();
      return result[0];
    }
  }

  async getAbandonedCarts(hoursThreshold: number): Promise<Array<{ customerId: number; cartLastUpdated: Date; lastReminderSent: Date | null; reminderCount: number }>> {
    const thresholdDate = new Date(Date.now() - hoursThreshold * 60 * 60 * 1000);
    
    const result = await db
      .select({
        customerId: cartReminders.customerId,
        cartLastUpdated: cartReminders.cartLastUpdated,
        lastReminderSent: cartReminders.lastReminderSent,
        reminderCount: cartReminders.reminderCount,
      })
      .from(cartReminders)
      .where(
        and(
          lte(cartReminders.cartLastUpdated, thresholdDate)
        )
      );
    
    return result.filter(r => r.cartLastUpdated !== null) as Array<{ customerId: number; cartLastUpdated: Date; lastReminderSent: Date | null; reminderCount: number }>;
  }

  async getCustomersWithAbandonedCarts(hoursThreshold: number, maxReminders: number): Promise<Array<{ customer: DeliveryCustomer; cartItems: CartItem[]; cartValue: number }>> {
    const thresholdDate = new Date(Date.now() - hoursThreshold * 60 * 60 * 1000);
    
    // Get all customers with cart items
    const allCartItems = await db.select().from(cartItems);
    
    // Group by customer
    const customerCarts = new Map<number, CartItem[]>();
    for (const item of allCartItems) {
      if (!customerCarts.has(item.customerId)) {
        customerCarts.set(item.customerId, []);
      }
      customerCarts.get(item.customerId)!.push(item);
    }

    const results: Array<{ customer: DeliveryCustomer; cartItems: CartItem[]; cartValue: number }> = [];

    for (const [customerId, items] of customerCarts) {
      // Check if cart is old enough (last item update was before threshold)
      const latestUpdate = items.reduce((latest, item) => {
        const updateTime = item.updatedAt ? new Date(item.updatedAt).getTime() : 0;
        return updateTime > latest ? updateTime : latest;
      }, 0);

      if (latestUpdate > thresholdDate.getTime()) {
        continue; // Cart was updated recently, skip
      }

      // Check reminder count
      const reminder = await this.getCartReminder(customerId);
      if (reminder && reminder.reminderCount >= maxReminders) {
        continue; // Already sent max reminders
      }

      // Get customer details
      const customer = await this.getDeliveryCustomerById(customerId);
      if (!customer || customer.approvalStatus !== 'approved') {
        continue; // Only approved customers
      }

      // Calculate cart value
      let cartValue = 0;
      for (const item of items) {
        const product = await this.getDeliveryProduct(item.productId);
        if (product) {
          const price = product.salePrice && parseFloat(product.salePrice) > 0 
            ? parseFloat(product.salePrice) 
            : parseFloat(product.price);
          cartValue += price * item.quantity;
        }
      }

      results.push({ customer, cartItems: items, cartValue });
    }

    return results;
  }

  // Delivery order operations
  async createDeliveryOrder(order: InsertDeliveryOrder): Promise<DeliveryOrder> {
    const result = await db.insert(deliveryOrders).values({
      ...order,
      createdAt: new Date(),
      updatedAt: new Date()
    }).returning();
    return result[0];
  }

  async getOrdersByCustomer(customerId: number): Promise<DeliveryOrder[]> {
    return db.select().from(deliveryOrders).where(eq(deliveryOrders.customerId, customerId)).orderBy(desc(deliveryOrders.createdAt));
  }

  async getAllDeliveryOrders(): Promise<DeliveryOrder[]> {
    return db.select().from(deliveryOrders).orderBy(desc(deliveryOrders.createdAt));
  }

  async updateDeliveryOrderStatus(id: number, status: string): Promise<DeliveryOrder | undefined> {
    const result = await db
      .update(deliveryOrders)
      .set({ 
        status,
        updatedAt: new Date()
      })
      .where(eq(deliveryOrders.id, id))
      .returning();
    
    return result[0];
  }

  async updateDeliveryOrderCloverInfo(id: number, cloverChargeId: string, paymentStatus?: string): Promise<DeliveryOrder | undefined> {
    const updateData: any = { 
      cloverChargeId,
      updatedAt: new Date()
    };
    if (paymentStatus) {
      updateData.paymentStatus = paymentStatus;
    }
    const result = await db
      .update(deliveryOrders)
      .set(updateData)
      .where(eq(deliveryOrders.id, id))
      .returning();
    
    return result[0];
  }

  async getDeliveryOrderById(id: number): Promise<DeliveryOrder | undefined> {
    const result = await db.select().from(deliveryOrders).where(eq(deliveryOrders.id, id));
    return result[0];
  }

  async processRefund(id: number, refundAmount: string, refundReason: string, cloverRefundId?: string): Promise<DeliveryOrder | undefined> {
    const result = await db
      .update(deliveryOrders)
      .set({ 
        paymentStatus: 'refunded',
        refundAmount,
        refundReason,
        refundedAt: new Date(),
        cloverRefundId: cloverRefundId || null,
        updatedAt: new Date()
      })
      .where(eq(deliveryOrders.id, id))
      .returning();
    
    return result[0];
  }

  async deleteDeliveryOrder(id: number): Promise<boolean> {
    // First delete associated order items
    await db.delete(deliveryOrderItems).where(eq(deliveryOrderItems.orderId, id));
    // Then delete the order
    const result = await db.delete(deliveryOrders).where(eq(deliveryOrders.id, id)).returning();
    return result.length > 0;
  }

  // Order items operations
  async createDeliveryOrderItem(item: InsertDeliveryOrderItem): Promise<DeliveryOrderItem> {
    const result = await db.insert(deliveryOrderItems).values({
      ...item,
      createdAt: new Date()
    }).returning();
    return result[0];
  }

  async getDeliveryOrderItems(orderId: number): Promise<Array<DeliveryOrderItem & { product?: DeliveryProduct }>> {
    const items = await db.select().from(deliveryOrderItems).where(eq(deliveryOrderItems.orderId, orderId));
    
    // Get product details for each item
    const itemsWithProducts = await Promise.all(
      items.map(async (item) => {
        const products = await db.select().from(deliveryProducts).where(eq(deliveryProducts.id, item.productId));
        return {
          ...item,
          product: products[0]
        };
      })
    );
    
    return itemsWithProducts;
  }

  // Settings operations
  async getSetting(key: string): Promise<Setting | undefined> {
    const result = await db.select().from(settings).where(eq(settings.key, key));
    return result[0];
  }

  async getAllSettings(): Promise<Setting[]> {
    return db.select().from(settings).orderBy(asc(settings.key));
  }

  async upsertSetting(key: string, value: string, description?: string): Promise<Setting> {
    const existing = await this.getSetting(key);
    
    if (existing) {
      const result = await db
        .update(settings)
        .set({ 
          value,
          description: description || existing.description,
          updatedAt: new Date()
        })
        .where(eq(settings.key, key))
        .returning();
      return result[0];
    } else {
      const result = await db.insert(settings).values({
        key,
        value,
        description,
        updatedAt: new Date()
      }).returning();
      return result[0];
    }
  }

  // Clover OAuth token operations
  async getCloverOAuthToken(merchantId: string): Promise<CloverOAuthToken | undefined> {
    const result = await db.select().from(cloverOAuthTokens).where(eq(cloverOAuthTokens.merchantId, merchantId));
    return result[0];
  }

  async upsertCloverOAuthToken(token: InsertCloverOAuthToken): Promise<CloverOAuthToken> {
    const existing = await this.getCloverOAuthToken(token.merchantId);
    
    if (existing) {
      const result = await db
        .update(cloverOAuthTokens)
        .set({
          accessToken: token.accessToken,
          refreshToken: token.refreshToken,
          expiresAt: token.expiresAt,
          updatedAt: new Date()
        })
        .where(eq(cloverOAuthTokens.merchantId, token.merchantId))
        .returning();
      return result[0];
    } else {
      const result = await db.insert(cloverOAuthTokens).values({
        ...token,
        createdAt: new Date(),
        updatedAt: new Date()
      }).returning();
      return result[0];
    }
  }

  // Site Settings operations (concept1)
  async getSiteSettings(): Promise<SiteSettings> {
    const result = await db.select().from(siteSettings).limit(1);
    if (result.length === 0) {
      // Create default settings if none exist
      const defaultSettings = await db.insert(siteSettings).values({
        infoBarMessage: "Free delivery on orders over $100!",
        infoBarEnabled: true,
        freeDeliveryThreshold: "100",
        updatedAt: new Date()
      }).returning();
      return defaultSettings[0];
    }
    return result[0];
  }

  async updateSiteSettings(updates: Partial<InsertSiteSettings>): Promise<SiteSettings> {
    const current = await this.getSiteSettings();
    const result = await db
      .update(siteSettings)
      .set({
        ...updates,
        updatedAt: new Date()
      })
      .where(eq(siteSettings.id, current.id))
      .returning();
    return result[0];
  }

  // Hero Slides operations (concept1)
  async getAllHeroSlides(): Promise<HeroSlide[]> {
    return await db.select().from(heroSlides).orderBy(asc(heroSlides.displayOrder));
  }

  async getEnabledHeroSlides(): Promise<HeroSlide[]> {
    return await db.select().from(heroSlides)
      .where(eq(heroSlides.enabled, true))
      .orderBy(asc(heroSlides.displayOrder));
  }

  async getHeroSlide(id: number): Promise<HeroSlide | undefined> {
    const result = await db.select().from(heroSlides).where(eq(heroSlides.id, id));
    return result[0];
  }

  async createHeroSlide(slide: InsertHeroSlide): Promise<HeroSlide> {
    const result = await db.insert(heroSlides).values({
      ...slide,
      createdAt: new Date(),
      updatedAt: new Date()
    }).returning();
    return result[0];
  }

  async updateHeroSlide(id: number, slide: Partial<InsertHeroSlide>): Promise<HeroSlide | undefined> {
    const result = await db
      .update(heroSlides)
      .set({
        ...slide,
        updatedAt: new Date()
      })
      .where(eq(heroSlides.id, id))
      .returning();
    return result[0];
  }

  async deleteHeroSlide(id: number): Promise<boolean> {
    await db.delete(heroSlides).where(eq(heroSlides.id, id));
    return true;
  }

  // Category Banners operations
  async getAllCategoryBanners(): Promise<CategoryBanner[]> {
    return await db.select().from(categoryBanners).orderBy(asc(categoryBanners.displayOrder));
  }

  async getActiveCategoryBanners(): Promise<CategoryBanner[]> {
    return await db.select().from(categoryBanners)
      .where(eq(categoryBanners.isActive, true))
      .orderBy(asc(categoryBanners.displayOrder));
  }

  async getCategoryBanner(id: number): Promise<CategoryBanner | undefined> {
    const result = await db.select().from(categoryBanners).where(eq(categoryBanners.id, id));
    return result[0];
  }

  async createCategoryBanner(banner: InsertCategoryBanner): Promise<CategoryBanner> {
    const result = await db.insert(categoryBanners).values({
      ...banner,
      createdAt: new Date(),
      updatedAt: new Date()
    }).returning();
    return result[0];
  }

  async updateCategoryBanner(id: number, banner: Partial<InsertCategoryBanner>): Promise<CategoryBanner | undefined> {
    const result = await db
      .update(categoryBanners)
      .set({
        ...banner,
        updatedAt: new Date()
      })
      .where(eq(categoryBanners.id, id))
      .returning();
    return result[0];
  }

  async deleteCategoryBanner(id: number): Promise<boolean> {
    await db.delete(categoryBanners).where(eq(categoryBanners.id, id));
    return true;
  }

  // Delivery Categories operations
  async getAllDeliveryCategories(): Promise<DeliveryCategory[]> {
    return db.select().from(deliveryCategories).orderBy(asc(deliveryCategories.displayOrder));
  }

  async getActiveDeliveryCategories(): Promise<DeliveryCategory[]> {
    return db.select().from(deliveryCategories)
      .where(eq(deliveryCategories.isActive, true))
      .orderBy(asc(deliveryCategories.displayOrder));
  }

  async getDeliveryCategory(id: number): Promise<DeliveryCategory | undefined> {
    const result = await db.select().from(deliveryCategories).where(eq(deliveryCategories.id, id));
    return result[0];
  }

  async getDeliveryCategoryBySlug(slug: string): Promise<DeliveryCategory | undefined> {
    const result = await db.select().from(deliveryCategories).where(eq(deliveryCategories.slug, slug));
    return result[0];
  }

  async createDeliveryCategory(category: InsertDeliveryCategory): Promise<DeliveryCategory> {
    const result = await db.insert(deliveryCategories).values({
      ...category,
      createdAt: new Date(),
      updatedAt: new Date()
    }).returning();
    return result[0];
  }

  async updateDeliveryCategory(id: number, category: Partial<InsertDeliveryCategory>): Promise<DeliveryCategory | undefined> {
    const result = await db.update(deliveryCategories)
      .set({
        ...category,
        updatedAt: new Date()
      })
      .where(eq(deliveryCategories.id, id))
      .returning();
    return result[0];
  }

  async deleteDeliveryCategory(id: number): Promise<boolean> {
    await db.delete(deliveryCategories).where(eq(deliveryCategories.id, id));
    return true;
  }

  async reorderDeliveryCategories(orderedIds: number[]): Promise<boolean> {
    for (let i = 0; i < orderedIds.length; i++) {
      await db.update(deliveryCategories)
        .set({ displayOrder: i, updatedAt: new Date() })
        .where(eq(deliveryCategories.id, orderedIds[i]));
    }
    return true;
  }

  // Delivery Brands operations
  async getAllDeliveryBrands(): Promise<DeliveryBrand[]> {
    return db.select().from(deliveryBrands).orderBy(asc(deliveryBrands.displayOrder));
  }

  async getActiveDeliveryBrands(): Promise<DeliveryBrand[]> {
    return db.select().from(deliveryBrands)
      .where(eq(deliveryBrands.isActive, true))
      .orderBy(asc(deliveryBrands.displayOrder));
  }

  async getDeliveryBrandsByCategory(categoryId: number): Promise<DeliveryBrand[]> {
    return db.select().from(deliveryBrands)
      .where(eq(deliveryBrands.categoryId, categoryId))
      .orderBy(asc(deliveryBrands.displayOrder));
  }

  async getDeliveryBrand(id: number): Promise<DeliveryBrand | undefined> {
    const result = await db.select().from(deliveryBrands).where(eq(deliveryBrands.id, id));
    return result[0];
  }

  async getDeliveryBrandBySlug(slug: string): Promise<DeliveryBrand | undefined> {
    const result = await db.select().from(deliveryBrands).where(eq(deliveryBrands.slug, slug));
    return result[0];
  }

  async createDeliveryBrand(brand: InsertDeliveryBrand): Promise<DeliveryBrand> {
    const result = await db.insert(deliveryBrands).values({
      ...brand,
      createdAt: new Date(),
      updatedAt: new Date()
    }).returning();
    return result[0];
  }

  async updateDeliveryBrand(id: number, brand: Partial<InsertDeliveryBrand>): Promise<DeliveryBrand | undefined> {
    const result = await db.update(deliveryBrands)
      .set({
        ...brand,
        updatedAt: new Date()
      })
      .where(eq(deliveryBrands.id, id))
      .returning();
    return result[0];
  }

  async deleteDeliveryBrand(id: number): Promise<boolean> {
    await db.delete(deliveryBrands).where(eq(deliveryBrands.id, id));
    return true;
  }

  async reorderDeliveryBrands(categoryId: number, orderedIds: number[]): Promise<boolean> {
    for (let i = 0; i < orderedIds.length; i++) {
      await db.update(deliveryBrands)
        .set({ displayOrder: i, updatedAt: new Date() })
        .where(and(eq(deliveryBrands.id, orderedIds[i]), eq(deliveryBrands.categoryId, categoryId)));
    }
    return true;
  }

  // Delivery Product Lines operations
  async getAllDeliveryProductLines(): Promise<DeliveryProductLine[]> {
    return db.select().from(deliveryProductLines).orderBy(asc(deliveryProductLines.displayOrder));
  }

  async getActiveDeliveryProductLines(): Promise<DeliveryProductLine[]> {
    return db.select().from(deliveryProductLines)
      .where(eq(deliveryProductLines.isActive, true))
      .orderBy(asc(deliveryProductLines.displayOrder));
  }

  async getDeliveryProductLinesByBrand(brandId: number): Promise<DeliveryProductLine[]> {
    return db.select().from(deliveryProductLines)
      .where(eq(deliveryProductLines.brandId, brandId))
      .orderBy(asc(deliveryProductLines.displayOrder));
  }

  async getDeliveryProductLine(id: number): Promise<DeliveryProductLine | undefined> {
    const result = await db.select().from(deliveryProductLines).where(eq(deliveryProductLines.id, id));
    return result[0];
  }

  async getDeliveryProductLineBySlug(slug: string): Promise<DeliveryProductLine | undefined> {
    const result = await db.select().from(deliveryProductLines).where(eq(deliveryProductLines.slug, slug));
    return result[0];
  }

  async createDeliveryProductLine(productLine: InsertDeliveryProductLine): Promise<DeliveryProductLine> {
    const result = await db.insert(deliveryProductLines).values({
      ...productLine,
      createdAt: new Date(),
      updatedAt: new Date()
    }).returning();
    return result[0];
  }

  async updateDeliveryProductLine(id: number, productLine: Partial<InsertDeliveryProductLine>): Promise<DeliveryProductLine | undefined> {
    const result = await db.update(deliveryProductLines)
      .set({
        ...productLine,
        updatedAt: new Date()
      })
      .where(eq(deliveryProductLines.id, id))
      .returning();
    return result[0];
  }

  async deleteDeliveryProductLine(id: number): Promise<boolean> {
    await db.delete(deliveryProductLines).where(eq(deliveryProductLines.id, id));
    return true;
  }

  async reorderDeliveryProductLines(brandId: number, orderedIds: number[]): Promise<boolean> {
    for (let i = 0; i < orderedIds.length; i++) {
      await db.update(deliveryProductLines)
        .set({ displayOrder: i, updatedAt: new Date() })
        .where(and(eq(deliveryProductLines.id, orderedIds[i]), eq(deliveryProductLines.brandId, brandId)));
    }
    return true;
  }

  async deleteCloverOAuthToken(merchantId: string): Promise<boolean> {
    const result = await db.delete(cloverOAuthTokens).where(eq(cloverOAuthTokens.merchantId, merchantId));
    return true;
  }

  // Promotion operations
  async getAllPromotions(): Promise<Promotion[]> {
    return db.select().from(promotions).orderBy(desc(promotions.createdAt));
  }

  async getPromotion(id: number): Promise<Promotion | undefined> {
    const result = await db.select().from(promotions).where(eq(promotions.id, id));
    return result[0];
  }

  async getPromotionByCode(code: string): Promise<Promotion | undefined> {
    const result = await db.select().from(promotions).where(
      sql`UPPER(${promotions.code}) = UPPER(${code})`
    );
    return result[0];
  }

  async createPromotion(promotion: InsertPromotion): Promise<Promotion> {
    const result = await db.insert(promotions).values({
      ...promotion,
      code: promotion.code.toUpperCase(),
      currentUsageCount: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    }).returning();
    return result[0];
  }

  async updatePromotion(id: number, promotion: Partial<InsertPromotion>): Promise<Promotion | undefined> {
    const updateData: any = { ...promotion, updatedAt: new Date() };
    if (promotion.code) {
      updateData.code = promotion.code.toUpperCase();
    }
    const result = await db.update(promotions).set(updateData).where(eq(promotions.id, id)).returning();
    return result[0];
  }

  async deletePromotion(id: number): Promise<boolean> {
    const result = await db.delete(promotions).where(eq(promotions.id, id)).returning();
    return result.length > 0;
  }

  async incrementPromotionUsage(id: number): Promise<Promotion | undefined> {
    const result = await db.update(promotions).set({
      currentUsageCount: sql`${promotions.currentUsageCount} + 1`,
      updatedAt: new Date()
    }).where(eq(promotions.id, id)).returning();
    return result[0];
  }

  async validatePromoCode(code: string, customerId: number, orderSubtotal: number): Promise<{valid: boolean; promotion?: Promotion; errorMessage?: string; discountAmount?: number}> {
    const promotion = await this.getPromotionByCode(code);
    
    if (!promotion) {
      return { valid: false, errorMessage: "Invalid promo code" };
    }

    if (!promotion.enabled) {
      return { valid: false, errorMessage: "This promo code is no longer active" };
    }

    const now = new Date();
    if (now < new Date(promotion.validFrom)) {
      return { valid: false, errorMessage: "This promo code is not yet active" };
    }

    if (now > new Date(promotion.validUntil)) {
      return { valid: false, errorMessage: "This promo code has expired" };
    }

    if (promotion.maxUsageCount !== null && promotion.currentUsageCount >= promotion.maxUsageCount) {
      return { valid: false, errorMessage: "This promo code has reached its usage limit" };
    }

    const customerUsageCount = await this.getPromotionUsageCount(promotion.id, customerId);
    if (promotion.maxUsagePerCustomer !== null && customerUsageCount >= promotion.maxUsagePerCustomer) {
      return { valid: false, errorMessage: "You have already used this promo code" };
    }

    const minOrder = parseFloat(promotion.minimumOrderAmount?.toString() || "0");
    if (orderSubtotal < minOrder) {
      return { valid: false, errorMessage: `Minimum order amount is $${minOrder.toFixed(2)}` };
    }

    let discountAmount = 0;
    const discountValue = parseFloat(promotion.discountValue.toString());
    
    if (promotion.discountType === "percentage") {
      discountAmount = (orderSubtotal * discountValue) / 100;
    } else {
      discountAmount = Math.min(discountValue, orderSubtotal);
    }

    return { valid: true, promotion, discountAmount };
  }

  // Promotion usage operations
  async createPromotionUsage(usage: InsertPromotionUsage): Promise<PromotionUsage> {
    const result = await db.insert(promotionUsages).values({
      ...usage,
      usedAt: new Date()
    }).returning();
    return result[0];
  }

  async getPromotionUsagesByCustomer(customerId: number): Promise<PromotionUsage[]> {
    return db.select().from(promotionUsages).where(eq(promotionUsages.customerId, customerId));
  }

  async getPromotionUsageCount(promotionId: number, customerId: number): Promise<number> {
    const result = await db.select({ count: sql<number>`count(*)` }).from(promotionUsages).where(
      and(eq(promotionUsages.promotionId, promotionId), eq(promotionUsages.customerId, customerId))
    );
    return Number(result[0]?.count || 0);
  }
}

// Fallback to MemStorage if database connection fails
export class MemStorage implements IStorage {
  private usersMap: Map<number, User>;
  private brandCategoriesMap: Map<number, BrandCategory>;
  private brandsMap: Map<number, Brand>;
  private blogPostsMap: Map<number, BlogPost>;
  private storeLocationsMap: Map<number, StoreLocation>;
  private productCategoriesMap: Map<number, ProductCategory>;
  private productsMap: Map<number, Product>;
  private newsletterSubscriptionsMap: Map<number, NewsletterSubscription>;
  private deliveryCustomersMap: Map<number, DeliveryCustomer>;
  private deliveryProductsMap: Map<number, DeliveryProduct>;
  private deliveryWindowsMap: Map<number, DeliveryWindow>;
  private cartItemsMap: Map<number, CartItem>;
  private deliveryOrdersMap: Map<number, DeliveryOrder>;
  private settingsMap: Map<string, Setting>;
  
  private userCurrentId: number;
  private categoryCurrentId: number;
  private brandCurrentId: number;
  private blogPostCurrentId: number;
  private storeLocationCurrentId: number;
  private productCategoryCurrentId: number;
  private productCurrentId: number;
  private newsletterSubscriptionCurrentId: number;
  private deliveryCustomerCurrentId: number;
  private deliveryProductCurrentId: number;
  private deliveryWindowCurrentId: number;
  private cartItemCurrentId: number;
  private deliveryOrderCurrentId: number;
  private settingCurrentId: number;

  constructor() {
    this.usersMap = new Map();
    this.brandCategoriesMap = new Map();
    this.brandsMap = new Map();
    this.blogPostsMap = new Map();
    this.storeLocationsMap = new Map();
    this.productCategoriesMap = new Map();
    this.productsMap = new Map();
    this.newsletterSubscriptionsMap = new Map();
    this.deliveryCustomersMap = new Map();
    this.deliveryProductsMap = new Map();
    this.deliveryWindowsMap = new Map();
    this.cartItemsMap = new Map();
    this.deliveryOrdersMap = new Map();
    this.settingsMap = new Map();
    
    this.userCurrentId = 1;
    this.categoryCurrentId = 1;
    this.brandCurrentId = 1;
    this.blogPostCurrentId = 1;
    this.storeLocationCurrentId = 1;
    this.productCategoryCurrentId = 1;
    this.productCurrentId = 1;
    this.newsletterSubscriptionCurrentId = 1;
    this.deliveryCustomerCurrentId = 1;
    this.deliveryProductCurrentId = 1;
    this.deliveryWindowCurrentId = 1;
    this.cartItemCurrentId = 1;
    this.deliveryOrderCurrentId = 1;
    this.settingCurrentId = 1;
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.usersMap.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.usersMap.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userCurrentId++;
    
    // For memory storage, we'll hash the password too
    const hashedPassword = await bcrypt.hash(insertUser.password, 10);
    
    const user: User = { 
      ...insertUser, 
      id, 
      password: hashedPassword,
      isAdmin: insertUser.isAdmin || false
    };
    
    this.usersMap.set(id, user);
    return user;
  }

  async validateUser(username: string, password: string): Promise<User | null> {
    const user = await this.getUserByUsername(username);
    
    if (!user) {
      return null;
    }
    
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return null;
    }
    
    return user;
  }

  async getAllAdminUsers(): Promise<User[]> {
    return Array.from(this.usersMap.values()).filter(user => user.isAdmin);
  }

  async updateUserPassword(userId: number, currentPassword: string, newPassword: string): Promise<User | null> {
    const user = this.usersMap.get(userId);
    
    if (!user) {
      return null;
    }
    
    // Verify current password
    const isValid = await bcrypt.compare(currentPassword, user.password);
    if (!isValid) {
      return null;
    }
    
    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    // Update password
    const updatedUser = { ...user, password: hashedPassword };
    this.usersMap.set(userId, updatedUser);
    
    return updatedUser;
  }

  async updateUserUsername(userId: number, newUsername: string): Promise<User | undefined> {
    const user = this.usersMap.get(userId);
    
    if (!user) {
      return undefined;
    }
    
    const updatedUser = { ...user, username: newUsername };
    this.usersMap.set(userId, updatedUser);
    
    return updatedUser;
  }

  // Brand category operations
  async getAllBrandCategories(): Promise<BrandCategory[]> {
    return Array.from(this.brandCategoriesMap.values())
      .sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
  }

  async getBrandCategory(id: number): Promise<BrandCategory | undefined> {
    return this.brandCategoriesMap.get(id);
  }

  async createBrandCategory(category: InsertBrandCategory): Promise<BrandCategory> {
    const id = this.categoryCurrentId++;
    const newCategory: BrandCategory = { 
      ...category, 
      id,
      bgClass: category.bgClass ?? "bg-gradient-to-br from-gray-900 to-gray-800",
      displayOrder: category.displayOrder ?? 0,
      intervalMs: category.intervalMs ?? 5000
    };
    this.brandCategoriesMap.set(id, newCategory);
    return newCategory;
  }

  async updateBrandCategory(id: number, category: Partial<InsertBrandCategory>): Promise<BrandCategory | undefined> {
    const existingCategory = this.brandCategoriesMap.get(id);
    
    if (!existingCategory) {
      return undefined;
    }
    
    const updatedCategory: BrandCategory = { ...existingCategory, ...category };
    this.brandCategoriesMap.set(id, updatedCategory);
    return updatedCategory;
  }

  async deleteBrandCategory(id: number): Promise<boolean> {
    return this.brandCategoriesMap.delete(id);
  }

  // Brand operations
  async getAllBrands(): Promise<Brand[]> {
    return Array.from(this.brandsMap.values())
      .sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
  }

  async getBrandsByCategory(categoryId: number): Promise<Brand[]> {
    return Array.from(this.brandsMap.values())
      .filter(brand => brand.categoryId === categoryId)
      .sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
  }

  async getBrand(id: number): Promise<Brand | undefined> {
    return this.brandsMap.get(id);
  }

  async createBrand(brand: InsertBrand): Promise<Brand> {
    const id = this.brandCurrentId++;
    const newBrand: Brand = { 
      ...brand, 
      id,
      displayOrder: brand.displayOrder ?? 0,
      imageSize: brand.imageSize ?? "medium"
    };
    this.brandsMap.set(id, newBrand);
    return newBrand;
  }

  async updateBrand(id: number, brand: Partial<InsertBrand>): Promise<Brand | undefined> {
    const existingBrand = this.brandsMap.get(id);
    
    if (!existingBrand) {
      return undefined;
    }
    
    const updatedBrand: Brand = { ...existingBrand, ...brand };
    this.brandsMap.set(id, updatedBrand);
    return updatedBrand;
  }

  async deleteBrand(id: number): Promise<boolean> {
    return this.brandsMap.delete(id);
  }
  
  // Blog category operations have been removed

  // Blog post operations
  async getAllBlogPosts(includeUnpublished: boolean = false): Promise<BlogPost[]> {
    let posts = Array.from(this.blogPostsMap.values());
    
    if (!includeUnpublished) {
      posts = posts.filter(post => post.is_published);
    }
    
    return posts.sort((a, b) => {
      const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
      const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
      return dateB - dateA; // Sort by most recent first
    });
  }

  async getFeaturedBlogPosts(limit: number = 5): Promise<BlogPost[]> {
    const posts = Array.from(this.blogPostsMap.values())
      .filter(post => post.is_featured && post.is_published)
      .sort((a, b) => {
        const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
        const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
        return dateB - dateA; // Sort by most recent first
      });
    
    return posts.slice(0, limit);
  }

  async getBlogPost(id: number): Promise<BlogPost | undefined> {
    return this.blogPostsMap.get(id);
  }

  async getBlogPostBySlug(slug: string): Promise<BlogPost | undefined> {
    return Array.from(this.blogPostsMap.values()).find(
      (post) => post.slug === slug
    );
  }

  async createBlogPost(post: InsertBlogPost): Promise<BlogPost> {
    const id = this.blogPostCurrentId++;
    const now = new Date();
    
    // Create a properly typed BlogPost with all required fields
    const newPost: BlogPost = {
      id,
      title: post.title,
      slug: post.slug,
      summary: post.summary,
      content: post.content,
      featured_image: post.featured_image || null,
      is_featured: post.is_featured || false,
      is_published: post.is_published || true,
      meta_title: post.meta_title || null,
      meta_description: post.meta_description || null,
      view_count: 0,
      created_at: now,
      updated_at: now
    };
    
    this.blogPostsMap.set(id, newPost);
    return newPost;
  }

  async updateBlogPost(id: number, post: Partial<InsertBlogPost>): Promise<BlogPost | undefined> {
    const existingPost = this.blogPostsMap.get(id);
    
    if (!existingPost) {
      return undefined;
    }
    
    // Create a properly typed updated post
    const updatedPost: BlogPost = { ...existingPost };
    
    // Explicitly update only the fields that are provided
    if (post.title !== undefined) updatedPost.title = post.title;
    if (post.slug !== undefined) updatedPost.slug = post.slug;
    if (post.summary !== undefined) updatedPost.summary = post.summary;
    if (post.content !== undefined) updatedPost.content = post.content;
    if (post.featured_image !== undefined) updatedPost.featured_image = post.featured_image;
    if (post.meta_title !== undefined) updatedPost.meta_title = post.meta_title;
    if (post.meta_description !== undefined) updatedPost.meta_description = post.meta_description;
    if (post.is_featured !== undefined) updatedPost.is_featured = post.is_featured;
    if (post.is_published !== undefined) updatedPost.is_published = post.is_published;
    
    // Always update the updated_at timestamp
    updatedPost.updated_at = new Date();
    
    this.blogPostsMap.set(id, updatedPost);
    return updatedPost;
  }

  async deleteBlogPost(id: number): Promise<boolean> {
    return this.blogPostsMap.delete(id);
  }
  
  async incrementBlogPostViewCount(id: number): Promise<void> {
    const post = this.blogPostsMap.get(id);
    
    if (post) {
      post.view_count = (post.view_count || 0) + 1;
      this.blogPostsMap.set(id, post);
    }
  }

  // Store location operations
  async getAllStoreLocations(): Promise<StoreLocation[]> {
    return Array.from(this.storeLocationsMap.values());
  }

  async getStoreLocation(id: number): Promise<StoreLocation | undefined> {
    return this.storeLocationsMap.get(id);
  }

  async getStoreLocationByCity(city: string): Promise<StoreLocation | undefined> {
    return Array.from(this.storeLocationsMap.values()).find(
      (location) => location.city.toLowerCase() === city.toLowerCase()
    );
  }

  async createStoreLocation(location: InsertStoreLocation): Promise<StoreLocation> {
    const id = this.storeLocationCurrentId++;
    const now = new Date();
    
    const newLocation: StoreLocation = {
      ...location,
      id,
      created_at: now,
      updated_at: now
    };
    
    this.storeLocationsMap.set(id, newLocation);
    return newLocation;
  }

  async updateStoreLocation(id: number, location: Partial<InsertStoreLocation>): Promise<StoreLocation | undefined> {
    const existingLocation = this.storeLocationsMap.get(id);
    
    if (!existingLocation) {
      return undefined;
    }
    
    // Create an updated store location object
    const updatedLocation: StoreLocation = { 
      ...existingLocation,
      ...location,
      updated_at: new Date()
    };
    
    this.storeLocationsMap.set(id, updatedLocation);
    return updatedLocation;
  }

  async deleteStoreLocation(id: number): Promise<boolean> {
    return this.storeLocationsMap.delete(id);
  }
  
  // Product category operations
  async getAllProductCategories(): Promise<ProductCategory[]> {
    return Array.from(this.productCategoriesMap.values())
      .sort((a, b) => (a.display_order || 0) - (b.display_order || 0));
  }
  
  async getProductCategory(id: number): Promise<ProductCategory | undefined> {
    return this.productCategoriesMap.get(id);
  }
  
  async getProductCategoryBySlug(slug: string): Promise<ProductCategory | undefined> {
    return Array.from(this.productCategoriesMap.values()).find(
      (category) => category.slug === slug
    );
  }
  
  async createProductCategory(category: InsertProductCategory): Promise<ProductCategory> {
    const id = this.productCategoryCurrentId++;
    const now = new Date();
    
    const newCategory: ProductCategory = {
      ...category,
      id,
      created_at: now,
      updated_at: now
    };
    
    this.productCategoriesMap.set(id, newCategory);
    return newCategory;
  }
  
  async updateProductCategory(id: number, category: Partial<InsertProductCategory>): Promise<ProductCategory | undefined> {
    const existingCategory = this.productCategoriesMap.get(id);
    
    if (!existingCategory) {
      return undefined;
    }
    
    // Create a properly typed updated category
    const updatedCategory: ProductCategory = { 
      ...existingCategory,
      ...category,
      updated_at: new Date()
    };
    
    this.productCategoriesMap.set(id, updatedCategory);
    return updatedCategory;
  }
  
  async deleteProductCategory(id: number): Promise<boolean> {
    return this.productCategoriesMap.delete(id);
  }
  
  // Product operations
  async getAllProducts(): Promise<Product[]> {
    return Array.from(this.productsMap.values());
  }
  
  async getFeaturedProducts(limit: number = 10): Promise<Product[]> {
    const products = Array.from(this.productsMap.values())
      .filter(product => product.featured)
      .sort((a, b) => a.name.localeCompare(b.name));
    
    return products.slice(0, limit);
  }
  
  async getProductsByCategory(category: string): Promise<Product[]> {
    // First check if the category input is actually a numeric ID
    const categoryId = !isNaN(parseInt(category)) ? parseInt(category) : null;
    
    if (categoryId) {
      // If it's a valid category ID, filter by categoryId
      return Array.from(this.productsMap.values())
        .filter(product => product.categoryId === categoryId)
        .sort((a, b) => a.name.localeCompare(b.name));
    } else {
      // Otherwise filter by category slug
      return Array.from(this.productsMap.values())
        .filter(product => product.category === category)
        .sort((a, b) => a.name.localeCompare(b.name));
    }
  }
  
  async getProduct(id: number): Promise<Product | undefined> {
    return this.productsMap.get(id);
  }
  
  async createProduct(product: InsertProduct): Promise<Product> {
    const id = this.productCurrentId++;
    const now = new Date();
    
    // Create a product object with all fields from the form
    const productData: any = { ...product };
    
    // If no category ID provided but we have a category slug, try to find the category ID
    if (!productData.categoryId && productData.category) {
      try {
        const category = await this.getProductCategoryBySlug(productData.category);
        if (category) {
          productData.categoryId = category.id;
        }
      } catch (error) {
        console.error("Error finding category ID for slug:", error);
      }
    }
    
    const newProduct: Product = {
      ...productData,
      id,
      created_at: now,
      updated_at: now
    };
    
    this.productsMap.set(id, newProduct);
    return newProduct;
  }
  
  async updateProduct(id: number, product: Partial<InsertProduct>): Promise<Product | undefined> {
    const existingProduct = this.productsMap.get(id);
    
    if (!existingProduct) {
      return undefined;
    }
    
    // Make a copy of the product data
    const productData = { ...product };
    
    // If category has changed, try to update categoryId to match
    if (productData.category && !productData.categoryId) {
      try {
        const category = await this.getProductCategoryBySlug(productData.category);
        if (category) {
          productData.categoryId = category.id;
        }
      } catch (error) {
        console.error("Error finding category ID for slug:", error);
      }
    }
    
    const updatedProduct: Product = {
      ...existingProduct,
      ...productData,
      updated_at: new Date()
    };
    
    this.productsMap.set(id, updatedProduct);
    return updatedProduct;
  }
  
  async deleteProduct(id: number): Promise<boolean> {
    return this.productsMap.delete(id);
  }
  
  // Newsletter subscription operations
  async getAllNewsletterSubscriptions(): Promise<NewsletterSubscription[]> {
    return Array.from(this.newsletterSubscriptionsMap.values())
      .sort((a, b) => {
        const dateA = a.subscribed_at ? new Date(a.subscribed_at).getTime() : 0;
        const dateB = b.subscribed_at ? new Date(b.subscribed_at).getTime() : 0;
        return dateB - dateA; // Sort by most recent first
      });
  }
  
  async getNewsletterSubscriptionByEmail(email: string): Promise<NewsletterSubscription | undefined> {
    return Array.from(this.newsletterSubscriptionsMap.values()).find(
      (subscription) => subscription.email.toLowerCase() === email.toLowerCase()
    );
  }
  
  async createNewsletterSubscription(subscription: InsertNewsletterSubscription): Promise<NewsletterSubscription> {
    // Check if the email already exists
    const existing = await this.getNewsletterSubscriptionByEmail(subscription.email);
    
    if (existing) {
      // If it exists but is inactive, reactivate it
      if (!existing.is_active) {
        const updated = await this.toggleNewsletterSubscriptionStatus(existing.id, true);
        if (updated) {
          return updated;
        }
      }
      // Otherwise just return the existing one
      return existing;
    }
    
    const id = this.newsletterSubscriptionCurrentId++;
    const now = new Date();
    
    const newSubscription: NewsletterSubscription = {
      id,
      email: subscription.email,
      source: subscription.source || "website",
      ip_address: subscription.ip_address || "",
      subscribed_at: now,
      is_active: true,
      last_updated: now
    };
    
    this.newsletterSubscriptionsMap.set(id, newSubscription);
    return newSubscription;
  }
  
  async updateNewsletterSubscription(id: number, subscription: Partial<InsertNewsletterSubscription>): Promise<NewsletterSubscription | undefined> {
    const existingSubscription = this.newsletterSubscriptionsMap.get(id);
    
    if (!existingSubscription) {
      return undefined;
    }
    
    const updatedSubscription: NewsletterSubscription = {
      ...existingSubscription,
      ...subscription,
      last_updated: new Date()
    };
    
    this.newsletterSubscriptionsMap.set(id, updatedSubscription);
    return updatedSubscription;
  }
  
  async toggleNewsletterSubscriptionStatus(id: number, isActive: boolean): Promise<NewsletterSubscription | undefined> {
    const subscription = this.newsletterSubscriptionsMap.get(id);
    
    if (!subscription) {
      return undefined;
    }
    
    const updatedSubscription: NewsletterSubscription = {
      ...subscription,
      is_active: isActive,
      last_updated: new Date()
    };
    
    this.newsletterSubscriptionsMap.set(id, updatedSubscription);
    return updatedSubscription;
  }
  
  async deleteNewsletterSubscription(id: number): Promise<boolean> {
    return this.newsletterSubscriptionsMap.delete(id);
  }

  // Delivery customer operations
  async createDeliveryCustomer(customer: InsertDeliveryCustomer): Promise<DeliveryCustomer> {
    const id = this.deliveryCustomerCurrentId++;
    const now = new Date();
    
    const newCustomer: DeliveryCustomer = {
      id,
      ...customer,
      approvalStatus: "pending",
      approvedBy: null,
      approvedAt: null,
      rejectionReason: null,
      temporaryPassword: null,
      mustChangePassword: false,
      passwordResetToken: null,
      passwordResetExpiry: null,
      createdAt: now,
      updatedAt: now
    };
    
    this.deliveryCustomersMap.set(id, newCustomer);
    return newCustomer;
  }

  async getDeliveryCustomerById(id: number): Promise<DeliveryCustomer | undefined> {
    return this.deliveryCustomersMap.get(id);
  }

  async getDeliveryCustomerByEmail(email: string): Promise<DeliveryCustomer | undefined> {
    return Array.from(this.deliveryCustomersMap.values()).find(
      (customer) => customer.email === email
    );
  }

  async validateDeliveryCustomer(email: string, password: string): Promise<DeliveryCustomer | null> {
    const customer = await this.getDeliveryCustomerByEmail(email);
    if (!customer || !customer.passwordHash) {
      return null;
    }
    
    const isValid = await bcrypt.compare(password, customer.passwordHash);
    return isValid ? customer : null;
  }

  async getAllDeliveryCustomers(): Promise<DeliveryCustomer[]> {
    return Array.from(this.deliveryCustomersMap.values())
      .sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dateB - dateA;
      });
  }

  async getPendingDeliveryCustomers(): Promise<DeliveryCustomer[]> {
    return Array.from(this.deliveryCustomersMap.values())
      .filter(customer => customer.approvalStatus === "pending")
      .sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dateB - dateA;
      });
  }

  async updateDeliveryCustomerApproval(id: number, approvalStatus: string, approvedBy?: number, rejectionReason?: string): Promise<DeliveryCustomer | undefined> {
    const customer = this.deliveryCustomersMap.get(id);
    
    if (!customer) {
      return undefined;
    }
    
    const updatedCustomer: DeliveryCustomer = {
      ...customer,
      approvalStatus,
      updatedAt: new Date()
    };
    
    if (approvalStatus === "approved") {
      updatedCustomer.approvedBy = approvedBy || null;
      updatedCustomer.approvedAt = new Date();
      updatedCustomer.rejectionReason = null;
    } else if (approvalStatus === "rejected") {
      updatedCustomer.rejectionReason = rejectionReason || null;
      updatedCustomer.approvedBy = approvedBy || null;
      updatedCustomer.approvedAt = null;
    }
    
    this.deliveryCustomersMap.set(id, updatedCustomer);
    return updatedCustomer;
  }

  async updateDeliveryCustomerPassword(id: number, passwordHash: string | null, mustChangePassword: boolean): Promise<DeliveryCustomer | undefined> {
    const customer = this.deliveryCustomersMap.get(id);
    
    if (!customer) {
      return undefined;
    }
    
    const updatedCustomer: DeliveryCustomer = {
      ...customer,
      passwordHash,
      mustChangePassword,
      updatedAt: new Date()
    };
    
    this.deliveryCustomersMap.set(id, updatedCustomer);
    return updatedCustomer;
  }

  async setPasswordSetupToken(id: number, token: string, expiryDate: Date): Promise<DeliveryCustomer | undefined> {
    const customer = this.deliveryCustomersMap.get(id);
    
    if (!customer) {
      return undefined;
    }
    
    const updatedCustomer: DeliveryCustomer = {
      ...customer,
      passwordSetupToken: token,
      passwordSetupTokenExpiry: expiryDate,
      updatedAt: new Date()
    };
    
    this.deliveryCustomersMap.set(id, updatedCustomer);
    return updatedCustomer;
  }

  async getDeliveryCustomerByPasswordSetupToken(token: string): Promise<DeliveryCustomer | undefined> {
    return Array.from(this.deliveryCustomersMap.values()).find(
      (customer) => customer.passwordSetupToken === token
    );
  }

  async setDeliveryCustomerPassword(id: number, passwordHash: string): Promise<DeliveryCustomer | undefined> {
    const customer = this.deliveryCustomersMap.get(id);
    
    if (!customer) {
      return undefined;
    }
    
    const updatedCustomer: DeliveryCustomer = {
      ...customer,
      passwordHash,
      passwordSetupToken: null,
      passwordSetupTokenExpiry: null,
      mustChangePassword: false,
      updatedAt: new Date()
    };
    
    this.deliveryCustomersMap.set(id, updatedCustomer);
    return updatedCustomer;
  }

  async deleteDeliveryCustomer(id: number): Promise<boolean> {
    return this.deliveryCustomersMap.delete(id);
  }

  async updateDeliveryCustomer(id: number, data: Partial<Pick<DeliveryCustomer, 'fullName' | 'phone' | 'address' | 'city' | 'state' | 'zipCode'>>): Promise<DeliveryCustomer | undefined> {
    const customer = this.deliveryCustomersMap.get(id);
    
    if (!customer) {
      return undefined;
    }
    
    const updatedCustomer: DeliveryCustomer = {
      ...customer,
      ...data,
      updatedAt: new Date()
    };
    
    this.deliveryCustomersMap.set(id, updatedCustomer);
    return updatedCustomer;
  }

  // Delivery product operations
  async getAllDeliveryProducts(filters?: {
    search?: string;
    category?: string;
    enabled?: boolean | 'all';
    limit?: number;
    offset?: number;
  }): Promise<{products: DeliveryProduct[]; totalCount: number}> {
    let products = Array.from(this.deliveryProductsMap.values());

    // Apply filters
    if (filters?.search) {
      const searchLower = filters.search.toLowerCase();
      products = products.filter(p => 
        p.name.toLowerCase().includes(searchLower) ||
        p.description?.toLowerCase().includes(searchLower) ||
        p.cloverItemId?.toLowerCase().includes(searchLower)
      );
    }

    if (filters?.category) {
      products = products.filter(p => p.category === filters.category);
    }

    if (filters?.enabled !== undefined && filters.enabled !== 'all') {
      products = products.filter(p => p.enabled === filters.enabled);
    }

    // Sort by display order
    products.sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));

    const totalCount = products.length;

    // Apply pagination
    const offset = filters?.offset || 0;
    const limit = filters?.limit || totalCount;
    products = products.slice(offset, offset + limit);

    return { products, totalCount };
  }

  async getDeliveryProduct(id: number): Promise<DeliveryProduct | undefined> {
    return this.deliveryProductsMap.get(id);
  }

  async getEnabledDeliveryProducts(): Promise<DeliveryProduct[]> {
    return Array.from(this.deliveryProductsMap.values())
      .filter(product => product.enabled)
      .sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
  }

  async getDeliveryProductByCloverItemId(cloverItemId: string): Promise<DeliveryProduct | undefined> {
    return Array.from(this.deliveryProductsMap.values()).find(
      product => product.cloverItemId === cloverItemId
    );
  }

  async createDeliveryProduct(product: InsertDeliveryProduct): Promise<DeliveryProduct> {
    const id = this.deliveryProductCurrentId++;
    const now = new Date();
    
    const newProduct: DeliveryProduct = {
      id,
      ...product,
      displayOrder: product.displayOrder ?? null,
      badge: product.badge ?? null,
      isFeaturedSlideshow: product.isFeaturedSlideshow ?? null,
      slideshowPosition: product.slideshowPosition ?? null,
      stockQuantity: product.stockQuantity ?? null,
      enabled: product.enabled ?? null,
      createdAt: now,
      updatedAt: now
    };
    
    this.deliveryProductsMap.set(id, newProduct);
    return newProduct;
  }

  async updateDeliveryProduct(id: number, product: Partial<InsertDeliveryProduct>): Promise<DeliveryProduct | undefined> {
    const existingProduct = this.deliveryProductsMap.get(id);
    
    if (!existingProduct) {
      return undefined;
    }
    
    const updatedProduct: DeliveryProduct = {
      ...existingProduct,
      ...product,
      updatedAt: new Date()
    };
    
    this.deliveryProductsMap.set(id, updatedProduct);
    return updatedProduct;
  }

  async deleteDeliveryProduct(id: number): Promise<boolean> {
    return this.deliveryProductsMap.delete(id);
  }

  async syncProductsFromClover(products: Array<Partial<InsertDeliveryProduct>>): Promise<{synced: number, updated: number, created: number, deleted: number}> {
    let synced = 0;
    let updated = 0;
    let created = 0;
    let deleted = 0;

    const processedIds = new Set<string>();

    for (const product of products) {
      if (!product.cloverItemId) continue;
      
      if (processedIds.has(product.cloverItemId)) continue;
      processedIds.add(product.cloverItemId);

      const existing = await this.getDeliveryProductByCloverItemId(product.cloverItemId);
      
      if (existing) {
        // Update existing product but preserve admin settings
        await this.updateDeliveryProduct(existing.id, {
          name: product.name,
          price: product.price,
          image: product.image,
          description: product.description,
          category: product.category,
          stockQuantity: product.stockQuantity,
        });
        updated++;
      } else {
        // Create new product
        await this.createDeliveryProduct(product as InsertDeliveryProduct);
        created++;
      }
      synced++;
    }

    // Remove products that exist locally but not in Clover anymore
    for (const [id, product] of this.deliveryProductsMap) {
      if (product.cloverItemId && !processedIds.has(product.cloverItemId)) {
        this.deliveryProductsMap.delete(id);
        deleted++;
      }
    }

    return { synced, updated, created, deleted };
  }

  async refreshProductStockAndPrice(cloverItemId: string, stockQuantity: string, price: string): Promise<DeliveryProduct | undefined> {
    const existing = await this.getDeliveryProductByCloverItemId(cloverItemId);
    if (!existing) return undefined;

    return this.updateDeliveryProduct(existing.id, { stockQuantity, price });
  }

  // Delivery window operations
  async getAllDeliveryWindows(): Promise<DeliveryWindow[]> {
    return Array.from(this.deliveryWindowsMap.values())
      .filter(window => window.enabled)
      .sort((a, b) => {
        if (a.date !== b.date) {
          return a.date.localeCompare(b.date);
        }
        return a.startTime.localeCompare(b.startTime);
      });
  }

  async getDeliveryWindowById(id: number): Promise<DeliveryWindow | undefined> {
    return this.deliveryWindowsMap.get(id);
  }

  async getDeliveryWindowsByDate(date: string): Promise<DeliveryWindow[]> {
    return Array.from(this.deliveryWindowsMap.values())
      .filter(window => window.date === date && window.enabled)
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
  }

  async createDeliveryWindow(window: InsertDeliveryWindow): Promise<DeliveryWindow> {
    const id = this.deliveryWindowCurrentId++;
    
    const newWindow: DeliveryWindow = {
      id,
      ...window,
      capacity: window.capacity ?? 10,
      enabled: window.enabled ?? true,
      currentBookings: 0,
      createdAt: new Date()
    };
    
    this.deliveryWindowsMap.set(id, newWindow);
    return newWindow;
  }

  async updateDeliveryWindow(id: number, window: Partial<InsertDeliveryWindow>): Promise<DeliveryWindow | undefined> {
    const existingWindow = this.deliveryWindowsMap.get(id);
    
    if (!existingWindow) {
      return undefined;
    }
    
    const updatedWindow: DeliveryWindow = {
      ...existingWindow,
      ...window
    };
    
    this.deliveryWindowsMap.set(id, updatedWindow);
    return updatedWindow;
  }

  async deleteDeliveryWindow(id: number): Promise<boolean> {
    return this.deliveryWindowsMap.delete(id);
  }

  // Cart operations
  async getCartItems(customerId: number): Promise<CartItem[]> {
    return Array.from(this.cartItemsMap.values())
      .filter(item => item.customerId === customerId)
      .sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dateB - dateA;
      });
  }

  async addToCart(item: InsertCartItem): Promise<CartItem> {
    const id = this.cartItemCurrentId++;
    const now = new Date();
    
    const newCartItem: CartItem = {
      id,
      ...item,
      quantity: item.quantity ?? 1,
      createdAt: now,
      updatedAt: now
    };
    
    this.cartItemsMap.set(id, newCartItem);
    return newCartItem;
  }

  async updateCartItemQuantity(id: number, quantity: number): Promise<CartItem | undefined> {
    const cartItem = this.cartItemsMap.get(id);
    
    if (!cartItem) {
      return undefined;
    }
    
    const updatedCartItem: CartItem = {
      ...cartItem,
      quantity,
      updatedAt: new Date()
    };
    
    this.cartItemsMap.set(id, updatedCartItem);
    return updatedCartItem;
  }

  async removeFromCart(id: number): Promise<boolean> {
    return this.cartItemsMap.delete(id);
  }

  async clearCart(customerId: number): Promise<boolean> {
    const itemsToDelete = Array.from(this.cartItemsMap.entries())
      .filter(([_, item]) => item.customerId === customerId);
    
    itemsToDelete.forEach(([id, _]) => {
      this.cartItemsMap.delete(id);
    });
    
    return itemsToDelete.length > 0;
  }

  // Cart reminder operations (stubs for MemStorage - not used in production)
  async getCartReminder(customerId: number): Promise<CartReminder | undefined> {
    return undefined;
  }

  async upsertCartReminder(customerId: number, updates: { lastReminderSent?: Date; reminderCount?: number; cartLastUpdated?: Date }): Promise<CartReminder> {
    return {
      id: 1,
      customerId,
      lastReminderSent: updates.lastReminderSent || null,
      reminderCount: updates.reminderCount || 0,
      cartLastUpdated: updates.cartLastUpdated || null,
      createdAt: new Date(),
    };
  }

  async getAbandonedCarts(hoursThreshold: number): Promise<Array<{ customerId: number; cartLastUpdated: Date; lastReminderSent: Date | null; reminderCount: number }>> {
    return [];
  }

  async getCustomersWithAbandonedCarts(hoursThreshold: number, maxReminders: number): Promise<Array<{ customer: DeliveryCustomer; cartItems: CartItem[]; cartValue: number }>> {
    return [];
  }

  // Delivery order operations
  async createDeliveryOrder(order: InsertDeliveryOrder): Promise<DeliveryOrder> {
    const id = this.deliveryOrderCurrentId++;
    const now = new Date();
    
    const newOrder: DeliveryOrder = {
      id,
      ...order,
      status: order.status ?? "pending",
      deliveryFee: order.deliveryFee ?? "0",
      cloverPaymentId: order.cloverPaymentId ?? null,
      notes: order.notes ?? null,
      createdAt: now,
      updatedAt: now
    };
    
    this.deliveryOrdersMap.set(id, newOrder);
    return newOrder;
  }

  async getOrdersByCustomer(customerId: number): Promise<DeliveryOrder[]> {
    return Array.from(this.deliveryOrdersMap.values())
      .filter(order => order.customerId === customerId)
      .sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dateB - dateA;
      });
  }

  async getAllDeliveryOrders(): Promise<DeliveryOrder[]> {
    return Array.from(this.deliveryOrdersMap.values())
      .sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dateB - dateA;
      });
  }

  async updateDeliveryOrderStatus(id: number, status: string): Promise<DeliveryOrder | undefined> {
    const order = this.deliveryOrdersMap.get(id);
    
    if (!order) {
      return undefined;
    }
    
    const updatedOrder: DeliveryOrder = {
      ...order,
      status,
      updatedAt: new Date()
    };
    
    this.deliveryOrdersMap.set(id, updatedOrder);
    return updatedOrder;
  }

  async updateDeliveryOrderCloverInfo(id: number, cloverChargeId: string, paymentStatus?: string): Promise<DeliveryOrder | undefined> {
    const order = this.deliveryOrdersMap.get(id);
    
    if (!order) {
      return undefined;
    }
    
    const updatedOrder: DeliveryOrder = {
      ...order,
      cloverChargeId,
      paymentStatus: paymentStatus || order.paymentStatus,
      updatedAt: new Date()
    };
    
    this.deliveryOrdersMap.set(id, updatedOrder);
    return updatedOrder;
  }

  async getDeliveryOrderById(id: number): Promise<DeliveryOrder | undefined> {
    return this.deliveryOrdersMap.get(id);
  }

  async processRefund(id: number, refundAmount: string, refundReason: string, cloverRefundId?: string): Promise<DeliveryOrder | undefined> {
    const order = this.deliveryOrdersMap.get(id);
    
    if (!order) {
      return undefined;
    }
    
    const updatedOrder: DeliveryOrder = {
      ...order,
      paymentStatus: 'refunded',
      refundAmount,
      refundReason,
      refundedAt: new Date(),
      cloverRefundId: cloverRefundId || null,
      updatedAt: new Date()
    };
    
    this.deliveryOrdersMap.set(id, updatedOrder);
    return updatedOrder;
  }

  async deleteDeliveryOrder(id: number): Promise<boolean> {
    // Delete associated order items
    for (const [itemId, item] of this.orderItemsMap) {
      if (item.orderId === id) {
        this.orderItemsMap.delete(itemId);
      }
    }
    // Delete the order
    return this.deliveryOrdersMap.delete(id);
  }

  // Order items operations
  private orderItemsMap = new Map<number, DeliveryOrderItem>();
  private orderItemCurrentId = 1;

  async createDeliveryOrderItem(item: InsertDeliveryOrderItem): Promise<DeliveryOrderItem> {
    const id = this.orderItemCurrentId++;
    const now = new Date();
    
    const newItem: DeliveryOrderItem = {
      id,
      orderId: item.orderId,
      productId: item.productId,
      quantity: item.quantity,
      price: item.price,
      createdAt: now
    };
    
    this.orderItemsMap.set(id, newItem);
    return newItem;
  }

  async getDeliveryOrderItems(orderId: number): Promise<Array<DeliveryOrderItem & { product?: DeliveryProduct }>> {
    const items = Array.from(this.orderItemsMap.values()).filter(item => item.orderId === orderId);
    
    return items.map(item => {
      const product = this.deliveryProductsMap.get(item.productId);
      return {
        ...item,
        product
      };
    });
  }

  // Settings operations
  async getSetting(key: string): Promise<Setting | undefined> {
    return this.settingsMap.get(key);
  }

  async getAllSettings(): Promise<Setting[]> {
    return Array.from(this.settingsMap.values())
      .sort((a, b) => a.key.localeCompare(b.key));
  }

  async upsertSetting(key: string, value: string, description?: string): Promise<Setting> {
    const existing = this.settingsMap.get(key);
    
    const setting: Setting = {
      id: existing?.id || this.settingCurrentId++,
      key,
      value,
      description: description || existing?.description || null,
      updatedAt: new Date()
    };
    
    this.settingsMap.set(key, setting);
    return setting;
  }

  // Clover OAuth token operations (stub - not used in memory storage)
  async getCloverOAuthToken(merchantId: string): Promise<CloverOAuthToken | undefined> {
    return undefined;
  }

  async upsertCloverOAuthToken(token: InsertCloverOAuthToken): Promise<CloverOAuthToken> {
    const now = new Date();
    return {
      id: 1,
      merchantId: token.merchantId,
      accessToken: token.accessToken,
      refreshToken: token.refreshToken,
      expiresAt: token.expiresAt,
      createdAt: now,
      updatedAt: now
    };
  }

  async deleteCloverOAuthToken(merchantId: string): Promise<boolean> {
    return true;
  }

  // Bulk delivery product operations (stub - not used in memory storage)
  async bulkUpdateDeliveryProducts(productIds: number[], updates: Partial<InsertDeliveryProduct>): Promise<{ updated: number }> {
    return { updated: 0 };
  }

  async bulkDeleteDeliveryProducts(productIds: number[]): Promise<{ deleted: number }> {
    return { deleted: 0 };
  }

  // Weekly delivery template operations (stub - not used in memory storage)
  async getAllWeeklyDeliveryTemplates(): Promise<WeeklyDeliveryTemplate[]> {
    return [];
  }

  async getWeeklyDeliveryTemplateByDay(dayOfWeek: number): Promise<WeeklyDeliveryTemplate[]> {
    return [];
  }

  async createWeeklyDeliveryTemplate(template: InsertWeeklyDeliveryTemplate): Promise<WeeklyDeliveryTemplate> {
    const now = new Date();
    return {
      id: 1,
      dayOfWeek: template.dayOfWeek,
      startTime: template.startTime,
      endTime: template.endTime,
      capacity: template.capacity,
      enabled: template.enabled,
      createdAt: now,
      updatedAt: now
    };
  }

  async updateWeeklyDeliveryTemplate(id: number, template: Partial<InsertWeeklyDeliveryTemplate>): Promise<WeeklyDeliveryTemplate | undefined> {
    return undefined;
  }

  async deleteWeeklyDeliveryTemplate(id: number): Promise<boolean> {
    return true;
  }

  async generateWindowsFromTemplates(daysAhead: number = 4): Promise<{ created: number; skipped: number }> {
    let created = 0;
    let skipped = 0;
    
    const templates = await this.getAllWeeklyDeliveryTemplates();
    if (templates.length === 0) {
      return { created, skipped };
    }
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    for (let dayOffset = 0; dayOffset <= daysAhead; dayOffset++) {
      const targetDate = new Date(today);
      targetDate.setDate(today.getDate() + dayOffset);
      const dayOfWeek = targetDate.getDay();
      
      const year = targetDate.getFullYear();
      const month = String(targetDate.getMonth() + 1).padStart(2, '0');
      const day = String(targetDate.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;
      
      const templatesForDay = templates.filter(t => t.dayOfWeek === dayOfWeek && t.enabled);
      
      for (const template of templatesForDay) {
        const existingWindows = await this.getDeliveryWindowsByDate(dateStr);
        const alreadyExists = existingWindows.some(
          w => w.startTime === template.startTime && w.endTime === template.endTime
        );
        
        if (alreadyExists) {
          skipped++;
          continue;
        }
        
        await this.createDeliveryWindow({
          date: dateStr,
          startTime: template.startTime,
          endTime: template.endTime,
          capacity: template.capacity,
          enabled: true,
        });
        created++;
      }
    }
    
    return { created, skipped };
  }

  // Site Settings operations (stub - not used in memory storage)
  async getSiteSettings(): Promise<SiteSettings> {
    const now = new Date();
    return {
      id: 1,
      infoBarMessage: "Free delivery on orders over $100!",
      infoBarEnabled: true,
      freeDeliveryThreshold: "100",
      updatedAt: now
    };
  }

  async updateSiteSettings(updates: Partial<InsertSiteSettings>): Promise<SiteSettings> {
    return this.getSiteSettings();
  }

  // Hero Slides operations (stub - not used in memory storage)
  async getAllHeroSlides(): Promise<HeroSlide[]> {
    return [];
  }

  async getEnabledHeroSlides(): Promise<HeroSlide[]> {
    return [];
  }

  async getHeroSlide(id: number): Promise<HeroSlide | undefined> {
    return undefined;
  }

  async createHeroSlide(slide: InsertHeroSlide): Promise<HeroSlide> {
    const now = new Date();
    return {
      id: 1,
      title: slide.title,
      subtitle: slide.subtitle || null,
      image: slide.image,
      buttonText: slide.buttonText || null,
      buttonLink: slide.buttonLink || null,
      displayOrder: slide.displayOrder || 0,
      enabled: slide.enabled !== undefined ? slide.enabled : true,
      createdAt: now,
      updatedAt: now
    };
  }

  async updateHeroSlide(id: number, slide: Partial<InsertHeroSlide>): Promise<HeroSlide | undefined> {
    return undefined;
  }

  async deleteHeroSlide(id: number): Promise<boolean> {
    return true;
  }

  // Category Banners operations (stub - not used in memory storage)
  async getAllCategoryBanners(): Promise<CategoryBanner[]> {
    return [];
  }

  async getActiveCategoryBanners(): Promise<CategoryBanner[]> {
    return [];
  }

  async getCategoryBanner(id: number): Promise<CategoryBanner | undefined> {
    return undefined;
  }

  async createCategoryBanner(banner: InsertCategoryBanner): Promise<CategoryBanner> {
    const now = new Date();
    return {
      id: 1,
      categoryId: banner.categoryId,
      title: banner.title || null,
      subtitle: banner.subtitle || null,
      image: banner.image,
      buttonText: banner.buttonText || "Shop Now",
      buttonLink: banner.buttonLink || null,
      displayOrder: banner.displayOrder || 0,
      isActive: banner.isActive !== undefined ? banner.isActive : true,
      createdAt: now,
      updatedAt: now
    };
  }

  async updateCategoryBanner(id: number, banner: Partial<InsertCategoryBanner>): Promise<CategoryBanner | undefined> {
    return undefined;
  }

  async deleteCategoryBanner(id: number): Promise<boolean> {
    return true;
  }

  // Promotion operations (stub - not used in memory storage)
  async getAllPromotions(): Promise<Promotion[]> {
    return [];
  }

  async getPromotion(id: number): Promise<Promotion | undefined> {
    return undefined;
  }

  async getPromotionByCode(code: string): Promise<Promotion | undefined> {
    return undefined;
  }

  async createPromotion(promotion: InsertPromotion): Promise<Promotion> {
    const now = new Date();
    return {
      id: 1,
      code: promotion.code.toUpperCase(),
      description: promotion.description || null,
      discountType: promotion.discountType,
      discountValue: promotion.discountValue,
      minimumOrderAmount: promotion.minimumOrderAmount || "0",
      maxUsageCount: promotion.maxUsageCount || null,
      currentUsageCount: 0,
      maxUsagePerCustomer: promotion.maxUsagePerCustomer || 1,
      validFrom: promotion.validFrom,
      validUntil: promotion.validUntil,
      enabled: promotion.enabled !== undefined ? promotion.enabled : true,
      createdAt: now,
      updatedAt: now
    };
  }

  async updatePromotion(id: number, promotion: Partial<InsertPromotion>): Promise<Promotion | undefined> {
    return undefined;
  }

  async deletePromotion(id: number): Promise<boolean> {
    return true;
  }

  async incrementPromotionUsage(id: number): Promise<Promotion | undefined> {
    return undefined;
  }

  async validatePromoCode(code: string, customerId: number, orderSubtotal: number): Promise<{valid: boolean; promotion?: Promotion; errorMessage?: string; discountAmount?: number}> {
    return { valid: false, errorMessage: "Promotions not supported in memory storage" };
  }

  async createPromotionUsage(usage: InsertPromotionUsage): Promise<PromotionUsage> {
    return {
      id: 1,
      promotionId: usage.promotionId,
      customerId: usage.customerId,
      orderId: usage.orderId,
      discountAmount: usage.discountAmount,
      usedAt: new Date()
    };
  }

  async getPromotionUsagesByCustomer(customerId: number): Promise<PromotionUsage[]> {
    return [];
  }

  async getPromotionUsageCount(promotionId: number, customerId: number): Promise<number> {
    return 0;
  }

  // Delivery Categories operations (stub)
  async getAllDeliveryCategories(): Promise<DeliveryCategory[]> {
    return [];
  }

  async getActiveDeliveryCategories(): Promise<DeliveryCategory[]> {
    return [];
  }

  async getDeliveryCategory(id: number): Promise<DeliveryCategory | undefined> {
    return undefined;
  }

  async getDeliveryCategoryBySlug(slug: string): Promise<DeliveryCategory | undefined> {
    return undefined;
  }

  async createDeliveryCategory(category: InsertDeliveryCategory): Promise<DeliveryCategory> {
    const now = new Date();
    return {
      id: 1,
      name: category.name,
      slug: category.slug,
      image: category.image || null,
      displayOrder: category.displayOrder || 0,
      isActive: category.isActive ?? true,
      createdAt: now,
      updatedAt: now
    };
  }

  async updateDeliveryCategory(id: number, category: Partial<InsertDeliveryCategory>): Promise<DeliveryCategory | undefined> {
    return undefined;
  }

  async deleteDeliveryCategory(id: number): Promise<boolean> {
    return true;
  }

  async reorderDeliveryCategories(orderedIds: number[]): Promise<boolean> {
    return true;
  }

  // Delivery Brands operations (stub)
  async getAllDeliveryBrands(): Promise<DeliveryBrand[]> {
    return [];
  }

  async getActiveDeliveryBrands(): Promise<DeliveryBrand[]> {
    return [];
  }

  async getDeliveryBrandsByCategory(categoryId: number): Promise<DeliveryBrand[]> {
    return [];
  }

  async getDeliveryBrand(id: number): Promise<DeliveryBrand | undefined> {
    return undefined;
  }

  async getDeliveryBrandBySlug(slug: string): Promise<DeliveryBrand | undefined> {
    return undefined;
  }

  async createDeliveryBrand(brand: InsertDeliveryBrand): Promise<DeliveryBrand> {
    const now = new Date();
    return {
      id: 1,
      name: brand.name,
      slug: brand.slug,
      categoryId: brand.categoryId,
      logo: brand.logo || null,
      displayOrder: brand.displayOrder || 0,
      isActive: brand.isActive ?? true,
      createdAt: now,
      updatedAt: now
    };
  }

  async updateDeliveryBrand(id: number, brand: Partial<InsertDeliveryBrand>): Promise<DeliveryBrand | undefined> {
    return undefined;
  }

  async deleteDeliveryBrand(id: number): Promise<boolean> {
    return true;
  }

  async reorderDeliveryBrands(categoryId: number, orderedIds: number[]): Promise<boolean> {
    return true;
  }

  // Delivery Product Lines operations (stub)
  async getAllDeliveryProductLines(): Promise<DeliveryProductLine[]> {
    return [];
  }

  async getActiveDeliveryProductLines(): Promise<DeliveryProductLine[]> {
    return [];
  }

  async getDeliveryProductLinesByBrand(brandId: number): Promise<DeliveryProductLine[]> {
    return [];
  }

  async getDeliveryProductLine(id: number): Promise<DeliveryProductLine | undefined> {
    return undefined;
  }

  async getDeliveryProductLineBySlug(slug: string): Promise<DeliveryProductLine | undefined> {
    return undefined;
  }

  async createDeliveryProductLine(productLine: InsertDeliveryProductLine): Promise<DeliveryProductLine> {
    const now = new Date();
    return {
      id: 1,
      name: productLine.name,
      slug: productLine.slug,
      brandId: productLine.brandId,
      logo: productLine.logo || null,
      displayOrder: productLine.displayOrder || 0,
      isActive: productLine.isActive ?? true,
      createdAt: now,
      updatedAt: now
    };
  }

  async updateDeliveryProductLine(id: number, productLine: Partial<InsertDeliveryProductLine>): Promise<DeliveryProductLine | undefined> {
    return undefined;
  }

  async deleteDeliveryProductLine(id: number): Promise<boolean> {
    return true;
  }

  async reorderDeliveryProductLines(brandId: number, orderedIds: number[]): Promise<boolean> {
    return true;
  }
}

// Try to use the database implementation, fall back to memory if it fails
let storage: IStorage;

try {
  storage = new DbStorage();
  console.log("Using database storage");
} catch (error) {
  console.error("Failed to initialize database storage, falling back to memory storage", error);
  storage = new MemStorage();
}

export { storage };
