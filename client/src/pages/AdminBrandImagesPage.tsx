import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Upload, Loader2, ArrowLeft, Check, Image as ImageIcon } from "lucide-react";

interface DeliveryCategory {
  id: number;
  name: string;
  slug: string;
  isActive: boolean;
}

interface DeliveryBrand {
  id: number;
  name: string;
  slug: string;
  categoryId: number;
  logo: string | null;
  isActive: boolean;
}

interface DeliveryProductLine {
  id: number;
  name: string;
  slug: string;
  brandId: number;
  logo: string | null;
  isActive: boolean;
}

export default function AdminBrandImagesPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch('/api/admin/check', { credentials: 'include' });
        if (!res.ok) {
          setLocation('/admin/login');
        }
      } catch {
        setLocation('/admin/login');
      }
    };
    checkAuth();
  }, [setLocation]);

  const { data: categories = [] } = useQuery<DeliveryCategory[]>({
    queryKey: ['/api/delivery/categories'],
  });

  const { data: brands = [] } = useQuery<DeliveryBrand[]>({
    queryKey: ['/api/delivery/brands'],
  });

  const { data: productLines = [] } = useQuery<DeliveryProductLine[]>({
    queryKey: ['/api/delivery/product-lines'],
  });

  const updateBrand = useMutation({
    mutationFn: async ({ id, logo }: { id: number; logo: string }) => {
      const response = await fetch(`/api/admin/delivery/brands/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ logo }),
      });
      if (!response.ok) throw new Error('Failed to update');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/delivery/brands'] });
      toast({ title: "Brand logo updated!" });
    },
    onError: () => {
      toast({ title: "Failed to update brand", variant: "destructive" });
    }
  });

  const updateProductLine = useMutation({
    mutationFn: async ({ id, logo }: { id: number; logo: string }) => {
      const response = await fetch(`/api/admin/delivery/product-lines/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ logo }),
      });
      if (!response.ok) throw new Error('Failed to update');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/delivery/product-lines'] });
      toast({ title: "Product line image updated!" });
    },
    onError: () => {
      toast({ title: "Failed to update product line", variant: "destructive" });
    }
  });

  const handleUpload = async (type: 'brand' | 'productLine', id: number, file: File) => {
    const uploadKey = `${type}-${id}`;
    setUploadingId(uploadKey);

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

      if (type === 'brand') {
        await updateBrand.mutateAsync({ id, logo: objectPath });
      } else {
        await updateProductLine.mutateAsync({ id, logo: objectPath });
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast({ title: "Failed to upload image", variant: "destructive" });
    } finally {
      setUploadingId(null);
    }
  };

  const activeCategories = categories.filter(c => c.isActive);

  return (
    <div className="min-h-screen bg-[#1A1A1A]">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">Brand & Product Line Images</h1>
            <p className="text-gray-400 mt-1">Upload logos for brands and product lines displayed on the home screen</p>
          </div>
          <a href="/admin" className="text-orange-500 hover:text-orange-400 transition-colors flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Admin
          </a>
        </div>

        <div className="space-y-12">
          {activeCategories.map(category => {
            const categoryBrands = brands.filter(b => b.categoryId === category.id && b.isActive);
            
            if (categoryBrands.length === 0) return null;

            return (
              <div key={category.id}>
                <h2 className="text-2xl font-bold text-white mb-6 border-b border-gray-700 pb-2">
                  {category.name}
                </h2>

                <div className="space-y-8">
                  {categoryBrands.map(brand => {
                    const brandProductLines = productLines.filter(pl => pl.brandId === brand.id && pl.isActive);
                    const brandUploadKey = `brand-${brand.id}`;

                    return (
                      <div key={brand.id} className="bg-gray-800/50 rounded-xl p-6">
                        <div className="flex items-start gap-6 mb-6">
                          <div className="w-24 h-24 bg-white rounded-xl flex items-center justify-center overflow-hidden flex-shrink-0">
                            {brand.logo ? (
                              <img src={brand.logo} alt={brand.name} className="w-full h-full object-contain p-2" />
                            ) : (
                              <ImageIcon className="w-10 h-10 text-gray-300" />
                            )}
                          </div>
                          <div className="flex-1">
                            <h3 className="text-xl font-bold text-white mb-2">{brand.name}</h3>
                            <input
                              ref={el => fileInputRefs.current[brandUploadKey] = el}
                              type="file"
                              accept="image/*"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) handleUpload('brand', brand.id, file);
                                e.target.value = '';
                              }}
                              className="hidden"
                            />
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => fileInputRefs.current[brandUploadKey]?.click()}
                              disabled={uploadingId === brandUploadKey}
                              className="border-gray-600 hover:bg-gray-700"
                            >
                              {uploadingId === brandUploadKey ? (
                                <>
                                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                  Uploading...
                                </>
                              ) : (
                                <>
                                  <Upload className="h-4 w-4 mr-2" />
                                  {brand.logo ? 'Change Logo' : 'Upload Logo'}
                                </>
                              )}
                            </Button>
                            {brand.logo && (
                              <span className="ml-3 text-green-400 text-sm inline-flex items-center gap-1">
                                <Check className="h-4 w-4" /> Logo uploaded
                              </span>
                            )}
                          </div>
                        </div>

                        {brandProductLines.length > 0 && (
                          <div className="border-t border-gray-700 pt-4">
                            <h4 className="text-sm font-semibold text-gray-400 mb-4 uppercase tracking-wide">Product Lines (Sub-brands)</h4>
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                              {brandProductLines.map(productLine => {
                                const plUploadKey = `productLine-${productLine.id}`;

                                return (
                                  <Card key={productLine.id} className="bg-gray-900 border-gray-700 p-4">
                                    <div className="w-full aspect-square bg-white rounded-lg flex items-center justify-center overflow-hidden mb-3">
                                      {productLine.logo ? (
                                        <img src={productLine.logo} alt={productLine.name} className="w-full h-full object-contain p-2" />
                                      ) : (
                                        <ImageIcon className="w-8 h-8 text-gray-300" />
                                      )}
                                    </div>
                                    <p className="text-sm font-medium text-white mb-2 text-center line-clamp-2">{productLine.name}</p>
                                    <input
                                      ref={el => fileInputRefs.current[plUploadKey] = el}
                                      type="file"
                                      accept="image/*"
                                      onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file) handleUpload('productLine', productLine.id, file);
                                        e.target.value = '';
                                      }}
                                      className="hidden"
                                    />
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => fileInputRefs.current[plUploadKey]?.click()}
                                      disabled={uploadingId === plUploadKey}
                                      className="w-full border-gray-600 hover:bg-gray-700 text-xs"
                                    >
                                      {uploadingId === plUploadKey ? (
                                        <Loader2 className="h-3 w-3 animate-spin" />
                                      ) : (
                                        <>
                                          <Upload className="h-3 w-3 mr-1" />
                                          {productLine.logo ? 'Change' : 'Upload'}
                                        </>
                                      )}
                                    </Button>
                                  </Card>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {activeCategories.length === 0 && (
          <div className="text-center py-16 bg-gray-800/50 rounded-xl">
            <p className="text-gray-400">No active categories with brands found. Add categories and brands first.</p>
          </div>
        )}
      </div>
    </div>
  );
}
