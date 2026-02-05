import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import {
  Plus,
  Edit2,
  Trash2,
  Image as ImageIcon,
} from "lucide-react";
import type { CategoryBanner, InsertCategoryBanner } from "@shared/schema";

interface DeliveryCategory {
  id: number;
  name: string;
  slug: string;
}

export function CategoryBannersManagement() {
  const { toast } = useToast();
  
  const [bannerDialog, setBannerDialog] = useState(false);
  const [editingBanner, setEditingBanner] = useState<CategoryBanner | null>(null);
  const [categoryId, setCategoryId] = useState<string>("");
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [image, setImage] = useState("");
  const [buttonText, setButtonText] = useState("Shop Now");
  const [buttonLink, setButtonLink] = useState("");
  const [displayOrder, setDisplayOrder] = useState(0);
  const [isActive, setIsActive] = useState(true);
  
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [deleteBanner, setDeleteBanner] = useState<CategoryBanner | null>(null);

  const { data: banners = [], isLoading } = useQuery<CategoryBanner[]>({
    queryKey: ['/api/admin/category-banners'],
  });

  const { data: categories = [] } = useQuery<DeliveryCategory[]>({
    queryKey: ['/api/delivery/categories'],
  });

  const sortedBanners = [...banners].sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));

  const createBannerMutation = useMutation({
    mutationFn: async (data: InsertCategoryBanner) => {
      return apiRequest('POST', '/api/admin/category-banners', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/category-banners'] });
      queryClient.invalidateQueries({ queryKey: ['/api/category-banners'] });
      toast({ title: "Category banner created successfully" });
      resetForm();
    },
    onError: (error: Error) => {
      toast({ title: "Error creating banner", description: error.message, variant: "destructive" });
    }
  });

  const updateBannerMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<InsertCategoryBanner> }) => {
      return apiRequest('PATCH', `/api/admin/category-banners/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/category-banners'] });
      queryClient.invalidateQueries({ queryKey: ['/api/category-banners'] });
      toast({ title: "Category banner updated successfully" });
      resetForm();
    },
    onError: (error: Error) => {
      toast({ title: "Error updating banner", description: error.message, variant: "destructive" });
    }
  });

  const deleteBannerMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest('DELETE', `/api/admin/category-banners/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/category-banners'] });
      queryClient.invalidateQueries({ queryKey: ['/api/category-banners'] });
      toast({ title: "Category banner deleted successfully" });
      setDeleteDialog(false);
      setDeleteBanner(null);
    },
    onError: (error: Error) => {
      toast({ title: "Error deleting banner", description: error.message, variant: "destructive" });
    }
  });

  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: number; isActive: boolean }) => {
      return apiRequest('PATCH', `/api/admin/category-banners/${id}`, { isActive });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/category-banners'] });
      queryClient.invalidateQueries({ queryKey: ['/api/category-banners'] });
    },
    onError: (error: Error) => {
      toast({ title: "Error updating banner", description: error.message, variant: "destructive" });
    }
  });

  const resetForm = () => {
    setBannerDialog(false);
    setEditingBanner(null);
    setCategoryId("");
    setTitle("");
    setSubtitle("");
    setImage("");
    setButtonText("Shop Now");
    setButtonLink("");
    setDisplayOrder(0);
    setIsActive(true);
  };

  const openEditBanner = (banner: CategoryBanner) => {
    setEditingBanner(banner);
    setCategoryId(String(banner.categoryId));
    setTitle(banner.title || "");
    setSubtitle(banner.subtitle || "");
    setImage(banner.image);
    setButtonText(banner.buttonText || "Shop Now");
    setButtonLink(banner.buttonLink || "");
    setDisplayOrder(banner.displayOrder || 0);
    setIsActive(banner.isActive ?? true);
    setBannerDialog(true);
  };

  const handleSaveBanner = () => {
    if (!categoryId) {
      toast({ title: "Category is required", variant: "destructive" });
      return;
    }
    if (!image.trim()) {
      toast({ title: "Image URL is required", variant: "destructive" });
      return;
    }

    const data: InsertCategoryBanner = {
      categoryId: parseInt(categoryId),
      title: title || null,
      subtitle: subtitle || null,
      image,
      buttonText: buttonText || "Shop Now",
      buttonLink: buttonLink || null,
      displayOrder,
      isActive,
    };

    if (editingBanner) {
      updateBannerMutation.mutate({ id: editingBanner.id, data });
    } else {
      createBannerMutation.mutate(data);
    }
  };

  const getCategoryName = (catId: number) => {
    const category = categories.find(c => c.id === catId);
    return category?.name || `Category ${catId}`;
  };

  if (isLoading) {
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
          <h2 className="text-xl font-semibold text-white">Category Banners</h2>
          <p className="text-gray-400 text-sm">Manage featured category banners on the delivery homepage.</p>
        </div>
        <Button onClick={() => setBannerDialog(true)} className="bg-orange-600 hover:bg-orange-700">
          <Plus size={16} className="mr-2" /> Add Banner
        </Button>
      </div>

      {sortedBanners.length === 0 ? (
        <div className="text-center py-12 bg-gray-800/50 rounded-lg border border-gray-700">
          <ImageIcon size={48} className="mx-auto text-gray-500 mb-4" />
          <h3 className="text-lg font-medium text-gray-300 mb-2">No category banners yet</h3>
          <p className="text-gray-500 mb-4">Create banners to showcase featured categories on your homepage</p>
          <Button onClick={() => setBannerDialog(true)} className="bg-orange-600 hover:bg-orange-700">
            <Plus size={16} className="mr-2" /> Create First Banner
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          {sortedBanners.map((banner) => (
            <div
              key={banner.id}
              className="flex items-center gap-4 p-4 bg-gray-800 rounded-lg border border-gray-700 hover:border-orange-500/50 transition-colors"
            >
              <div className="w-32 h-20 rounded overflow-hidden bg-gray-700 flex-shrink-0">
                <img
                  src={banner.image || '/placeholder-product.png'}
                  alt={banner.title || 'Category banner'}
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-white truncate">{banner.title || getCategoryName(banner.categoryId)}</h3>
                {banner.subtitle && (
                  <p className="text-sm text-gray-400 truncate">{banner.subtitle}</p>
                )}
                <div className="flex gap-2 mt-1">
                  <span className="text-xs bg-blue-900/50 text-blue-300 px-2 py-0.5 rounded">
                    {getCategoryName(banner.categoryId)}
                  </span>
                  {banner.buttonText && (
                    <span className="text-xs bg-gray-700 text-gray-300 px-2 py-0.5 rounded">
                      CTA: {banner.buttonText}
                    </span>
                  )}
                  <span className="text-xs bg-gray-700 text-gray-300 px-2 py-0.5 rounded">
                    Order: {banner.displayOrder}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Switch
                  checked={banner.isActive ?? true}
                  onCheckedChange={(checked) => toggleActiveMutation.mutate({ id: banner.id, isActive: checked })}
                />
                <span className={`text-xs px-2 py-1 rounded ${banner.isActive ? 'bg-green-900/50 text-green-400' : 'bg-gray-700 text-gray-400'}`}>
                  {banner.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>

              <Button variant="ghost" size="sm" onClick={() => openEditBanner(banner)} className="h-8 px-2">
                <Edit2 size={14} />
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => {
                  setDeleteBanner(banner);
                  setDeleteDialog(true);
                }} 
                className="h-8 px-2 text-red-400 hover:text-red-300"
              >
                <Trash2 size={14} />
              </Button>
            </div>
          ))}
        </div>
      )}

      <Dialog open={bannerDialog} onOpenChange={(open) => { if (!open) resetForm(); else setBannerDialog(true); }}>
        <DialogContent className="bg-gray-900 border-gray-700 max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-white">
              {editingBanner ? "Edit Category Banner" : "Create Category Banner"}
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              {editingBanner ? "Update the banner details below." : "Add a new category banner to the delivery homepage."}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="text-gray-200">Category *</Label>
              <Select value={categoryId} onValueChange={setCategoryId}>
                <SelectTrigger className="bg-gray-800 border-gray-600 text-white">
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-600">
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={String(cat.id)} className="text-white">
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-gray-200">Title (optional)</Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Featured Disposables"
                className="bg-gray-800 border-gray-600 text-white"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-gray-200">Subtitle (optional)</Label>
              <Input
                value={subtitle}
                onChange={(e) => setSubtitle(e.target.value)}
                placeholder="e.g., Check out our latest collection"
                className="bg-gray-800 border-gray-600 text-white"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-gray-200">Image URL *</Label>
              <Input
                value={image}
                onChange={(e) => setImage(e.target.value)}
                placeholder="https://example.com/banner.jpg"
                className="bg-gray-800 border-gray-600 text-white"
              />
              {image && (
                <div className="mt-2">
                  <img src={image} alt="Preview" className="w-full h-32 object-cover rounded border border-gray-700" />
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-gray-200">Button Text</Label>
                <Input
                  value={buttonText}
                  onChange={(e) => setButtonText(e.target.value)}
                  placeholder="Shop Now"
                  className="bg-gray-800 border-gray-600 text-white"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-gray-200">Button Link (optional)</Label>
                <Input
                  value={buttonLink}
                  onChange={(e) => setButtonLink(e.target.value)}
                  placeholder="/delivery/category/..."
                  className="bg-gray-800 border-gray-600 text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-gray-200">Display Order</Label>
                <Input
                  type="number"
                  value={displayOrder}
                  onChange={(e) => setDisplayOrder(parseInt(e.target.value) || 0)}
                  className="bg-gray-800 border-gray-600 text-white"
                />
              </div>
              <div className="flex items-center gap-3 pt-6">
                <Switch checked={isActive} onCheckedChange={setIsActive} />
                <Label className="text-gray-200">Active</Label>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={resetForm} className="border-gray-600">
              Cancel
            </Button>
            <Button 
              onClick={handleSaveBanner} 
              className="bg-orange-600 hover:bg-orange-700"
              disabled={createBannerMutation.isPending || updateBannerMutation.isPending}
            >
              {createBannerMutation.isPending || updateBannerMutation.isPending ? "Saving..." : (editingBanner ? "Update" : "Create")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialog} onOpenChange={setDeleteDialog}>
        <AlertDialogContent className="bg-gray-900 border-gray-700">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Delete Category Banner</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-400">
              Are you sure you want to delete this banner? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-gray-600">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteBanner && deleteBannerMutation.mutate(deleteBanner.id)}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleteBannerMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
