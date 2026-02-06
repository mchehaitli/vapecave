import type { Express, Request, Response, NextFunction } from "express";
import express from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertUserSchema, 
  insertBrandCategorySchema, 
  insertBrandSchema, 
  insertBlogPostSchema, 
  insertStoreLocationSchema,
  insertProductCategorySchema,
  insertProductSchema,
  InsertNewsletterSubscription,
  insertNewsletterSubscriptionSchema,
  insertDeliveryCustomerSchema,
  DeliveryCustomer,
  deliverySignupSchema,
  insertDeliveryProductSchema,
  insertDeliveryWindowSchema,
  insertWeeklyDeliveryTemplateSchema,
  insertCartItemSchema,
  insertDeliveryOrderSchema,
  insertDeliveryOrderItemSchema,
  insertCategoryBannerSchema
} from "@shared/schema";
import { seedStoreLocations } from "./seed-store-locations";
import { seedDeliveryProducts } from "./seed-delivery-products";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import * as dotenv from "dotenv";
import cookieParser from "cookie-parser";
import cors from "cors";
import { sendContactEmail, sendNewsletterSubscriptionEmail, sendDeliverySignupConfirmation, sendDeliveryApprovalEmail, sendDeliveryRejectionEmail, sendPasswordResetEmail, sendOrderStatusEmail, sendOrderConfirmationEmail, sendDriverNotificationEmail, ContactFormData, NewsletterSubscription, DeliverySignupData, DeliveryApprovalData, DeliveryRejectionData, PasswordResetData, OrderStatusEmailData, OrderConfirmationEmailData, DriverNotificationEmailData } from "./email-service";
import { generateTemporaryPassword, generateResetToken } from "./password-utils";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { CloverService } from "./clover-service";
import { startAutoSync, triggerManualSync, getLastSyncTime, getNextSyncTime } from "./clover-sync-service";
import { cloverOAuthService } from "./clover-oauth-service";
import { cloverPaymentService } from "./clover-payment-service";
import { cloverHostedCheckout } from "./clover-hosted-checkout";
import { fetchGoogleReviews, clearReviewsCache, getCacheStatus } from "./google-reviews-service";
import multer from "multer";
import path from "path";
import fs from "fs";
import { registerObjectStorageRoutes, ObjectStorageService } from "./replit_integrations/object_storage";

// Add userId and deliveryCustomerId to session
declare module 'express-session' {
  interface SessionData {
    userId: number;
    deliveryCustomerId: number;
    cloverOAuthState?: string;
  }
}

dotenv.config();

// Helper function to generate secure password setup token
function generatePasswordSetupToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

// Authentication middleware
function isAuthenticated(req: Request, res: Response, next: NextFunction) {
  if (req.session && req.session.userId) {
    next();
  } else {
    res.status(401).json({ error: "Unauthorized" });
  }
}

// Admin access middleware
async function isAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.session || !req.session.userId) {
    console.log("[isAdmin] No session or userId:", { 
      hasSession: !!req.session, 
      userId: req.session?.userId,
      url: req.url 
    });
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const user = await storage.getUser(req.session.userId);
    if (!user || !user.isAdmin) {
      return res.status(403).json({ error: "Forbidden: Admin access required" });
    }
    next();
  } catch (error) {
    console.error("Error in admin middleware:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

// Check if a user is an admin (for use in routes)
async function isAdminUser(userId: number): Promise<boolean> {
  try {
    const user = await storage.getUser(userId);
    return !!user?.isAdmin;
  } catch (error) {
    console.error("Error checking admin status:", error);
    return false;
  }
}

// Delivery customer authentication middleware
async function verifyApprovedCustomer(req: Request, res: Response, next: NextFunction) {
  if (!req.session || !req.session.deliveryCustomerId) {
    return res.status(401).json({ error: "Unauthorized: Not authenticated" });
  }

  try {
    const customer = await storage.getDeliveryCustomerById(req.session.deliveryCustomerId);
    
    if (!customer) {
      return res.status(404).json({ error: "Customer not found" });
    }
    
    if (customer.approvalStatus !== "approved") {
      return res.status(403).json({ 
        error: "Account pending approval", 
        approvalStatus: customer.approvalStatus 
      });
    }
    
    (req as any).deliveryCustomer = customer;
    next();
  } catch (error) {
    console.error("Error verifying customer:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

// Configure multer for image uploads
const productImagesDir = path.join(process.cwd(), "attached_assets", "product-images");
if (!fs.existsSync(productImagesDir)) {
  fs.mkdirSync(productImagesDir, { recursive: true });
}

const productImageStorage = multer.diskStorage({
  destination: productImagesDir,
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `product-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const uploadProductImage = multer({
  storage: productImageStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'));
    }
  }
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Serve static files from attached_assets directory with file type restrictions
  app.use('/attached_assets', (req, res, next) => {
    const allowedExtensions = /\.(jpg|jpeg|png|gif|webp|svg|ico)$/i;
    if (allowedExtensions.test(req.path)) {
      next();
    } else {
      res.status(403).json({ error: 'Access denied: File type not allowed' });
    }
  }, express.static(path.join(process.cwd(), 'attached_assets')));

  // Register object storage routes for persistent file uploads
  registerObjectStorageRoutes(app);


  // Configure CORS to allow credentials from production domain
  app.use(cors({
    origin: (origin, callback) => {
      // Allow requests from vapecavetx.com, Replit domains, and localhost
      const allowedOrigins = [
        'https://vapecavetx.com',
        'https://www.vapecavetx.com',
        /\.replit\.app$/,
        /\.replit\.dev$/,
        /^http:\/\/localhost(:\d+)?$/,
        /^http:\/\/127\.0\.0\.1(:\d+)?$/
      ];
      
      // Allow requests with no origin (mobile apps, curl, same-origin, etc.)
      if (!origin) return callback(null, true);
      
      // Check if origin matches any allowed pattern
      const isAllowed = allowedOrigins.some(allowed => {
        if (typeof allowed === 'string') {
          return origin === allowed;
        }
        return allowed.test(origin);
      });
      
      if (isAllowed) {
        callback(null, true);
      } else {
        console.error(`CORS blocked origin: ${origin}`);
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true, // Allow cookies to be sent with requests
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization']
  }));

  // Set up session with PostgreSQL
  const PgSession = connectPgSimple(session);
  
  // Validate required environment variables
  if (!process.env.SESSION_SECRET) {
    throw new Error("SESSION_SECRET environment variable is required for security");
  }

  app.use(cookieParser());
  app.use(session({
    store: new PgSession({
      conString: process.env.DATABASE_URL,
      tableName: 'sessions'
    }),
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: { 
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/'
    }
  }));

  // Authentication routes
  app.post('/api/auth/login', async (req, res) => {
    try {
      const { username, password } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({ error: "Username and password are required" });
      }
      
      const user = await storage.validateUser(username, password);
      
      if (!user) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      // Save user session and wait for it to be saved
      req.session.userId = user.id;
      
      await new Promise<void>((resolve, reject) => {
        req.session.save((err) => {
          if (err) {
            console.error("Session save error:", err);
            reject(err);
          } else {
            resolve();
          }
        });
      });
      
      // Return user info without password
      const { password: _, ...userInfo } = user;
      res.json(userInfo);
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post('/api/auth/logout', (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ error: "Failed to logout" });
      }
      res.json({ message: "Logged out successfully" });
    });
  });

  app.get('/api/auth/status', async (req, res) => {
    if (req.session && req.session.userId) {
      try {
        const user = await storage.getUser(req.session.userId);
        if (user) {
          const { password: _, ...userInfo } = user;
          return res.json({ authenticated: true, user: userInfo });
        }
      } catch (error) {
        console.error("Auth status error:", error);
      }
    }
    
    res.json({ authenticated: false });
  });

  // Generic presigned URL endpoint for admin uploads (hero slides, etc.)
  // NOTE: This must be AFTER session middleware is applied
  const storageService = new ObjectStorageService();
  
  app.post('/api/storage/presign', isAdmin, async (req, res) => {
    try {
      const { fileName, contentType, directory } = req.body;
      
      if (!fileName) {
        return res.status(400).json({ error: "Missing required field: fileName" });
      }
      
      const uploadUrl = await storageService.getObjectEntityUploadURL();
      const objectPath = storageService.normalizeObjectEntityPath(uploadUrl);
      
      res.json({
        uploadUrl,
        objectPath,
        metadata: { fileName, contentType, directory }
      });
    } catch (error) {
      console.error("Error generating presigned URL:", error);
      res.status(500).json({ error: "Failed to generate upload URL" });
    }
  });
  
  // Set public ACL for uploaded object (called after successful upload)
  app.post('/api/storage/set-public', isAdmin, async (req, res) => {
    try {
      const { objectPath } = req.body;
      
      if (!objectPath) {
        return res.status(400).json({ error: "Missing required field: objectPath" });
      }
      
      const { setObjectAclPolicy } = await import("./replit_integrations/object_storage/objectAcl");
      const objectFile = await storageService.getObjectEntityFile(objectPath);
      await setObjectAclPolicy(objectFile, {
        owner: "admin",
        visibility: "public"
      });
      
      res.json({ success: true, objectPath });
    } catch (error) {
      console.error("Error setting ACL:", error);
      res.status(500).json({ error: "Failed to set public access" });
    }
  });

  // Admin user management
  
  // Get all admin users
  app.get('/api/admin/users', isAdmin, async (req, res) => {
    try {
      const users = await storage.getAllAdminUsers();
      // Remove passwords from response
      const sanitizedUsers = users.map(({ password: _, ...user }) => user);
      res.json(sanitizedUsers);
    } catch (error) {
      console.error("Get admin users error:", error);
      res.status(500).json({ error: "Failed to fetch admin users" });
    }
  });
  
  // Create new admin user
  app.post('/api/admin/users', isAdmin, async (req, res) => {
    try {
      const userResult = insertUserSchema.safeParse(req.body);
      
      if (!userResult.success) {
        return res.status(400).json({ error: userResult.error.format() });
      }
      
      const user = await storage.createUser(userResult.data);
      const { password: _, ...userInfo } = user;
      
      res.status(201).json(userInfo);
    } catch (error) {
      console.error("Create user error:", error);
      res.status(500).json({ error: "Failed to create user" });
    }
  });
  
  // Change admin password
  app.patch('/api/admin/users/:id/password', isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { currentPassword, newPassword } = req.body;
      
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid user ID" });
      }
      
      if (!currentPassword || !newPassword) {
        return res.status(400).json({ error: "Current password and new password are required" });
      }
      
      if (newPassword.length < 6) {
        return res.status(400).json({ error: "New password must be at least 6 characters long" });
      }
      
      // Ensure user is updating their own password
      if (req.session.userId !== id) {
        return res.status(403).json({ error: "You can only change your own password" });
      }
      
      const updatedUser = await storage.updateUserPassword(id, currentPassword, newPassword);
      
      if (!updatedUser) {
        return res.status(401).json({ error: "Current password is incorrect" });
      }
      
      const { password: _, ...userInfo } = updatedUser;
      res.json(userInfo);
    } catch (error) {
      console.error("Update password error:", error);
      res.status(500).json({ error: "Failed to update password" });
    }
  });
  
  // Change admin username
  app.patch('/api/admin/users/:id/username', isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { newUsername } = req.body;
      
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid user ID" });
      }
      
      if (!newUsername || newUsername.trim().length === 0) {
        return res.status(400).json({ error: "New username is required" });
      }
      
      // Ensure user is updating their own username
      if (req.session.userId !== id) {
        return res.status(403).json({ error: "You can only change your own username" });
      }
      
      // Check if username already exists
      const existingUser = await storage.getUserByUsername(newUsername);
      if (existingUser && existingUser.id !== id) {
        return res.status(409).json({ error: "Username already exists" });
      }
      
      const updatedUser = await storage.updateUserUsername(id, newUsername);
      
      if (!updatedUser) {
        return res.status(404).json({ error: "User not found" });
      }
      
      const { password: _, ...userInfo } = updatedUser;
      res.json(userInfo);
    } catch (error) {
      console.error("Update username error:", error);
      res.status(500).json({ error: "Failed to update username" });
    }
  });

  // Brand category endpoints
  app.get('/api/brand-categories', async (req, res) => {
    try {
      const categories = await storage.getAllBrandCategories();
      res.json(categories);
    } catch (error) {
      console.error("Get categories error:", error);
      res.status(500).json({ error: "Failed to fetch brand categories" });
    }
  });

  app.get('/api/brand-categories/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid category ID" });
      }
      
      const category = await storage.getBrandCategory(id);
      
      if (!category) {
        return res.status(404).json({ error: "Category not found" });
      }
      
      res.json(category);
    } catch (error) {
      console.error("Get category error:", error);
      res.status(500).json({ error: "Failed to fetch category" });
    }
  });

  app.post('/api/admin/brand-categories', isAdmin, async (req, res) => {
    try {
      const categoryResult = insertBrandCategorySchema.safeParse(req.body);
      
      if (!categoryResult.success) {
        return res.status(400).json({ error: categoryResult.error.format() });
      }
      
      const category = await storage.createBrandCategory(categoryResult.data);
      res.status(201).json(category);
    } catch (error) {
      console.error("Create category error:", error);
      res.status(500).json({ error: "Failed to create brand category" });
    }
  });

  app.put('/api/admin/brand-categories/:id', isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid category ID" });
      }
      
      // Only validate the fields present in the request
      const updatedData: Record<string, any> = {};
      
      if (req.body.category !== undefined) updatedData.category = req.body.category;
      if (req.body.bgClass !== undefined) updatedData.bgClass = req.body.bgClass;
      if (req.body.displayOrder !== undefined) updatedData.displayOrder = req.body.displayOrder;
      if (req.body.intervalMs !== undefined) updatedData.intervalMs = req.body.intervalMs;
      
      const category = await storage.updateBrandCategory(id, updatedData);
      
      if (!category) {
        return res.status(404).json({ error: "Category not found" });
      }
      
      res.json(category);
    } catch (error) {
      console.error("Update category error:", error);
      res.status(500).json({ error: "Failed to update brand category" });
    }
  });

  app.delete('/api/admin/brand-categories/:id', isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid category ID" });
      }
      
      const success = await storage.deleteBrandCategory(id);
      
      if (!success) {
        return res.status(404).json({ error: "Category not found" });
      }
      
      res.json({ message: "Category deleted successfully" });
    } catch (error) {
      console.error("Delete category error:", error);
      res.status(500).json({ error: "Failed to delete brand category" });
    }
  });

  // Brand endpoints
  app.get('/api/brands', async (req, res) => {
    try {
      const categoryId = req.query.categoryId ? parseInt(req.query.categoryId as string) : undefined;
      
      let brands;
      if (categoryId && !isNaN(categoryId)) {
        brands = await storage.getBrandsByCategory(categoryId);
      } else {
        brands = await storage.getAllBrands();
      }
      
      res.json(brands);
    } catch (error) {
      console.error("Get brands error:", error);
      res.status(500).json({ error: "Failed to fetch brands" });
    }
  });

  app.get('/api/brands/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid brand ID" });
      }
      
      const brand = await storage.getBrand(id);
      
      if (!brand) {
        return res.status(404).json({ error: "Brand not found" });
      }
      
      res.json(brand);
    } catch (error) {
      console.error("Get brand error:", error);
      res.status(500).json({ error: "Failed to fetch brand" });
    }
  });

  app.post('/api/admin/brands', isAdmin, async (req, res) => {
    try {
      const brandResult = insertBrandSchema.safeParse(req.body);
      
      if (!brandResult.success) {
        return res.status(400).json({ error: brandResult.error.format() });
      }
      
      const brand = await storage.createBrand(brandResult.data);
      res.status(201).json(brand);
    } catch (error) {
      console.error("Create brand error:", error);
      res.status(500).json({ error: "Failed to create brand" });
    }
  });

  app.put('/api/admin/brands/:id', isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid brand ID" });
      }
      
      // Only validate the fields present in the request
      const updatedData: Record<string, any> = {};
      
      if (req.body.categoryId !== undefined) updatedData.categoryId = req.body.categoryId;
      if (req.body.name !== undefined) updatedData.name = req.body.name;
      if (req.body.image !== undefined) updatedData.image = req.body.image;
      if (req.body.description !== undefined) updatedData.description = req.body.description;
      if (req.body.displayOrder !== undefined) updatedData.displayOrder = req.body.displayOrder;
      if (req.body.imageSize !== undefined) updatedData.imageSize = req.body.imageSize;
      
      const brand = await storage.updateBrand(id, updatedData);
      
      if (!brand) {
        return res.status(404).json({ error: "Brand not found" });
      }
      
      res.json(brand);
    } catch (error) {
      console.error("Update brand error:", error);
      res.status(500).json({ error: "Failed to update brand" });
    }
  });

  app.delete('/api/admin/brands/:id', isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid brand ID" });
      }
      
      const success = await storage.deleteBrand(id);
      
      if (!success) {
        return res.status(404).json({ error: "Brand not found" });
      }
      
      res.json({ message: "Brand deleted successfully" });
    } catch (error) {
      console.error("Delete brand error:", error);
      res.status(500).json({ error: "Failed to delete brand" });
    }
  });

  // Public API to get all visible brand categories with their brands
  app.get('/api/featured-brands', async (req, res) => {
    try {
      const categories = await storage.getAllBrandCategories();
      
      // Get brands for each category and map them together
      const results = await Promise.all(
        categories.map(async (category) => {
          const brands = await storage.getBrandsByCategory(category.id);
          return {
            ...category,
            brands
          };
        })
      );
      
      res.json(results);
    } catch (error) {
      console.error("Get featured brands error:", error);
      res.status(500).json({ error: "Failed to fetch featured brands" });
    }
  });
  
  // No blog category endpoints - using simplified blog structure
  
  // Blog posts endpoints
  app.get('/api/blog-posts', async (req, res) => {
    try {
      // Admin users can see unpublished posts if they specify includeUnpublished=true
      const userIsAdmin = req.session?.userId ? await isAdminUser(req.session.userId) : false;
      const includeUnpublished = userIsAdmin && req.query.includeUnpublished === 'true';
      
      const posts = await storage.getAllBlogPosts(includeUnpublished);
      res.json(posts);
    } catch (error) {
      console.error("Get blog posts error:", error);
      res.status(500).json({ error: "Failed to fetch blog posts" });
    }
  });
  
  app.get('/api/blog-posts/featured', async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
      const posts = await storage.getFeaturedBlogPosts(limit);
      res.json(posts);
    } catch (error) {
      console.error("Get featured blog posts error:", error);
      res.status(500).json({ error: "Failed to fetch featured blog posts" });
    }
  });
  
  // Category-based blog post routes have been removed
  
  app.get('/api/blog-posts/slug/:slug', async (req, res) => {
    try {
      const { slug } = req.params;
      
      const post = await storage.getBlogPostBySlug(slug);
      
      if (!post) {
        return res.status(404).json({ error: "Blog post not found" });
      }
      
      // Increment view count (don't await this, let it happen in the background)
      storage.incrementBlogPostViewCount(post.id).catch(err => {
        console.error("Error incrementing view count:", err);
      });
      
      res.json(post);
    } catch (error) {
      console.error("Get blog post by slug error:", error);
      res.status(500).json({ error: "Failed to fetch blog post" });
    }
  });
  
  app.get('/api/blog-posts/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid blog post ID" });
      }
      
      const post = await storage.getBlogPost(id);
      
      if (!post) {
        return res.status(404).json({ error: "Blog post not found" });
      }
      
      // Increment view count (don't await this, let it happen in the background)
      storage.incrementBlogPostViewCount(id).catch(err => {
        console.error("Error incrementing view count:", err);
      });
      
      res.json(post);
    } catch (error) {
      console.error("Get blog post error:", error);
      res.status(500).json({ error: "Failed to fetch blog post" });
    }
  });
  
  app.post('/api/admin/blog-posts', isAdmin, async (req, res) => {
    try {
      const postResult = insertBlogPostSchema.safeParse(req.body);
      
      if (!postResult.success) {
        return res.status(400).json({ error: postResult.error.format() });
      }
      
      const post = await storage.createBlogPost(postResult.data);
      res.status(201).json(post);
    } catch (error) {
      console.error("Create blog post error:", error);
      res.status(500).json({ error: "Failed to create blog post" });
    }
  });
  
  app.put('/api/admin/blog-posts/:id', isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid blog post ID" });
      }
      
      // Only validate the fields present in the request
      const updatedData: Record<string, any> = {};
      
      if (req.body.title !== undefined) updatedData.title = req.body.title;
      if (req.body.slug !== undefined) updatedData.slug = req.body.slug;
      if (req.body.summary !== undefined) updatedData.summary = req.body.summary;
      if (req.body.content !== undefined) updatedData.content = req.body.content;
      if (req.body.featured_image !== undefined) updatedData.featured_image = req.body.featured_image;
      if (req.body.meta_title !== undefined) updatedData.meta_title = req.body.meta_title;
      if (req.body.meta_description !== undefined) updatedData.meta_description = req.body.meta_description;
      if (req.body.is_featured !== undefined) updatedData.is_featured = req.body.is_featured;
      if (req.body.is_published !== undefined) updatedData.is_published = req.body.is_published;
      
      const post = await storage.updateBlogPost(id, updatedData);
      
      if (!post) {
        return res.status(404).json({ error: "Blog post not found" });
      }
      
      res.json(post);
    } catch (error) {
      console.error("Update blog post error:", error);
      res.status(500).json({ error: "Failed to update blog post" });
    }
  });
  
  app.delete('/api/admin/blog-posts/:id', isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid blog post ID" });
      }
      
      const success = await storage.deleteBlogPost(id);
      
      if (!success) {
        return res.status(404).json({ error: "Blog post not found" });
      }
      
      res.json({ message: "Blog post deleted successfully" });
    } catch (error) {
      console.error("Delete blog post error:", error);
      res.status(500).json({ error: "Failed to delete blog post" });
    }
  });

  // Store location endpoints
  app.get('/api/store-locations', async (req, res) => {
    try {
      const locations = await storage.getAllStoreLocations();
      res.json(locations);
    } catch (error) {
      console.error("Get store locations error:", error);
      res.status(500).json({ error: "Failed to fetch store locations" });
    }
  });

  app.get('/api/store-locations/city/:city', async (req, res) => {
    try {
      const { city } = req.params;
      
      const location = await storage.getStoreLocationByCity(city);
      
      if (!location) {
        return res.status(404).json({ error: "Store location not found" });
      }
      
      res.json(location);
    } catch (error) {
      console.error("Get store location by city error:", error);
      res.status(500).json({ error: "Failed to fetch store location" });
    }
  });
  
  app.get('/api/store-locations/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid store location ID" });
      }
      
      const location = await storage.getStoreLocation(id);
      
      if (!location) {
        return res.status(404).json({ error: "Store location not found" });
      }
      
      res.json(location);
    } catch (error) {
      console.error("Get store location error:", error);
      res.status(500).json({ error: "Failed to fetch store location" });
    }
  });

  app.post('/api/admin/store-locations', isAdmin, async (req, res) => {
    try {
      const locationResult = insertStoreLocationSchema.safeParse(req.body);
      
      if (!locationResult.success) {
        return res.status(400).json({ error: locationResult.error.format() });
      }
      
      const location = await storage.createStoreLocation(locationResult.data);
      res.status(201).json(location);
    } catch (error) {
      console.error("Create store location error:", error);
      res.status(500).json({ error: "Failed to create store location" });
    }
  });

  app.put('/api/admin/store-locations/:id', isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid store location ID" });
      }
      
      // Create a clean update object with only the fields that are in the request
      const updatedData: Record<string, any> = {};
      
      // Map all properties from the request body to the updatedData object
      Object.keys(req.body).forEach(key => {
        if (req.body[key] !== undefined) {
          updatedData[key] = req.body[key];
        }
      });
      
      const location = await storage.updateStoreLocation(id, updatedData);
      
      if (!location) {
        return res.status(404).json({ error: "Store location not found" });
      }
      
      res.json(location);
    } catch (error) {
      console.error("Update store location error:", error);
      res.status(500).json({ error: "Failed to update store location" });
    }
  });
  
  // Dedicated endpoint for updating store hours
  app.put('/api/admin/store-locations/:id/hours', isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid store location ID" });
      }
      
      // Extract hours-related data from request
      const { opening_hours, closed_days, hours } = req.body;
      
      // Validate the hours data
      if (!opening_hours || typeof opening_hours !== 'object') {
        return res.status(400).json({ error: "Invalid opening hours data" });
      }
      
      // Create update object with only hours-related fields
      const updatedData = {
        opening_hours,
        closed_days: closed_days || null,
        hours: hours || ""
      };
      
      const location = await storage.updateStoreLocation(id, updatedData);
      
      if (!location) {
        return res.status(404).json({ error: "Store location not found" });
      }
      
      res.json(location);
    } catch (error) {
      console.error("Update store hours error:", error);
      res.status(500).json({ error: "Failed to update store hours" });
    }
  });

  app.delete('/api/admin/store-locations/:id', isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid store location ID" });
      }
      
      const success = await storage.deleteStoreLocation(id);
      
      if (!success) {
        return res.status(404).json({ error: "Store location not found" });
      }
      
      res.json({ message: "Store location deleted successfully" });
    } catch (error) {
      console.error("Delete store location error:", error);
      res.status(500).json({ error: "Failed to delete store location" });
    }
  });
  
  // Special endpoint to seed store locations from frontend data
  app.post('/api/admin/seed-store-locations', isAdmin, async (req, res) => {
    try {
      await seedStoreLocations();
      res.json({ message: "Store locations seeded successfully" });
    } catch (error) {
      console.error("Seed store locations error:", error);
      res.status(500).json({ error: "Failed to seed store locations" });
    }
  });

  // Special endpoint to seed delivery products with sample data
  app.post('/api/admin/seed-delivery-products', isAdmin, async (req, res) => {
    try {
      await seedDeliveryProducts();
      res.json({ message: "Delivery products seeded successfully" });
    } catch (error) {
      console.error("Seed delivery products error:", error);
      res.status(500).json({ error: "Failed to seed delivery products" });
    }
  });

  // Contact form submission endpoint
  app.post('/api/contact', async (req, res) => {
    try {
      const { name, email, subject, message } = req.body;
      
      // Validate required fields
      if (!name || !email || !message) {
        return res.status(400).json({ error: "Name, email, and message are required" });
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({ error: "Invalid email format" });
      }
      
      const contactData: ContactFormData = {
        name,
        email,
        subject: subject || "General Inquiry", // Default subject if not provided
        message
      };
      
      const result = await sendContactEmail(contactData);
      
      if (result.success) {
        res.json({ message: "Contact form submitted successfully" });
      } else {
        res.status(500).json({ error: "Failed to send contact form" });
      }
    } catch (error) {
      console.error("Contact form submission error:", error);
      res.status(500).json({ error: "Failed to process contact form" });
    }
  });
  
  // Newsletter subscription endpoint
  app.post('/api/newsletter/subscribe', async (req, res) => {
    try {
      const { email } = req.body;
      
      // Validate email
      if (!email) {
        return res.status(400).json({ error: "Email is required" });
      }
      
      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({ error: "Invalid email format" });
      }
      
      // Get IP address for tracking purposes
      const ip_address = req.ip || req.socket.remoteAddress || '';
      const source = req.get('Referrer') ? 'website' : 'unknown';
      
      // Create subscription data
      const subscriptionData: InsertNewsletterSubscription = { 
        email, 
        ip_address,
        source
      };
      
      try {
        // Save to database
        await storage.createNewsletterSubscription(subscriptionData);
        
        // Send email notification
        const emailData: NewsletterSubscription = { email };
        const result = await sendNewsletterSubscriptionEmail(emailData);
        
        if (result.success) {
          res.json({ message: "Newsletter subscription successful" });
        } else {
          // Still return success even if email fails, as DB save was successful
          console.warn("Newsletter subscription saved, but email notification failed");
          res.json({ message: "Newsletter subscription successful" });
        }
      } catch (dbError) {
        console.error("Error saving newsletter subscription:", dbError);
        res.status(500).json({ error: "Failed to save newsletter subscription" });
      }
    } catch (error) {
      console.error("Newsletter subscription error:", error);
      res.status(500).json({ error: "Failed to process newsletter subscription" });
    }
  });
  
  // Product category endpoints
  app.get('/api/product-categories', async (_req, res) => {
    try {
      const categories = await storage.getAllProductCategories();
      res.json(categories);
    } catch (error) {
      console.error("Error fetching product categories:", error);
      res.status(500).json({ error: "Failed to fetch product categories" });
    }
  });

  app.get('/api/product-categories/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid product category ID" });
      }
      
      const category = await storage.getProductCategory(id);
      
      if (!category) {
        return res.status(404).json({ error: "Product category not found" });
      }
      
      res.json(category);
    } catch (error) {
      console.error("Error fetching product category:", error);
      res.status(500).json({ error: "Failed to fetch product category" });
    }
  });

  app.get('/api/product-categories/slug/:slug', async (req, res) => {
    try {
      const { slug } = req.params;
      
      const category = await storage.getProductCategoryBySlug(slug);
      
      if (!category) {
        return res.status(404).json({ error: "Product category not found" });
      }
      
      res.json(category);
    } catch (error) {
      console.error("Error fetching product category by slug:", error);
      res.status(500).json({ error: "Failed to fetch product category" });
    }
  });

  app.post('/api/admin/product-categories', isAdmin, async (req, res) => {
    try {
      const categoryResult = insertProductCategorySchema.safeParse(req.body);
      
      if (!categoryResult.success) {
        return res.status(400).json({ error: categoryResult.error.format() });
      }
      
      const category = await storage.createProductCategory(categoryResult.data);
      res.status(201).json(category);
    } catch (error) {
      console.error("Error creating product category:", error);
      res.status(500).json({ error: "Failed to create product category" });
    }
  });

  app.put('/api/admin/product-categories/:id', isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid product category ID" });
      }
      
      // Only validate the fields present in the request
      const updatedData: Record<string, any> = {};
      
      if (req.body.name !== undefined) updatedData.name = req.body.name;
      if (req.body.slug !== undefined) updatedData.slug = req.body.slug;
      if (req.body.description !== undefined) updatedData.description = req.body.description;
      if (req.body.display_order !== undefined) updatedData.display_order = req.body.display_order;
      
      const category = await storage.updateProductCategory(id, updatedData);
      
      if (!category) {
        return res.status(404).json({ error: "Product category not found" });
      }
      
      res.json(category);
    } catch (error) {
      console.error("Error updating product category:", error);
      res.status(500).json({ error: "Failed to update product category" });
    }
  });

  app.delete('/api/admin/product-categories/:id', isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid product category ID" });
      }
      
      const success = await storage.deleteProductCategory(id);
      
      if (!success) {
        return res.status(404).json({ error: "Product category not found" });
      }
      
      res.json({ message: "Product category deleted successfully" });
    } catch (error) {
      console.error("Error deleting product category:", error);
      res.status(500).json({ error: "Failed to delete product category" });
    }
  });

  // Product endpoints
  app.get('/api/products', async (_req, res) => {
    try {
      const products = await storage.getAllProducts();
      res.json(products);
    } catch (error) {
      console.error("Error fetching products:", error);
      res.status(500).json({ error: "Failed to fetch products" });
    }
  });
  
  app.get('/api/products/featured', async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
      const products = await storage.getFeaturedProducts(limit);
      res.json(products);
    } catch (error) {
      console.error("Error fetching featured products:", error);
      res.status(500).json({ error: "Failed to fetch featured products" });
    }
  });
  
  app.get('/api/products/category/:category', async (req, res) => {
    try {
      const { category } = req.params;
      const products = await storage.getProductsByCategory(category);
      res.json(products);
    } catch (error) {
      console.error("Error fetching products by category:", error);
      res.status(500).json({ error: "Failed to fetch products by category" });
    }
  });
  
  app.get('/api/products/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const product = await storage.getProduct(id);
      
      if (!product) {
        return res.status(404).json({ error: "Product not found" });
      }
      
      res.json(product);
    } catch (error) {
      console.error("Error fetching product:", error);
      res.status(500).json({ error: "Failed to fetch product" });
    }
  });
  
  app.post('/api/admin/products', isAdmin, async (req, res) => {
    try {
      const productResult = insertProductSchema.safeParse(req.body);
      
      if (!productResult.success) {
        return res.status(400).json({ error: productResult.error.format() });
      }
      
      const newProduct = await storage.createProduct(productResult.data);
      res.status(201).json(newProduct);
    } catch (error) {
      console.error("Error creating product:", error);
      res.status(500).json({ error: "Failed to create product" });
    }
  });
  
  app.put('/api/admin/products/:id', isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const product = req.body;
      const updatedProduct = await storage.updateProduct(id, product);
      
      if (!updatedProduct) {
        return res.status(404).json({ error: "Product not found" });
      }
      
      res.json(updatedProduct);
    } catch (error) {
      console.error("Error updating product:", error);
      res.status(500).json({ error: "Failed to update product" });
    }
  });
  
  app.delete('/api/admin/products/:id', isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteProduct(id);
      
      if (!success) {
        return res.status(404).json({ error: "Product not found" });
      }
      
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting product:", error);
      res.status(500).json({ error: "Failed to delete product" });
    }
  });
  
  // Newsletter subscription management endpoints
  app.get('/api/admin/newsletter-subscriptions', isAdmin, async (req, res) => {
    try {
      const subscriptions = await storage.getAllNewsletterSubscriptions();
      res.json(subscriptions);
    } catch (error) {
      console.error("Error fetching newsletter subscriptions:", error);
      res.status(500).json({ error: "Failed to fetch newsletter subscriptions" });
    }
  });
  
  app.put('/api/admin/newsletter-subscriptions/:id/toggle', isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid subscription ID" });
      }
      
      const { is_active } = req.body;
      if (typeof is_active !== 'boolean') {
        return res.status(400).json({ error: "is_active must be a boolean" });
      }
      
      const subscription = await storage.toggleNewsletterSubscriptionStatus(id, is_active);
      
      if (!subscription) {
        return res.status(404).json({ error: "Subscription not found" });
      }
      
      res.json(subscription);
    } catch (error) {
      console.error("Error toggling subscription status:", error);
      res.status(500).json({ error: "Failed to update subscription status" });
    }
  });
  
  app.delete('/api/admin/newsletter-subscriptions/:id', isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid subscription ID" });
      }
      
      const success = await storage.deleteNewsletterSubscription(id);
      
      if (!success) {
        return res.status(404).json({ error: "Subscription not found" });
      }
      
      res.json({ message: "Subscription deleted successfully" });
    } catch (error) {
      console.error("Error deleting subscription:", error);
      res.status(500).json({ error: "Failed to delete subscription" });
    }
  });

  // ==================== DELIVERY SYSTEM ROUTES ====================

  // Validate delivery address using Google Geocoding API (server-side only)
  app.post('/api/delivery/validate-address', async (req, res) => {
    try {
      const { address } = req.body;
      
      if (!address) {
        return res.status(400).json({ error: "Address is required" });
      }
      
      // Get delivery radius setting from database
      const radiusSetting = await storage.getSetting('delivery_radius_miles');
      const deliveryRadiusMiles = radiusSetting ? parseInt(radiusSetting.value) : 3;
      
      // Call Google Geocoding API from server (requires IP restrictions, not HTTP referrer)
      const apiKey = process.env.GOOGLE_GEOCODING_API_KEY;
      const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${apiKey}`;
      
      const response = await fetch(url);
      const data = await response.json();
      
      console.log('Google Geocoding API response:', JSON.stringify(data, null, 2));
      
      if (data.status === "OK" && data.results.length > 0) {
        const result = data.results[0];
        const location = result.geometry.location;
        
        // Extract address components
        let city = '';
        let state = '';
        let zipCode = '';
        
        result.address_components?.forEach((component: any) => {
          if (component.types.includes('locality')) {
            city = component.long_name;
          } else if (component.types.includes('administrative_area_level_1')) {
            state = component.short_name;
          } else if (component.types.includes('postal_code')) {
            zipCode = component.long_name;
          }
        });
        
        // Calculate distance from Frisco location
        const friscoLat = 33.1507;
        const friscoLng = -96.8236;
        const distance = calculateDistance(location.lat, location.lng, friscoLat, friscoLng);
        
        const responseData = {
          success: true,
          coordinates: { lat: location.lat, lng: location.lng },
          city,
          state,
          zipCode,
          distance,
          withinDeliveryZone: distance <= deliveryRadiusMiles
        };
        
        console.log('Sending validation response:', JSON.stringify(responseData, null, 2));
        res.json(responseData);
      } else {
        res.json({
          success: false,
          error: "Could not validate address"
        });
      }
    } catch (error) {
      console.error("Address validation error:", error);
      res.status(500).json({ error: "Failed to validate address" });
    }
  });
  
  function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 3959; // Earth's radius in miles
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  // Create delivery customer (signup) - Simple email/password auth
  app.post('/api/delivery/customers', async (req, res) => {
    try {
      const validated = deliverySignupSchema.parse(req.body);
      
      // Check if email already exists
      const existingCustomer = await storage.getDeliveryCustomerByEmail(validated.email);
      if (existingCustomer) {
        return res.status(400).json({ error: "Email already registered" });
      }
      
      // Store photo ID as base64 data URL
      const photoUrl = validated.photoIdBase64;
      
      // Create delivery customer record with pending status
      // Password will be set when admin approves the account
      const customer = await storage.createDeliveryCustomer({
        email: validated.email,
        passwordHash: await bcrypt.hash(generateTemporaryPassword(), 10), // Temporary hash, will be replaced on approval
        fullName: validated.fullName,
        phone: validated.phone,
        address: validated.address,
        city: validated.city,
        state: validated.state,
        zipCode: validated.zipCode,
        lat: validated.lat,
        lng: validated.lng,
        photoIdUrl: photoUrl,
      });
      
      // Send signup confirmation email
      const emailData: DeliverySignupData = {
        email: customer.email,
        fullName: customer.fullName,
      };
      
      await sendDeliverySignupConfirmation(emailData);
      
      res.json({ message: "Signup successful. Please wait for admin approval." });
    } catch (error: any) {
      console.error("Error creating delivery customer:", error);
      if (error.name === 'ZodError') {
        return res.status(400).json({ error: "Invalid customer data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create customer" });
    }
  });

  // Delivery customer login
  app.post('/api/delivery/login', async (req, res) => {
    try {
      const { email, password } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ error: "Email and password are required" });
      }
      
      const customer = await storage.validateDeliveryCustomer(email, password);
      
      if (!customer) {
        return res.status(401).json({ error: "Incorrect email or password" });
      }
      
      if (customer.approvalStatus !== "approved") {
        return res.status(403).json({ error: "Your account is pending approval. Please wait for admin confirmation." });
      }
      
      // Store customer ID in session
      req.session.deliveryCustomerId = customer.id;
      await new Promise<void>((resolve, reject) => {
        req.session.save((err) => {
          if (err) reject(err);
          else resolve();
        });
      });
      
      res.json({ 
        customer: {
          id: customer.id,
          email: customer.email,
          fullName: customer.fullName
        },
        mustChangePassword: customer.mustChangePassword || false
      });
    } catch (error) {
      console.error("Error logging in delivery customer:", error);
      res.status(500).json({ error: "Failed to login" });
    }
  });

  // Delivery customer logout
  app.post('/api/delivery/logout', (req, res) => {
    req.session.deliveryCustomerId = undefined;
    req.session.destroy((err) => {
      if (err) {
        console.error("Error destroying session:", err);
        return res.status(500).json({ error: "Failed to logout" });
      }
      res.clearCookie('connect.sid');
      res.json({ message: "Logged out successfully" });
    });
  });

  // Get delivery customer by session (requires authentication)
  app.get('/api/delivery/customers/me', async (req, res) => {
    try {
      const customerId = req.session.deliveryCustomerId;
      
      if (!customerId) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      
      const customer = await storage.getDeliveryCustomerById(customerId);
      if (!customer) {
        return res.status(404).json({ error: "Customer not found" });
      }
      res.json(customer);
    } catch (error) {
      console.error("Error fetching delivery customer:", error);
      res.status(500).json({ error: "Failed to fetch customer" });
    }
  });

  // Update customer profile (requires authentication)
  app.patch('/api/delivery/customers/me', async (req, res) => {
    try {
      const customerId = req.session.deliveryCustomerId;
      
      if (!customerId) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      
      const { fullName, phone, address, city, state, zipCode } = req.body;
      
      // Validate required fields
      if (!fullName?.trim() || !phone?.trim() || !address?.trim() || !city?.trim() || !state?.trim() || !zipCode?.trim()) {
        return res.status(400).json({ error: "All fields are required" });
      }

      // Normalize and validate phone (allow common formats)
      const cleanPhone = phone.trim().replace(/[^\d]/g, '');
      if (cleanPhone.length !== 10) {
        return res.status(400).json({ error: "Please enter a valid 10-digit phone number" });
      }

      // Normalize state to uppercase
      const normalizedState = state.trim().toUpperCase();
      if (normalizedState.length !== 2 || !/^[A-Z]{2}$/.test(normalizedState)) {
        return res.status(400).json({ error: "Please enter a valid 2-letter state abbreviation" });
      }

      // Validate ZIP code
      const cleanZip = zipCode.trim();
      if (!/^\d{5}(-\d{4})?$/.test(cleanZip)) {
        return res.status(400).json({ error: "Please enter a valid ZIP code" });
      }

      const updatedCustomer = await storage.updateDeliveryCustomer(customerId, {
        fullName: fullName.trim(),
        phone: phone.trim(),
        address: address.trim(),
        city: city.trim(),
        state: normalizedState,
        zipCode: cleanZip
      });

      if (!updatedCustomer) {
        return res.status(404).json({ error: "Customer not found" });
      }

      res.json(updatedCustomer);
    } catch (error) {
      console.error("Error updating customer profile:", error);
      res.status(500).json({ error: "Failed to update profile" });
    }
  });

  // Change delivery customer password (requires authentication)
  app.patch('/api/delivery/customers/change-password', async (req, res) => {
    try {
      const customerId = req.session.deliveryCustomerId;
      
      if (!customerId) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      
      const { currentPassword, newPassword } = req.body;
      
      if (!currentPassword || !newPassword) {
        return res.status(400).json({ error: "Current password and new password are required" });
      }
      
      const customer = await storage.getDeliveryCustomerById(customerId);
      if (!customer) {
        return res.status(404).json({ error: "Customer not found" });
      }
      
      // Check if password is set
      if (!customer.passwordHash) {
        return res.status(400).json({ error: "Password not set. Please use the password setup link." });
      }
      
      // Verify current password
      const isValid = await bcrypt.compare(currentPassword, customer.passwordHash);
      if (!isValid) {
        return res.status(401).json({ error: "Current password is incorrect" });
      }
      
      // Hash new password and update
      const newHashedPassword = await bcrypt.hash(newPassword, 10);
      const updatedCustomer = await storage.updateDeliveryCustomerPassword(
        customer.id,
        newHashedPassword,
        false
      );
      
      if (!updatedCustomer) {
        return res.status(500).json({ error: "Failed to update password" });
      }
      
      res.json({ message: "Password changed successfully" });
    } catch (error) {
      console.error("Error changing password:", error);
      res.status(500).json({ error: "Failed to change password" });
    }
  });

  // Validate password setup token
  app.get('/api/delivery/validate-setup-token', async (req, res) => {
    try {
      const { token } = req.query;
      
      if (!token || typeof token !== 'string') {
        return res.status(400).json({ error: "Token is required" });
      }
      
      const customer = await storage.getDeliveryCustomerByPasswordSetupToken(token);
      
      if (!customer) {
        return res.status(404).json({ error: "Invalid token" });
      }
      
      // Check if token has expired
      if (customer.passwordSetupTokenExpiry && new Date(customer.passwordSetupTokenExpiry) < new Date()) {
        return res.status(410).json({ error: "Token has expired" });
      }
      
      res.json({ 
        valid: true, 
        fullName: customer.fullName 
      });
    } catch (error) {
      console.error("Error validating setup token:", error);
      res.status(500).json({ error: "Failed to validate token" });
    }
  });

  // Set password using setup token
  app.post('/api/delivery/set-password', async (req, res) => {
    try {
      const { token, password } = req.body;
      
      if (!token || !password) {
        return res.status(400).json({ error: "Token and password are required" });
      }
      
      if (password.length < 6) {
        return res.status(400).json({ error: "Password must be at least 6 characters" });
      }
      
      const customer = await storage.getDeliveryCustomerByPasswordSetupToken(token);
      
      if (!customer) {
        return res.status(404).json({ error: "Invalid token" });
      }
      
      // Check if token has expired
      if (customer.passwordSetupTokenExpiry && new Date(customer.passwordSetupTokenExpiry) < new Date()) {
        return res.status(410).json({ error: "Token has expired" });
      }
      
      // Hash password and update customer
      const hashedPassword = await bcrypt.hash(password, 10);
      const updatedCustomer = await storage.setDeliveryCustomerPassword(customer.id, hashedPassword);
      
      if (!updatedCustomer) {
        return res.status(500).json({ error: "Failed to set password" });
      }
      
      res.json({ message: "Password set successfully" });
    } catch (error) {
      console.error("Error setting password:", error);
      res.status(500).json({ error: "Failed to set password" });
    }
  });

  // Request password reset
  app.post('/api/delivery/password-reset', async (req, res) => {
    try {
      const { email } = req.body;
      
      if (!email) {
        return res.status(400).json({ error: "Email is required" });
      }
      
      const customer = await storage.getDeliveryCustomerByEmail(email);
      
      if (!customer) {
        // Return success even if customer not found (security best practice)
        return res.json({ message: "If an account exists with this email, a password reset link has been sent." });
      }
      
      if (customer.approvalStatus !== "approved") {
        return res.status(403).json({ error: "Account is not approved yet" });
      }
      
      // Generate temporary password
      const tempPassword = generateTemporaryPassword();
      const hashedPassword = await bcrypt.hash(tempPassword, 10);
      
      // Store hashed temp password and set mustChangePassword flag
      await storage.updateDeliveryCustomerPassword(
        customer.id,
        hashedPassword,
        true
      );
      
      // Send password reset email
      const emailData: PasswordResetData = {
        email: customer.email,
        fullName: customer.fullName,
        temporaryPassword: tempPassword,
      };
      
      await sendPasswordResetEmail(emailData);
      
      res.json({ message: "Password reset email sent successfully" });
    } catch (error) {
      console.error("Error resetting password:", error);
      res.status(500).json({ error: "Failed to reset password" });
    }
  });

  // Get all delivery customers (admin)
  app.get('/api/admin/delivery/customers', isAdmin, async (req, res) => {
    try {
      const customers = await storage.getAllDeliveryCustomers();
      res.json(customers);
    } catch (error) {
      console.error("Error fetching customers:", error);
      res.status(500).json({ error: "Failed to fetch customers" });
    }
  });

  // Get all pending customers (admin)
  app.get('/api/admin/delivery/customers/pending', isAdmin, async (req, res) => {
    try {
      const customers = await storage.getPendingDeliveryCustomers();
      res.json(customers);
    } catch (error) {
      console.error("Error fetching pending customers:", error);
      res.status(500).json({ error: "Failed to fetch pending customers" });
    }
  });

  // Approve/reject delivery customer (admin)
  app.patch('/api/admin/delivery/customers/:id/approval', isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { status, rejectionReason } = req.body;
      
      if (!status || !['approved', 'rejected', 'pending'].includes(status)) {
        return res.status(400).json({ error: "Invalid approval status" });
      }

      let customer = await storage.updateDeliveryCustomerApproval(
        id,
        status,
        req.session.userId!,
        rejectionReason
      );

      if (!customer) {
        return res.status(404).json({ error: "Customer not found" });
      }

      // If approved, generate password setup token
      if (status === 'approved') {
        const setupToken = generatePasswordSetupToken();
        const tokenExpiry = new Date();
        tokenExpiry.setHours(tokenExpiry.getHours() + 48); // 48 hour expiry
        
        // Store password setup token
        const updatedCustomer = await storage.setPasswordSetupToken(
          id,
          setupToken,
          tokenExpiry
        );
        
        if (!updatedCustomer) {
          return res.status(500).json({ error: "Failed to generate password setup token" });
        }
        
        customer = updatedCustomer;
        
        // Send approval email with password setup link
        const emailData: DeliveryApprovalData = {
          email: customer.email,
          fullName: customer.fullName,
          passwordSetupToken: setupToken,
        };
        
        await sendDeliveryApprovalEmail(emailData);
      } else if (status === 'rejected') {
        // Send rejection email with reason
        const rejectionEmailData: DeliveryRejectionData = {
          email: customer.email,
          fullName: customer.fullName,
          rejectionReason: rejectionReason || 'No reason provided',
        };
        
        await sendDeliveryRejectionEmail(rejectionEmailData);
      }

      res.json(customer);
    } catch (error) {
      console.error("Error updating customer approval:", error);
      res.status(500).json({ error: "Failed to update approval status" });
    }
  });

  // Resend credentials - generate new password setup token (admin)
  app.post('/api/admin/delivery/customers/:id/resend-credentials', isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      const customer = await storage.getDeliveryCustomerById(id);
      if (!customer) {
        return res.status(404).json({ error: "Customer not found" });
      }
      
      if (customer.approvalStatus !== "approved") {
        return res.status(400).json({ error: "Customer must be approved to resend credentials" });
      }
      
      const setupToken = generatePasswordSetupToken();
      const tokenExpiry = new Date();
      tokenExpiry.setHours(tokenExpiry.getHours() + 48); // 48 hour expiry
      
      // Store password setup token
      const updatedCustomer = await storage.setPasswordSetupToken(
        id,
        setupToken,
        tokenExpiry
      );
      
      if (!updatedCustomer) {
        return res.status(500).json({ error: "Failed to generate password setup token" });
      }
      
      // Send activation email with password setup link
      const emailData: DeliveryApprovalData = {
        email: updatedCustomer.email,
        fullName: updatedCustomer.fullName,
        passwordSetupToken: setupToken,
      };
      
      await sendDeliveryApprovalEmail(emailData);
      
      res.json({ 
        message: "Activation link sent successfully",
        customer: updatedCustomer
      });
    } catch (error) {
      console.error("Error resending credentials:", error);
      res.status(500).json({ error: "Failed to resend credentials" });
    }
  });

  // Update delivery customer information (admin)
  app.patch('/api/admin/delivery/customers/:id', isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { fullName, phone, address, city, state, zipCode } = req.body;
      
      const updateData: Partial<Pick<DeliveryCustomer, 'fullName' | 'phone' | 'address' | 'city' | 'state' | 'zipCode'>> = {};
      
      if (fullName !== undefined) updateData.fullName = fullName;
      if (phone !== undefined) updateData.phone = phone;
      if (address !== undefined) updateData.address = address;
      if (city !== undefined) updateData.city = city;
      if (state !== undefined) updateData.state = state;
      if (zipCode !== undefined) updateData.zipCode = zipCode;

      const customer = await storage.updateDeliveryCustomer(id, updateData);

      if (!customer) {
        return res.status(404).json({ error: "Customer not found" });
      }

      res.json(customer);
    } catch (error) {
      console.error("Error updating customer:", error);
      res.status(500).json({ error: "Failed to update customer information" });
    }
  });

  // Delete delivery customer (admin)
  app.delete('/api/admin/delivery/customers/:id', isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid customer ID" });
      }
      
      const deleted = await storage.deleteDeliveryCustomer(id);
      
      if (!deleted) {
        return res.status(404).json({ error: "Customer not found" });
      }
      
      res.json({ message: "Customer deleted successfully" });
    } catch (error) {
      console.error("Error deleting customer:", error);
      res.status(500).json({ error: "Failed to delete customer" });
    }
  });

  // Sync products from Clover (admin)
  app.post('/api/admin/clover/sync', isAdmin, async (req, res) => {
    try {
      console.log("[Admin Sync] Starting manual sync from Clover...");
      
      if (!process.env.CLOVER_API_TOKEN || !process.env.CLOVER_MERCHANT_ID) {
        console.log("[Admin Sync] Missing credentials:", {
          hasToken: !!process.env.CLOVER_API_TOKEN,
          hasMerchant: !!process.env.CLOVER_MERCHANT_ID
        });
        return res.status(503).json({ error: "Clover API credentials not configured" });
      }

      console.log("[Admin Sync] Credentials OK, creating CloverService...");
      const cloverService = new CloverService();
      
      console.log("[Admin Sync] Fetching transformed inventory...");
      const products = await cloverService.getTransformedInventory();
      console.log(`[Admin Sync] Got ${products.length} products from Clover`);

      console.log("[Admin Sync] Syncing to database...");
      const result = await storage.syncProductsFromClover(products);
      console.log("[Admin Sync] Sync complete:", result);
      
      res.json({ 
        message: "Products synced successfully from Clover",
        ...result,
        timestamp: new Date().toISOString()
      });
    } catch (error: any) {
      console.error("[Admin Sync] Error syncing from Clover:", error?.message || error);
      console.error("[Admin Sync] Stack:", error?.stack);
      res.status(500).json({ error: error?.message || "Failed to sync products from Clover" });
    }
  });

  // Refresh inventory stock AND prices from Clover (admin)
  app.post('/api/admin/clover/refresh-inventory', isAdmin, async (req, res) => {
    try {
      if (!process.env.CLOVER_API_TOKEN || !process.env.CLOVER_MERCHANT_ID) {
        return res.status(503).json({ error: "Clover API credentials not configured" });
      }

      const cloverService = new CloverService();
      const items = await cloverService.fetchInventoryItems();
      
      let refreshed = 0;
      for (const item of items) {
        const stockQuantity = (item.itemStock?.quantity || 0).toString();
        const price = (item.price / 100).toFixed(2); // Convert cents to dollars
        const updated = await storage.refreshProductStockAndPrice(item.id, stockQuantity, price);
        if (updated) refreshed++;
      }
      
      res.json({ 
        message: "Inventory and prices refreshed successfully",
        refreshed,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error("Error refreshing inventory:", error);
      res.status(500).json({ error: "Failed to refresh inventory from Clover" });
    }
  });

  // Get all delivery products (customer - only enabled)
  app.get('/api/delivery/products', async (req, res) => {
    try {
      const products = await storage.getEnabledDeliveryProducts();
      res.json(products);
    } catch (error) {
      console.error("Error fetching delivery products:", error);
      res.status(500).json({ error: "Failed to fetch products" });
    }
  });

  // Get all delivery products for admin with pagination and filters
  app.get('/api/admin/delivery/products', isAdmin, async (req, res) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 50;
      const search = req.query.search as string | undefined;
      const category = req.query.category as string | undefined;
      const enabled = req.query.enabled === 'all' ? 'all' : req.query.enabled === 'true' ? true : req.query.enabled === 'false' ? false : undefined;

      const offset = (page - 1) * limit;

      const result = await storage.getAllDeliveryProducts({
        search,
        category,
        enabled,
        limit,
        offset
      });

      res.json({
        products: result.products,
        totalCount: result.totalCount,
        page,
        limit,
        totalPages: Math.ceil(result.totalCount / limit)
      });
    } catch (error) {
      console.error("Error fetching delivery products:", error);
      res.status(500).json({ error: "Failed to fetch products" });
    }
  });

  // Request presigned URL for product image upload (admin)
  const objectStorageService = new ObjectStorageService();
  
  app.post('/api/admin/delivery/products/upload-url', isAdmin, async (req, res) => {
    try {
      const { name, size, contentType } = req.body;
      
      if (!name) {
        return res.status(400).json({ error: "Missing required field: name" });
      }
      
      const uploadURL = await objectStorageService.getObjectEntityUploadURL();
      const objectPath = objectStorageService.normalizeObjectEntityPath(uploadURL);
      
      res.json({
        uploadURL,
        objectPath,
        metadata: { name, size, contentType }
      });
    } catch (error) {
      console.error("Error generating product image upload URL:", error);
      res.status(500).json({ error: "Failed to generate upload URL" });
    }
  });
  
  // Update product image after upload to object storage (admin)
  app.post('/api/admin/delivery/products/:id/image', isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid product ID" });
      }

      const { objectPath } = req.body;
      
      if (!objectPath) {
        return res.status(400).json({ error: "objectPath is required" });
      }

      // Set public ACL policy for the uploaded image
      try {
        const objectFile = await objectStorageService.getObjectEntityFile(objectPath);
        const { setObjectAclPolicy } = await import("./replit_integrations/object_storage/objectAcl");
        await setObjectAclPolicy(objectFile, {
          owner: "admin",
          visibility: "public"
        });
      } catch (aclError) {
        console.error("Warning: Could not set ACL policy:", aclError);
        // Continue anyway - image will still be accessible via /objects/ route
      }

      // Update the product with the object storage path
      const product = await storage.updateDeliveryProduct(id, { image: objectPath });

      if (!product) {
        return res.status(404).json({ error: "Product not found" });
      }

      res.json({ imageUrl: objectPath, product });
    } catch (error) {
      console.error("Error updating product image:", error);
      res.status(500).json({ error: "Failed to update product image" });
    }
  });
  
  // Legacy upload endpoint - still supports FormData for backwards compatibility
  app.post('/api/admin/delivery/products/:id/image-upload', isAdmin, uploadProductImage.single('image'), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid product ID" });
      }

      if (!req.file) {
        return res.status(400).json({ error: "No image file provided" });
      }

      // Construct the public URL path for the image
      const imageUrl = `/attached_assets/product-images/${req.file.filename}`;

      // Update the product with the new image URL
      const product = await storage.updateDeliveryProduct(id, { image: imageUrl });

      if (!product) {
        // Delete the uploaded file if product not found
        fs.unlinkSync(req.file.path);
        return res.status(404).json({ error: "Product not found" });
      }

      res.json({ imageUrl, product });
    } catch (error) {
      console.error("Error uploading product image:", error);
      // Clean up uploaded file on error
      if (req.file) {
        fs.unlinkSync(req.file.path);
      }
      res.status(500).json({ error: "Failed to upload image" });
    }
  });

  // Create delivery product (admin)
  app.post('/api/admin/delivery/products', isAdmin, async (req, res) => {
    try {
      const validated = insertDeliveryProductSchema.parse(req.body);
      const product = await storage.createDeliveryProduct(validated);
      res.json(product);
    } catch (error) {
      console.error("Error creating delivery product:", error);
      res.status(500).json({ error: "Failed to create product" });
    }
  });

  // Bulk update delivery products (admin) - MUST come before :id routes
  app.patch('/api/admin/delivery/products/bulk', isAdmin, async (req, res) => {
    try {
      const { productIds, updates } = req.body;
      
      if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
        return res.status(400).json({ error: "productIds array is required" });
      }

      if (!updates || typeof updates !== 'object') {
        return res.status(400).json({ error: "updates object is required" });
      }

      // Skip validation for now - just pass the updates through
      const result = await storage.bulkUpdateDeliveryProducts(productIds, updates);
      
      res.json({ 
        message: `${result.updated} products updated successfully`,
        updated: result.updated 
      });
    } catch (error: any) {
      return res.status(500).json({ error: "Failed to bulk update products", message: error.message });
    }
  });

  // Bulk delete delivery products (admin) - MUST come before :id routes
  app.delete('/api/admin/delivery/products/bulk', isAdmin, async (req, res) => {
    try {
      const { productIds } = req.body;
      
      if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
        return res.status(400).json({ error: "productIds array is required" });
      }

      const result = await storage.bulkDeleteDeliveryProducts(productIds);
      
      res.json({ 
        message: `${result.deleted} products deleted successfully`,
        deleted: result.deleted 
      });
    } catch (error) {
      console.error("Error bulk deleting delivery products:", error);
      res.status(500).json({ error: "Failed to bulk delete products" });
    }
  });

  // Update delivery product (admin)
  app.patch('/api/admin/delivery/products/:id', isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid product ID" });
      }

      // Validate partial product data
      const partialSchema = insertDeliveryProductSchema.partial();
      const validated = partialSchema.parse(req.body);
      
      const product = await storage.updateDeliveryProduct(id, validated);
      
      if (!product) {
        return res.status(404).json({ error: "Product not found" });
      }

      res.json(product);
    } catch (error: any) {
      console.error("Error updating delivery product:", error);
      if (error.name === 'ZodError') {
        return res.status(400).json({ error: "Invalid product data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to update product" });
    }
  });

  // Delete delivery product (admin)
  app.delete('/api/admin/delivery/products/:id', isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteDeliveryProduct(id);
      
      if (!success) {
        return res.status(404).json({ error: "Product not found" });
      }

      res.json({ message: "Product deleted successfully" });
    } catch (error) {
      console.error("Error deleting delivery product:", error);
      res.status(500).json({ error: "Failed to delete product" });
    }
  });

  // Get all delivery windows (limited to next 5 days, with 1-hour cutoff)
  app.get('/api/delivery/windows', async (req, res) => {
    try {
      const { date } = req.query;
      const now = new Date();
      const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);
      
      // Calculate date range: today through 4 days ahead (5 days total)
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const fiveDaysAhead = new Date(today);
      fiveDaysAhead.setDate(fiveDaysAhead.getDate() + 4);
      
      // Format dates as YYYY-MM-DD for comparison
      const formatDateStr = (d: Date) => {
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      };
      
      const todayStr = formatDateStr(today);
      const fiveDaysAheadStr = formatDateStr(fiveDaysAhead);
      
      let windows = date 
        ? await storage.getDeliveryWindowsByDate(date as string)
        : await storage.getAllDeliveryWindows();
      
      // Filter to only include windows within the next 5 days
      windows = windows.filter(window => {
        const windowDateStr = window.date;
        return windowDateStr >= todayStr && windowDateStr <= fiveDaysAheadStr;
      });
      
      // Helper function to parse time strings like "05:00 PM" or "14:00"
      const parseTimeString = (timeStr: string): { hours: number; minutes: number } => {
        // Check for AM/PM format
        const ampmMatch = timeStr.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
        if (ampmMatch) {
          let hours = parseInt(ampmMatch[1], 10);
          const minutes = parseInt(ampmMatch[2], 10);
          const period = ampmMatch[3].toUpperCase();
          
          if (period === 'PM' && hours !== 12) {
            hours += 12;
          } else if (period === 'AM' && hours === 12) {
            hours = 0;
          }
          
          return { hours, minutes };
        }
        
        // Fall back to 24-hour format
        const parts = timeStr.split(':').map(Number);
        return { hours: parts[0] || 0, minutes: parts[1] || 0 };
      };
      
      const availableWindows = windows.map(window => {
        // Parse the window date and start time to create a full datetime
        const [year, month, day] = window.date.split('-').map(Number);
        const windowDate = new Date(year, month - 1, day);
        const { hours, minutes } = parseTimeString(window.startTime);
        windowDate.setHours(hours, minutes, 0, 0);
        
        // Check if the window start time is more than 1 hour away
        const isAvailable = windowDate > oneHourFromNow;
        
        return {
          ...window,
          isClosed: !isAvailable,
          closedReason: !isAvailable ? 'This delivery window has closed (1 hour before start time)' : null
        };
      });
      
      res.json(availableWindows);
    } catch (error) {
      console.error("Error fetching delivery windows:", error);
      res.status(500).json({ error: "Failed to fetch delivery windows" });
    }
  });

  // Create delivery window (admin)
  app.post('/api/admin/delivery/windows', isAdmin, async (req, res) => {
    try {
      const validated = insertDeliveryWindowSchema.parse(req.body);
      const window = await storage.createDeliveryWindow(validated);
      res.json(window);
    } catch (error) {
      console.error("Error creating delivery window:", error);
      res.status(500).json({ error: "Failed to create delivery window" });
    }
  });

  // Update delivery window (admin)
  app.patch('/api/admin/delivery/windows/:id', isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const window = await storage.updateDeliveryWindow(id, req.body);
      
      if (!window) {
        return res.status(404).json({ error: "Delivery window not found" });
      }

      res.json(window);
    } catch (error) {
      console.error("Error updating delivery window:", error);
      res.status(500).json({ error: "Failed to update delivery window" });
    }
  });

  // Delete delivery window (admin)
  app.delete('/api/admin/delivery/windows/:id', isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteDeliveryWindow(id);
      
      if (!success) {
        return res.status(404).json({ error: "Delivery window not found" });
      }

      res.json({ message: "Delivery window deleted successfully" });
    } catch (error) {
      console.error("Error deleting delivery window:", error);
      res.status(500).json({ error: "Failed to delete delivery window" });
    }
  });

  // Weekly Delivery Template Management (admin)
  app.get('/api/admin/delivery/weekly-templates', isAdmin, async (req, res) => {
    try {
      const templates = await storage.getAllWeeklyDeliveryTemplates();
      res.json(templates);
    } catch (error) {
      console.error("Error fetching weekly templates:", error);
      res.status(500).json({ error: "Failed to fetch weekly templates" });
    }
  });

  app.post('/api/admin/delivery/weekly-templates', isAdmin, async (req, res) => {
    try {
      const validated = insertWeeklyDeliveryTemplateSchema.parse(req.body);
      const template = await storage.createWeeklyDeliveryTemplate(validated);
      res.json(template);
    } catch (error) {
      console.error("Error creating weekly template:", error);
      res.status(500).json({ error: "Failed to create weekly template" });
    }
  });

  app.patch('/api/admin/delivery/weekly-templates/:id', isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const template = await storage.updateWeeklyDeliveryTemplate(id, req.body);
      
      if (!template) {
        return res.status(404).json({ error: "Weekly template not found" });
      }

      res.json(template);
    } catch (error) {
      console.error("Error updating weekly template:", error);
      res.status(500).json({ error: "Failed to update weekly template" });
    }
  });

  // Site Settings routes (concept1)
  app.get('/api/site-settings', async (req, res) => {
    try {
      const settings = await storage.getSiteSettings();
      res.json(settings);
    } catch (error) {
      console.error("Error fetching site settings:", error);
      res.status(500).json({ error: "Failed to fetch site settings" });
    }
  });

  app.patch('/api/admin/site-settings', isAdmin, async (req, res) => {
    try {
      const settings = await storage.updateSiteSettings(req.body);
      res.json(settings);
    } catch (error) {
      console.error("Error updating site settings:", error);
      res.status(500).json({ error: "Failed to update site settings" });
    }
  });

  // Hero Slides routes (concept1)
  app.get('/api/hero-slides', async (req, res) => {
    try {
      const slides = await storage.getEnabledHeroSlides();
      res.json(slides);
    } catch (error) {
      console.error("Error fetching hero slides:", error);
      res.status(500).json({ error: "Failed to fetch hero slides" });
    }
  });

  app.get('/api/admin/hero-slides', isAdmin, async (req, res) => {
    try {
      const slides = await storage.getAllHeroSlides();
      res.json(slides);
    } catch (error) {
      console.error("Error fetching hero slides:", error);
      res.status(500).json({ error: "Failed to fetch hero slides" });
    }
  });

  app.post('/api/admin/hero-slides', isAdmin, async (req, res) => {
    try {
      const slide = await storage.createHeroSlide(req.body);
      res.json(slide);
    } catch (error) {
      console.error("Error creating hero slide:", error);
      res.status(500).json({ error: "Failed to create hero slide" });
    }
  });

  app.patch('/api/admin/hero-slides/:id', isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const slide = await storage.updateHeroSlide(id, req.body);
      if (!slide) {
        return res.status(404).json({ error: "Hero slide not found" });
      }
      res.json(slide);
    } catch (error) {
      console.error("Error updating hero slide:", error);
      res.status(500).json({ error: "Failed to update hero slide" });
    }
  });

  app.delete('/api/admin/hero-slides/:id', isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteHeroSlide(id);
      res.json({ message: "Hero slide deleted successfully" });
    } catch (error) {
      console.error("Error deleting hero slide:", error);
      res.status(500).json({ error: "Failed to delete hero slide" });
    }
  });

  app.post('/api/admin/hero-slides/reorder', isAdmin, async (req, res) => {
    try {
      const { orderedIds } = req.body;
      for (let i = 0; i < orderedIds.length; i++) {
        await storage.updateHeroSlide(orderedIds[i], { displayOrder: i });
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Error reordering hero slides:", error);
      res.status(500).json({ error: "Failed to reorder hero slides" });
    }
  });

  // Category Banners routes
  app.get('/api/category-banners', async (req, res) => {
    try {
      const banners = await storage.getActiveCategoryBanners();
      res.json(banners);
    } catch (error) {
      console.error("Error fetching category banners:", error);
      res.status(500).json({ error: "Failed to fetch category banners" });
    }
  });

  app.get('/api/admin/category-banners', isAdmin, async (req, res) => {
    try {
      const banners = await storage.getAllCategoryBanners();
      res.json(banners);
    } catch (error) {
      console.error("Error fetching category banners:", error);
      res.status(500).json({ error: "Failed to fetch category banners" });
    }
  });

  app.post('/api/admin/category-banners', isAdmin, async (req, res) => {
    try {
      const bannerResult = insertCategoryBannerSchema.safeParse(req.body);
      
      if (!bannerResult.success) {
        return res.status(400).json({ error: bannerResult.error.format() });
      }
      
      const banner = await storage.createCategoryBanner(bannerResult.data);
      res.json(banner);
    } catch (error) {
      console.error("Error creating category banner:", error);
      res.status(500).json({ error: "Failed to create category banner" });
    }
  });

  app.patch('/api/admin/category-banners/:id', isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid banner ID" });
      }
      
      const banner = await storage.updateCategoryBanner(id, req.body);
      if (!banner) {
        return res.status(404).json({ error: "Category banner not found" });
      }
      res.json(banner);
    } catch (error) {
      console.error("Error updating category banner:", error);
      res.status(500).json({ error: "Failed to update category banner" });
    }
  });

  app.delete('/api/admin/category-banners/:id', isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid banner ID" });
      }
      
      await storage.deleteCategoryBanner(id);
      res.json({ message: "Category banner deleted successfully" });
    } catch (error) {
      console.error("Error deleting category banner:", error);
      res.status(500).json({ error: "Failed to delete category banner" });
    }
  });

  app.delete('/api/admin/delivery/weekly-templates/:id', isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteWeeklyDeliveryTemplate(id);
      
      if (!success) {
        return res.status(404).json({ error: "Weekly template not found" });
      }

      res.json({ message: "Weekly template deleted successfully" });
    } catch (error) {
      console.error("Error deleting weekly template:", error);
      res.status(500).json({ error: "Failed to delete weekly template" });
    }
  });

  // Generate delivery windows from weekly templates (admin)
  app.post('/api/admin/delivery/generate-windows', isAdmin, async (req, res) => {
    try {
      const { daysAhead = 4 } = req.body;
      const result = await storage.generateWindowsFromTemplates(daysAhead);
      res.json({
        message: `Generated ${result.created} delivery windows, skipped ${result.skipped} existing windows`,
        ...result
      });
    } catch (error) {
      console.error("Error generating delivery windows:", error);
      res.status(500).json({ error: "Failed to generate delivery windows" });
    }
  });

  // Cart management (requires approved customer)
  app.get('/api/delivery/cart', verifyApprovedCustomer, async (req, res) => {
    try {
      const customerId = (req as any).deliveryCustomer.id;
      const cart = await storage.getCartItems(customerId);
      
      // Enrich cart items with product data
      const cartWithProducts = await Promise.all(
        cart.map(async (item) => {
          const product = await storage.getDeliveryProduct(item.productId);
          return {
            ...item,
            product: product ? {
              id: product.id,
              name: product.name,
              price: product.price,
              salePrice: product.salePrice,
              image: product.image,
              description: product.description,
              category: product.category,
              stockQuantity: product.stockQuantity,
            } : null
          };
        })
      );
      
      res.json(cartWithProducts);
    } catch (error) {
      console.error("Error fetching cart:", error);
      res.status(500).json({ error: "Failed to fetch cart" });
    }
  });

  app.post('/api/delivery/cart', verifyApprovedCustomer, async (req, res) => {
    try {
      const customerId = (req as any).deliveryCustomer.id;
      const validated = insertCartItemSchema.parse({
        ...req.body,
        customerId
      });
      
      // Check stock availability before adding to cart
      const product = await storage.getDeliveryProduct(validated.productId);
      if (!product) {
        return res.status(404).json({ error: "Product not found" });
      }
      
      const stockQuantity = product.stockQuantity ? parseInt(product.stockQuantity) : 0;
      if (stockQuantity === 0) {
        return res.status(400).json({ error: "This product is out of stock" });
      }
      
      // Check current cart quantity for this product
      const currentCart = await storage.getCartItems(customerId);
      const existingItem = currentCart.find(item => item.productId === validated.productId);
      const currentCartQuantity = existingItem ? existingItem.quantity : 0;
      
      if (currentCartQuantity >= stockQuantity) {
        return res.status(400).json({ error: "You've reached the maximum available quantity for this product" });
      }
      
      const item = await storage.addToCart(validated);
      res.json(item);
    } catch (error: any) {
      console.error("Error adding to cart:", error);
      if (error.name === 'ZodError') {
        return res.status(400).json({ error: "Invalid cart item data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to add to cart" });
    }
  });

  app.patch('/api/delivery/cart/:id', verifyApprovedCustomer, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid cart item ID" });
      }

      const { quantity } = req.body;
      if (typeof quantity !== 'number' || quantity < 1) {
        return res.status(400).json({ error: "Quantity must be a positive number" });
      }

      // Get the cart item to find the product
      const customerId = (req as any).deliveryCustomer.id;
      const currentCart = await storage.getCartItems(customerId);
      const cartItem = currentCart.find(item => item.id === id);
      
      if (!cartItem) {
        return res.status(404).json({ error: "Cart item not found" });
      }
      
      // Check stock availability
      const product = await storage.getDeliveryProduct(cartItem.productId);
      if (product) {
        const stockQuantity = product.stockQuantity ? parseInt(product.stockQuantity) : 0;
        if (quantity > stockQuantity) {
          return res.status(400).json({ error: `Only ${stockQuantity} available in stock` });
        }
      }

      const item = await storage.updateCartItemQuantity(id, quantity);
      
      if (!item) {
        return res.status(404).json({ error: "Cart item not found" });
      }

      res.json(item);
    } catch (error) {
      console.error("Error updating cart item:", error);
      res.status(500).json({ error: "Failed to update cart item" });
    }
  });

  app.delete('/api/delivery/cart/:id', verifyApprovedCustomer, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid cart item ID" });
      }

      const success = await storage.removeFromCart(id);
      
      if (!success) {
        return res.status(404).json({ error: "Cart item not found" });
      }

      res.json({ message: "Item removed from cart" });
    } catch (error) {
      console.error("Error removing from cart:", error);
      res.status(500).json({ error: "Failed to remove from cart" });
    }
  });

  app.delete('/api/delivery/cart/clear', verifyApprovedCustomer, async (req, res) => {
    try {
      const customerId = (req as any).deliveryCustomer.id;
      await storage.clearCart(customerId);
      res.json({ message: "Cart cleared" });
    } catch (error) {
      console.error("Error clearing cart:", error);
      res.status(500).json({ error: "Failed to clear cart" });
    }
  });

  // Reorder - add items from a previous order to cart
  app.post('/api/delivery/orders/:orderId/reorder', verifyApprovedCustomer, async (req, res) => {
    try {
      const customerId = (req as any).deliveryCustomer.id;
      const orderId = parseInt(req.params.orderId);
      
      if (isNaN(orderId)) {
        return res.status(400).json({ error: "Invalid order ID" });
      }

      // Fetch the order and verify it belongs to this customer
      const order = await storage.getDeliveryOrderById(orderId);
      if (!order) {
        return res.status(404).json({ error: "Order not found" });
      }
      if (order.customerId !== customerId) {
        return res.status(403).json({ error: "Not authorized to reorder this order" });
      }

      // Get order items from the order items table
      const items = await storage.getDeliveryOrderItems(orderId);
      if (!items || items.length === 0) {
        return res.status(400).json({ error: "Order has no items to reorder" });
      }

      // Add each item to cart
      const addedItems: any[] = [];
      const unavailableItems: any[] = [];
      
      for (const item of items) {
        try {
          const productName = item.product?.name || `Product #${item.productId}`;
          
          // Validate quantity is positive
          const quantity = item.quantity;
          if (!quantity || quantity < 1) {
            unavailableItems.push({ name: productName, reason: "Invalid quantity" });
            continue;
          }

          // Check if product still exists and is available
          const product = await storage.getDeliveryProduct(item.productId);
          if (!product || !product.enabled) {
            unavailableItems.push({ name: productName, reason: "Product no longer available" });
            continue;
          }

          // Add to cart with exact quantity from original order
          const cartItem = await storage.addToCart({
            customerId,
            productId: item.productId,
            quantity: quantity
          });
          addedItems.push(cartItem);
        } catch (itemError) {
          console.error(`Error adding item ${item.productId} to cart:`, itemError);
          unavailableItems.push({ name: item.product?.name || `Product #${item.productId}`, reason: "Failed to add to cart" });
        }
      }

      res.json({
        message: `Added ${addedItems.length} item(s) to cart`,
        addedCount: addedItems.length,
        unavailableItems
      });
    } catch (error) {
      console.error("Error processing reorder:", error);
      res.status(500).json({ error: "Failed to process reorder" });
    }
  });

  // Download receipt/invoice as PDF
  app.get('/api/delivery/orders/:orderId/receipt', verifyApprovedCustomer, async (req, res) => {
    try {
      const orderId = parseInt(req.params.orderId);
      const customerId = req.session.deliveryCustomerId;

      if (!customerId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      // Get order and verify it belongs to the customer
      const order = await storage.getDeliveryOrderById(orderId);
      if (!order || order.customerId !== customerId) {
        return res.status(404).json({ error: "Order not found" });
      }

      // Get order items
      const items = await storage.getDeliveryOrderItems(orderId);

      // Get customer details
      const customer = await storage.getDeliveryCustomerById(customerId);
      if (!customer) {
        return res.status(404).json({ error: "Customer not found" });
      }

      // Import PDFKit dynamically
      const PDFDocument = (await import('pdfkit')).default;

      // Create PDF document
      const doc = new PDFDocument({ margin: 50 });

      // Set response headers for PDF download
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="receipt-${order.id}.pdf"`);

      // Pipe the PDF to the response
      doc.pipe(res);

      // Colors
      const primaryColor = '#FF7100';
      const darkColor = '#1A1A1A';
      const grayColor = '#666666';

      // Header - Company Info
      doc.fontSize(24).fillColor(primaryColor).text('Vape Cave Smoke & Stuff', { align: 'center' });
      doc.fontSize(10).fillColor(grayColor).text('Frisco, TX', { align: 'center' });
      doc.moveDown(0.5);
      
      // Receipt Title
      doc.fontSize(16).fillColor(darkColor).text('Receipt / Invoice', { align: 'center' });
      doc.moveDown(1);

      // Order Details Box
      doc.fontSize(10).fillColor(grayColor);
      doc.text(`Order #: ${order.id}`, { continued: true });
      doc.text(`Date: ${new Date(order.createdAt!).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`, { align: 'right' });
      doc.moveDown(0.5);
      doc.text(`Payment Method: ${order.paymentMethod === 'card' ? 'Credit Card' : 'Cash on Delivery'}`, { continued: true });
      doc.text(`Status: ${order.status.replace(/_/g, ' ').toUpperCase()}`, { align: 'right' });
      doc.moveDown(1.5);

      // Customer Info
      doc.fontSize(12).fillColor(darkColor).text('Customer Information');
      doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke('#E0E0E0');
      doc.moveDown(0.5);
      doc.fontSize(10).fillColor(grayColor);
      doc.text(`Name: ${customer.fullName}`);
      doc.text(`Email: ${customer.email}`);
      doc.text(`Phone: ${customer.phone}`);
      doc.moveDown(0.5);

      // Delivery Address
      doc.fontSize(12).fillColor(darkColor).text('Delivery Address');
      doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke('#E0E0E0');
      doc.moveDown(0.5);
      doc.fontSize(10).fillColor(grayColor);
      doc.text(`${order.deliveryAddress}`);
      if (order.deliveryNotes) {
        doc.text(`Notes: ${order.deliveryNotes}`);
      }
      doc.moveDown(1);

      // Items Table Header
      doc.fontSize(12).fillColor(darkColor).text('Order Items');
      doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke('#E0E0E0');
      doc.moveDown(0.5);

      // Table header
      const tableTop = doc.y;
      doc.fontSize(10).fillColor(darkColor);
      doc.text('Item', 50, tableTop, { width: 250 });
      doc.text('Qty', 310, tableTop, { width: 50, align: 'center' });
      doc.text('Price', 370, tableTop, { width: 80, align: 'right' });
      doc.text('Total', 460, tableTop, { width: 80, align: 'right' });
      doc.moveDown(0.3);
      doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke('#E0E0E0');

      // Items
      doc.moveDown(0.5);
      let currentY = doc.y;
      doc.fontSize(10).fillColor(grayColor);
      
      for (const item of items) {
        const itemTotal = parseFloat(item.unitPrice) * item.quantity;
        doc.text(item.productName, 50, currentY, { width: 250 });
        doc.text(item.quantity.toString(), 310, currentY, { width: 50, align: 'center' });
        doc.text(`$${parseFloat(item.unitPrice).toFixed(2)}`, 370, currentY, { width: 80, align: 'right' });
        doc.text(`$${itemTotal.toFixed(2)}`, 460, currentY, { width: 80, align: 'right' });
        currentY += 20;
      }
      
      doc.y = currentY;
      doc.moveDown(0.5);
      doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke('#E0E0E0');
      doc.moveDown(1);

      // Totals
      const totalsX = 370;
      doc.fontSize(10).fillColor(grayColor);
      doc.text('Subtotal:', totalsX, doc.y, { width: 80, continued: true });
      doc.text(`$${parseFloat(order.subtotal).toFixed(2)}`, { width: 80, align: 'right' });
      
      if (order.discountAmount && parseFloat(order.discountAmount) > 0) {
        doc.text('Discount:', totalsX, doc.y, { width: 80, continued: true });
        doc.text(`-$${parseFloat(order.discountAmount).toFixed(2)}`, { width: 80, align: 'right' });
      }
      
      doc.text('Delivery Fee:', totalsX, doc.y, { width: 80, continued: true });
      doc.text(`$${parseFloat(order.deliveryFee).toFixed(2)}`, { width: 80, align: 'right' });
      
      doc.moveDown(0.3);
      doc.moveTo(totalsX, doc.y).lineTo(545, doc.y).stroke('#E0E0E0');
      doc.moveDown(0.5);
      
      doc.fontSize(12).fillColor(darkColor);
      doc.text('Total:', totalsX, doc.y, { width: 80, continued: true });
      doc.text(`$${parseFloat(order.totalAmount).toFixed(2)}`, { width: 80, align: 'right' });

      // Payment Info
      if (order.paymentStatus === 'paid' || order.paymentStatus === 'refunded') {
        doc.moveDown(1);
        doc.fontSize(10).fillColor(grayColor);
        doc.text(`Payment Status: ${order.paymentStatus.toUpperCase()}`, { align: 'center' });
        
        if (order.paymentStatus === 'refunded' && order.refundAmount) {
          doc.text(`Refund Amount: $${parseFloat(order.refundAmount).toFixed(2)}`, { align: 'center' });
        }
      }

      // Footer
      doc.moveDown(2);
      doc.fontSize(8).fillColor(grayColor);
      doc.text('Thank you for your order!', { align: 'center' });
      doc.text('All sales are final. For questions, please contact us.', { align: 'center' });
      doc.moveDown(0.5);
      doc.text(`Generated on ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}`, { align: 'center' });

      // Finalize PDF
      doc.end();

    } catch (error) {
      console.error("Error generating receipt:", error);
      res.status(500).json({ error: "Failed to generate receipt" });
    }
  });

  // Admin: Download receipt for any order
  app.get('/api/admin/orders/:orderId/receipt', isAdmin, async (req, res) => {
    try {
      const orderId = parseInt(req.params.orderId);

      // Get order
      const order = await storage.getDeliveryOrderById(orderId);
      if (!order) {
        return res.status(404).json({ error: "Order not found" });
      }

      // Get order items
      const items = await storage.getDeliveryOrderItems(orderId);

      // Get customer details
      const customer = await storage.getDeliveryCustomerById(order.customerId);
      if (!customer) {
        return res.status(404).json({ error: "Customer not found" });
      }

      // Import PDFKit dynamically
      const PDFDocument = (await import('pdfkit')).default;

      // Create PDF document
      const doc = new PDFDocument({ margin: 50 });

      // Set response headers for PDF download
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="receipt-${order.id}.pdf"`);

      // Pipe the PDF to the response
      doc.pipe(res);

      // Colors
      const primaryColor = '#FF7100';
      const darkColor = '#1A1A1A';
      const grayColor = '#666666';

      // Header - Company Info
      doc.fontSize(24).fillColor(primaryColor).text('Vape Cave Smoke & Stuff', { align: 'center' });
      doc.fontSize(10).fillColor(grayColor).text('Frisco, TX', { align: 'center' });
      doc.moveDown(0.5);
      
      // Receipt Title
      doc.fontSize(16).fillColor(darkColor).text('Receipt / Invoice', { align: 'center' });
      doc.moveDown(1);

      // Order Details Box
      doc.fontSize(10).fillColor(grayColor);
      doc.text(`Order #: ${order.id}`, { continued: true });
      doc.text(`Date: ${new Date(order.createdAt!).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`, { align: 'right' });
      doc.moveDown(0.5);
      doc.text(`Payment Method: ${order.paymentMethod === 'card' ? 'Credit Card' : 'Cash on Delivery'}`, { continued: true });
      doc.text(`Status: ${order.status.replace(/_/g, ' ').toUpperCase()}`, { align: 'right' });
      doc.moveDown(1.5);

      // Customer Info
      doc.fontSize(12).fillColor(darkColor).text('Customer Information');
      doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke('#E0E0E0');
      doc.moveDown(0.5);
      doc.fontSize(10).fillColor(grayColor);
      doc.text(`Name: ${customer.fullName}`);
      doc.text(`Email: ${customer.email}`);
      doc.text(`Phone: ${customer.phone}`);
      doc.moveDown(0.5);

      // Delivery Address
      doc.fontSize(12).fillColor(darkColor).text('Delivery Address');
      doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke('#E0E0E0');
      doc.moveDown(0.5);
      doc.fontSize(10).fillColor(grayColor);
      doc.text(`${order.deliveryAddress}`);
      if (order.deliveryNotes) {
        doc.text(`Notes: ${order.deliveryNotes}`);
      }
      doc.moveDown(1);

      // Items Table Header
      doc.fontSize(12).fillColor(darkColor).text('Order Items');
      doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke('#E0E0E0');
      doc.moveDown(0.5);

      // Table header
      const tableTop = doc.y;
      doc.fontSize(10).fillColor(darkColor);
      doc.text('Item', 50, tableTop, { width: 250 });
      doc.text('Qty', 310, tableTop, { width: 50, align: 'center' });
      doc.text('Price', 370, tableTop, { width: 80, align: 'right' });
      doc.text('Total', 460, tableTop, { width: 80, align: 'right' });
      doc.moveDown(0.3);
      doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke('#E0E0E0');

      // Items
      doc.moveDown(0.5);
      let currentY = doc.y;
      doc.fontSize(10).fillColor(grayColor);
      
      for (const item of items) {
        const itemTotal = parseFloat(item.unitPrice) * item.quantity;
        doc.text(item.productName, 50, currentY, { width: 250 });
        doc.text(item.quantity.toString(), 310, currentY, { width: 50, align: 'center' });
        doc.text(`$${parseFloat(item.unitPrice).toFixed(2)}`, 370, currentY, { width: 80, align: 'right' });
        doc.text(`$${itemTotal.toFixed(2)}`, 460, currentY, { width: 80, align: 'right' });
        currentY += 20;
      }
      
      doc.y = currentY;
      doc.moveDown(0.5);
      doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke('#E0E0E0');
      doc.moveDown(1);

      // Totals
      const totalsX = 370;
      doc.fontSize(10).fillColor(grayColor);
      doc.text('Subtotal:', totalsX, doc.y, { width: 80, continued: true });
      doc.text(`$${parseFloat(order.subtotal).toFixed(2)}`, { width: 80, align: 'right' });
      
      if (order.discountAmount && parseFloat(order.discountAmount) > 0) {
        doc.text('Discount:', totalsX, doc.y, { width: 80, continued: true });
        doc.text(`-$${parseFloat(order.discountAmount).toFixed(2)}`, { width: 80, align: 'right' });
      }
      
      doc.text('Delivery Fee:', totalsX, doc.y, { width: 80, continued: true });
      doc.text(`$${parseFloat(order.deliveryFee).toFixed(2)}`, { width: 80, align: 'right' });
      
      doc.moveDown(0.3);
      doc.moveTo(totalsX, doc.y).lineTo(545, doc.y).stroke('#E0E0E0');
      doc.moveDown(0.5);
      
      doc.fontSize(12).fillColor(darkColor);
      doc.text('Total:', totalsX, doc.y, { width: 80, continued: true });
      doc.text(`$${parseFloat(order.totalAmount).toFixed(2)}`, { width: 80, align: 'right' });

      // Payment Info
      if (order.paymentStatus === 'paid' || order.paymentStatus === 'refunded') {
        doc.moveDown(1);
        doc.fontSize(10).fillColor(grayColor);
        doc.text(`Payment Status: ${order.paymentStatus.toUpperCase()}`, { align: 'center' });
        
        if (order.paymentStatus === 'refunded' && order.refundAmount) {
          doc.text(`Refund Amount: $${parseFloat(order.refundAmount).toFixed(2)}`, { align: 'center' });
        }
      }

      // Footer
      doc.moveDown(2);
      doc.fontSize(8).fillColor(grayColor);
      doc.text('Thank you for your order!', { align: 'center' });
      doc.text('All sales are final. For questions, please contact us.', { align: 'center' });
      doc.moveDown(0.5);
      doc.text(`Generated on ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}`, { align: 'center' });

      // Finalize PDF
      doc.end();

    } catch (error) {
      console.error("Error generating receipt:", error);
      res.status(500).json({ error: "Failed to generate receipt" });
    }
  });

  // Get Clover sync status
  app.get('/api/admin/clover/sync-status', isAdmin, async (req, res) => {
    try {
      const lastSync = getLastSyncTime();
      const nextSync = getNextSyncTime();
      
      res.json({
        lastSyncTime: lastSync?.toISOString() || null,
        nextSyncTime: nextSync?.toISOString() || null,
        autoSyncEnabled: true,
        syncIntervalMinutes: 5
      });
    } catch (error) {
      console.error("Error getting sync status:", error);
      res.status(500).json({ error: "Failed to get sync status" });
    }
  });

  // OAuth: Get Clover connection status
  app.get('/api/admin/clover/oauth/status', isAdmin, async (req, res) => {
    try {
      const merchantId = process.env.CLOVER_MERCHANT_ID;
      const apiToken = process.env.CLOVER_API_TOKEN;
      
      // First check if direct API token is configured (takes precedence)
      if (apiToken && merchantId) {
        return res.json({ 
          connected: true, 
          merchantId,
          connectionType: 'api_token',
          message: 'Connected via API token'
        });
      }
      
      if (!merchantId) {
        return res.json({ connected: false, error: "Merchant ID not configured" });
      }

      // Fall back to OAuth token check
      const connected = await cloverOAuthService.isConnected(merchantId);
      res.json({ connected, merchantId, connectionType: connected ? 'oauth' : null });
    } catch (error) {
      console.error("Error checking OAuth status:", error);
      res.status(500).json({ error: "Failed to check connection status" });
    }
  });

  // OAuth: Initiate authorization flow
  app.get('/api/admin/clover/oauth/authorize', isAdmin, async (req, res) => {
    try {
      const state = crypto.randomBytes(16).toString('hex');
      const authUrl = cloverOAuthService.getAuthorizationUrl(state);
      
      // Store state in session for verification
      req.session.cloverOAuthState = state;
      
      res.redirect(authUrl);
    } catch (error) {
      console.error("Error initiating OAuth:", error);
      res.status(500).json({ error: "Failed to initiate authorization" });
    }
  });

  // OAuth: Handle callback from Clover
  app.get('/api/clover/oauth/callback', async (req, res) => {
    try {
      const { code, state } = req.query;

      if (!code || typeof code !== 'string') {
        return res.status(400).send('Missing authorization code');
      }

      // Verify state (if you stored it in session)
      // if (state !== req.session.cloverOAuthState) {
      //   return res.status(400).send('Invalid state parameter');
      // }

      // Exchange code for token
      const tokenData = await cloverOAuthService.exchangeCodeForToken(code);

      // Get merchant ID from the token
      const merchantId = await cloverOAuthService.getMerchantId(tokenData.access_token);

      // Store tokens
      await cloverOAuthService.storeTokens(merchantId, tokenData);

      // Redirect to admin page with success message
      res.redirect('/admin?clover_connected=true');
    } catch (error) {
      console.error('[OAuth] Callback error:', error);
      res.redirect('/admin?clover_error=true');
    }
  });

  // OAuth: Disconnect Clover account
  app.delete('/api/admin/clover/oauth/disconnect', isAdmin, async (req, res) => {
    try {
      const merchantId = process.env.CLOVER_MERCHANT_ID;
      if (!merchantId) {
        return res.status(400).json({ error: "Merchant ID not configured" });
      }

      await cloverOAuthService.disconnect(merchantId);
      res.json({ message: "Clover account disconnected successfully" });
    } catch (error) {
      console.error("Error disconnecting Clover:", error);
      res.status(500).json({ error: "Failed to disconnect" });
    }
  });

  // Test Clover connection (admin)
  app.post('/api/admin/clover/test-connection', isAdmin, async (req, res) => {
    try {
      const token = process.env.CLOVER_API_TOKEN;
      const merchantId = process.env.CLOVER_MERCHANT_ID;
      const apiBase = process.env.CLOVER_API_BASE || "https://api.clover.com";
      
      console.log("[Test Connection] Testing with:", {
        tokenExists: !!token,
        tokenLength: token?.length,
        merchantIdExists: !!merchantId,
        merchantIdLength: merchantId?.length,
        apiBase
      });
      
      if (!token || !merchantId) {
        return res.status(503).json({ 
          error: "Clover API credentials not configured",
          details: "Please set CLOVER_API_TOKEN and CLOVER_MERCHANT_ID in your environment secrets",
          debug: {
            tokenExists: !!token,
            merchantIdExists: !!merchantId
          }
        });
      }

      // Clean the token (remove any accidental whitespace)
      const cleanToken = token.trim();
      const cleanMerchantId = merchantId.trim();
      
      // Use the items endpoint which we know works from the sync service
      const testUrl = `${apiBase}/v3/merchants/${cleanMerchantId}/items?limit=1`;
      
      const response = await fetch(testUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${cleanToken}`,
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("[Test Connection] API Error - Status:", response.status);
        
        return res.status(response.status).json({
          success: false,
          error: `Clover API returned ${response.status} ${response.statusText}`,
          details: errorText,
          suggestions: response.status === 401 ? [
            "Verify your API token is valid and not expired",
            "Check if you're using the correct environment (sandbox vs production)",
            "Ensure the token has 'Read Inventory' permissions",
            "Make sure there are no extra spaces or quotes in your token",
            "Token should be 36 characters (with dashes) like: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
            "For sandbox, set CLOVER_API_BASE=https://sandbox.dev.clover.com",
            "For production, use CLOVER_API_BASE=https://api.clover.com (default)"
          ] : [
            "Check the error details above",
            "Verify your merchant ID is correct",
            "Ensure your Clover account has inventory items"
          ]
        });
      }

      const data = await response.json();
      const itemCount = data.elements?.length || 0;
      
      res.json({
        success: true,
        message: "Successfully connected to Clover API!",
        details: `Found ${itemCount} item(s) in your inventory`,
        itemsAvailable: itemCount
      });
    } catch (error) {
      console.error("[Test Connection] Error:", error);
      res.status(500).json({ 
        success: false,
        error: "Failed to test Clover connection",
        details: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Get Clover eCommerce config (public key for frontend)
  app.get('/api/delivery/clover-config', async (req, res) => {
    try {
      const publicKey = process.env.CLOVER_ECOMM_PUBLIC_KEY;
      const isConfigured = !!publicKey && !!process.env.CLOVER_ECOMM_PRIVATE_TOKEN;
      const hostedCheckoutConfigured = cloverHostedCheckout.isConfigured();
      
      res.json({
        publicKey: publicKey || null,
        isConfigured,
        hostedCheckoutConfigured,
        environment: process.env.CLOVER_ENVIRONMENT || 'sandbox'
      });
    } catch (error) {
      console.error("Error getting Clover config:", error);
      res.status(500).json({ error: "Failed to get Clover configuration" });
    }
  });

  // Create Clover Hosted Checkout session
  app.post('/api/delivery/create-checkout-session', verifyApprovedCustomer, async (req, res) => {
    try {
      const customerId = (req as any).deliveryCustomer.id;
      const customer = (req as any).deliveryCustomer;
      const { promoCode, deliveryWindowId, deliveryFee: clientDeliveryFee, notes } = req.body;

      // Store checkout data in session for later order creation
      const cartItems = await storage.getCartItems(customerId);
      if (cartItems.length === 0) {
        return res.status(400).json({ error: "Cart is empty" });
      }

      // Calculate totals server-side
      let subtotal = 0;
      const lineItems = [];
      for (const item of cartItems) {
        const product = await storage.getDeliveryProduct(item.productId);
        if (!product) {
          return res.status(400).json({ error: `Product not found: ${item.productId}` });
        }
        const itemTotal = parseFloat(product.price) * item.quantity;
        subtotal += itemTotal;
        lineItems.push({
          name: product.name,
          price: Math.round(parseFloat(product.price) * 100),
          unitQty: item.quantity,
          note: product.description || "",
        });
      }

      // Validate promo code
      let discount = 0;
      if (promoCode && typeof promoCode === 'string' && promoCode.trim()) {
        const promoValidation = await storage.validatePromoCode(promoCode.trim(), customerId, subtotal);
        if (promoValidation.valid && promoValidation.discountAmount) {
          discount = promoValidation.discountAmount;
        }
      }

      // Calculate delivery fee and tax
      const discountedSubtotal = Math.max(0, subtotal - discount);
      const deliveryFee = parseFloat(clientDeliveryFee || "0");
      const tax = discountedSubtotal * 0.0825;

      // Add delivery fee as line item
      if (deliveryFee > 0) {
        lineItems.push({
          name: "Delivery Fee",
          price: Math.round(deliveryFee * 100),
          unitQty: 1,
        });
      }

      // Add tax as line item
      if (tax > 0) {
        lineItems.push({
          name: "Sales Tax (8.25%)",
          price: Math.round(tax * 100),
          unitQty: 1,
        });
      }

      // Add discount as negative line item
      if (discount > 0) {
        lineItems.push({
          name: `Discount (${promoCode?.toUpperCase()})`,
          price: -Math.round(discount * 100),
          unitQty: 1,
        });
      }

      // Parse customer name
      const nameParts = customer.fullName.split(' ');
      const firstName = nameParts[0] || 'Customer';
      const lastName = nameParts.slice(1).join(' ') || '';

      // Create pending order in database before redirecting
      const total = discountedSubtotal + deliveryFee + tax;
      const fullAddress = `${customer.address}, ${customer.city}, ${customer.state} ${customer.zipCode}`;
      const pendingOrder = await storage.createDeliveryOrder({
        customerId,
        deliveryWindowId: deliveryWindowId || null,
        status: 'pending_payment',
        paymentMethod: 'credit_card',
        paymentStatus: 'pending',
        subtotal: subtotal.toFixed(2),
        deliveryFee: deliveryFee.toFixed(2),
        tax: tax.toFixed(2),
        discount: discount.toFixed(2),
        promoCode: promoCode?.toUpperCase() || null,
        total: total.toFixed(2),
        deliveryAddress: fullAddress,
        notes: notes || null,
      });

      // Create order items
      for (const item of cartItems) {
        const product = await storage.getDeliveryProduct(item.productId);
        if (product) {
          await storage.createDeliveryOrderItem({
            orderId: pendingOrder.id,
            productId: item.productId,
            quantity: item.quantity,
            price: product.price,
          });
        }
      }

      // Create Clover checkout session
      const checkoutSession = await cloverHostedCheckout.createCheckoutSession({
        customer: {
          email: customer.email,
          firstName,
          lastName,
          phoneNumber: customer.phone || undefined,
        },
        lineItems,
        orderId: `order-${pendingOrder.id}`,
      });

      // Update order with checkout session ID for webhook matching
      await storage.updateDeliveryOrderCloverInfo(pendingOrder.id, checkoutSession.checkoutSessionId);

      res.json({
        checkoutUrl: checkoutSession.href,
        sessionId: checkoutSession.checkoutSessionId,
        orderId: pendingOrder.id,
      });
    } catch (error) {
      console.error("Error creating checkout session:", error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : "Failed to create checkout session" 
      });
    }
  });

  // Clover webhook endpoint (receives payment notifications)
  app.post('/api/clover-webhook', express.raw({ type: 'application/json' }), async (req, res) => {
    try {
      const signature = req.headers['clover-signature'] as string;
      const rawBody = req.body.toString();

      // Verify webhook signature
      if (signature && !cloverHostedCheckout.verifyWebhookSignature(signature, rawBody)) {
        console.error("[Clover Webhook] Invalid signature");
        return res.status(401).json({ error: "Invalid signature" });
      }

      const payload = cloverHostedCheckout.parseWebhookPayload(rawBody);
      console.log("[Clover Webhook] Received:", payload);

      if (payload.type === 'PAYMENT' && payload.status === 'APPROVED') {
        // Find order by checkout session ID
        const checkoutSessionId = payload.data;
        const orders = await storage.getAllDeliveryOrders();
        const order = orders.find(o => o.cloverChargeId === checkoutSessionId);

        if (order) {
          // Update order payment status and Clover charge ID
          await storage.updateDeliveryOrderCloverInfo(order.id, payload.id, 'paid');
          await storage.updateDeliveryOrderStatus(order.id, 'confirmed');

          // Clear customer's cart
          await storage.clearCart(order.customerId);

          console.log(`[Clover Webhook] Order ${order.id} payment confirmed`);
        }
      }

      res.json({ received: true });
    } catch (error) {
      console.error("[Clover Webhook] Error:", error);
      res.status(500).json({ error: "Webhook processing failed" });
    }
  });

  // Verify payment and get order ID after Clover redirect
  app.get('/api/delivery/verify-payment', verifyApprovedCustomer, async (req, res) => {
    try {
      const customerId = (req as any).deliveryCustomer.id;
      const sessionId = req.query.session as string;

      if (!sessionId) {
        return res.status(400).json({ error: "Missing session ID" });
      }

      // Find order by checkout session ID (cloverChargeId)
      const orders = await storage.getOrdersByCustomer(customerId);
      const order = orders.find(o => o.cloverChargeId === sessionId);

      if (!order) {
        return res.status(404).json({ error: "Order not found for this payment session" });
      }

      // Update order status if still pending (in case webhook hasn't arrived yet)
      if (order.status === 'pending_payment') {
        await storage.updateDeliveryOrderStatus(order.id, 'confirmed');
        await storage.updateDeliveryOrderCloverInfo(order.id, sessionId, 'paid');
        await storage.clearCart(customerId);
      }

      res.json({
        orderId: order.id,
        status: order.status,
        paymentStatus: order.paymentStatus,
      });
    } catch (error) {
      console.error("Error verifying payment:", error);
      res.status(500).json({ error: "Failed to verify payment" });
    }
  });

  // Order management (requires approved customer)
  app.post('/api/delivery/orders', verifyApprovedCustomer, async (req, res) => {
    try {
      const customerId = (req as any).deliveryCustomer.id;
      const customer = (req as any).deliveryCustomer;
      const { paymentToken, paymentMethod, promoCode, deliveryWindowId, deliveryAddress, billingAddress, billingCity, billingState, billingZipCode, sameAsDelivery, notes, deliveryFee: clientDeliveryFee } = req.body;
      
      // Get cart items to create order items
      const cartItems = await storage.getCartItems(customerId);
      if (cartItems.length === 0) {
        return res.status(400).json({ error: "Cart is empty" });
      }

      // SERVER-SIDE: Validate customer is within delivery zone
      const customerLat = parseFloat(customer.lat);
      const customerLng = parseFloat(customer.lng);
      
      // Check if coordinates are valid before calculating distance
      if (isNaN(customerLat) || isNaN(customerLng)) {
        return res.status(400).json({ 
          error: "Your delivery address needs to be verified. Please update your address in your account settings." 
        });
      }
      
      const friscoLat = 33.1507;
      const friscoLng = -96.8236;
      const distance = calculateDistance(customerLat, customerLng, friscoLat, friscoLng);
      const radiusSetting = await storage.getSetting('delivery_radius_miles');
      const deliveryRadiusMiles = radiusSetting ? parseFloat(radiusSetting.value) : 3;
      
      if (distance > deliveryRadiusMiles) {
        return res.status(400).json({ 
          error: `Delivery address is outside our ${deliveryRadiusMiles}-mile delivery zone. Your address is ${distance.toFixed(1)} miles away.` 
        });
      }

      // SERVER-SIDE: Calculate subtotal from cart items with actual product prices
      let subtotal = 0;
      const cartItemsWithProducts = [];
      for (const item of cartItems) {
        const product = await storage.getDeliveryProduct(item.productId);
        if (!product) {
          return res.status(400).json({ error: `Product not found: ${item.productId}` });
        }
        const itemTotal = parseFloat(product.price) * item.quantity;
        subtotal += itemTotal;
        cartItemsWithProducts.push({ ...item, product });
      }

      // SERVER-SIDE: Validate promo code and calculate discount
      let discount = 0;
      let validatedPromoCode: string | null = null;
      let validatedPromotionId: number | null = null;

      if (promoCode && typeof promoCode === 'string' && promoCode.trim()) {
        const promoValidation = await storage.validatePromoCode(promoCode.trim(), customerId, subtotal);
        if (promoValidation.valid && promoValidation.discountAmount) {
          discount = promoValidation.discountAmount;
          validatedPromoCode = promoCode.trim().toUpperCase();
          validatedPromotionId = promoValidation.promotion?.id || null;
        } else {
          // Promo code invalid - log but don't fail order, just don't apply discount
          console.log(`Promo code validation failed: ${promoValidation.errorMessage}`);
        }
      }

      // SERVER-SIDE: Calculate tax and total
      const discountedSubtotal = Math.max(0, subtotal - discount);
      const deliveryFee = parseFloat(clientDeliveryFee || "0");
      const tax = discountedSubtotal * 0.0825; // 8.25% Texas sales tax
      const total = discountedSubtotal + deliveryFee + tax;

      let cloverChargeId = null;
      let cardLast4 = null;
      let cardBrand = null;
      let paymentStatus = paymentMethod === 'cash' ? 'pending' : 'pending';

      // Process Clover payment if credit card selected
      if (paymentMethod === 'credit_card' && paymentToken) {
        try {
          if (!cloverPaymentService.isConfigured()) {
            return res.status(503).json({ 
              error: "Payment processing is not configured. Please contact support or choose cash on delivery." 
            });
          }

          // Convert SERVER-CALCULATED total to cents for Clover
          const amountInCents = Math.round(total * 100);
          
          const chargeResult = await cloverPaymentService.createCharge({
            source: paymentToken,
            amount: amountInCents,
            currency: 'usd',
            description: `Order for ${customer.fullName}`,
            externalReferenceId: `delivery-${customerId}-${Date.now()}`
          });

          cloverChargeId = chargeResult.id;
          cardLast4 = chargeResult.source?.last4 || null;
          cardBrand = chargeResult.source?.brand || null;
          paymentStatus = chargeResult.status === 'succeeded' ? 'paid' : 'failed';

          if (paymentStatus === 'failed') {
            return res.status(400).json({ error: "Payment failed. Please try again or use a different card." });
          }
        } catch (paymentError: any) {
          console.error("Payment processing error:", paymentError);
          return res.status(400).json({ 
            error: paymentError.message || "Payment processing failed. Please try again." 
          });
        }
      }

      // Create order with SERVER-CALCULATED values (not client values)
      const validated = insertDeliveryOrderSchema.parse({
        customerId,
        deliveryWindowId,
        deliveryAddress,
        billingAddress: sameAsDelivery ? null : billingAddress,
        billingCity: sameAsDelivery ? null : billingCity,
        billingState: sameAsDelivery ? null : billingState,
        billingZipCode: sameAsDelivery ? null : billingZipCode,
        sameAsDelivery: sameAsDelivery !== false,
        subtotal: subtotal.toFixed(2),
        discount: discount.toFixed(2),
        promoCode: validatedPromoCode,
        promotionId: validatedPromotionId,
        tax: tax.toFixed(2),
        deliveryFee: deliveryFee.toFixed(2),
        total: total.toFixed(2),
        paymentMethod,
        paymentStatus,
        cloverChargeId,
        cardLast4,
        cardBrand,
        notes,
        status: paymentStatus === 'paid' ? 'confirmed' : 'pending'
      });
      
      const order = await storage.createDeliveryOrder(validated);

      // Create order items from cart with product prices
      for (const itemWithProduct of cartItemsWithProducts) {
        await storage.createDeliveryOrderItem({
          orderId: order.id,
          productId: itemWithProduct.productId,
          quantity: itemWithProduct.quantity,
          price: itemWithProduct.product.price
        });
      }

      // Clear the cart after successful order
      await storage.clearCart(customerId);

      // Track promotion usage if a promo code was validated and applied
      if (validatedPromotionId && discount > 0) {
        try {
          await storage.createPromotionUsage({
            promotionId: validatedPromotionId,
            customerId,
            orderId: order.id,
            discountAmount: discount.toFixed(2)
          });
          await storage.incrementPromotionUsage(validatedPromotionId);
        } catch (promoError) {
          console.error("Error tracking promotion usage:", promoError);
        }
      }
      
      // Trigger immediate Clover sync after order completion
      triggerManualSync().catch(err => {
        console.error("[Order] Error triggering sync after order:", err);
      });
      
      // Send order confirmation and driver notification emails
      try {
        // Get delivery window info
        let deliveryDate: string | undefined;
        let deliveryTime: string | undefined;
        if (deliveryWindowId) {
          const deliveryWindow = await storage.getDeliveryWindowById(deliveryWindowId);
          if (deliveryWindow) {
            deliveryDate = new Date(deliveryWindow.date).toLocaleDateString('en-US', { 
              weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
            });
            deliveryTime = `${deliveryWindow.startTime} - ${deliveryWindow.endTime}`;
          }
        }
        
        // Prepare order items for email
        const orderItems = cartItemsWithProducts.map(item => ({
          name: item.product.name,
          quantity: item.quantity,
          price: item.product.price
        }));
        
        // Send order confirmation to customer
        await sendOrderConfirmationEmail({
          email: customer.email,
          fullName: customer.fullName,
          orderId: order.id,
          deliveryAddress,
          total: total.toFixed(2),
          subtotal: subtotal.toFixed(2),
          tax: tax.toFixed(2),
          deliveryFee: deliveryFee.toFixed(2),
          discount: discount > 0 ? discount.toFixed(2) : undefined,
          paymentMethod,
          deliveryDate,
          deliveryTime,
          items: orderItems
        });
        
        // Get driver email from settings (default to vapecavetx@gmail.com)
        const driverEmailSetting = await storage.getSetting('driver_notification_email');
        const driverEmail = driverEmailSetting?.value || 'vapecavetx@gmail.com';
        
        // Send notification to delivery driver
        await sendDriverNotificationEmail({
          driverEmail,
          orderId: order.id,
          customerName: customer.fullName,
          customerPhone: customer.phone,
          customerEmail: customer.email,
          deliveryAddress,
          total: total.toFixed(2),
          paymentMethod,
          deliveryDate,
          deliveryTime,
          notes,
          items: orderItems
        });
        
        console.log(`Order #${order.id}: Confirmation and driver notification emails sent`);
      } catch (emailError) {
        console.error("Error sending order emails:", emailError);
        // Don't fail the order if emails fail
      }
      
      res.json(order);
    } catch (error: any) {
      console.error("Error creating order:", error);
      if (error.name === 'ZodError') {
        return res.status(400).json({ error: "Invalid order data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create order" });
    }
  });

  // Get customer orders with detailed information (for account page)
  // MUST be defined before /api/delivery/orders/:id to avoid "my-orders" being matched as an ID
  app.get('/api/delivery/orders/my-orders', verifyApprovedCustomer, async (req, res) => {
    try {
      const customerId = (req as any).deliveryCustomer.id;
      
      // Get all orders for this customer
      const orders = await storage.getOrdersByCustomer(customerId);
      
      // Get order items with products for each order
      const ordersWithItems = await Promise.all(
        orders.map(async (order) => {
          const items = await storage.getDeliveryOrderItems(order.id);
          return { ...order, items };
        })
      );

      res.json(ordersWithItems);
    } catch (error) {
      console.error("Error fetching detailed orders:", error);
      res.status(500).json({ error: "Failed to fetch orders" });
    }
  });

  // Get single order with items (for order confirmation page)
  app.get('/api/delivery/orders/:id', verifyApprovedCustomer, async (req, res) => {
    try {
      const customerId = (req as any).deliveryCustomer.id;
      const orderId = parseInt(req.params.id);
      
      if (isNaN(orderId)) {
        return res.status(400).json({ error: "Invalid order ID" });
      }

      const order = await storage.getDeliveryOrderById(orderId);
      
      if (!order) {
        return res.status(404).json({ error: "Order not found" });
      }

      // Ensure customer can only see their own orders
      if (order.customerId !== customerId) {
        return res.status(403).json({ error: "Access denied" });
      }

      // Get order items with product details
      const orderItems = await storage.getDeliveryOrderItems(orderId);

      res.json({ ...order, items: orderItems });
    } catch (error) {
      console.error("Error fetching order:", error);
      res.status(500).json({ error: "Failed to fetch order" });
    }
  });

  app.get('/api/delivery/orders', verifyApprovedCustomer, async (req, res) => {
    try {
      const customerId = (req as any).deliveryCustomer.id;
      const orders = await storage.getOrdersByCustomer(customerId);
      res.json(orders);
    } catch (error) {
      console.error("Error fetching orders:", error);
      res.status(500).json({ error: "Failed to fetch orders" });
    }
  });

  app.get('/api/admin/delivery/orders', isAdmin, async (req, res) => {
    try {
      const orders = await storage.getAllDeliveryOrders();
      res.json(orders);
    } catch (error) {
      console.error("Error fetching orders:", error);
      res.status(500).json({ error: "Failed to fetch orders" });
    }
  });

  app.patch('/api/admin/delivery/orders/:id/status', isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { status } = req.body;
      const order = await storage.updateDeliveryOrderStatus(id, status);
      
      if (!order) {
        return res.status(404).json({ error: "Order not found" });
      }

      // Send email notification for order status change
      const notifyStatuses = ['confirmed', 'preparing', 'out_for_delivery', 'delivered', 'cancelled'];
      if (notifyStatuses.includes(status)) {
        try {
          const customer = await storage.getDeliveryCustomerById(order.customerId);
          if (customer) {
            // Get delivery window for date/time info
            const deliveryWindow = await storage.getDeliveryWindowById(order.deliveryWindowId);
            
            await sendOrderStatusEmail({
              email: customer.email,
              fullName: customer.fullName,
              orderId: order.id,
              status: status,
              deliveryAddress: order.deliveryAddress,
              total: order.total,
              deliveryDate: deliveryWindow?.date,
              deliveryTime: deliveryWindow ? `${deliveryWindow.startTime} - ${deliveryWindow.endTime}` : undefined
            });
          }
        } catch (emailError) {
          console.error("Error sending order status email:", emailError);
          // Don't fail the status update if email fails
        }
      }

      res.json(order);
    } catch (error) {
      console.error("Error updating order status:", error);
      res.status(500).json({ error: "Failed to update order status" });
    }
  });

  // Admin refund processing
  app.post('/api/admin/delivery/orders/:id/refund', isAdmin, async (req, res) => {
    try {
      const orderId = parseInt(req.params.id);
      const { refundAmount, refundReason } = req.body;
      
      if (!refundAmount || !refundReason) {
        return res.status(400).json({ error: "Refund amount and reason are required" });
      }

      const order = await storage.getDeliveryOrderById(orderId);
      if (!order) {
        return res.status(404).json({ error: "Order not found" });
      }

      if (order.paymentStatus === 'refunded') {
        return res.status(400).json({ error: "Order has already been refunded" });
      }

      // Validate refund amount doesn't exceed order total
      const maxRefund = parseFloat(order.total);
      const requestedRefund = parseFloat(refundAmount);
      if (requestedRefund > maxRefund || requestedRefund <= 0) {
        return res.status(400).json({ error: `Refund amount must be between $0.01 and $${maxRefund.toFixed(2)}` });
      }

      let cloverRefundId = null;

      // Process Clover refund if order was paid via credit card
      if (order.paymentMethod === 'credit_card' && order.cloverChargeId) {
        try {
          if (!cloverPaymentService.isConfigured()) {
            return res.status(503).json({ 
              error: "Clover payment service is not configured. Cannot process refund." 
            });
          }

          // Convert refund amount to cents
          const refundInCents = Math.round(requestedRefund * 100);
          const refundResult = await cloverPaymentService.refundCharge(order.cloverChargeId, refundInCents);
          cloverRefundId = refundResult.id;
          
          console.log(`[Refund] Successfully processed Clover refund ${cloverRefundId} for order ${orderId}`);
        } catch (refundError: any) {
          console.error("Clover refund error:", refundError);
          return res.status(400).json({ 
            error: refundError.message || "Failed to process refund through Clover" 
          });
        }
      }

      // Update order with refund details
      const updatedOrder = await storage.processRefund(
        orderId, 
        requestedRefund.toFixed(2), 
        refundReason, 
        cloverRefundId || undefined
      );

      if (!updatedOrder) {
        return res.status(500).json({ error: "Failed to update order with refund details" });
      }

      // Send refund notification email
      try {
        const customer = await storage.getDeliveryCustomerById(order.customerId);
        if (customer) {
          await sendOrderStatusEmail({
            email: customer.email,
            fullName: customer.fullName,
            orderId: order.id,
            status: 'refunded',
            deliveryAddress: order.deliveryAddress,
            total: order.total,
            refundAmount: requestedRefund.toFixed(2),
            refundReason
          });
        }
      } catch (emailError) {
        console.error("Error sending refund email:", emailError);
      }

      res.json({ 
        success: true, 
        order: updatedOrder,
        message: `Refund of $${requestedRefund.toFixed(2)} processed successfully` 
      });
    } catch (error) {
      console.error("Error processing refund:", error);
      res.status(500).json({ error: "Failed to process refund" });
    }
  });

  // Delete order (admin only)
  app.delete('/api/admin/delivery/orders/:id', isAdmin, async (req, res) => {
    try {
      const orderId = parseInt(req.params.id);
      
      if (isNaN(orderId)) {
        return res.status(400).json({ error: "Invalid order ID" });
      }

      const order = await storage.getDeliveryOrderById(orderId);
      if (!order) {
        return res.status(404).json({ error: "Order not found" });
      }

      const deleted = await storage.deleteDeliveryOrder(orderId);
      
      if (!deleted) {
        return res.status(500).json({ error: "Failed to delete order" });
      }

      res.json({ success: true, message: `Order #${orderId} deleted successfully` });
    } catch (error) {
      console.error("Error deleting order:", error);
      res.status(500).json({ error: "Failed to delete order" });
    }
  });

  // Create manual replacement order (admin only)
  app.post('/api/admin/delivery/orders/manual', isAdmin, async (req, res) => {
    try {
      const { customerId, items, notes, reason, deliveryWindowId, sendEmail } = req.body;
      
      if (!customerId) {
        return res.status(400).json({ error: "Customer is required" });
      }
      
      if (!items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ error: "At least one item is required" });
      }

      // Get customer
      const customer = await storage.getDeliveryCustomerById(customerId);
      if (!customer) {
        return res.status(404).json({ error: "Customer not found" });
      }

      // Calculate totals from items
      let subtotal = 0;
      const orderItems: { productId: number; quantity: number; price: string; name: string }[] = [];
      
      for (const item of items) {
        const product = await storage.getDeliveryProduct(item.productId);
        if (!product) {
          return res.status(404).json({ error: `Product #${item.productId} not found` });
        }
        
        const itemPrice = parseFloat(product.price) * item.quantity;
        subtotal += itemPrice;
        orderItems.push({
          productId: item.productId,
          quantity: item.quantity,
          price: product.price,
          name: product.name
        });
      }

      const fullAddress = `${customer.address}, ${customer.city}, ${customer.state} ${customer.zipCode}`;

      // Create order with $0.00 total (replacement/courtesy order)
      const order = await storage.createDeliveryOrder({
        customerId,
        deliveryWindowId: deliveryWindowId || null,
        status: 'confirmed',
        paymentMethod: 'manual',
        paymentStatus: 'paid',
        subtotal: '0.00',
        deliveryFee: '0.00',
        tax: '0.00',
        discount: subtotal.toFixed(2),
        promoCode: null,
        total: '0.00',
        deliveryAddress: fullAddress,
        notes: `${reason ? `Reason: ${reason}. ` : ''}${notes || ''} [REPLACEMENT ORDER - Created by Admin]`,
      });

      // Create order items
      for (const item of orderItems) {
        await storage.createDeliveryOrderItem({
          orderId: order.id,
          productId: item.productId,
          quantity: item.quantity,
          price: item.price,
        });
      }

      // Send email notification if requested
      if (sendEmail) {
        try {
          const deliveryWindow = deliveryWindowId ? await storage.getDeliveryWindowById(deliveryWindowId) : null;
          
          await sendOrderConfirmationEmail({
            email: customer.email,
            fullName: customer.fullName,
            orderId: order.id,
            items: orderItems.map(i => ({
              name: i.name,
              quantity: i.quantity,
              price: i.price
            })),
            subtotal: subtotal.toFixed(2),
            deliveryFee: '0.00',
            tax: '0.00',
            discount: subtotal.toFixed(2),
            total: '0.00',
            deliveryAddress: fullAddress,
            deliveryDate: deliveryWindow?.date,
            deliveryTime: deliveryWindow ? `${deliveryWindow.startTime} - ${deliveryWindow.endTime}` : undefined,
            notes: reason || 'Replacement order for defective/wrong item',
            isReplacement: true
          });
        } catch (emailError) {
          console.error("Error sending replacement order email:", emailError);
        }
      }

      res.json({ 
        success: true, 
        order,
        message: `Replacement order #${order.id} created successfully${sendEmail ? ' and email sent to customer' : ''}`
      });
    } catch (error) {
      console.error("Error creating manual order:", error);
      res.status(500).json({ error: "Failed to create manual order" });
    }
  });

  // ==================== Delivery Categories Routes ====================
  
  // Get all delivery categories (admin)
  app.get('/api/admin/delivery/categories', isAdmin, async (req, res) => {
    try {
      const categories = await storage.getAllDeliveryCategories();
      res.json(categories);
    } catch (error) {
      console.error("Error fetching delivery categories:", error);
      res.status(500).json({ error: "Failed to fetch categories" });
    }
  });

  // Get active delivery categories (public)
  app.get('/api/delivery/categories', async (req, res) => {
    try {
      const categories = await storage.getActiveDeliveryCategories();
      res.json(categories);
    } catch (error) {
      console.error("Error fetching active delivery categories:", error);
      res.status(500).json({ error: "Failed to fetch categories" });
    }
  });

  // Create delivery category
  app.post('/api/admin/delivery/categories', isAdmin, async (req, res) => {
    try {
      const { name, image, isActive } = req.body;
      const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      
      // Check if slug already exists
      const existing = await storage.getDeliveryCategoryBySlug(slug);
      if (existing) {
        return res.status(400).json({ error: "A category with this name already exists" });
      }
      
      const category = await storage.createDeliveryCategory({
        name,
        slug,
        image: image || null,
        isActive: isActive ?? true,
        displayOrder: 0
      });
      res.json(category);
    } catch (error) {
      console.error("Error creating delivery category:", error);
      res.status(500).json({ error: "Failed to create category" });
    }
  });

  // Update delivery category
  app.patch('/api/admin/delivery/categories/:id', isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updates = req.body;
      
      if (updates.name) {
        updates.slug = updates.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      }
      
      const category = await storage.updateDeliveryCategory(id, updates);
      if (!category) {
        return res.status(404).json({ error: "Category not found" });
      }
      res.json(category);
    } catch (error) {
      console.error("Error updating delivery category:", error);
      res.status(500).json({ error: "Failed to update category" });
    }
  });

  // Delete delivery category
  app.delete('/api/admin/delivery/categories/:id', isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteDeliveryCategory(id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting delivery category:", error);
      res.status(500).json({ error: "Failed to delete category" });
    }
  });

  // Reorder delivery categories
  app.post('/api/admin/delivery/categories/reorder', isAdmin, async (req, res) => {
    try {
      const { orderedIds } = req.body;
      await storage.reorderDeliveryCategories(orderedIds);
      res.json({ success: true });
    } catch (error) {
      console.error("Error reordering delivery categories:", error);
      res.status(500).json({ error: "Failed to reorder categories" });
    }
  });

  // ==================== Delivery Brands Routes ====================

  // Get all delivery brands (admin)
  app.get('/api/admin/delivery/brands', isAdmin, async (req, res) => {
    try {
      const { categoryId } = req.query;
      let brands;
      if (categoryId) {
        brands = await storage.getDeliveryBrandsByCategory(parseInt(categoryId as string));
      } else {
        brands = await storage.getAllDeliveryBrands();
      }
      res.json(brands);
    } catch (error) {
      console.error("Error fetching delivery brands:", error);
      res.status(500).json({ error: "Failed to fetch brands" });
    }
  });

  // Get active delivery brands (public)
  app.get('/api/delivery/brands', async (req, res) => {
    try {
      const { categoryId } = req.query;
      let brands;
      if (categoryId) {
        const allBrands = await storage.getDeliveryBrandsByCategory(parseInt(categoryId as string));
        brands = allBrands.filter(b => b.isActive);
      } else {
        brands = await storage.getActiveDeliveryBrands();
      }
      res.json(brands);
    } catch (error) {
      console.error("Error fetching active delivery brands:", error);
      res.status(500).json({ error: "Failed to fetch brands" });
    }
  });

  // Create delivery brand
  app.post('/api/admin/delivery/brands', isAdmin, async (req, res) => {
    try {
      const { name, categoryId, logo, isActive } = req.body;
      const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      
      // Check if slug already exists
      const existing = await storage.getDeliveryBrandBySlug(slug);
      if (existing) {
        return res.status(400).json({ error: "A brand with this name already exists" });
      }
      
      const brand = await storage.createDeliveryBrand({
        name,
        slug,
        categoryId,
        logo: logo || null,
        isActive: isActive ?? true,
        displayOrder: 0
      });
      res.json(brand);
    } catch (error) {
      console.error("Error creating delivery brand:", error);
      res.status(500).json({ error: "Failed to create brand" });
    }
  });

  // Update delivery brand
  app.patch('/api/admin/delivery/brands/:id', isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updates = req.body;
      
      if (updates.name) {
        updates.slug = updates.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      }
      
      const brand = await storage.updateDeliveryBrand(id, updates);
      if (!brand) {
        return res.status(404).json({ error: "Brand not found" });
      }
      res.json(brand);
    } catch (error) {
      console.error("Error updating delivery brand:", error);
      res.status(500).json({ error: "Failed to update brand" });
    }
  });

  // Delete delivery brand
  app.delete('/api/admin/delivery/brands/:id', isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteDeliveryBrand(id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting delivery brand:", error);
      res.status(500).json({ error: "Failed to delete brand" });
    }
  });

  // Reorder delivery brands within a category
  app.post('/api/admin/delivery/brands/reorder', isAdmin, async (req, res) => {
    try {
      const { categoryId, orderedIds } = req.body;
      await storage.reorderDeliveryBrands(categoryId, orderedIds);
      res.json({ success: true });
    } catch (error) {
      console.error("Error reordering delivery brands:", error);
      res.status(500).json({ error: "Failed to reorder brands" });
    }
  });

  // Assign product to brand
  app.patch('/api/admin/delivery/products/:id/brand', isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { brandId } = req.body;
      
      const product = await storage.updateDeliveryProduct(id, { brandId: brandId || null });
      if (!product) {
        return res.status(404).json({ error: "Product not found" });
      }
      res.json(product);
    } catch (error) {
      console.error("Error assigning brand to product:", error);
      res.status(500).json({ error: "Failed to assign brand" });
    }
  });

  // Bulk assign products to brand
  app.post('/api/admin/delivery/products/bulk-assign-brand', isAdmin, async (req, res) => {
    try {
      const { productIds, brandId } = req.body;
      
      const result = await storage.bulkUpdateDeliveryProducts(productIds, { brandId: brandId || null });
      res.json({ success: true, updated: result.updated });
    } catch (error) {
      console.error("Error bulk assigning brand to products:", error);
      res.status(500).json({ error: "Failed to bulk assign brand" });
    }
  });

  // ============ DELIVERY PRODUCT LINES (Brand Subcategories) ============

  // Get all product lines (admin)
  app.get('/api/admin/delivery/product-lines', isAdmin, async (req, res) => {
    try {
      const productLines = await storage.getAllDeliveryProductLines();
      res.json(productLines);
    } catch (error) {
      console.error("Error fetching delivery product lines:", error);
      res.status(500).json({ error: "Failed to fetch product lines" });
    }
  });

  // Get active product lines (public)
  app.get('/api/delivery/product-lines', async (req, res) => {
    try {
      const { brandId } = req.query;
      let productLines;
      if (brandId) {
        productLines = await storage.getDeliveryProductLinesByBrand(parseInt(brandId as string));
        productLines = productLines.filter(pl => pl.isActive);
      } else {
        productLines = await storage.getActiveDeliveryProductLines();
      }
      res.json(productLines);
    } catch (error) {
      console.error("Error fetching delivery product lines:", error);
      res.status(500).json({ error: "Failed to fetch product lines" });
    }
  });

  // Create product line
  app.post('/api/admin/delivery/product-lines', isAdmin, async (req, res) => {
    try {
      const { name, brandId, logo, isActive } = req.body;
      
      if (!name || !brandId) {
        return res.status(400).json({ error: "Name and brandId are required" });
      }
      
      // Auto-generate slug
      const slug = name.toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
      
      // Check for duplicate slug
      const existing = await storage.getDeliveryProductLineBySlug(slug);
      if (existing) {
        return res.status(400).json({ error: "A product line with this name already exists" });
      }
      
      const productLine = await storage.createDeliveryProductLine({
        name,
        slug,
        brandId,
        logo: logo || null,
        isActive: isActive ?? true,
        displayOrder: 0
      });
      
      res.status(201).json(productLine);
    } catch (error) {
      console.error("Error creating delivery product line:", error);
      res.status(500).json({ error: "Failed to create product line" });
    }
  });

  // Update product line
  app.patch('/api/admin/delivery/product-lines/:id', isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { name, brandId, logo, isActive } = req.body;
      
      const updateData: any = {};
      if (name !== undefined) {
        updateData.name = name;
        // Also update slug if name changes
        updateData.slug = name.toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-+|-+$/g, '');
      }
      if (brandId !== undefined) updateData.brandId = brandId;
      if (logo !== undefined) updateData.logo = logo;
      if (isActive !== undefined) updateData.isActive = isActive;
      
      const productLine = await storage.updateDeliveryProductLine(id, updateData);
      if (!productLine) {
        return res.status(404).json({ error: "Product line not found" });
      }
      res.json(productLine);
    } catch (error) {
      console.error("Error updating delivery product line:", error);
      res.status(500).json({ error: "Failed to update product line" });
    }
  });

  // Delete product line
  app.delete('/api/admin/delivery/product-lines/:id', isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteDeliveryProductLine(id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting delivery product line:", error);
      res.status(500).json({ error: "Failed to delete product line" });
    }
  });

  // Reorder product lines within a brand
  app.post('/api/admin/delivery/product-lines/reorder', isAdmin, async (req, res) => {
    try {
      const { brandId, orderedIds } = req.body;
      await storage.reorderDeliveryProductLines(brandId, orderedIds);
      res.json({ success: true });
    } catch (error) {
      console.error("Error reordering delivery product lines:", error);
      res.status(500).json({ error: "Failed to reorder product lines" });
    }
  });

  // Assign product to product line
  app.patch('/api/admin/delivery/products/:id/product-line', isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { productLineId } = req.body;
      
      const product = await storage.updateDeliveryProduct(id, { productLineId: productLineId || null });
      if (!product) {
        return res.status(404).json({ error: "Product not found" });
      }
      res.json(product);
    } catch (error) {
      console.error("Error assigning product line to product:", error);
      res.status(500).json({ error: "Failed to assign product line" });
    }
  });

  // Bulk assign products to product line
  app.post('/api/admin/delivery/products/bulk-assign-product-line', isAdmin, async (req, res) => {
    try {
      const { productIds, productLineId } = req.body;
      
      const result = await storage.bulkUpdateDeliveryProducts(productIds, { productLineId: productLineId || null });
      res.json({ success: true, updated: result.updated });
    } catch (error) {
      console.error("Error bulk assigning product line to products:", error);
      res.status(500).json({ error: "Failed to bulk assign product line" });
    }
  });

  // Analytics routes for admin dashboard
  app.get('/api/admin/analytics/summary', isAdmin, async (req, res) => {
    try {
      const { startDate, endDate } = req.query;
      
      // Get all orders
      const allOrders = await storage.getAllDeliveryOrders();
      
      // Filter by date range if provided
      let orders = allOrders;
      if (startDate && endDate) {
        const start = new Date(startDate as string);
        const end = new Date(endDate as string);
        end.setHours(23, 59, 59, 999);
        orders = allOrders.filter(order => {
          const orderDate = new Date(order.createdAt);
          return orderDate >= start && orderDate <= end;
        });
      }
      
      // Calculate metrics
      const totalOrders = orders.length;
      const completedOrders = orders.filter(o => o.status === 'delivered').length;
      const pendingOrders = orders.filter(o => o.status === 'pending').length;
      const confirmedOrders = orders.filter(o => o.status === 'confirmed').length;
      const outForDeliveryOrders = orders.filter(o => o.status === 'out_for_delivery').length;
      const cancelledOrders = orders.filter(o => o.status === 'cancelled').length;
      
      // Calculate revenue (only from delivered/completed orders)
      const deliveredOrders = orders.filter(o => o.status === 'delivered' && o.paymentStatus === 'paid');
      const totalRevenue = deliveredOrders.reduce((sum, order) => sum + parseFloat(order.total || '0'), 0);
      const averageOrderValue = deliveredOrders.length > 0 ? totalRevenue / deliveredOrders.length : 0;
      
      // All paid orders (any status)
      const paidOrders = orders.filter(o => o.paymentStatus === 'paid');
      const totalPaidRevenue = paidOrders.reduce((sum, order) => sum + parseFloat(order.total || '0'), 0);
      
      // Refunded amounts
      const refundedOrders = orders.filter(o => o.paymentStatus === 'refunded' && o.refundAmount);
      const totalRefunds = refundedOrders.reduce((sum, order) => sum + parseFloat(order.refundAmount || '0'), 0);
      
      // Payment method breakdown
      const cashOrders = orders.filter(o => o.paymentMethod === 'cash');
      const cardOrders = orders.filter(o => o.paymentMethod === 'card');
      
      res.json({
        totalOrders,
        totalRevenue: totalRevenue.toFixed(2),
        totalPaidRevenue: totalPaidRevenue.toFixed(2),
        averageOrderValue: averageOrderValue.toFixed(2),
        totalRefunds: totalRefunds.toFixed(2),
        ordersByStatus: {
          pending: pendingOrders,
          confirmed: confirmedOrders,
          out_for_delivery: outForDeliveryOrders,
          delivered: completedOrders,
          cancelled: cancelledOrders
        },
        ordersByPaymentMethod: {
          cash: cashOrders.length,
          card: cardOrders.length
        },
        paymentStatus: {
          paid: paidOrders.length,
          pending: orders.filter(o => !o.paymentStatus || o.paymentStatus === 'pending').length,
          refunded: refundedOrders.length
        }
      });
    } catch (error) {
      console.error("Error fetching analytics summary:", error);
      res.status(500).json({ error: "Failed to fetch analytics summary" });
    }
  });

  app.get('/api/admin/analytics/sales-by-date', isAdmin, async (req, res) => {
    try {
      const { days = '30' } = req.query;
      const numDays = parseInt(days as string) || 30;
      
      const allOrders = await storage.getAllDeliveryOrders();
      
      // Get orders from the last N days
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - numDays);
      startDate.setHours(0, 0, 0, 0);
      
      const recentOrders = allOrders.filter(order => {
        const orderDate = new Date(order.createdAt);
        return orderDate >= startDate && (order.paymentStatus === 'paid' || order.status === 'delivered');
      });
      
      // Group by date
      const salesByDate: Record<string, { date: string; orders: number; revenue: number }> = {};
      
      // Initialize all dates in range
      for (let i = 0; i < numDays; i++) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        salesByDate[dateStr] = { date: dateStr, orders: 0, revenue: 0 };
      }
      
      // Populate with actual data
      recentOrders.forEach(order => {
        const dateStr = new Date(order.createdAt).toISOString().split('T')[0];
        if (salesByDate[dateStr]) {
          salesByDate[dateStr].orders++;
          salesByDate[dateStr].revenue += parseFloat(order.total || '0');
        }
      });
      
      // Convert to sorted array
      const result = Object.values(salesByDate)
        .sort((a, b) => a.date.localeCompare(b.date))
        .map(item => ({
          ...item,
          revenue: parseFloat(item.revenue.toFixed(2))
        }));
      
      res.json(result);
    } catch (error) {
      console.error("Error fetching sales by date:", error);
      res.status(500).json({ error: "Failed to fetch sales data" });
    }
  });

  app.get('/api/admin/analytics/top-products', isAdmin, async (req, res) => {
    try {
      const { limit = '10' } = req.query;
      const numLimit = parseInt(limit as string) || 10;
      
      const allOrders = await storage.getAllDeliveryOrders();
      const completedOrders = allOrders.filter(o => o.paymentStatus === 'paid' || o.status === 'delivered');
      
      // Aggregate product sales
      const productSales: Record<string, { productId: number; name: string; quantitySold: number; revenue: number }> = {};
      
      completedOrders.forEach(order => {
        if (order.items && Array.isArray(order.items)) {
          order.items.forEach((item: any) => {
            const key = item.productId?.toString() || item.name;
            if (!productSales[key]) {
              productSales[key] = {
                productId: item.productId || 0,
                name: item.name || 'Unknown Product',
                quantitySold: 0,
                revenue: 0
              };
            }
            productSales[key].quantitySold += item.quantity || 1;
            productSales[key].revenue += parseFloat(item.price || '0') * (item.quantity || 1);
          });
        }
      });
      
      // Sort by quantity sold and limit
      const topProducts = Object.values(productSales)
        .sort((a, b) => b.quantitySold - a.quantitySold)
        .slice(0, numLimit)
        .map(item => ({
          ...item,
          revenue: parseFloat(item.revenue.toFixed(2))
        }));
      
      res.json(topProducts);
    } catch (error) {
      console.error("Error fetching top products:", error);
      res.status(500).json({ error: "Failed to fetch top products" });
    }
  });

  app.get('/api/admin/analytics/customers', isAdmin, async (req, res) => {
    try {
      const customers = await storage.getAllDeliveryCustomers();
      const orders = await storage.getAllDeliveryOrders();
      
      // Customer status breakdown
      const approved = customers.filter(c => c.approvalStatus === 'approved').length;
      const pending = customers.filter(c => c.approvalStatus === 'pending').length;
      const rejected = customers.filter(c => c.approvalStatus === 'rejected').length;
      
      // Find top customers by order count and revenue
      const customerStats: Record<number, { customerId: number; name: string; orderCount: number; totalSpent: number }> = {};
      
      orders.filter(o => o.paymentStatus === 'paid' || o.status === 'delivered').forEach(order => {
        if (!customerStats[order.customerId]) {
          const customer = customers.find(c => c.id === order.customerId);
          customerStats[order.customerId] = {
            customerId: order.customerId,
            name: customer?.fullName || 'Unknown',
            orderCount: 0,
            totalSpent: 0
          };
        }
        customerStats[order.customerId].orderCount++;
        customerStats[order.customerId].totalSpent += parseFloat(order.total || '0');
      });
      
      const topCustomers = Object.values(customerStats)
        .sort((a, b) => b.totalSpent - a.totalSpent)
        .slice(0, 10)
        .map(item => ({
          ...item,
          totalSpent: parseFloat(item.totalSpent.toFixed(2))
        }));
      
      res.json({
        totalCustomers: customers.length,
        byStatus: { approved, pending, rejected },
        topCustomers
      });
    } catch (error) {
      console.error("Error fetching customer analytics:", error);
      res.status(500).json({ error: "Failed to fetch customer analytics" });
    }
  });

  // Settings routes
  app.get('/api/settings/:key', async (req, res) => {
    try {
      const setting = await storage.getSetting(req.params.key);
      
      if (!setting) {
        return res.status(404).json({ error: "Setting not found" });
      }

      res.json(setting);
    } catch (error) {
      console.error("Error fetching setting:", error);
      res.status(500).json({ error: "Failed to fetch setting" });
    }
  });

  app.get('/api/settings', async (req, res) => {
    try {
      const settings = await storage.getAllSettings();
      res.json(settings);
    } catch (error) {
      console.error("Error fetching settings:", error);
      res.status(500).json({ error: "Failed to fetch settings" });
    }
  });

  app.put('/api/admin/settings/:key', isAdmin, async (req, res) => {
    try {
      const { value, description } = req.body;
      
      if (!value) {
        return res.status(400).json({ error: "Value is required" });
      }

      const setting = await storage.upsertSetting(req.params.key, value, description);
      res.json(setting);
    } catch (error) {
      console.error("Error updating setting:", error);
      res.status(500).json({ error: "Failed to update setting" });
    }
  });

  // Public delivery fee settings endpoint (for customers)
  app.get('/api/delivery/fee-settings', async (req, res) => {
    try {
      const feeType = await storage.getSetting('delivery_fee_type');
      const flatFee = await storage.getSetting('delivery_flat_fee');
      const perMileFee = await storage.getSetting('delivery_per_mile_fee');
      const perItemFee = await storage.getSetting('delivery_per_item_fee');

      res.json({
        feeType: feeType?.value || 'flat',
        flatFee: flatFee?.value || '10.00',
        perMileFee: perMileFee?.value || '1.50',
        perItemFee: perItemFee?.value || '0.50',
      });
    } catch (error) {
      console.error("Error fetching delivery fee settings:", error);
      res.status(500).json({ error: "Failed to fetch delivery fee settings" });
    }
  });

  // Admin delivery fee settings endpoint (for admin portal)
  app.get('/api/admin/delivery/fee-settings', isAdmin, async (req, res) => {
    try {
      const feeType = await storage.getSetting('delivery_fee_type');
      const flatFee = await storage.getSetting('delivery_flat_fee');
      const perMileFee = await storage.getSetting('delivery_per_mile_fee');
      const perItemFee = await storage.getSetting('delivery_per_item_fee');

      res.json({
        feeType: feeType?.value || 'flat',
        flatFee: flatFee?.value || '10.00',
        perMileFee: perMileFee?.value || '1.50',
        perItemFee: perItemFee?.value || '0.50',
      });
    } catch (error) {
      console.error("Error fetching delivery fee settings:", error);
      res.status(500).json({ error: "Failed to fetch delivery fee settings" });
    }
  });

  app.patch('/api/admin/delivery/fee-settings', isAdmin, async (req, res) => {
    try {
      const { feeType, flatFee, perMileFee, perItemFee } = req.body;

      // Validate fee type
      if (!['flat', 'per_mile', 'per_item', 'combined'].includes(feeType)) {
        return res.status(400).json({ error: "Invalid fee type" });
      }

      // Update all settings
      await storage.upsertSetting('delivery_fee_type', feeType, 'Type of delivery fee: flat, per_mile, per_item, or combined');
      await storage.upsertSetting('delivery_flat_fee', flatFee, 'Flat delivery fee amount in dollars');
      await storage.upsertSetting('delivery_per_mile_fee', perMileFee, 'Per-mile delivery fee amount in dollars');
      await storage.upsertSetting('delivery_per_item_fee', perItemFee, 'Per-item delivery fee amount in dollars');

      res.json({
        feeType,
        flatFee,
        perMileFee,
        perItemFee,
      });
    } catch (error) {
      console.error("Error updating delivery fee settings:", error);
      res.status(500).json({ error: "Failed to update delivery fee settings" });
    }
  });

  // Admin driver notification email settings
  app.get('/api/admin/delivery/notification-settings', isAdmin, async (req, res) => {
    try {
      const driverEmail = await storage.getSetting('driver_notification_email');
      res.json({
        driverEmail: driverEmail?.value || 'vapecavetx@gmail.com',
      });
    } catch (error) {
      console.error("Error fetching notification settings:", error);
      res.status(500).json({ error: "Failed to fetch notification settings" });
    }
  });

  app.patch('/api/admin/delivery/notification-settings', isAdmin, async (req, res) => {
    try {
      const { driverEmail } = req.body;

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!driverEmail || !emailRegex.test(driverEmail)) {
        return res.status(400).json({ error: "Invalid email address" });
      }

      await storage.upsertSetting('driver_notification_email', driverEmail, 'Email address for delivery driver order notifications');

      res.json({
        driverEmail,
      });
    } catch (error) {
      console.error("Error updating notification settings:", error);
      res.status(500).json({ error: "Failed to update notification settings" });
    }
  });

  // Calculate delivery fee for a customer based on actual distance
  app.get('/api/delivery/calculate-fee', verifyApprovedCustomer, async (req, res) => {
    try {
      const customerId = (req as any).deliveryCustomer.id;
      const customer = await storage.getDeliveryCustomerById(customerId);
      
      if (!customer) {
        return res.status(404).json({ error: "Customer not found" });
      }

      // Frisco store coordinates
      const friscoLat = 33.1507;
      const friscoLng = -96.8236;
      
      // Calculate distance from customer to store
      const customerLat = parseFloat(customer.lat);
      const customerLng = parseFloat(customer.lng);
      
      // Handle missing/invalid coordinates gracefully
      if (isNaN(customerLat) || isNaN(customerLng)) {
        // Return a response indicating address needs verification
        const radiusSetting = await storage.getSetting('delivery_radius_miles');
        const deliveryRadiusMiles = radiusSetting ? parseFloat(radiusSetting.value) : 3;
        return res.json({
          distance: 0,
          feeType: 'flat',
          flatFee: 10,
          perMileFee: 1.5,
          perItemFee: 0.5,
          withinDeliveryZone: false,
          deliveryRadiusMiles,
          addressNeedsVerification: true,
        });
      }
      
      const distance = calculateDistance(customerLat, customerLng, friscoLat, friscoLng);

      // Get fee settings
      const feeType = await storage.getSetting('delivery_fee_type');
      const flatFee = await storage.getSetting('delivery_flat_fee');
      const perMileFee = await storage.getSetting('delivery_per_mile_fee');
      const perItemFee = await storage.getSetting('delivery_per_item_fee');
      const radiusSetting = await storage.getSetting('delivery_radius_miles');
      const deliveryRadiusMiles = radiusSetting ? parseFloat(radiusSetting.value) : 3;

      const feeTypeValue = feeType?.value || 'flat';
      const flatFeeValue = parseFloat(flatFee?.value || '10.00');
      const perMileFeeValue = parseFloat(perMileFee?.value || '1.50');
      const perItemFeeValue = parseFloat(perItemFee?.value || '0.50');

      res.json({
        distance: Math.round(distance * 100) / 100, // Round to 2 decimals
        feeType: feeTypeValue,
        flatFee: flatFeeValue,
        perMileFee: perMileFeeValue,
        perItemFee: perItemFeeValue,
        withinDeliveryZone: distance <= deliveryRadiusMiles,
        deliveryRadiusMiles,
      });
    } catch (error) {
      console.error("Error calculating delivery fee:", error);
      res.status(500).json({ error: "Failed to calculate delivery fee" });
    }
  });

  // =====================================================
  // PROMOTION/PROMO CODE ROUTES
  // =====================================================

  // Validate promo code (customer endpoint)
  app.post('/api/delivery/promo/validate', verifyApprovedCustomer, async (req, res) => {
    try {
      const customerId = (req as any).deliveryCustomer.id;
      const { code, subtotal } = req.body;

      if (!code) {
        return res.status(400).json({ valid: false, errorMessage: "Promo code is required" });
      }

      if (typeof subtotal !== 'number' || subtotal < 0) {
        return res.status(400).json({ valid: false, errorMessage: "Valid subtotal is required" });
      }

      const result = await storage.validatePromoCode(code, customerId, subtotal);
      res.json(result);
    } catch (error) {
      console.error("Error validating promo code:", error);
      res.status(500).json({ valid: false, errorMessage: "Failed to validate promo code" });
    }
  });

  // Get all promotions (admin)
  app.get('/api/admin/promotions', isAdmin, async (req, res) => {
    try {
      const promotions = await storage.getAllPromotions();
      res.json(promotions);
    } catch (error) {
      console.error("Error fetching promotions:", error);
      res.status(500).json({ error: "Failed to fetch promotions" });
    }
  });

  // Get single promotion (admin)
  app.get('/api/admin/promotions/:id', isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const promotion = await storage.getPromotion(id);
      
      if (!promotion) {
        return res.status(404).json({ error: "Promotion not found" });
      }

      res.json(promotion);
    } catch (error) {
      console.error("Error fetching promotion:", error);
      res.status(500).json({ error: "Failed to fetch promotion" });
    }
  });

  // Create promotion (admin)
  app.post('/api/admin/promotions', isAdmin, async (req, res) => {
    try {
      const { code, description, discountType, discountValue, minimumOrderAmount, maxUsageCount, maxUsagePerCustomer, validFrom, validUntil, enabled } = req.body;

      if (!code || !discountType || !discountValue || !validFrom || !validUntil) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      if (discountType !== 'percentage' && discountType !== 'fixed') {
        return res.status(400).json({ error: "Discount type must be 'percentage' or 'fixed'" });
      }

      // Check if code already exists
      const existing = await storage.getPromotionByCode(code);
      if (existing) {
        return res.status(400).json({ error: "A promotion with this code already exists" });
      }

      const promotion = await storage.createPromotion({
        code,
        description,
        discountType,
        discountValue: discountValue.toString(),
        minimumOrderAmount: minimumOrderAmount?.toString(),
        maxUsageCount: maxUsageCount || null,
        maxUsagePerCustomer: maxUsagePerCustomer || 1,
        validFrom: new Date(validFrom),
        validUntil: new Date(validUntil),
        enabled: enabled !== false
      });

      res.status(201).json(promotion);
    } catch (error) {
      console.error("Error creating promotion:", error);
      res.status(500).json({ error: "Failed to create promotion" });
    }
  });

  // Update promotion (admin)
  app.patch('/api/admin/promotions/:id', isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { code, description, discountType, discountValue, minimumOrderAmount, maxUsageCount, maxUsagePerCustomer, validFrom, validUntil, enabled } = req.body;

      const updates: any = {};
      if (code !== undefined) updates.code = code;
      if (description !== undefined) updates.description = description;
      if (discountType !== undefined) updates.discountType = discountType;
      if (discountValue !== undefined) updates.discountValue = discountValue.toString();
      if (minimumOrderAmount !== undefined) updates.minimumOrderAmount = minimumOrderAmount?.toString();
      if (maxUsageCount !== undefined) updates.maxUsageCount = maxUsageCount;
      if (maxUsagePerCustomer !== undefined) updates.maxUsagePerCustomer = maxUsagePerCustomer;
      if (validFrom !== undefined) updates.validFrom = new Date(validFrom);
      if (validUntil !== undefined) updates.validUntil = new Date(validUntil);
      if (enabled !== undefined) updates.enabled = enabled;

      const promotion = await storage.updatePromotion(id, updates);
      
      if (!promotion) {
        return res.status(404).json({ error: "Promotion not found" });
      }

      res.json(promotion);
    } catch (error) {
      console.error("Error updating promotion:", error);
      res.status(500).json({ error: "Failed to update promotion" });
    }
  });

  // Delete promotion (admin)
  app.delete('/api/admin/promotions/:id', isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deletePromotion(id);
      
      if (!deleted) {
        return res.status(404).json({ error: "Promotion not found" });
      }

      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting promotion:", error);
      res.status(500).json({ error: "Failed to delete promotion" });
    }
  });

  // Google Reviews API endpoints
  app.get('/api/reviews/google', async (req, res) => {
    try {
      const reviews = await fetchGoogleReviews();
      res.json(reviews);
    } catch (error) {
      console.error("Error fetching Google reviews:", error);
      res.status(500).json({ error: "Failed to fetch reviews" });
    }
  });

  app.get('/api/reviews/google/status', async (req, res) => {
    try {
      const status = getCacheStatus();
      res.json(status);
    } catch (error) {
      console.error("Error getting cache status:", error);
      res.status(500).json({ error: "Failed to get cache status" });
    }
  });

  app.post('/api/admin/reviews/refresh', isAdmin, async (req, res) => {
    try {
      clearReviewsCache();
      const reviews = await fetchGoogleReviews();
      res.json(reviews);
    } catch (error) {
      console.error("Error refreshing reviews:", error);
      res.status(500).json({ error: "Failed to refresh reviews" });
    }
  });

  const httpServer = createServer(app);
  
  // Start automatic Clover sync (every 5 minutes)
  console.log("[Server] Starting Clover auto-sync service...");
  startAutoSync();
  
  return httpServer;
}
