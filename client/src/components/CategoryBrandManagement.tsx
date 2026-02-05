import { useState, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Upload, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  Plus,
  Edit2,
  Trash2,
  GripVertical,
  Folder,
  Tag,
  ChevronDown,
  ChevronRight,
  Layers,
  Star,
  Check,
} from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";

interface DeliveryCategory {
  id: number;
  name: string;
  slug: string;
  image: string | null;
  displayOrder: number;
  isActive: boolean;
  featuredProductIds?: number[];
}

interface DeliveryBrand {
  id: number;
  name: string;
  slug: string;
  categoryId: number;
  logo: string | null;
  displayOrder: number;
  isActive: boolean;
  featuredProductIds?: number[];
}

interface DeliveryProductLine {
  id: number;
  name: string;
  slug: string;
  brandId: number;
  logo: string | null;
  displayOrder: number;
  isActive: boolean;
  featuredProductIds?: number[];
}

interface DeliveryProduct {
  id: number;
  name: string;
  image: string | null;
  price: string;
  brandId: number | null;
  productLineId: number | null;
  enabled: boolean;
}

function SortableProductLine({
  productLine,
  onEdit,
  onDelete,
  onFeatured,
}: {
  productLine: DeliveryProductLine;
  onEdit: () => void;
  onDelete: () => void;
  onFeatured: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: `pl-${productLine.id}` });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const hasFeatured = (productLine.featuredProductIds?.length || 0) > 0;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-2 p-2 bg-gray-600/50 rounded-lg border border-gray-500 hover:border-orange-500/30"
    >
      <button {...attributes} {...listeners} className="cursor-grab hover:text-orange-400">
        <GripVertical size={14} />
      </button>
      <Layers size={14} className="text-purple-400" />
      <span className="flex-1 text-sm">{productLine.name}</span>
      <span className={`text-xs px-2 py-0.5 rounded ${productLine.isActive ? 'bg-green-900/50 text-green-400' : 'bg-gray-700 text-gray-400'}`}>
        {productLine.isActive ? 'Active' : 'Inactive'}
      </span>
      <Button variant="ghost" size="sm" onClick={onFeatured} className={`h-6 px-2 ${hasFeatured ? 'text-yellow-400' : 'text-gray-400 hover:text-yellow-400'}`} title="Manage Featured Products">
        <Star size={10} fill={hasFeatured ? 'currentColor' : 'none'} />
      </Button>
      <Button variant="ghost" size="sm" onClick={onEdit} className="h-6 px-2">
        <Edit2 size={10} />
      </Button>
      <Button variant="ghost" size="sm" onClick={onDelete} className="h-6 px-2 text-red-400 hover:text-red-300">
        <Trash2 size={10} />
      </Button>
    </div>
  );
}

function SortableBrand({
  brand,
  isExpanded,
  onToggle,
  onEdit,
  onDelete,
  onFeatured,
  productLines,
  onEditProductLine,
  onDeleteProductLine,
  onAddProductLine,
  onReorderProductLines,
  onFeaturedProductLine,
}: {
  brand: DeliveryBrand;
  isExpanded: boolean;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onFeatured: () => void;
  productLines: DeliveryProductLine[];
  onEditProductLine: (productLine: DeliveryProductLine) => void;
  onDeleteProductLine: (productLineId: number) => void;
  onAddProductLine: () => void;
  onReorderProductLines: (orderedIds: number[]) => void;
  onFeaturedProductLine: (productLine: DeliveryProductLine) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: brand.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleProductLineDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const activeId = parseInt((active.id as string).replace('pl-', ''));
      const overId = parseInt((over.id as string).replace('pl-', ''));
      const oldIndex = productLines.findIndex((pl) => pl.id === activeId);
      const newIndex = productLines.findIndex((pl) => pl.id === overId);
      const newOrder = arrayMove(productLines, oldIndex, newIndex);
      onReorderProductLines(newOrder.map((pl) => pl.id));
    }
  };

  const hasFeatured = (brand.featuredProductIds?.length || 0) > 0;

  return (
    <div ref={setNodeRef} style={style} className="mb-2">
      <div className="flex items-center gap-2 p-2 bg-gray-700/50 rounded-lg border border-gray-600 hover:border-orange-500/30">
        <button {...attributes} {...listeners} className="cursor-grab hover:text-orange-400">
          <GripVertical size={16} />
        </button>
        {productLines.length > 0 && (
          <button onClick={onToggle} className="hover:text-orange-400">
            {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          </button>
        )}
        <Tag size={16} className="text-blue-400" />
        <span className="flex-1">{brand.name}</span>
        <span className={`text-xs px-2 py-0.5 rounded ${brand.isActive ? 'bg-green-900/50 text-green-400' : 'bg-gray-700 text-gray-400'}`}>
          {brand.isActive ? 'Active' : 'Inactive'}
        </span>
        {productLines.length > 0 && (
          <span className="text-xs text-gray-500">{productLines.length} lines</span>
        )}
        <Button variant="ghost" size="sm" onClick={onFeatured} className={`h-7 px-2 ${hasFeatured ? 'text-yellow-400' : 'text-gray-400 hover:text-yellow-400'}`} title="Manage Featured Products">
          <Star size={12} fill={hasFeatured ? 'currentColor' : 'none'} />
        </Button>
        <Button variant="ghost" size="sm" onClick={onAddProductLine} className="h-7 px-2" title="Add Product Line">
          <Plus size={12} className="text-purple-400" />
        </Button>
        <Button variant="ghost" size="sm" onClick={onEdit} className="h-7 px-2">
          <Edit2 size={12} />
        </Button>
        <Button variant="ghost" size="sm" onClick={onDelete} className="h-7 px-2 text-red-400 hover:text-red-300">
          <Trash2 size={12} />
        </Button>
      </div>

      {isExpanded && productLines.length > 0 && (
        <div className="ml-8 mt-2 space-y-1">
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleProductLineDragEnd}>
            <SortableContext items={productLines.map(pl => `pl-${pl.id}`)} strategy={verticalListSortingStrategy}>
              {productLines.map((productLine) => (
                <SortableProductLine
                  key={productLine.id}
                  productLine={productLine}
                  onEdit={() => onEditProductLine(productLine)}
                  onDelete={() => onDeleteProductLine(productLine.id)}
                  onFeatured={() => onFeaturedProductLine(productLine)}
                />
              ))}
            </SortableContext>
          </DndContext>
        </div>
      )}
    </div>
  );
}

function SortableCategory({
  category,
  isExpanded,
  onToggle,
  onEdit,
  onDelete,
  onFeatured,
  brands,
  productLines,
  expandedBrands,
  onToggleBrand,
  onEditBrand,
  onDeleteBrand,
  onAddBrand,
  onReorderBrands,
  onEditProductLine,
  onDeleteProductLine,
  onAddProductLine,
  onReorderProductLines,
  onFeaturedBrand,
  onFeaturedProductLine,
}: {
  category: DeliveryCategory;
  isExpanded: boolean;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onFeatured: () => void;
  brands: DeliveryBrand[];
  productLines: DeliveryProductLine[];
  expandedBrands: Set<number>;
  onToggleBrand: (brandId: number) => void;
  onEditBrand: (brand: DeliveryBrand) => void;
  onDeleteBrand: (brandId: number) => void;
  onAddBrand: () => void;
  onReorderBrands: (orderedIds: number[]) => void;
  onEditProductLine: (productLine: DeliveryProductLine) => void;
  onDeleteProductLine: (productLineId: number) => void;
  onAddProductLine: (brandId: number) => void;
  onReorderProductLines: (brandId: number, orderedIds: number[]) => void;
  onFeaturedBrand: (brand: DeliveryBrand) => void;
  onFeaturedProductLine: (productLine: DeliveryProductLine) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: category.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleBrandDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = brands.findIndex((b) => b.id === active.id);
      const newIndex = brands.findIndex((b) => b.id === over.id);
      const newOrder = arrayMove(brands, oldIndex, newIndex);
      onReorderBrands(newOrder.map((b) => b.id));
    }
  };

  const getProductLinesForBrand = (brandId: number) => {
    return productLines.filter(pl => pl.brandId === brandId).sort((a, b) => a.displayOrder - b.displayOrder);
  };

  const hasFeatured = (category.featuredProductIds?.length || 0) > 0;

  return (
    <div ref={setNodeRef} style={style} className="mb-2">
      <div className="flex items-center gap-2 p-3 bg-gray-800 rounded-lg border border-gray-700 hover:border-orange-500/50 transition-colors">
        <button {...attributes} {...listeners} className="cursor-grab hover:text-orange-400">
          <GripVertical size={18} />
        </button>
        <button onClick={onToggle} className="hover:text-orange-400">
          {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
        </button>
        <Folder size={18} className="text-orange-400" />
        <span className="flex-1 font-medium">{category.name}</span>
        <span className={`text-xs px-2 py-1 rounded ${category.isActive ? 'bg-green-900/50 text-green-400' : 'bg-gray-700 text-gray-400'}`}>
          {category.isActive ? 'Active' : 'Inactive'}
        </span>
        <span className="text-xs text-gray-500">{brands.length} brands</span>
        <Button variant="ghost" size="sm" onClick={onFeatured} className={`h-8 px-2 ${hasFeatured ? 'text-yellow-400' : 'text-gray-400 hover:text-yellow-400'}`} title="Manage Featured Products">
          <Star size={14} fill={hasFeatured ? 'currentColor' : 'none'} />
        </Button>
        <Button variant="ghost" size="sm" onClick={onEdit} className="h-8 px-2">
          <Edit2 size={14} />
        </Button>
        <Button variant="ghost" size="sm" onClick={onDelete} className="h-8 px-2 text-red-400 hover:text-red-300">
          <Trash2 size={14} />
        </Button>
      </div>
      
      {isExpanded && (
        <div className="ml-8 mt-2 space-y-2">
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleBrandDragEnd}>
            <SortableContext items={brands.map(b => b.id)} strategy={verticalListSortingStrategy}>
              {brands.map((brand) => (
                <SortableBrand
                  key={brand.id}
                  brand={brand}
                  isExpanded={expandedBrands.has(brand.id)}
                  onToggle={() => onToggleBrand(brand.id)}
                  onEdit={() => onEditBrand(brand)}
                  onDelete={() => onDeleteBrand(brand.id)}
                  onFeatured={() => onFeaturedBrand(brand)}
                  productLines={getProductLinesForBrand(brand.id)}
                  onEditProductLine={onEditProductLine}
                  onDeleteProductLine={onDeleteProductLine}
                  onAddProductLine={() => onAddProductLine(brand.id)}
                  onReorderProductLines={(orderedIds) => onReorderProductLines(brand.id, orderedIds)}
                  onFeaturedProductLine={onFeaturedProductLine}
                />
              ))}
            </SortableContext>
          </DndContext>
          <Button
            variant="outline"
            size="sm"
            onClick={onAddBrand}
            className="w-full border-dashed border-gray-600 hover:border-orange-500"
          >
            <Plus size={14} className="mr-2" /> Add Brand to {category.name}
          </Button>
        </div>
      )}
    </div>
  );
}

export function CategoryBrandManagement() {
  const { toast } = useToast();
  const [expandedCategories, setExpandedCategories] = useState<Set<number>>(new Set());
  const [expandedBrands, setExpandedBrands] = useState<Set<number>>(new Set());
  
  const [categoryDialog, setCategoryDialog] = useState(false);
  const [editingCategory, setEditingCategory] = useState<DeliveryCategory | null>(null);
  const [categoryName, setCategoryName] = useState("");
  const [categoryImage, setCategoryImage] = useState("");
  const [categoryActive, setCategoryActive] = useState(true);
  
  const [brandDialog, setBrandDialog] = useState(false);
  const [editingBrand, setEditingBrand] = useState<DeliveryBrand | null>(null);
  const [brandCategoryId, setBrandCategoryId] = useState<number | null>(null);
  const [brandName, setBrandName] = useState("");
  const [brandLogo, setBrandLogo] = useState("");
  const [brandActive, setBrandActive] = useState(true);
  const [brandLogoUploading, setBrandLogoUploading] = useState(false);
  const brandLogoInputRef = useRef<HTMLInputElement>(null);

  const handleBrandLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setBrandLogoUploading(true);
    try {
      const response = await fetch('/api/admin/delivery/products/upload-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: file.name,
          size: file.size,
          contentType: file.type
        })
      });

      if (!response.ok) throw new Error('Failed to get upload URL');

      const { uploadURL, objectPath } = await response.json();

      const uploadResponse = await fetch(uploadURL, {
        method: 'PUT',
        headers: { 'Content-Type': file.type || 'application/octet-stream' },
        body: file
      });

      if (!uploadResponse.ok) throw new Error('Failed to upload image');

      setBrandLogo(objectPath);
      toast({ title: "Logo uploaded successfully" });
    } catch (error) {
      console.error('Upload error:', error);
      toast({ title: "Failed to upload logo", variant: "destructive" });
    } finally {
      setBrandLogoUploading(false);
      if (brandLogoInputRef.current) {
        brandLogoInputRef.current.value = '';
      }
    }
  };

  const [productLineDialog, setProductLineDialog] = useState(false);
  const [editingProductLine, setEditingProductLine] = useState<DeliveryProductLine | null>(null);
  const [productLineBrandId, setProductLineBrandId] = useState<number | null>(null);
  const [productLineName, setProductLineName] = useState("");
  const [productLineLogo, setProductLineLogo] = useState("");
  const [productLineActive, setProductLineActive] = useState(true);
  
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ type: 'category' | 'brand' | 'productLine'; id: number; name: string } | null>(null);

  const [featuredDialog, setFeaturedDialog] = useState(false);
  const [featuredTarget, setFeaturedTarget] = useState<{ type: 'category' | 'brand' | 'productLine'; id: number; name: string } | null>(null);
  const [selectedFeaturedIds, setSelectedFeaturedIds] = useState<number[]>([]);

  const { data: categories = [], isLoading: loadingCategories } = useQuery<DeliveryCategory[]>({
    queryKey: ['/api/admin/delivery/categories'],
  });

  const { data: brands = [], isLoading: loadingBrands } = useQuery<DeliveryBrand[]>({
    queryKey: ['/api/admin/delivery/brands'],
  });

  const { data: productsResponse } = useQuery<{ products: DeliveryProduct[]; totalCount: number }>({
    queryKey: ['/api/admin/delivery/products'],
  });
  const products = productsResponse?.products || [];

  const { data: productLines = [], isLoading: loadingProductLines } = useQuery<DeliveryProductLine[]>({
    queryKey: ['/api/admin/delivery/product-lines'],
  });

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const createCategoryMutation = useMutation({
    mutationFn: async (data: { name: string; image: string | null; isActive: boolean }) => {
      return apiRequest('POST', '/api/admin/delivery/categories', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/delivery/categories'] });
      toast({ title: "Category created successfully" });
      resetCategoryForm();
    },
    onError: (error: Error) => {
      toast({ title: "Error creating category", description: error.message, variant: "destructive" });
    }
  });

  const updateCategoryMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<DeliveryCategory> }) => {
      return apiRequest('PATCH', `/api/admin/delivery/categories/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/delivery/categories'] });
      toast({ title: "Category updated successfully" });
      resetCategoryForm();
    },
    onError: (error: Error) => {
      toast({ title: "Error updating category", description: error.message, variant: "destructive" });
    }
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest('DELETE', `/api/admin/delivery/categories/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/delivery/categories'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/delivery/brands'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/delivery/product-lines'] });
      toast({ title: "Category deleted successfully" });
      setDeleteDialog(false);
      setDeleteTarget(null);
    },
    onError: (error: Error) => {
      toast({ title: "Error deleting category", description: error.message, variant: "destructive" });
    }
  });

  const reorderCategoriesMutation = useMutation({
    mutationFn: async (orderedIds: number[]) => {
      return apiRequest('POST', '/api/admin/delivery/categories/reorder', { orderedIds });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/delivery/categories'] });
    },
    onError: (error: Error) => {
      toast({ title: "Error reordering categories", description: error.message, variant: "destructive" });
    }
  });

  const createBrandMutation = useMutation({
    mutationFn: async (data: { name: string; categoryId: number; logo: string | null; isActive: boolean }) => {
      return apiRequest('POST', '/api/admin/delivery/brands', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/delivery/brands'] });
      toast({ title: "Brand created successfully" });
      resetBrandForm();
    },
    onError: (error: Error) => {
      toast({ title: "Error creating brand", description: error.message, variant: "destructive" });
    }
  });

  const updateBrandMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<DeliveryBrand> }) => {
      return apiRequest('PATCH', `/api/admin/delivery/brands/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/delivery/brands'] });
      toast({ title: "Brand updated successfully" });
      resetBrandForm();
    },
    onError: (error: Error) => {
      toast({ title: "Error updating brand", description: error.message, variant: "destructive" });
    }
  });

  const deleteBrandMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest('DELETE', `/api/admin/delivery/brands/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/delivery/brands'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/delivery/product-lines'] });
      toast({ title: "Brand deleted successfully" });
      setDeleteDialog(false);
      setDeleteTarget(null);
    },
    onError: (error: Error) => {
      toast({ title: "Error deleting brand", description: error.message, variant: "destructive" });
    }
  });

  const reorderBrandsMutation = useMutation({
    mutationFn: async ({ categoryId, orderedIds }: { categoryId: number; orderedIds: number[] }) => {
      return apiRequest('POST', '/api/admin/delivery/brands/reorder', { categoryId, orderedIds });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/delivery/brands'] });
    },
    onError: (error: Error) => {
      toast({ title: "Error reordering brands", description: error.message, variant: "destructive" });
    }
  });

  const createProductLineMutation = useMutation({
    mutationFn: async (data: { name: string; brandId: number; logo: string | null; isActive: boolean }) => {
      return apiRequest('POST', '/api/admin/delivery/product-lines', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/delivery/product-lines'] });
      toast({ title: "Product line created successfully" });
      resetProductLineForm();
    },
    onError: (error: Error) => {
      toast({ title: "Error creating product line", description: error.message, variant: "destructive" });
    }
  });

  const updateProductLineMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<DeliveryProductLine> }) => {
      return apiRequest('PATCH', `/api/admin/delivery/product-lines/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/delivery/product-lines'] });
      toast({ title: "Product line updated successfully" });
      resetProductLineForm();
    },
    onError: (error: Error) => {
      toast({ title: "Error updating product line", description: error.message, variant: "destructive" });
    }
  });

  const deleteProductLineMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest('DELETE', `/api/admin/delivery/product-lines/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/delivery/product-lines'] });
      toast({ title: "Product line deleted successfully" });
      setDeleteDialog(false);
      setDeleteTarget(null);
    },
    onError: (error: Error) => {
      toast({ title: "Error deleting product line", description: error.message, variant: "destructive" });
    }
  });

  const reorderProductLinesMutation = useMutation({
    mutationFn: async ({ brandId, orderedIds }: { brandId: number; orderedIds: number[] }) => {
      return apiRequest('POST', '/api/admin/delivery/product-lines/reorder', { brandId, orderedIds });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/delivery/product-lines'] });
    },
    onError: (error: Error) => {
      toast({ title: "Error reordering product lines", description: error.message, variant: "destructive" });
    }
  });

  const updateFeaturedProductsMutation = useMutation({
    mutationFn: async ({ type, id, featuredProductIds }: { type: 'category' | 'brand' | 'productLine'; id: number; featuredProductIds: number[] }) => {
      const endpoint = type === 'category' 
        ? `/api/admin/delivery/categories/${id}`
        : type === 'brand'
        ? `/api/admin/delivery/brands/${id}`
        : `/api/admin/delivery/product-lines/${id}`;
      return apiRequest('PATCH', endpoint, { featuredProductIds });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/delivery/categories'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/delivery/brands'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/delivery/product-lines'] });
      toast({ title: "Featured products updated successfully" });
      setFeaturedDialog(false);
      setFeaturedTarget(null);
      setSelectedFeaturedIds([]);
    },
    onError: (error: Error) => {
      toast({ title: "Error updating featured products", description: error.message, variant: "destructive" });
    }
  });

  const openFeaturedDialog = (type: 'category' | 'brand' | 'productLine', id: number, name: string, currentFeaturedIds: number[] = []) => {
    setFeaturedTarget({ type, id, name });
    setSelectedFeaturedIds(currentFeaturedIds);
    setFeaturedDialog(true);
  };

  const getProductsForFeaturedSelection = () => {
    if (!featuredTarget) return [];
    
    if (featuredTarget.type === 'category') {
      const categoryBrandIds = brands.filter(b => b.categoryId === featuredTarget.id).map(b => b.id);
      return products.filter(p => p.enabled && p.brandId && categoryBrandIds.includes(p.brandId));
    } else if (featuredTarget.type === 'brand') {
      return products.filter(p => p.enabled && p.brandId === featuredTarget.id);
    } else {
      return products.filter(p => p.enabled && p.productLineId === featuredTarget.id);
    }
  };

  const toggleFeaturedProduct = (productId: number) => {
    setSelectedFeaturedIds(prev => 
      prev.includes(productId) 
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  const resetCategoryForm = () => {
    setCategoryDialog(false);
    setEditingCategory(null);
    setCategoryName("");
    setCategoryImage("");
    setCategoryActive(true);
  };

  const resetBrandForm = () => {
    setBrandDialog(false);
    setEditingBrand(null);
    setBrandCategoryId(null);
    setBrandName("");
    setBrandLogo("");
    setBrandActive(true);
  };

  const resetProductLineForm = () => {
    setProductLineDialog(false);
    setEditingProductLine(null);
    setProductLineBrandId(null);
    setProductLineName("");
    setProductLineLogo("");
    setProductLineActive(true);
  };

  const openEditCategory = (category: DeliveryCategory) => {
    setEditingCategory(category);
    setCategoryName(category.name);
    setCategoryImage(category.image || "");
    setCategoryActive(category.isActive);
    setCategoryDialog(true);
  };

  const openAddBrand = (categoryId: number) => {
    setBrandCategoryId(categoryId);
    setBrandDialog(true);
  };

  const openEditBrand = (brand: DeliveryBrand) => {
    setEditingBrand(brand);
    setBrandCategoryId(brand.categoryId);
    setBrandName(brand.name);
    setBrandLogo(brand.logo || "");
    setBrandActive(brand.isActive);
    setBrandDialog(true);
  };

  const openAddProductLine = (brandId: number) => {
    setProductLineBrandId(brandId);
    setProductLineDialog(true);
  };

  const openEditProductLine = (productLine: DeliveryProductLine) => {
    setEditingProductLine(productLine);
    setProductLineBrandId(productLine.brandId);
    setProductLineName(productLine.name);
    setProductLineLogo(productLine.logo || "");
    setProductLineActive(productLine.isActive);
    setProductLineDialog(true);
  };

  const handleCategoryDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = categories.findIndex((c) => c.id === active.id);
      const newIndex = categories.findIndex((c) => c.id === over.id);
      const newOrder = arrayMove(categories, oldIndex, newIndex);
      reorderCategoriesMutation.mutate(newOrder.map((c) => c.id));
    }
  };

  const handleSaveCategory = () => {
    if (!categoryName.trim()) {
      toast({ title: "Category name is required", variant: "destructive" });
      return;
    }

    if (editingCategory) {
      updateCategoryMutation.mutate({
        id: editingCategory.id,
        data: { name: categoryName, image: categoryImage || null, isActive: categoryActive }
      });
    } else {
      createCategoryMutation.mutate({
        name: categoryName,
        image: categoryImage || null,
        isActive: categoryActive
      });
    }
  };

  const handleSaveBrand = () => {
    if (!brandName.trim()) {
      toast({ title: "Brand name is required", variant: "destructive" });
      return;
    }
    if (!brandCategoryId) {
      toast({ title: "Please select a category", variant: "destructive" });
      return;
    }

    if (editingBrand) {
      updateBrandMutation.mutate({
        id: editingBrand.id,
        data: { name: brandName, categoryId: brandCategoryId, logo: brandLogo || null, isActive: brandActive }
      });
    } else {
      createBrandMutation.mutate({
        name: brandName,
        categoryId: brandCategoryId,
        logo: brandLogo || null,
        isActive: brandActive
      });
    }
  };

  const handleSaveProductLine = () => {
    if (!productLineName.trim()) {
      toast({ title: "Product line name is required", variant: "destructive" });
      return;
    }
    if (!productLineBrandId) {
      toast({ title: "Please select a brand", variant: "destructive" });
      return;
    }

    if (editingProductLine) {
      updateProductLineMutation.mutate({
        id: editingProductLine.id,
        data: { name: productLineName, brandId: productLineBrandId, logo: productLineLogo || null, isActive: productLineActive }
      });
    } else {
      createProductLineMutation.mutate({
        name: productLineName,
        brandId: productLineBrandId,
        logo: productLineLogo || null,
        isActive: productLineActive
      });
    }
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    if (deleteTarget.type === 'category') {
      deleteCategoryMutation.mutate(deleteTarget.id);
    } else if (deleteTarget.type === 'brand') {
      deleteBrandMutation.mutate(deleteTarget.id);
    } else {
      deleteProductLineMutation.mutate(deleteTarget.id);
    }
  };

  const toggleExpanded = (categoryId: number) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedCategories(newExpanded);
  };

  const toggleBrandExpanded = (brandId: number) => {
    const newExpanded = new Set(expandedBrands);
    if (newExpanded.has(brandId)) {
      newExpanded.delete(brandId);
    } else {
      newExpanded.add(brandId);
    }
    setExpandedBrands(newExpanded);
  };

  const getBrandsForCategory = (categoryId: number) => {
    return brands.filter(b => b.categoryId === categoryId).sort((a, b) => a.displayOrder - b.displayOrder);
  };

  if (loadingCategories || loadingBrands || loadingProductLines) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin h-8 w-8 border-2 border-orange-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-white">Categories, Brands & Product Lines</h2>
          <p className="text-gray-400 text-sm">Organize products by category, brand, and product line. Drag to reorder.</p>
        </div>
        <Button onClick={() => setCategoryDialog(true)} className="bg-orange-600 hover:bg-orange-700">
          <Plus size={16} className="mr-2" /> Add Category
        </Button>
      </div>

      {categories.length === 0 ? (
        <div className="text-center py-12 bg-gray-800/50 rounded-lg border border-gray-700">
          <Folder size={48} className="mx-auto text-gray-500 mb-4" />
          <h3 className="text-lg font-medium text-gray-300 mb-2">No categories yet</h3>
          <p className="text-gray-500 mb-4">Create categories to organize your products</p>
          <Button onClick={() => setCategoryDialog(true)} className="bg-orange-600 hover:bg-orange-700">
            <Plus size={16} className="mr-2" /> Create First Category
          </Button>
        </div>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleCategoryDragEnd}>
          <SortableContext items={categories.map(c => c.id)} strategy={verticalListSortingStrategy}>
            {categories.map((category) => (
              <SortableCategory
                key={category.id}
                category={category}
                isExpanded={expandedCategories.has(category.id)}
                onToggle={() => toggleExpanded(category.id)}
                onEdit={() => openEditCategory(category)}
                onDelete={() => {
                  setDeleteTarget({ type: 'category', id: category.id, name: category.name });
                  setDeleteDialog(true);
                }}
                onFeatured={() => openFeaturedDialog('category', category.id, category.name, category.featuredProductIds || [])}
                brands={getBrandsForCategory(category.id)}
                productLines={productLines}
                expandedBrands={expandedBrands}
                onToggleBrand={toggleBrandExpanded}
                onEditBrand={openEditBrand}
                onDeleteBrand={(brandId) => {
                  const brand = brands.find(b => b.id === brandId);
                  if (brand) {
                    setDeleteTarget({ type: 'brand', id: brand.id, name: brand.name });
                    setDeleteDialog(true);
                  }
                }}
                onAddBrand={() => openAddBrand(category.id)}
                onReorderBrands={(orderedIds) => reorderBrandsMutation.mutate({ categoryId: category.id, orderedIds })}
                onEditProductLine={openEditProductLine}
                onDeleteProductLine={(productLineId) => {
                  const productLine = productLines.find(pl => pl.id === productLineId);
                  if (productLine) {
                    setDeleteTarget({ type: 'productLine', id: productLine.id, name: productLine.name });
                    setDeleteDialog(true);
                  }
                }}
                onAddProductLine={openAddProductLine}
                onReorderProductLines={(brandId, orderedIds) => reorderProductLinesMutation.mutate({ brandId, orderedIds })}
                onFeaturedBrand={(brand) => openFeaturedDialog('brand', brand.id, brand.name, brand.featuredProductIds || [])}
                onFeaturedProductLine={(productLine) => openFeaturedDialog('productLine', productLine.id, productLine.name, productLine.featuredProductIds || [])}
              />
            ))}
          </SortableContext>
        </DndContext>
      )}

      {/* Category Dialog */}
      <Dialog open={categoryDialog} onOpenChange={(open) => { if (!open) resetCategoryForm(); else setCategoryDialog(true); }}>
        <DialogContent className="bg-gray-800 text-white border-gray-700">
          <DialogHeader>
            <DialogTitle>{editingCategory ? 'Edit Category' : 'Create Category'}</DialogTitle>
            <DialogDescription className="text-gray-400">
              {editingCategory ? 'Update category details' : 'Add a new product category'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <Label>Category Name</Label>
              <Input
                value={categoryName}
                onChange={(e) => setCategoryName(e.target.value)}
                placeholder="e.g., Disposables, E-Liquids, Accessories"
                className="mt-2 bg-gray-700 border-gray-600"
              />
            </div>
            <div>
              <Label>Category Image URL (Optional)</Label>
              <div className="flex gap-2 mt-2">
                <Input
                  value={categoryImage}
                  onChange={(e) => setCategoryImage(e.target.value)}
                  placeholder="https://example.com/image.jpg"
                  className="flex-1 bg-gray-700 border-gray-600"
                />
                {categoryImage && (
                  <div className="w-12 h-12 rounded overflow-hidden border border-gray-600">
                    <img src={categoryImage} alt="" className="w-full h-full object-cover" />
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={categoryActive} onCheckedChange={setCategoryActive} />
              <Label>Active</Label>
            </div>
          </div>
          <DialogFooter className="mt-6">
            <Button variant="outline" onClick={resetCategoryForm} className="border-gray-600">
              Cancel
            </Button>
            <Button
              onClick={handleSaveCategory}
              disabled={createCategoryMutation.isPending || updateCategoryMutation.isPending}
              className="bg-orange-600 hover:bg-orange-700"
            >
              {(createCategoryMutation.isPending || updateCategoryMutation.isPending) ? 'Saving...' : 'Save Category'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Brand Dialog */}
      <Dialog open={brandDialog} onOpenChange={(open) => { if (!open) resetBrandForm(); else setBrandDialog(true); }}>
        <DialogContent className="bg-gray-800 text-white border-gray-700">
          <DialogHeader>
            <DialogTitle>{editingBrand ? 'Edit Brand' : 'Create Brand'}</DialogTitle>
            <DialogDescription className="text-gray-400">
              {editingBrand ? 'Update brand details' : 'Add a new brand to a category'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <Label>Category</Label>
              <Select value={brandCategoryId?.toString() || ""} onValueChange={(v) => setBrandCategoryId(parseInt(v))}>
                <SelectTrigger className="mt-2 bg-gray-700 border-gray-600">
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent className="bg-gray-700 border-gray-600">
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id.toString()}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Brand Name</Label>
              <Input
                value={brandName}
                onChange={(e) => setBrandName(e.target.value)}
                placeholder="e.g., GeekBar, Lost Mary, Elf Bar"
                className="mt-2 bg-gray-700 border-gray-600"
              />
            </div>
            <div>
              <Label>Brand Logo</Label>
              <div className="flex flex-col gap-3 mt-2">
                <div className="flex gap-2">
                  <Input
                    value={brandLogo}
                    onChange={(e) => setBrandLogo(e.target.value)}
                    placeholder="Enter URL or upload an image"
                    className="flex-1 bg-gray-700 border-gray-600"
                  />
                  <input
                    ref={brandLogoInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleBrandLogoUpload}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => brandLogoInputRef.current?.click()}
                    disabled={brandLogoUploading}
                    className="border-gray-600"
                  >
                    {brandLogoUploading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Upload className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                {brandLogo && (
                  <div className="w-20 h-20 rounded-lg overflow-hidden border border-gray-600 bg-white p-2">
                    <img src={brandLogo} alt="Brand logo preview" className="w-full h-full object-contain" />
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={brandActive} onCheckedChange={setBrandActive} />
              <Label>Active</Label>
            </div>
          </div>
          <DialogFooter className="mt-6">
            <Button variant="outline" onClick={resetBrandForm} className="border-gray-600">
              Cancel
            </Button>
            <Button
              onClick={handleSaveBrand}
              disabled={createBrandMutation.isPending || updateBrandMutation.isPending}
              className="bg-orange-600 hover:bg-orange-700"
            >
              {(createBrandMutation.isPending || updateBrandMutation.isPending) ? 'Saving...' : 'Save Brand'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Product Line Dialog */}
      <Dialog open={productLineDialog} onOpenChange={(open) => { if (!open) resetProductLineForm(); else setProductLineDialog(true); }}>
        <DialogContent className="bg-gray-800 text-white border-gray-700">
          <DialogHeader>
            <DialogTitle>{editingProductLine ? 'Edit Product Line' : 'Create Product Line'}</DialogTitle>
            <DialogDescription className="text-gray-400">
              {editingProductLine ? 'Update product line details' : 'Add a new product line (subcategory) to a brand'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <Label>Brand</Label>
              <Select value={productLineBrandId?.toString() || ""} onValueChange={(v) => setProductLineBrandId(parseInt(v))}>
                <SelectTrigger className="mt-2 bg-gray-700 border-gray-600">
                  <SelectValue placeholder="Select a brand" />
                </SelectTrigger>
                <SelectContent className="bg-gray-700 border-gray-600">
                  {brands.map((brand) => (
                    <SelectItem key={brand.id} value={brand.id.toString()}>
                      {brand.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Product Line Name</Label>
              <Input
                value={productLineName}
                onChange={(e) => setProductLineName(e.target.value)}
                placeholder="e.g., Meloso Mini, Pulse, Pulse X"
                className="mt-2 bg-gray-700 border-gray-600"
              />
            </div>
            <div>
              <Label>Product Line Logo URL (Optional)</Label>
              <div className="flex gap-2 mt-2">
                <Input
                  value={productLineLogo}
                  onChange={(e) => setProductLineLogo(e.target.value)}
                  placeholder="https://example.com/logo.png"
                  className="flex-1 bg-gray-700 border-gray-600"
                />
                {productLineLogo && (
                  <div className="w-12 h-12 rounded overflow-hidden border border-gray-600 bg-white p-1">
                    <img src={productLineLogo} alt="" className="w-full h-full object-contain" />
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={productLineActive} onCheckedChange={setProductLineActive} />
              <Label>Active</Label>
            </div>
          </div>
          <DialogFooter className="mt-6">
            <Button variant="outline" onClick={resetProductLineForm} className="border-gray-600">
              Cancel
            </Button>
            <Button
              onClick={handleSaveProductLine}
              disabled={createProductLineMutation.isPending || updateProductLineMutation.isPending}
              className="bg-orange-600 hover:bg-orange-700"
            >
              {(createProductLineMutation.isPending || updateProductLineMutation.isPending) ? 'Saving...' : 'Save Product Line'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialog} onOpenChange={setDeleteDialog}>
        <DialogContent className="bg-gray-800 text-white border-gray-700">
          <DialogHeader>
            <DialogTitle>
              Delete {deleteTarget?.type === 'category' ? 'Category' : deleteTarget?.type === 'brand' ? 'Brand' : 'Product Line'}
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              Are you sure you want to delete "{deleteTarget?.name}"? This action cannot be undone.
              {deleteTarget?.type === 'category' && (
                <span className="block mt-2 text-yellow-400">
                  Warning: This will also remove all brands and product lines within this category.
                </span>
              )}
              {deleteTarget?.type === 'brand' && (
                <span className="block mt-2 text-yellow-400">
                  Warning: This will also remove all product lines within this brand.
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-6">
            <Button variant="outline" onClick={() => { setDeleteDialog(false); setDeleteTarget(null); }} className="border-gray-600">
              Cancel
            </Button>
            <Button
              onClick={handleDelete}
              disabled={deleteCategoryMutation.isPending || deleteBrandMutation.isPending || deleteProductLineMutation.isPending}
              className="bg-red-600 hover:bg-red-700"
            >
              {(deleteCategoryMutation.isPending || deleteBrandMutation.isPending || deleteProductLineMutation.isPending) ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={featuredDialog} onOpenChange={(open) => { if (!open) { setFeaturedDialog(false); setFeaturedTarget(null); setSelectedFeaturedIds([]); } }}>
        <DialogContent className="bg-gray-800 text-white border-gray-700 max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Star className="text-yellow-400" size={20} />
              Featured Products for "{featuredTarget?.name}"
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              Select products to feature in the {featuredTarget?.type} carousel. Featured products appear first.
            </DialogDescription>
          </DialogHeader>
          
          <ScrollArea className="h-[400px] pr-4">
            {getProductsForFeaturedSelection().length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                No products available for this {featuredTarget?.type}.
              </div>
            ) : (
              <div className="space-y-2">
                {getProductsForFeaturedSelection().map((product) => (
                  <div
                    key={product.id}
                    onClick={() => toggleFeaturedProduct(product.id)}
                    className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all ${
                      selectedFeaturedIds.includes(product.id)
                        ? 'bg-orange-500/20 border border-orange-500'
                        : 'bg-gray-700/50 border border-gray-600 hover:border-gray-500'
                    }`}
                  >
                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                      selectedFeaturedIds.includes(product.id)
                        ? 'bg-orange-500 border-orange-500'
                        : 'border-gray-500'
                    }`}>
                      {selectedFeaturedIds.includes(product.id) && (
                        <Check size={14} className="text-white" />
                      )}
                    </div>
                    {product.image && (
                      <img src={product.image} alt={product.name} className="w-12 h-12 object-cover rounded" />
                    )}
                    <div className="flex-1">
                      <div className="font-medium">{product.name}</div>
                      <div className="text-sm text-gray-400">${product.price}</div>
                    </div>
                    {selectedFeaturedIds.includes(product.id) && (
                      <Star className="text-yellow-400" size={16} fill="currentColor" />
                    )}
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
          
          <div className="text-sm text-gray-400">
            {selectedFeaturedIds.length} product{selectedFeaturedIds.length !== 1 ? 's' : ''} selected
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => { setFeaturedDialog(false); setFeaturedTarget(null); setSelectedFeaturedIds([]); }} className="border-gray-600">
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (featuredTarget) {
                  updateFeaturedProductsMutation.mutate({
                    type: featuredTarget.type,
                    id: featuredTarget.id,
                    featuredProductIds: selectedFeaturedIds
                  });
                }
              }}
              disabled={updateFeaturedProductsMutation.isPending}
              className="bg-orange-600 hover:bg-orange-700"
            >
              {updateFeaturedProductsMutation.isPending ? 'Saving...' : 'Save Featured Products'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
