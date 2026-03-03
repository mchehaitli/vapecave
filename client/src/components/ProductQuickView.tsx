import { useState, useEffect } from "react";
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
import type { VariantGroup, ProductVariant } from "@/lib/productVariants";
import { getDefaultVariant, getVariantByNicLevel, sortNicLevels } from "@/lib/productVariants";

interface ProductQuickViewProps {
  product: DeliveryProduct | null;
  open: boolean;
  onClose: () => void;
  onAddToCart?: (productId: number, quantity: number) => Promise<void>;
  variantGroup?: VariantGroup | null;
  selectedNicLevel?: string;
  onNicLevelChange?: (level: string) => void;
}

export function ProductQuickView({
  product,
  open,
  onClose,
  onAddToCart,
  variantGroup,
  selectedNicLevel,
  onNicLevelChange,
}: ProductQuickViewProps) {
  const [quantity, setQuantity] = useState(1);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [addedToCart, setAddedToCart] = useState(false);
  const [localNicLevel, setLocalNicLevel] = useState<string>("");

  const isVariantMode = !!variantGroup;

  useEffect(() => {
    if (isVariantMode && variantGroup) {
      const initialLevel =
        selectedNicLevel || getDefaultVariant(variantGroup).nicLevel;
      setLocalNicLevel(initialLevel);
    }
  }, [variantGroup, selectedNicLevel, isVariantMode]);

  useEffect(() => {
    if (open) {
      setSelectedImageIndex(0);
    }
  }, [open, product?.id, variantGroup?.key]);

  useEffect(() => {
    if (!open) return;

    let name = "";
    let image = "";
    let description = "";
    let price = "";
    let inStock = false;
    let sku = "";
    let brand = "";

    if (isVariantMode && variantGroup) {
      const variant = localNicLevel
        ? getVariantByNicLevel(variantGroup, localNicLevel) || getDefaultVariant(variantGroup)
        : getDefaultVariant(variantGroup);

      name = `${variantGroup.displayName}${localNicLevel ? ` ${localNicLevel}` : ""}`;
      image = variantGroup.image || "";
      description = variantGroup.description || "";
      price = variant.salePrice || variant.price;
      inStock = variant.stockQuantity ? parseInt(variant.stockQuantity) > 0 : false;
      sku = variant.cloverItemId || String(variant.productId);
      brand = variantGroup.brandLine || variantGroup.brand || "";
    } else if (product) {
      name = product.name;
      image = product.image || "";
      description = product.description || "";
      price = product.salePrice || product.price;
      inStock = product.stockQuantity ? parseInt(product.stockQuantity) > 0 : false;
      sku = product.cloverItemId || String(product.id);
      brand = product.brand || "";
    }

    const existingScript = document.getElementById("product-schema-ld");
    if (existingScript) existingScript.remove();

    const schema = {
      "@context": "https://schema.org/",
      "@type": "Product",
      name,
      image: image ? [image] : [],
      description,
      sku,
      brand: brand ? { "@type": "Brand", name: brand } : undefined,
      offers: {
        "@type": "Offer",
        url: "https://vapecavetx.com/delivery/shop",
        priceCurrency: "USD",
        price,
        availability: inStock
          ? "https://schema.org/InStock"
          : "https://schema.org/OutOfStock",
        itemCondition: "https://schema.org/NewCondition",
      },
    };

    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.id = "product-schema-ld";
    script.textContent = JSON.stringify(schema);
    document.head.appendChild(script);

    return () => {
      const s = document.getElementById("product-schema-ld");
      if (s) s.remove();
    };
  }, [open, product, variantGroup, localNicLevel, isVariantMode]);

  if (!product && !variantGroup) return null;

  let displayName = "";
  let displayBrand = "";
  let displayCategory = "";
  let displayBadge = "";
  let displayDescription = "";
  let allImages: string[] = [];
  let displayPrice = 0;
  let originalPrice: number | null = null;
  let isOnSale = false;
  let stockQty = 0;
  let selectedVariant: ProductVariant | null = null;

  if (isVariantMode && variantGroup) {
    const variant = localNicLevel
      ? getVariantByNicLevel(variantGroup, localNicLevel) || getDefaultVariant(variantGroup)
      : getDefaultVariant(variantGroup);

    selectedVariant = variant;
    displayName = variantGroup.displayName;
    displayBrand = variantGroup.brandLine || variantGroup.brand || "";
    displayCategory = variantGroup.category;
    displayBadge = variantGroup.badge || "";
    displayDescription = variantGroup.description || "";
    allImages = [
      variantGroup.image,
      ...(variantGroup.images || []),
    ].filter(Boolean) as string[];
    displayPrice = variant.salePrice
      ? parseFloat(variant.salePrice)
      : parseFloat(variant.price);
    originalPrice = variant.salePrice ? parseFloat(variant.price) : null;
    isOnSale = !!variant.salePrice;
    stockQty = variant.stockQuantity ? parseInt(variant.stockQuantity) : 0;
  } else if (product) {
    displayPrice = product.salePrice
      ? parseFloat(product.salePrice)
      : parseFloat(product.price);
    originalPrice = product.salePrice ? parseFloat(product.price) : null;
    isOnSale = !!product.salePrice;
    stockQty = product.stockQuantity ? parseInt(product.stockQuantity) : 0;
    displayName = product.name;
    displayBrand = product.brand || "";
    displayCategory = product.category || "";
    displayBadge = product.badge || "";
    displayDescription = product.description || "";
    allImages = [product.image, ...(product.images || [])].filter(Boolean) as string[];
  }

  const inStock = stockQty > 0;
  const isLowStock = stockQty > 0 && stockQty <= 2;

  const handleNicLevelChange = (level: string) => {
    setLocalNicLevel(level);
    onNicLevelChange?.(level);
  };

  const handleAddToCart = async () => {
    if (!inStock || isAddingToCart) return;

    const productId = isVariantMode && selectedVariant
      ? selectedVariant.productId
      : product?.id;

    if (!productId) return;

    setIsAddingToCart(true);
    try {
      if (onAddToCart) {
        await onAddToCart(productId, quantity);
      }
      setAddedToCart(true);
      setTimeout(() => {
        setAddedToCart(false);
        setQuantity(1);
        onClose();
      }, 1500);
    } catch (error) {
      console.error("Error adding to cart:", error);
    } finally {
      setIsAddingToCart(false);
    }
  };

  const incrementQuantity = () => setQuantity((prev) => prev + 1);
  const decrementQuantity = () => setQuantity((prev) => Math.max(1, prev - 1));

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      onClose();
      setTimeout(() => {
        setQuantity(1);
        setSelectedImageIndex(0);
        setAddedToCart(false);
      }, 200);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0 text-foreground">
        <VisuallyHidden>
          <DialogTitle>Quick View: {displayName}</DialogTitle>
        </VisuallyHidden>

        <div className="grid md:grid-cols-2 gap-4 sm:gap-6 p-4 sm:p-6">
          <div className="space-y-4">
            <div
              className="aspect-square bg-muted rounded-lg overflow-hidden relative"
              style={{
                boxShadow:
                  "0 0 0 2px rgba(255, 113, 0, 0.2), 0 0 12px rgba(255, 113, 0, 0.15)",
              }}
            >
              {allImages.length > 0 ? (
                <img
                  src={allImages[selectedImageIndex]}
                  alt={displayName}
                  className="w-full h-full object-contain p-2"
                  data-testid={`img-product-main-${isVariantMode ? variantGroup?.key : product?.id}`}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                  No image available
                </div>
              )}

              {displayBadge && (
                <div
                  className={`absolute top-4 right-4 px-3 py-1.5 rounded text-sm font-bold uppercase ${
                    displayBadge === "sale"
                      ? "bg-red-500 text-white"
                      : displayBadge === "new"
                      ? "bg-green-500 text-white"
                      : displayBadge === "popular"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {displayBadge}
                </div>
              )}

              {!inStock && (
                <div className="absolute inset-0 bg-background/90 flex items-center justify-center">
                  <span className="text-2xl font-bold text-muted-foreground">
                    Out of Stock
                  </span>
                </div>
              )}
            </div>

            {allImages.length > 1 && (
              <div className="flex gap-2 overflow-x-auto">
                {allImages.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImageIndex(index)}
                    className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${
                      selectedImageIndex === index
                        ? "border-primary shadow-lg"
                        : "border-transparent hover:border-muted-foreground/50"
                    }`}
                    data-testid={`button-thumbnail-${index}`}
                  >
                    <img
                      src={image}
                      alt={`${displayName} - View ${index + 1}`}
                      className="w-full h-full object-contain p-1"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex flex-col">
            <div className="flex-1">
              {isVariantMode ? (
                <div className="mb-3">
                  {displayBrand && (
                    <p className="text-base sm:text-lg font-bold text-foreground leading-tight">
                      {displayBrand}
                    </p>
                  )}
                  <h2
                    className="text-xl sm:text-3xl font-bold text-foreground leading-tight"
                    data-testid={`text-product-name-${variantGroup?.key}`}
                  >
                    {displayName}
                  </h2>
                  {variantGroup?.mlSize && (
                    <p className="text-xs text-muted-foreground mt-0.5">{variantGroup.mlSize}</p>
                  )}
                </div>
              ) : (
                <>
                  <h2
                    className="text-xl sm:text-3xl font-bold mb-3 text-foreground"
                    data-testid={`text-product-name-${product?.id}`}
                  >
                    {displayName}
                  </h2>
                  {displayBrand && (
                    <p className="text-muted-foreground mb-3 text-sm sm:text-base">
                      Brand:{" "}
                      <span className="font-medium text-foreground">{displayBrand}</span>
                    </p>
                  )}
                </>
              )}

              {displayCategory && (
                <p className="text-xs sm:text-sm text-muted-foreground mb-4">
                  Category: {displayCategory}
                </p>
              )}

              {isVariantMode && variantGroup && variantGroup.variants.length > 0 && (
                <div className="mb-4">
                  <p className="text-sm font-semibold mb-2 text-foreground">
                    Nicotine Strength
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {sortNicLevels(variantGroup.variants.map((v) => v.nicLevel)).map(
                      (level) => {
                        const variant = getVariantByNicLevel(variantGroup, level);
                        const variantStock = variant?.stockQuantity
                          ? parseInt(variant.stockQuantity)
                          : 0;
                        const variantOOS = variantStock <= 0;
                        return (
                          <Button
                            key={level}
                            size="sm"
                            variant={localNicLevel === level ? "default" : "outline"}
                            className={`text-xs px-3 py-1 h-7 transition-all ${
                              variantOOS ? "opacity-50" : ""
                            }`}
                            onClick={() => handleNicLevelChange(level)}
                            title={variantOOS ? "Out of stock" : level}
                          >
                            {level}
                          </Button>
                        );
                      }
                    )}
                  </div>
                </div>
              )}

              <div className="mb-4 sm:mb-6">
                <div className="flex items-baseline gap-2 sm:gap-3">
                  <span
                    className="text-2xl sm:text-4xl font-bold text-primary"
                    data-testid={`text-price-${isVariantMode ? variantGroup?.key : product?.id}`}
                  >
                    ${displayPrice.toFixed(2)}
                  </span>
                  {originalPrice && (
                    <span
                      className="text-base sm:text-xl text-muted-foreground line-through"
                      data-testid={`text-original-price-${isVariantMode ? variantGroup?.key : product?.id}`}
                    >
                      ${originalPrice.toFixed(2)}
                    </span>
                  )}
                </div>

                {isOnSale && originalPrice && (
                  <p className="text-red-500 font-semibold mt-2">
                    Save ${(originalPrice - displayPrice).toFixed(2)} (
                    {Math.round(
                      ((originalPrice - displayPrice) / originalPrice) * 100
                    )}
                    % off)
                  </p>
                )}
              </div>

              {displayDescription && (
                <div className="mb-4 sm:mb-6">
                  <h3 className="font-semibold mb-2 text-foreground text-sm sm:text-base">
                    Description
                  </h3>
                  <p className="text-muted-foreground text-sm sm:text-base">
                    {displayDescription}
                  </p>
                </div>
              )}

              {inStock && (
                <div className="mb-4 sm:mb-6">
                  <p
                    className={`text-sm font-medium ${
                      isLowStock
                        ? "text-amber-600 dark:text-amber-400"
                        : "text-green-600 dark:text-green-400"
                    }`}
                  >
                    {isLowStock ? "Low Stock" : "In Stock"}
                  </p>
                </div>
              )}
            </div>

            <div className="space-y-4 pt-4 border-t">
              {inStock && (
                <div className="flex items-center gap-4">
                  <label className="font-semibold text-foreground">Quantity:</label>
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
                    <span
                      className="w-12 text-center font-semibold text-lg text-foreground"
                      data-testid="text-quantity"
                    >
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
                      {inStock
                        ? `Add to Cart - $${(displayPrice * quantity).toFixed(2)}`
                        : "Out of Stock"}
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
