import { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Image as ImageIcon, Search, Check, X, Link2, Loader2, ChevronLeft, ChevronRight, Save, RotateCcw, Database, Download, ArrowUpDown, GripVertical } from "lucide-react";

interface StoredImage {
  objectPath: string;
  name: string;
  size: number;
  contentType: string;
  created: string | null;
  isAssigned: boolean;
  assignedTo: { id: number; name: string } | null;
}

interface ProductWithoutImage {
  id: number;
  name: string;
  category: string | null;
  brand: string | null;
  brandId: number | null;
  productLineId: number | null;
  productLineName: string | null;
  enabled: boolean;
  image: string | null;
}

export default function AdminImageRecoveryPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [selectedImage, setSelectedImage] = useState<StoredImage | null>(null);
  const [productSearch, setProductSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [brandFilter, setBrandFilter] = useState("");
  const [subBrandFilter, setSubBrandFilter] = useState("");
  const [enabledFilter, setEnabledFilter] = useState<"all" | "enabled" | "disabled">("all");
  const [imageFilter, setImageFilter] = useState<"all" | "unassigned" | "assigned">("unassigned");
  const [isDownloading, setIsDownloading] = useState(false);
  const [imagePage, setImagePage] = useState(0);
  const [imageSortOrder, setImageSortOrder] = useState<"newest" | "oldest">("newest");
  const [draggedImage, setDraggedImage] = useState<StoredImage | null>(null);
  const [dragOverProductId, setDragOverProductId] = useState<number | null>(null);
  const IMAGES_PER_PAGE = 24;

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch('/api/admin/check', { credentials: 'include' });
        if (!res.ok) setLocation('/admin/login');
      } catch {
        setLocation('/admin/login');
      }
    };
    checkAuth();
  }, [setLocation]);

  const { data: storedImagesData, isLoading: loadingImages } = useQuery<{
    images: StoredImage[];
    totalStored: number;
    totalAssigned: number;
  }>({
    queryKey: ['/api/admin/delivery/stored-images'],
  });

  const { data: productsData, isLoading: loadingProducts } = useQuery<{
    products: ProductWithoutImage[];
    total: number;
    brands: string[];
    categories: string[];
    subBrands: string[];
  }>({
    queryKey: ['/api/admin/delivery/products-without-images'],
  });

  const assignMutation = useMutation({
    mutationFn: async ({ productId, objectPath }: { productId: number; objectPath: string }) => {
      const res = await apiRequest('POST', '/api/admin/delivery/assign-image', { productId, objectPath });
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Image assigned successfully!" });
      setSelectedImage(null);
      queryClient.invalidateQueries({ queryKey: ['/api/admin/delivery/stored-images'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/delivery/products-without-images'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/delivery/products'] });
    },
    onError: () => {
      toast({ title: "Failed to assign image", variant: "destructive" });
    },
  });

  const { data: mappingInfo } = useQuery<{
    exists: boolean;
    savedAt?: string;
    totalMappings?: number;
  }>({
    queryKey: ['/api/admin/delivery/image-mapping-info'],
  });

  const saveMappingMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest('POST', '/api/admin/delivery/save-image-mapping', {});
      return res.json();
    },
    onSuccess: (data) => {
      toast({ title: `Mapping saved! ${data.totalSaved} image-product links backed up.` });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/delivery/image-mapping-info'] });
    },
    onError: () => {
      toast({ title: "Failed to save mapping", variant: "destructive" });
    },
  });

  const restoreMappingMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest('POST', '/api/admin/delivery/restore-image-mapping', {});
      return res.json();
    },
    onSuccess: (data) => {
      toast({ title: `Restored ${data.restored} image links! (${data.skipped} skipped)` });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/delivery/stored-images'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/delivery/products-without-images'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/delivery/image-mapping-info'] });
    },
    onError: () => {
      toast({ title: "Failed to restore mapping", variant: "destructive" });
    },
  });

  const filteredImages = useMemo(() => {
    if (!storedImagesData?.images) return [];
    let imgs = [...storedImagesData.images];
    if (imageFilter === "unassigned") imgs = imgs.filter(i => !i.isAssigned);
    else if (imageFilter === "assigned") imgs = imgs.filter(i => i.isAssigned);
    imgs.sort((a, b) => {
      const dateA = a.created ? new Date(a.created).getTime() : 0;
      const dateB = b.created ? new Date(b.created).getTime() : 0;
      return imageSortOrder === "newest" ? dateB - dateA : dateA - dateB;
    });
    return imgs;
  }, [storedImagesData, imageFilter, imageSortOrder]);

  const pagedImages = useMemo(() => {
    const start = imagePage * IMAGES_PER_PAGE;
    return filteredImages.slice(start, start + IMAGES_PER_PAGE);
  }, [filteredImages, imagePage]);

  const totalImagePages = Math.ceil(filteredImages.length / IMAGES_PER_PAGE);

  const filteredProducts = useMemo(() => {
    if (!productsData?.products) return [];
    let prods = productsData.products;
    if (enabledFilter === "enabled") {
      prods = prods.filter(p => p.enabled === true);
    } else if (enabledFilter === "disabled") {
      prods = prods.filter(p => p.enabled === false);
    }
    if (categoryFilter) {
      prods = prods.filter(p => p.category === categoryFilter);
    }
    if (brandFilter) {
      prods = prods.filter(p => p.brand === brandFilter);
    }
    if (subBrandFilter) {
      prods = prods.filter(p => p.productLineName === subBrandFilter);
    }
    if (productSearch) {
      const s = productSearch.toLowerCase();
      prods = prods.filter(p => p.name.toLowerCase().includes(s));
    }
    return prods;
  }, [productsData, categoryFilter, brandFilter, subBrandFilter, enabledFilter, productSearch]);

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="min-h-screen bg-background p-4 sm:p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => setLocation('/admin')}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Image Recovery Tool</h1>
              <p className="text-sm text-muted-foreground">
                {storedImagesData ? (
                  <>
                    {storedImagesData.totalStored} images in storage | {storedImagesData.totalAssigned} assigned | {storedImagesData.totalStored - storedImagesData.totalAssigned} unassigned
                  </>
                ) : "Loading..."}
                {productsData && ` | ${productsData.total} products need images`}
              </p>
            </div>
          </div>
          <Button
            onClick={async () => {
              setIsDownloading(true);
              toast({ title: "Preparing ZIP file... This may take several minutes for 400+ images. Please wait." });
              try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 600000);
                const response = await fetch('/api/admin/delivery/download-all-images', { 
                  credentials: 'include',
                  signal: controller.signal,
                });
                clearTimeout(timeoutId);
                if (!response.ok) throw new Error('Download failed');
                const blob = await response.blob();
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'vape-cave-product-images.zip';
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
                toast({ title: "Download started!" });
              } catch (err: any) {
                if (err?.name === 'AbortError') {
                  toast({ title: "Download timed out. Try again or contact support.", variant: "destructive" });
                } else {
                  toast({ title: "Failed to download images. Try again in a moment.", variant: "destructive" });
                }
              } finally {
                setIsDownloading(false);
              }
            }}
            disabled={isDownloading || !storedImagesData?.totalStored}
            className="bg-orange-600 hover:bg-orange-700 text-white"
          >
            {isDownloading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
            {isDownloading ? "Preparing ZIP..." : "Download All Images"}
          </Button>
        </div>

        <Card className="p-4 mb-6 border-blue-500/30 bg-blue-500/5">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-2">
              <Database className="w-5 h-5 text-blue-500" />
              <div>
                <p className="text-sm font-medium">Image Mapping Backup</p>
                <p className="text-xs text-muted-foreground">
                  {mappingInfo?.exists 
                    ? `Last saved: ${new Date(mappingInfo.savedAt!).toLocaleString()} (${mappingInfo.totalMappings} mappings)`
                    : "No backup saved yet"}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => saveMappingMutation.mutate()}
                disabled={saveMappingMutation.isPending}
                className="border-blue-500/50 text-blue-500 hover:bg-blue-500/10"
              >
                {saveMappingMutation.isPending ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <Save className="w-3 h-3 mr-1" />}
                Save Current Mapping
              </Button>
              {mappingInfo?.exists && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => restoreMappingMutation.mutate()}
                  disabled={restoreMappingMutation.isPending}
                  className="border-green-500/50 text-green-500 hover:bg-green-500/10"
                >
                  {restoreMappingMutation.isPending ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <RotateCcw className="w-3 h-3 mr-1" />}
                  Restore from Backup
                </Button>
              )}
            </div>
          </div>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <Card className="p-4">
              <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <ImageIcon className="w-5 h-5" />
                  Stored Images
                </h2>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => { setImageSortOrder(s => s === "newest" ? "oldest" : "newest"); setImagePage(0); }}
                    className="text-xs gap-1"
                    title={`Sort by ${imageSortOrder === "newest" ? "oldest" : "newest"} first`}
                  >
                    <ArrowUpDown className="w-3.5 h-3.5" />
                    {imageSortOrder === "newest" ? "Newest" : "Oldest"}
                  </Button>
                  <div className="flex gap-1">
                    {(["all", "unassigned", "assigned"] as const).map(f => (
                      <Button
                        key={f}
                        size="sm"
                        variant={imageFilter === f ? "default" : "outline"}
                        onClick={() => { setImageFilter(f); setImagePage(0); }}
                        className="text-xs capitalize"
                      >
                        {f} {f === "all" ? `(${storedImagesData?.totalStored || 0})` : 
                             f === "assigned" ? `(${storedImagesData?.totalAssigned || 0})` :
                             `(${(storedImagesData?.totalStored || 0) - (storedImagesData?.totalAssigned || 0)})`}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>

              {loadingImages ? (
                <div className="flex items-center justify-center py-20">
                  <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                    {pagedImages.map(img => (
                      <button
                        key={img.objectPath}
                        draggable
                        onDragStart={(e) => {
                          setDraggedImage(img);
                          setSelectedImage(img);
                          e.dataTransfer.setData('text/plain', img.objectPath);
                          e.dataTransfer.effectAllowed = 'copy';
                        }}
                        onDragEnd={() => {
                          setDraggedImage(null);
                          setDragOverProductId(null);
                        }}
                        onClick={() => setSelectedImage(selectedImage?.objectPath === img.objectPath ? null : img)}
                        className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all cursor-grab active:cursor-grabbing ${
                          selectedImage?.objectPath === img.objectPath
                            ? "border-primary ring-2 ring-primary/30 scale-[0.95]"
                            : img.isAssigned
                            ? "border-green-500/50 opacity-60"
                            : "border-border hover:border-primary/50"
                        }`}
                      >
                        <img
                          src={img.objectPath}
                          alt={img.name}
                          className="w-full h-full object-cover pointer-events-none"
                          loading="lazy"
                        />
                        {img.isAssigned && (
                          <div className="absolute top-1 right-1 bg-green-500 rounded-full p-0.5">
                            <Check className="w-3 h-3 text-white" />
                          </div>
                        )}
                        <div className="absolute top-1 left-1 opacity-0 group-hover:opacity-100">
                          <GripVertical className="w-3.5 h-3.5 text-white drop-shadow" />
                        </div>
                        <div className="absolute bottom-0 inset-x-0 bg-black/70 text-[10px] text-white px-1 py-0.5 truncate">
                          {img.created ? new Date(img.created).toLocaleDateString() : ''} · {formatSize(img.size)}
                        </div>
                      </button>
                    ))}
                  </div>

                  {filteredImages.length === 0 && (
                    <div className="text-center py-10 text-muted-foreground">
                      No {imageFilter} images found
                    </div>
                  )}

                  {totalImagePages > 1 && (
                    <div className="flex items-center justify-between mt-3 pt-3 border-t">
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={imagePage === 0}
                        onClick={() => setImagePage(p => p - 1)}
                      >
                        <ChevronLeft className="w-4 h-4 mr-1" /> Prev
                      </Button>
                      <span className="text-sm text-muted-foreground">
                        Page {imagePage + 1} of {totalImagePages}
                      </span>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={imagePage >= totalImagePages - 1}
                        onClick={() => setImagePage(p => p + 1)}
                      >
                        Next <ChevronRight className="w-4 h-4 ml-1" />
                      </Button>
                    </div>
                  )}
                </>
              )}
            </Card>

            {selectedImage && (
              <Card className="p-4 mt-4 border-primary">
                <h3 className="font-semibold mb-2">Selected Image</h3>
                <div className="flex gap-4">
                  <img
                    src={selectedImage.objectPath}
                    alt="Selected"
                    className="w-32 h-32 object-cover rounded-lg border"
                  />
                  <div className="text-sm space-y-1">
                    <p><span className="text-muted-foreground">Size:</span> {formatSize(selectedImage.size)}</p>
                    <p><span className="text-muted-foreground">Type:</span> {selectedImage.contentType}</p>
                    {selectedImage.created && (
                      <p><span className="text-muted-foreground">Uploaded:</span> {new Date(selectedImage.created).toLocaleString()}</p>
                    )}
                    {selectedImage.isAssigned && selectedImage.assignedTo && (
                      <p className="text-green-600">
                        <Check className="w-3 h-3 inline mr-1" />
                        Assigned to: {selectedImage.assignedTo.name}
                      </p>
                    )}
                    {!selectedImage.isAssigned && (
                      <p className="text-amber-500">Not assigned to any product</p>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setSelectedImage(null)}
                      className="mt-2"
                    >
                      <X className="w-3 h-3 mr-1" /> Deselect
                    </Button>
                  </div>
                </div>
              </Card>
            )}
          </div>

          <div>
            <Card className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <Link2 className="w-5 h-5" />
                  Products Without Images
                  <span className="text-sm font-normal text-muted-foreground">
                    ({filteredProducts.length}{productsData ? ` of ${productsData.total}` : ''})
                  </span>
                </h2>
              </div>

              <div className="space-y-2 mb-3">
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search products..."
                    value={productSearch}
                    onChange={e => setProductSearch(e.target.value)}
                    className="pl-8"
                  />
                </div>

                <div className="flex flex-wrap gap-2">
                  <select
                    value={enabledFilter}
                    onChange={e => setEnabledFilter(e.target.value as any)}
                    className="px-3 py-1.5 border rounded-md bg-background text-sm flex-1 min-w-[120px]"
                  >
                    <option value="all">All Status</option>
                    <option value="enabled">Enabled Only</option>
                    <option value="disabled">Disabled Only</option>
                  </select>

                  <select
                    value={categoryFilter}
                    onChange={e => setCategoryFilter(e.target.value)}
                    className="px-3 py-1.5 border rounded-md bg-background text-sm flex-1 min-w-[120px]"
                  >
                    <option value="">All Categories</option>
                    {(productsData?.categories || []).map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>

                  <select
                    value={brandFilter}
                    onChange={e => { setBrandFilter(e.target.value); setSubBrandFilter(""); }}
                    className="px-3 py-1.5 border rounded-md bg-background text-sm flex-1 min-w-[120px]"
                  >
                    <option value="">All Brands</option>
                    {(productsData?.brands || []).map(b => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                  </select>

                  <select
                    value={subBrandFilter}
                    onChange={e => setSubBrandFilter(e.target.value)}
                    className="px-3 py-1.5 border rounded-md bg-background text-sm flex-1 min-w-[120px]"
                  >
                    <option value="">All Sub-Brands</option>
                    {(productsData?.subBrands || []).map(sb => (
                      <option key={sb} value={sb}>{sb}</option>
                    ))}
                  </select>
                </div>

                {(enabledFilter !== "all" || categoryFilter || brandFilter || subBrandFilter) && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => { setEnabledFilter("all"); setCategoryFilter(""); setBrandFilter(""); setSubBrandFilter(""); }}
                    className="text-xs text-muted-foreground"
                  >
                    <X className="w-3 h-3 mr-1" /> Clear filters
                  </Button>
                )}
              </div>

              {!selectedImage && !draggedImage && (
                <div className="bg-muted/50 rounded-lg p-4 text-center text-sm text-muted-foreground mb-3">
                  <ImageIcon className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  Drag an image and drop it on a product, or click to select then click a product.
                </div>
              )}

              {(selectedImage || draggedImage) && (
                <div className="bg-primary/10 rounded-lg p-3 text-center text-sm mb-3 border border-primary/30">
                  <div className="flex items-center justify-center gap-2">
                    <img src={(draggedImage || selectedImage)!.objectPath} alt="" className="w-8 h-8 object-cover rounded" />
                    <span>{draggedImage ? "Drop on a product below to assign" : "Click a product below to assign this image"}</span>
                  </div>
                </div>
              )}

              {loadingProducts ? (
                <div className="flex items-center justify-center py-20">
                  <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <div className="max-h-[600px] overflow-y-auto space-y-1">
                  {filteredProducts.map(product => (
                    <button
                      key={product.id}
                      onClick={() => {
                        if (!selectedImage) {
                          toast({ title: "Select an image first", description: "Click an image or drag it onto a product", variant: "destructive" });
                          return;
                        }
                        assignMutation.mutate({ productId: product.id, objectPath: selectedImage.objectPath });
                      }}
                      onDragOver={(e) => {
                        e.preventDefault();
                        e.dataTransfer.dropEffect = 'copy';
                        setDragOverProductId(product.id);
                      }}
                      onDragLeave={() => {
                        setDragOverProductId(prev => prev === product.id ? null : prev);
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        setDragOverProductId(null);
                        const objectPath = e.dataTransfer.getData('text/plain');
                        if (objectPath) {
                          assignMutation.mutate({ productId: product.id, objectPath });
                        }
                        setDraggedImage(null);
                      }}
                      disabled={assignMutation.isPending}
                      className={`w-full flex items-center gap-3 p-2.5 rounded-lg text-left transition-all border ${
                        dragOverProductId === product.id
                          ? "bg-primary/20 border-primary ring-2 ring-primary/30 scale-[1.02]"
                          : selectedImage
                          ? "hover:bg-primary/10 hover:border-primary/30 cursor-pointer border-transparent"
                          : "border-transparent"
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-md flex items-center justify-center flex-shrink-0 transition-colors ${
                        dragOverProductId === product.id ? "bg-primary/30" : "bg-muted"
                      }`}>
                        {dragOverProductId === product.id ? (
                          <Download className="w-5 h-5 text-primary" />
                        ) : (
                          <ImageIcon className="w-5 h-5 text-muted-foreground" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{product.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {product.category}{product.brand ? ` · ${product.brand}` : ''}{product.productLineName ? ` · ${product.productLineName}` : ''}
                          {product.enabled === false && (
                            <span className="ml-1 text-red-400">(disabled)</span>
                          )}
                        </p>
                      </div>
                      {(selectedImage || dragOverProductId === product.id) && (
                        <div className="flex-shrink-0 text-primary">
                          <Link2 className="w-4 h-4" />
                        </div>
                      )}
                    </button>
                  ))}

                  {filteredProducts.length === 0 && (
                    <div className="text-center py-10 text-muted-foreground text-sm">
                      {productSearch || categoryFilter || brandFilter || subBrandFilter || enabledFilter !== "all"
                        ? "No matching products found"
                        : "All products have images!"}
                    </div>
                  )}
                </div>
              )}
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
