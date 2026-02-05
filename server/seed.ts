import { storage } from "./storage";
import * as bcrypt from "bcryptjs";
import * as dotenv from "dotenv";

dotenv.config();

// This script seeds the database with initial data
async function seedDatabase() {
  try {
    console.log("Starting database seeding...");
    
    // Create admin user
    const adminUsername = process.env.ADMIN_USERNAME || "admin";
    const adminPassword = process.env.ADMIN_PASSWORD || "vapecave2024";
    
    console.log(`Creating admin user: ${adminUsername}`);
    
    try {
      // Check if the admin user already exists
      const existingUser = await storage.getUserByUsername(adminUsername);
      
      if (!existingUser) {
        await storage.createUser({
          username: adminUsername,
          password: adminPassword,
          isAdmin: true
        });
        console.log("Admin user created successfully");
      } else {
        console.log("Admin user already exists");
      }
    } catch (error) {
      console.error("Error creating admin user:", error);
    }
    
    // Create brand categories
    const categories = [
      {
        category: "Disposables Nicotiene",
        bgClass: "bg-gradient-to-br from-indigo-900 to-indigo-800",
        displayOrder: 1,
        intervalMs: 5000
      },
      {
        category: "Delta",
        bgClass: "bg-gradient-to-br from-emerald-900 to-emerald-800",
        displayOrder: 2,
        intervalMs: 5000
      },
      {
        category: "E-Liquid/Salts",
        bgClass: "bg-gradient-to-br from-amber-900 to-amber-800", 
        displayOrder: 3,
        intervalMs: 5000
      },
      {
        category: "Vaporizer Devices",
        bgClass: "bg-gradient-to-br from-blue-900 to-blue-800",
        displayOrder: 4,
        intervalMs: 5000
      },
      {
        category: "Hookah/Shisha",
        bgClass: "bg-gradient-to-br from-rose-900 to-rose-800",
        displayOrder: 5,
        intervalMs: 5000
      },
      {
        category: "Glass",
        bgClass: "bg-gradient-to-br from-purple-900 to-purple-800",
        displayOrder: 6,
        intervalMs: 5000
      }
    ];
    
    console.log("Creating brand categories");
    const categoryMap = new Map<string, number>();
    
    for (const category of categories) {
      try {
        // Check if the category already exists
        const existingCategories = await storage.getAllBrandCategories();
        const existingCategory = existingCategories.find(c => c.category === category.category);
        
        if (existingCategory) {
          console.log(`Category "${category.category}" already exists`);
          categoryMap.set(category.category, existingCategory.id);
        } else {
          const newCategory = await storage.createBrandCategory(category);
          console.log(`Created category "${newCategory.category}" with ID ${newCategory.id}`);
          categoryMap.set(category.category, newCategory.id);
        }
      } catch (error) {
        console.error(`Error creating category "${category.category}":`, error);
      }
    }
    
    // Create brands
    const brands = [
      // Disposables Nicotiene
      {
        name: "ELFBAR",
        categoryId: categoryMap.get("Disposables Nicotiene") || 0,
        image: "/brand-logos/placeholder.svg",
        description: "Premium disposable vapes in a variety of flavors",
        displayOrder: 1,
        imageSize: "medium"
      },
      {
        name: "Lost Mary",
        categoryId: categoryMap.get("Disposables Nicotiene") || 0,
        image: "/brand-logos/placeholder.svg",
        description: "Quality disposable vapes with unique flavor profiles",
        displayOrder: 2
      },
      {
        name: "HYDE",
        categoryId: categoryMap.get("Disposables Nicotiene") || 0,
        image: "/brand-logos/placeholder.svg",
        description: "Long-lasting disposable vapes with bold flavors",
        displayOrder: 3
      },
      
      // Delta
      {
        name: "3CHI",
        categoryId: categoryMap.get("Delta") || 0,
        image: "/brand-logos/placeholder.svg",
        description: "Pioneer in hemp-derived delta products",
        displayOrder: 1
      },
      {
        name: "Cake",
        categoryId: categoryMap.get("Delta") || 0,
        image: "/brand-logos/placeholder.svg",
        description: "Popular delta products with great taste",
        displayOrder: 2
      },
      {
        name: "Delta Extrax",
        categoryId: categoryMap.get("Delta") || 0,
        image: "/brand-logos/placeholder.svg",
        description: "Quality delta extracts in various forms",
        displayOrder: 3
      },
      
      // E-Liquid/Salts
      {
        name: "Candy King",
        categoryId: categoryMap.get("E-Liquid/Salts") || 0,
        image: "/brand-logos/placeholder.svg",
        description: "Sweet and candy-inspired e-liquid flavors",
        displayOrder: 1
      },
      {
        name: "Naked 100",
        categoryId: categoryMap.get("E-Liquid/Salts") || 0,
        image: "/brand-logos/placeholder.svg",
        description: "Premium e-liquids with fruit and menthol flavors",
        displayOrder: 2
      },
      {
        name: "Salt Bae",
        categoryId: categoryMap.get("E-Liquid/Salts") || 0,
        image: "/brand-logos/placeholder.svg",
        description: "Salt nicotine e-liquids with smooth delivery",
        displayOrder: 3
      },
      
      // Vaporizer Devices
      {
        name: "SMOK",
        categoryId: categoryMap.get("Vaporizer Devices") || 0,
        image: "/brand-logos/placeholder.svg",
        description: "Industry-leading vaporizer devices and kits",
        displayOrder: 1
      },
      {
        name: "GeekVape",
        categoryId: categoryMap.get("Vaporizer Devices") || 0,
        image: "/brand-logos/placeholder.svg",
        description: "Durable and reliable vaping devices",
        displayOrder: 2
      },
      {
        name: "Vaporesso",
        categoryId: categoryMap.get("Vaporizer Devices") || 0,
        image: "/brand-logos/placeholder.svg",
        description: "Innovative and stylish vaporizer technology",
        displayOrder: 3
      },
      
      // Hookah/Shisha
      {
        name: "Starbuzz",
        categoryId: categoryMap.get("Hookah/Shisha") || 0,
        image: "/brand-logos/placeholder.svg",
        description: "Premium hookah tobacco in exotic flavors",
        displayOrder: 1
      },
      {
        name: "Al Fakher",
        categoryId: categoryMap.get("Hookah/Shisha") || 0,
        image: "/brand-logos/placeholder.svg",
        description: "Traditional hookah tobacco with authentic taste",
        displayOrder: 2
      },
      {
        name: "Fumari",
        categoryId: categoryMap.get("Hookah/Shisha") || 0,
        image: "/brand-logos/placeholder.svg",
        description: "Premium hookah tobacco with rich flavors",
        displayOrder: 3
      },
      
      // Glass
      {
        name: "GRAV",
        categoryId: categoryMap.get("Glass") || 0,
        image: "/brand-logos/placeholder.svg",
        description: "Scientific glass pieces with modern designs",
        displayOrder: 1
      },
      {
        name: "Pulsar",
        categoryId: categoryMap.get("Glass") || 0,
        image: "/brand-logos/placeholder.svg",
        description: "Innovative glass and electronic smoking accessories",
        displayOrder: 2
      },
      {
        name: "Diamond Glass",
        categoryId: categoryMap.get("Glass") || 0,
        image: "/brand-logos/placeholder.svg",
        description: "High-quality American-made glass products",
        displayOrder: 3
      }
    ];
    
    console.log("Creating brands");
    
    for (const brand of brands) {
      // Skip brands without valid category
      if (brand.categoryId === 0) {
        console.log(`Skipping brand "${brand.name}" because category not found`);
        continue;
      }
      
      try {
        // Check if the brand already exists
        const existingBrands = await storage.getAllBrands();
        const existingBrand = existingBrands.find(b => 
          b.name === brand.name && b.categoryId === brand.categoryId
        );
        
        if (existingBrand) {
          console.log(`Brand "${brand.name}" already exists in this category`);
        } else {
          // Add imageSize field if it doesn't exist
          const brandWithSize = {
            ...brand,
            imageSize: "medium" // Default value
          };
          const newBrand = await storage.createBrand(brandWithSize);
          console.log(`Created brand "${newBrand.name}" with ID ${newBrand.id}`);
        }
      } catch (error) {
        console.error(`Error creating brand "${brand.name}":`, error);
      }
    }
    
    console.log("Database seeding completed");
    
  } catch (error) {
    console.error("Error seeding database:", error);
  }
}

// Execute the seed function
seedDatabase().then(() => {
  console.log("Seed script completed");
  process.exit(0);
}).catch((error) => {
  console.error("Seed script failed:", error);
  process.exit(1);
});