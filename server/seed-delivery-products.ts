import { storage } from './storage';

/**
 * Seed script to populate the database with sample delivery products
 * This creates a realistic vape shop inventory for testing
 */
async function seedDeliveryProducts() {
  console.log("Starting to seed delivery products...");
  
  const sampleProducts = [
    // Featured Disposables
    {
      cloverItemId: "DISP001",
      name: "Lost Mary OS5000 - Blue Razz Ice",
      price: "19.99",
      image: "https://images.unsplash.com/photo-1606041008023-472dfb5e530f?w=400&h=400&fit=crop",
      description: "5000 puffs of refreshing blue raspberry with a cool menthol finish. Pre-filled and ready to vape.",
      category: "Disposables",
      badge: "popular",
      displayOrder: 1,
      isFeaturedSlideshow: true,
      slideshowPosition: 1,
      stockQuantity: "150",
      enabled: true
    },
    {
      cloverItemId: "DISP002",
      name: "Elf Bar BC5000 - Watermelon Ice",
      price: "18.99",
      image: "https://images.unsplash.com/photo-1606041008023-472dfb5e530f?w=400&h=400&fit=crop",
      description: "Sweet watermelon flavor with a refreshing icy exhale. 5000 puffs of pure satisfaction.",
      category: "Disposables",
      badge: "popular",
      displayOrder: 2,
      isFeaturedSlideshow: true,
      slideshowPosition: 2,
      stockQuantity: "200",
      enabled: true
    },
    {
      cloverItemId: "DISP003",
      name: "Hyde IQ - Tropical Fusion",
      price: "17.99",
      image: "https://images.unsplash.com/photo-1606041008023-472dfb5e530f?w=400&h=400&fit=crop",
      description: "Exotic blend of tropical fruits in a convenient disposable. 5000 puffs of paradise.",
      category: "Disposables",
      badge: "new",
      displayOrder: 3,
      isFeaturedSlideshow: true,
      slideshowPosition: 3,
      stockQuantity: "100",
      enabled: true
    },
    {
      cloverItemId: "DISP004",
      name: "Geek Bar Pulse - Strawberry Mango",
      price: "22.99",
      image: "https://images.unsplash.com/photo-1606041008023-472dfb5e530f?w=400&h=400&fit=crop",
      description: "Premium disposable with dual flavor profile. 15000 puffs in regular mode.",
      category: "Disposables",
      badge: "featured",
      displayOrder: 4,
      isFeaturedSlideshow: true,
      slideshowPosition: 4,
      stockQuantity: "80",
      enabled: true
    },
    {
      cloverItemId: "DISP005",
      name: "Fume Ultra - Mint Ice",
      price: "16.99",
      image: "https://images.unsplash.com/photo-1606041008023-472dfb5e530f?w=400&h=400&fit=crop",
      description: "Classic cool mint flavor for all-day vaping. 2500 puffs per device.",
      category: "Disposables",
      displayOrder: 5,
      isFeaturedSlideshow: false,
      stockQuantity: "120",
      enabled: true
    },

    // Premium E-Liquids
    {
      cloverItemId: "ELIQ001",
      name: "Naked 100 - Hawaiian POG 60ml",
      price: "24.99",
      image: "https://images.unsplash.com/photo-1607434472257-d9f8e57a643d?w=400&h=400&fit=crop",
      description: "Passion fruit, orange, and guava blend. Premium salt nic available. 3mg, 6mg nicotine.",
      category: "E-Liquids",
      badge: "popular",
      displayOrder: 10,
      isFeaturedSlideshow: true,
      slideshowPosition: 5,
      stockQuantity: "50",
      enabled: true
    },
    {
      cloverItemId: "ELIQ002",
      name: "Juice Head - Peach Pear 100ml",
      price: "29.99",
      image: "https://images.unsplash.com/photo-1607434472257-d9f8e57a643d?w=400&h=400&fit=crop",
      description: "Sweet peaches and crisp pears perfectly balanced. 0mg, 3mg, 6mg available.",
      category: "E-Liquids",
      badge: "new",
      displayOrder: 11,
      isFeaturedSlideshow: false,
      stockQuantity: "60",
      enabled: true
    },
    {
      cloverItemId: "ELIQ003",
      name: "Vapetasia - Killer Kustard 100ml",
      price: "27.99",
      image: "https://images.unsplash.com/photo-1607434472257-d9f8e57a643d?w=400&h=400&fit=crop",
      description: "Award-winning vanilla custard flavor. Smooth and creamy all-day vape.",
      category: "E-Liquids",
      displayOrder: 12,
      isFeaturedSlideshow: false,
      stockQuantity: "40",
      enabled: true
    },

    // Salt Nicotine
    {
      cloverItemId: "SALT001",
      name: "VGOD SaltNic - Cubano 30ml",
      price: "19.99",
      image: "https://images.unsplash.com/photo-1607434472257-d9f8e57a643d?w=400&h=400&fit=crop",
      description: "Rich tobacco with vanilla cream and honey. 25mg and 50mg nicotine strength.",
      category: "Salt Nicotine",
      badge: "popular",
      displayOrder: 15,
      isFeaturedSlideshow: false,
      stockQuantity: "70",
      enabled: true
    },
    {
      cloverItemId: "SALT002",
      name: "Pod Juice - Jewel Mint 30ml",
      price: "17.99",
      image: "https://images.unsplash.com/photo-1607434472257-d9f8e57a643d?w=400&h=400&fit=crop",
      description: "Refreshing mint with a hint of sweetness. Perfect for pod systems. 35mg and 55mg.",
      category: "Salt Nicotine",
      displayOrder: 16,
      isFeaturedSlideshow: false,
      stockQuantity: "85",
      enabled: true
    },

    // Vape Devices
    {
      cloverItemId: "DEV001",
      name: "SMOK Nord 5 Pod Kit",
      price: "39.99",
      image: "https://images.unsplash.com/photo-1511512578047-dfb367046420?w=400&h=400&fit=crop",
      description: "Powerful 80W pod system with 2000mAh battery. Includes 2 RPM 3 coils.",
      category: "Devices",
      badge: "featured",
      displayOrder: 20,
      isFeaturedSlideshow: false,
      stockQuantity: "25",
      enabled: true
    },
    {
      cloverItemId: "DEV002",
      name: "Vaporesso XROS 3 Pod",
      price: "29.99",
      image: "https://images.unsplash.com/photo-1511512578047-dfb367046420?w=400&h=400&fit=crop",
      description: "Sleek and portable with auto-draw activation. 1000mAh battery, adjustable airflow.",
      category: "Devices",
      badge: "new",
      displayOrder: 21,
      isFeaturedSlideshow: false,
      stockQuantity: "30",
      enabled: true
    },
    {
      cloverItemId: "DEV003",
      name: "VOOPOO Drag X2 Mod Kit",
      price: "59.99",
      image: "https://images.unsplash.com/photo-1511512578047-dfb367046420?w=400&h=400&fit=crop",
      description: "Dual 18650 battery mod with PnP X Tank. Adjustable 5-80W output power.",
      category: "Devices",
      badge: "popular",
      displayOrder: 22,
      isFeaturedSlideshow: false,
      stockQuantity: "15",
      enabled: true
    },

    // Coils & Accessories
    {
      cloverItemId: "COIL001",
      name: "SMOK RPM 3 Coil Pack (5ct)",
      price: "14.99",
      image: "https://images.unsplash.com/photo-1606041008023-472dfb5e530f?w=400&h=400&fit=crop",
      description: "Pack of 5 replacement coils. 0.15Ω and 0.23Ω mesh coils available.",
      category: "Coils",
      displayOrder: 30,
      isFeaturedSlideshow: false,
      stockQuantity: "100",
      enabled: true
    },
    {
      cloverItemId: "COIL002",
      name: "VOOPOO PnP Coil Pack (5ct)",
      price: "16.99",
      image: "https://images.unsplash.com/photo-1606041008023-472dfb5e530f?w=400&h=400&fit=crop",
      description: "Universal PnP coils compatible with multiple devices. VM1 0.3Ω mesh.",
      category: "Coils",
      displayOrder: 31,
      isFeaturedSlideshow: false,
      stockQuantity: "90",
      enabled: true
    },

    // Batteries & Chargers
    {
      cloverItemId: "BATT001",
      name: "Samsung 18650 Battery (2-Pack)",
      price: "19.99",
      image: "https://images.unsplash.com/photo-1606041008023-472dfb5e530f?w=400&h=400&fit=crop",
      description: "Premium 3000mAh rechargeable batteries. High drain, long-lasting performance.",
      category: "Batteries",
      badge: "popular",
      displayOrder: 35,
      isFeaturedSlideshow: false,
      stockQuantity: "120",
      enabled: true
    },
    {
      cloverItemId: "CHAR001",
      name: "Nitecore i2 Dual Bay Charger",
      price: "24.99",
      image: "https://images.unsplash.com/photo-1606041008023-472dfb5e530f?w=400&h=400&fit=crop",
      description: "Intelligent dual-slot battery charger with LED indicators. Universal compatibility.",
      category: "Chargers",
      displayOrder: 36,
      isFeaturedSlideshow: false,
      stockQuantity: "40",
      enabled: true
    },

    // Premium/Limited Items
    {
      cloverItemId: "PREM001",
      name: "Caliburn KOKO Prime Vision",
      price: "34.99",
      image: "https://images.unsplash.com/photo-1511512578047-dfb367046420?w=400&h=400&fit=crop",
      description: "Limited edition with unique LED display. 690mAh battery, 15W max output.",
      category: "Devices",
      badge: "featured",
      displayOrder: 40,
      isFeaturedSlideshow: true,
      slideshowPosition: 6,
      stockQuantity: "20",
      enabled: true
    }
  ];

  try {
    let created = 0;
    let updated = 0;
    let skipped = 0;

    for (const product of sampleProducts) {
      try {
        // Check if product already exists by cloverItemId
        const existing = await storage.getDeliveryProductByCloverItemId(product.cloverItemId);
        
        if (existing) {
          console.log(`Product ${product.name} already exists, updating...`);
          await storage.updateDeliveryProduct(existing.id, product);
          updated++;
        } else {
          console.log(`Creating product: ${product.name}`);
          await storage.createDeliveryProduct(product);
          created++;
        }
      } catch (error) {
        console.error(`Error processing product ${product.name}:`, error);
        skipped++;
      }
    }

    console.log(`\nDelivery products seeding completed!`);
    console.log(`Created: ${created}, Updated: ${updated}, Skipped: ${skipped}`);
    console.log(`Total products in catalog: ${sampleProducts.length}`);
  } catch (error) {
    console.error("Error seeding delivery products:", error);
    throw error;
  }
}

export { seedDeliveryProducts };
