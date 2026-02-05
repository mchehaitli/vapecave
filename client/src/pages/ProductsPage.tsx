import { useState } from "react";
import { Link } from "wouter";
import MainLayout from "@/layouts/MainLayout";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle } from "lucide-react";
import { motion } from "framer-motion";

interface Product {
  id: number;
  name: string;
  description: string;
  image: string;
  price: string;
  hidePrice?: boolean; // New field to hide price completely
  category: string;
  featured?: boolean;
  featuredLabel?: string;
  stock?: number;
  created_at?: string;
  updated_at?: string;
}

// Custom hook to fetch products
function useProducts(category?: string) {
  return useQuery({
    queryKey: category && category !== "all" 
      ? ["/api/products/category", category]
      : ["/api/products"],
    queryFn: async () => {
      const url = category && category !== "all"
        ? `/api/products/category/${category}`
        : `/api/products`;
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch products: ${response.statusText}`);
      }
      
      return response.json() as Promise<Product[]>;
    }
  });
}

const ProductsPage = () => {
  const [activeCategory, setActiveCategory] = useState("all");
  const { data: products, isLoading, error } = useProducts(activeCategory);
  
  const categories = [
    { id: "all", name: "All Products" },
    { id: "devices", name: "Vaping Devices" },
    { id: "e-liquids", name: "E-Liquids" },
    { id: "accessories", name: "Accessories" }
  ];
  
  return (
    <MainLayout
      title="Products - Vape Cave"
      description="Browse our extensive collection of premium vaping devices, e-liquids, and accessories at Vape Cave."
    >
      {/* Products Header */}
      <section className="bg-background py-12 text-foreground relative overflow-hidden">
        <div className="container mx-auto px-4 relative z-10">
          <motion.h1 
            className="text-4xl md:text-5xl font-bold mb-4"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            Our Products
          </motion.h1>
          <motion.p 
            className="text-muted-foreground max-w-2xl text-lg"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            Explore our wide selection of high-quality vaping products. We source from top manufacturers to bring you the best vaping experience.
          </motion.p>
        </div>
      </section>
      
      {/* Product Categories */}
      <section className="bg-background py-8 border-b border-border">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap items-center gap-4">
            <span className="font-medium text-foreground">Filter by:</span>
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => (
                <motion.button
                  key={category.id}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                    activeCategory === category.id 
                      ? "bg-primary text-black shadow-lg" 
                      : "bg-background text-foreground border border-primary/50 hover:bg-primary/10 hover:border-primary"
                  }`}
                  onClick={() => setActiveCategory(category.id)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {category.name}
                </motion.button>
              ))}
            </div>
          </div>
        </div>
      </section>
      
      {/* Products Grid */}
      <section className="py-12 bg-background">
        <div className="container mx-auto px-4">
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {Array.from({ length: 8 }).map((_, index) => (
                <div key={index} className="bg-card border border-border rounded-lg overflow-hidden">
                  <div className="p-5">
                    <Skeleton className="h-6 w-3/4 mb-2 bg-muted" />
                    <Skeleton className="h-4 w-full mb-1 bg-muted" />
                    <Skeleton className="h-4 w-5/6 mb-4 bg-muted" />
                    <div className="flex justify-between items-center">
                      <Skeleton className="h-6 w-16 bg-muted" />
                      <Skeleton className="h-10 w-28 bg-muted" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <AlertCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
              <p className="text-xl font-medium text-red-500">
                Error loading products. Please try again later.
              </p>
            </div>
          ) : products && products.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {products.map((product) => (
                <motion.div 
                  key={product.id} 
                  className="rounded-lg overflow-hidden relative bg-card border-2 border-primary/50"
                  animate={{
                    boxShadow: [
                      '0 0 15px rgba(255, 113, 0, 0.2), 0 0 30px rgba(255, 113, 0, 0.1)',
                      '0 0 25px rgba(255, 113, 0, 0.4), 0 0 50px rgba(255, 113, 0, 0.2)',
                      '0 0 15px rgba(255, 113, 0, 0.2), 0 0 30px rgba(255, 113, 0, 0.1)',
                    ]
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                  whileHover={{ y: -5, transition: { duration: 0.2 } }}
                >
                  {product.featured && (
                    <span className="absolute top-2 right-2 bg-primary text-black text-xs font-bold rounded-full px-2.5 py-0.5 z-10 shadow-lg">
                      {product.featuredLabel || "Featured"}
                    </span>
                  )}
                  <div className={`p-5 flex flex-col h-full ${product.featured ? 'pt-10' : ''}`}>
                    <h3 className="font-semibold text-lg mb-2 text-foreground">{product.name}</h3>
                    <p className="text-muted-foreground text-sm mb-4 line-clamp-2 min-h-[2.5rem]">{product.description}</p>
                    <div className="mt-auto">
                      <Link href="/signup">
                        <span className="w-full bg-primary hover:bg-primary/90 text-black font-medium py-2 px-4 rounded-md transition-colors text-center cursor-pointer inline-block" data-testid="button-signup-pricing">
                          Sign In/Sign Up to view pricing
                        </span>
                      </Link>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-foreground">
              <p className="text-xl font-medium">No products found in this category.</p>
            </div>
          )}
        </div>
      </section>
      
      {/* Age Verification Notice */}
      <section className="py-16 bg-background text-foreground">
        <div className="container mx-auto px-4 text-center">
          <motion.div 
            className="max-w-3xl mx-auto p-8 rounded-xl bg-card border-2 border-primary/50 shadow-[0_0_20px_rgba(255,113,0,0.3),0_0_40px_rgba(255,113,0,0.15)]"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <AlertCircle className="mx-auto h-10 w-10 text-primary mb-4" />
            <h2 className="text-2xl font-bold mb-3">Age Verification Required</h2>
            <p className="text-muted-foreground text-lg">Our products are intended for adult smokers aged 21 and over. Proof of age will be required upon purchase.</p>
          </motion.div>
        </div>
      </section>
    </MainLayout>
  );
};

export default ProductsPage;
