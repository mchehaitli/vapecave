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
  brand: string | null;
  brandId: number | null;
  image: string | null;
  images: string[] | null;
  description: string | null;
  category: string;
  badge: string | null;
  variants: ProductVariant[];
}

const NIC_SUFFIX_RE =
  /\s*[\([\-–]?\s*(?:(?:\d+(?:\.\d+)?)\s*mg(?:\/ml)?|nicotine\s*free|nic\s*free|salt\s*nic|salt|salts|e-?liquid|eliquid|e\s*liquid)\s*[\)[\]–]?$/i;

const MG_EXTRACT_RE = /(\d+(?:\.\d+)?)\s*mg/i;
const NIC_FREE_RE = /nicotine\s*free|nic\s*free|0\s*mg/i;

const VARIANT_CATEGORIES = new Set(["e-liquids", "salts", "e-liquid", "salt e-liquid"]);

export function isVariantCategory(category: string): boolean {
  return VARIANT_CATEGORIES.has(category.toLowerCase().trim());
}

export function getBaseFlavorName(name: string): string {
  return name.replace(NIC_SUFFIX_RE, "").trim();
}

export function extractNicLevel(name: string): string {
  if (NIC_FREE_RE.test(name)) return "0mg";
  const match = name.match(MG_EXTRACT_RE);
  if (match) return `${match[1]}mg`;
  return "";
}

export function sortNicLevels(levels: string[]): string[] {
  return [...levels].sort((a, b) => {
    const aNum = parseFloat(a.replace("mg", "")) || 0;
    const bNum = parseFloat(b.replace("mg", "")) || 0;
    return aNum - bNum;
  });
}

function toTitleCase(str: string): string {
  return str
    .toLowerCase()
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
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
    if (!product.category || !isVariantCategory(product.category)) {
      singles.push(product);
      continue;
    }

    const nicLevel = extractNicLevel(product.name);
    if (!nicLevel) {
      singles.push(product);
      continue;
    }

    const baseName = getBaseFlavorName(product.name);
    const brandKey = (product.brand || "unknown").toLowerCase().trim();
    const key = `${brandKey}||${baseName.toLowerCase().trim()}`;

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

  Array.from(groupMap.entries()).forEach(([key, entry]) => {
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

    groups.push({
      key,
      displayName: toTitleCase(baseName),
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

export function getVariantByNicLevel(group: VariantGroup, nicLevel: string): ProductVariant | undefined {
  return group.variants.find((v) => v.nicLevel === nicLevel);
}
