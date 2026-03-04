import type { DeliveryProduct } from "@shared/schema";

export interface ProductVariant {
  nicLevel: string;
  price: string;
  salePrice: string | null;
  stockQuantity: string | null;
  productId: number;
  cloverItemId: string | null;
}

export interface VariantGroup {
  key: string;
  displayName: string;
  brandLine: string | null;
  mlSize: string | null;
  brand: string | null;
  brandId: number | null;
  image: string | null;
  images: string[] | null;
  description: string | null;
  category: string;
  badge: string | null;
  variants: ProductVariant[];
}

const VARIANT_CATEGORIES = new Set(["e-liquids", "salts", "e-liquid", "salt e-liquid"]);

export function isVariantCategory(category: string): boolean {
  return VARIANT_CATEGORIES.has(category.toLowerCase().trim());
}

function toTitleCase(str: string): string {
  return str
    .toLowerCase()
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export function extractNicLevel(name: string): string {
  const match = name.match(/\b(\d+(?:\.\d+)?)\s*mg\b/i);
  if (match) return `${match[1]}mg`;
  return "";
}

export function getBaseFlavorName(name: string): string {
  return name
    .replace(/\s*\b\d+(?:\.\d+)?\s*mg(?:\/ml)?\b\s*/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function extractFlavorName(baseName: string): string {
  const match = baseName.match(
    /(?:E-?Liquids?|Nicotine\s+Salts?|Nic\s+Salts?|Salt\s+Nic|Salts?)\s+(.+)$/i
  );
  if (match) return toTitleCase(match[1].trim());
  return toTitleCase(baseName);
}

function extractBrandLine(baseName: string): string {
  const match = baseName.match(/^(.+?)\s+\d+ml\b/i);
  return match ? toTitleCase(match[1].trim()) : "";
}

function extractMlSize(baseName: string): string {
  const match = baseName.match(/\b(\d+ml)\b/i);
  return match ? match[1].toLowerCase() : "";
}

export function sortNicLevels(levels: string[]): string[] {
  return [...levels].sort((a, b) => {
    const aNum = parseFloat(a.replace("mg", "")) || 0;
    const bNum = parseFloat(b.replace("mg", "")) || 0;
    return aNum - bNum;
  });
}

export function isVariantGroup(item: VariantGroup | DeliveryProduct): item is VariantGroup {
  return "variants" in item && "displayName" in item;
}

export function groupProductsIntoVariants(products: DeliveryProduct[]): {
  groups: VariantGroup[];
  singles: DeliveryProduct[];
} {
  const groupMap = new Map<string, { products: DeliveryProduct[]; nicLevels: string[] }>();
  const singles: DeliveryProduct[] = [];

  for (const product of products) {
    const nicLevel = extractNicLevel(product.name);
    if (!nicLevel) {
      singles.push(product);
      continue;
    }

    const baseName = getBaseFlavorName(product.name);
    const key = baseName.toLowerCase().trim();

    if (!groupMap.has(key)) {
      groupMap.set(key, { products: [], nicLevels: [] });
    }
    const entry = groupMap.get(key)!;
    entry.products.push(product);
    if (!entry.nicLevels.includes(nicLevel)) {
      entry.nicLevels.push(nicLevel);
    }
  }

  const groups: VariantGroup[] = [];

  Array.from(groupMap.entries()).forEach(([, entry]) => {
    if (entry.products.length <= 1) {
      singles.push(...entry.products);
      return;
    }

    const sorted = sortNicLevels(entry.nicLevels);
    const first = entry.products[0];
    const baseName = getBaseFlavorName(first.name);

    const variants: ProductVariant[] = sorted.map((nicLevel) => {
      const match = entry.products.find(
        (p: DeliveryProduct) => extractNicLevel(p.name) === nicLevel
      );
      if (!match) return null;
      return {
        nicLevel,
        price: match.price,
        salePrice: match.salePrice ?? null,
        stockQuantity: match.stockQuantity ?? null,
        productId: match.id,
        cloverItemId: match.cloverItemId ?? null,
      };
    }).filter(Boolean) as ProductVariant[];

    const flavorName = extractFlavorName(baseName);
    const brandLine = extractBrandLine(baseName) || null;
    const mlSize = extractMlSize(baseName) || null;

    groups.push({
      key: baseName.toLowerCase().trim(),
      displayName: flavorName,
      brandLine,
      mlSize,
      brand: first.brand ?? null,
      brandId: first.brandId ?? null,
      image: first.image ?? null,
      images: first.images ?? null,
      description: first.description ?? null,
      category: first.category,
      badge: first.badge ?? null,
      variants,
    });
  });

  return { groups, singles };
}

export function getDefaultVariant(group: VariantGroup): ProductVariant {
  const inStock = group.variants.find(
    (v) => v.stockQuantity && parseInt(v.stockQuantity) > 0
  );
  return inStock || group.variants[0];
}

export function getVariantByNicLevel(
  group: VariantGroup,
  nicLevel: string
): ProductVariant | undefined {
  return group.variants.find((v) => v.nicLevel === nicLevel);
}
