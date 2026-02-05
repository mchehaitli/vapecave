import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Link } from "wouter";
import { Card } from "@/components/ui/card";
import { DeliveryHeader } from "@/components/DeliveryHeader";
import { DeliveryFooter } from "@/components/DeliveryFooter";
import { DeliveryCategoryNav } from "@/components/DeliveryCategoryNav";
import type { DeliveryCategory, DeliveryBrand } from "@shared/schema";

export default function DeliveryBrandsPage() {
  const { data: categories = [], isLoading: categoriesLoading } = useQuery<DeliveryCategory[]>({
    queryKey: ["/api/delivery/categories"],
  });

  const { data: brands = [], isLoading: brandsLoading } = useQuery<DeliveryBrand[]>({
    queryKey: ["/api/delivery/brands"],
  });

  const activeCategories = categories
    .filter(c => c.isActive)
    .sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));

  const activeBrands = brands
    .filter(b => b.isActive)
    .sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));

  const getBrandsByCategory = (categoryId: number) => {
    return activeBrands.filter(brand => brand.categoryId === categoryId);
  };

  const isLoading = categoriesLoading || brandsLoading;

  return (
    <div className="min-h-screen bg-background">
      <DeliveryHeader />
      <DeliveryCategoryNav />
      
      <main className="container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <h1 className="text-3xl md:text-4xl font-bold text-foreground">Shop by Brand</h1>
          <p className="text-muted-foreground mt-2">
            Browse all our brands organized by category
          </p>
        </motion.div>

        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : (
          <div className="space-y-12">
            {activeCategories.map((category, categoryIndex) => {
              const categoryBrands = getBrandsByCategory(category.id);
              
              if (categoryBrands.length === 0) return null;
              
              return (
                <motion.section
                  key={category.id}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: categoryIndex * 0.1 }}
                >
                  <div className="flex items-center gap-3 mb-6">
                    <h2 className="text-2xl md:text-3xl font-bold text-foreground">
                      {category.name}
                    </h2>
                    <div className="h-px flex-1 bg-border/50"></div>
                    <span className="text-sm text-muted-foreground">
                      {categoryBrands.length} {categoryBrands.length === 1 ? 'brand' : 'brands'}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
                    {categoryBrands.map((brand, brandIndex) => (
                      <motion.div
                        key={brand.id}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ 
                          duration: 0.4, 
                          delay: categoryIndex * 0.1 + brandIndex * 0.05 
                        }}
                      >
                        <BrandCard brand={brand} />
                      </motion.div>
                    ))}
                  </div>
                </motion.section>
              );
            })}
            
            {activeCategories.every(cat => getBrandsByCategory(cat.id).length === 0) && (
              <div className="text-center py-16 bg-card/50 rounded-2xl border border-border/30">
                <p className="text-muted-foreground text-lg">No brands available at this time</p>
              </div>
            )}
          </div>
        )}
      </main>

      <DeliveryFooter />
    </div>
  );
}

function BrandCard({ brand }: { brand: DeliveryBrand }) {
  return (
    <Link href={`/delivery/brand/${brand.slug}`}>
      <motion.div
        whileHover={{ y: -8, scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="h-full"
      >
        <Card className="overflow-hidden h-full flex flex-col group cursor-pointer transition-all duration-300 border border-border/50 bg-card hover:border-[#FF7100]/50 hover:shadow-2xl hover:shadow-[#FF7100]/20">
          <div className="relative aspect-square bg-white overflow-hidden flex items-center justify-center p-4">
            {brand.logo ? (
              <img 
                src={brand.logo} 
                alt={brand.name}
                className="w-full h-full object-contain transition-transform duration-700 ease-out group-hover:scale-110"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#FF7100]/20 to-[#FF7100]/5">
                <span className="text-4xl md:text-5xl font-black text-[#FF7100]/60 uppercase">
                  {brand.name.charAt(0)}
                </span>
              </div>
            )}
          </div>
          <div className="p-4 md:p-5 flex-1 flex flex-col bg-card text-center">
            <h3 className="font-bold text-sm md:text-base group-hover:text-[#FF7100] transition-colors duration-300 line-clamp-2">
              {brand.name}
            </h3>
          </div>
        </Card>
      </motion.div>
    </Link>
  );
}
