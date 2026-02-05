import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Plus, Minus, ShoppingCart, Check } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import type { DeliveryProduct } from "@shared/schema";

interface ProductQuickViewProps {
  product: DeliveryProduct | null;
  open: boolean;
  onClose: () => void;
  onAddToCart?: (productId: number, quantity: number) => Promise<void>;
}

export function ProductQuickView({ product, open, onClose, onAddToCart }: ProductQuickViewProps) {
  const [quantity, setQuantity] = useState(1);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [addedToCart, setAddedToCart] = useState(false);

  if (!product) return null;

  const displayPrice = product.salePrice ? parseFloat(product.salePrice) : parseFloat(product.price);
  const originalPrice = product.salePrice ? parseFloat(product.price) : null;
  const isOnSale = !!product.salePrice;
  const stockQty = product.stockQuantity ? parseInt(product.stockQuantity) : 0;
  const inStock = stockQty > 0;
  const isLowStock = stockQty > 0 && stockQty <= 2;
  const isInStock = stockQty >= 3;

  // Get all images (primary + additional images)
  const allImages = [
    product.image,
    ...(product.images || []),
  ].filter(Boolean) as string[];

  const handleAddToCart = async () => {
    if (!inStock || isAddingToCart) return;

    setIsAddingToCart(true);
    
    try {
      if (onAddToCart) {
        await onAddToCart(product.id, quantity);
      }
      
      setAddedToCart(true);
      
      // Reset after animation
      setTimeout(() => {
        setAddedToCart(false);
        setQuantity(1);
        onClose();
      }, 1500);
    } catch (error) {
      console.error('Error adding to cart:', error);
    } finally {
      setIsAddingToCart(false);
    }
  };

  const incrementQuantity = () => {
    setQuantity(prev => prev + 1);
  };

  const decrementQuantity = () => {
    setQuantity(prev => Math.max(1, prev - 1));
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      onClose();
      // Reset state when closing
      setTimeout(() => {
        setQuantity(1);
        setSelectedImageIndex(0);
        setAddedToCart(false);
      }, 200);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0">
        <VisuallyHidden>
          <DialogTitle>Quick View: {product.name}</DialogTitle>
        </VisuallyHidden>
        
        <div className="grid md:grid-cols-2 gap-6 p-6">
          {/* Left: Product Images */}
          <div className="space-y-4">
            {/* Main Image */}
            <div 
              className="aspect-square bg-muted rounded-lg overflow-hidden relative"
              style={{
                boxShadow: '0 0 0 2px rgba(255, 113, 0, 0.2), 0 0 12px rgba(255, 113, 0, 0.15)',
              }}
            >
              {allImages.length > 0 ? (
                <img
                  src={allImages[selectedImageIndex]}
                  alt={product.name}
                  className="w-full h-full object-contain p-2"
                  data-testid={`img-product-main-${product.id}`}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                  No image available
                </div>
              )}

              {product.badge && (
                <div
                  className={`absolute top-4 right-4 px-3 py-1.5 rounded text-sm font-bold uppercase ${
                    product.badge === 'sale' ? 'bg-red-500 text-white' :
                    product.badge === 'new' ? 'bg-green-500 text-white' :
                    product.badge === 'popular' ? 'bg-primary text-primary-foreground' :
                    'bg-muted text-muted-foreground'
                  }`}
                  data-testid={`badge-${product.badge}-${product.id}`}
                >
                  {product.badge}
                </div>
              )}

              {!inStock && (
                <div className="absolute inset-0 bg-background/90 flex items-center justify-center">
                  <span className="text-2xl font-bold text-muted-foreground">Out of Stock</span>
                </div>
              )}
            </div>

            {/* Thumbnail Gallery */}
            {allImages.length > 1 && (
              <div className="flex gap-2 overflow-x-auto">
                {allImages.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImageIndex(index)}
                    className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${
                      selectedImageIndex === index
                        ? 'border-primary shadow-lg'
                        : 'border-transparent hover:border-muted-foreground/50'
                    }`}
                    data-testid={`button-thumbnail-${index}`}
                  >
                    <img
                      src={image}
                      alt={`${product.name} - View ${index + 1}`}
                      className="w-full h-full object-contain p-1"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right: Product Details */}
          <div className="flex flex-col">
            <div className="flex-1">
              <h2 className="text-3xl font-bold mb-3" data-testid={`text-product-name-${product.id}`}>
                {product.name}
              </h2>

              {product.brand && (
                <p className="text-muted-foreground mb-3">
                  Brand: <span className="font-medium">{product.brand}</span>
                </p>
              )}

              {product.category && (
                <p className="text-sm text-muted-foreground mb-4">
                  Category: {product.category}
                </p>
              )}

              <div className="mb-6">
                <div className="flex items-baseline gap-3">
                  <span className="text-4xl font-bold text-primary" data-testid={`text-price-${product.id}`}>
                    ${displayPrice.toFixed(2)}
                  </span>
                  {originalPrice && (
                    <span className="text-xl text-muted-foreground line-through" data-testid={`text-original-price-${product.id}`}>
                      ${originalPrice.toFixed(2)}
                    </span>
                  )}
                </div>

                {isOnSale && (
                  <p className="text-red-500 font-semibold mt-2">
                    Save ${(originalPrice! - displayPrice).toFixed(2)} ({Math.round(((originalPrice! - displayPrice) / originalPrice!) * 100)}% off)
                  </p>
                )}
              </div>

              {product.description && (
                <div className="mb-6">
                  <h3 className="font-semibold mb-2">Description</h3>
                  <p className="text-muted-foreground">{product.description}</p>
                </div>
              )}

              {inStock && (
                <div className="mb-6">
                  <p className={`text-sm font-medium ${isLowStock ? 'text-amber-600 dark:text-amber-400' : 'text-green-600 dark:text-green-400'}`}>
                    {isLowStock ? 'Low Stock' : 'In Stock'}
                  </p>
                </div>
              )}
            </div>

            {/* Quantity Selector and Add to Cart */}
            <div className="space-y-4 pt-4 border-t">
              {inStock && (
                <div className="flex items-center gap-4">
                  <label className="font-semibold">Quantity:</label>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={decrementQuantity}
                      disabled={quantity <= 1 || isAddingToCart}
                      data-testid="button-decrement-quantity"
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <span className="w-12 text-center font-semibold text-lg" data-testid="text-quantity">
                      {quantity}
                    </span>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={incrementQuantity}
                      disabled={isAddingToCart}
                      data-testid="button-increment-quantity"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}

              <Button
                className="w-full text-lg py-6 bg-primary hover:bg-primary/90 relative overflow-hidden"
                onClick={handleAddToCart}
                disabled={!inStock || isAddingToCart}
                data-testid="button-add-to-cart"
              >
                <AnimatePresence mode="wait">
                  {addedToCart ? (
                    <motion.div
                      key="success"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                      className="flex items-center gap-2"
                    >
                      <Check className="h-5 w-5" />
                      Added to Cart!
                    </motion.div>
                  ) : isAddingToCart ? (
                    <motion.div
                      key="loading"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex items-center gap-2"
                    >
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      >
                        <ShoppingCart className="h-5 w-5" />
                      </motion.div>
                      Adding to Cart...
                    </motion.div>
                  ) : (
                    <motion.div
                      key="default"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex items-center gap-2"
                    >
                      <ShoppingCart className="h-5 w-5" />
                      {inStock ? `Add to Cart - $${(displayPrice * quantity).toFixed(2)}` : 'Out of Stock'}
                    </motion.div>
                  )}
                </AnimatePresence>
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
