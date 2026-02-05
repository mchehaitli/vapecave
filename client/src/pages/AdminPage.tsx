import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient, useQuery, useMutation } from "@tanstack/react-query";
import * as XLSX from 'xlsx';
import MainLayout from "@/layouts/MainLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useBrandCategories, useFeaturedBrands } from "@/hooks/use-brands";
import BrandsCarousel from "@/components/BrandsCarousel";
import StoreHoursDialog from "@/components/StoreHoursDialog";
import { StoreLocation } from "@/types/store-location";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { apiRequest } from "@/lib/queryClient";
import { Trash2, Edit, Plus, RefreshCcw, Info, Calendar, Eye, MessageCircle, Download, Clock, Loader2, AlertCircle } from "lucide-react";
import { DeliveryOverviewTab, DeliveryCustomersTab, DeliveryOrdersTab, DeliveryWindowsTab, DeliveryProductsTab } from "@/components/DeliveryManagement";
import { CategoryBrandManagement } from "@/components/CategoryBrandManagement";
import { HeroSlidesManagement } from "@/components/HeroSlidesManagement";
import { CategoryBannersManagement } from "@/components/CategoryBannersManagement";
import SettingsManagement from "@/components/SettingsManagement";
import AdminPromotions from "@/pages/AdminPromotions";
import CloverIntegration from "@/components/CloverIntegration";
import DeliveryFeeSettings from "@/components/DeliveryFeeSettings";
import DriverNotificationSettings from "@/components/DriverNotificationSettings";
import AnalyticsDashboard from "@/components/AnalyticsDashboard";
import { FeaturedProductsManagement } from "@/components/FeaturedProductsManagement";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
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

// Brand schema for forms
const brandSchema = z.object({
  categoryId: z.coerce.number({
    required_error: "Category is required",
  }),
  name: z.string({
    required_error: "Brand name is required",
  }),
  image: z.string({
    required_error: "Image URL is required",
  }),
  description: z.string({
    required_error: "Description is required",
  }),
  displayOrder: z.coerce.number().default(0),
  imageSize: z.string().default("medium"),
});

// Category schema for forms
const categorySchema = z.object({
  category: z.string({
    required_error: "Category name is required",
  }),
  bgClass: z.string().optional(),
  displayOrder: z.coerce.number().default(0),
  intervalMs: z.coerce.number().default(5000),
});

// User schema for forms
const userSchema = z.object({
  username: z.string({
    required_error: "Username is required",
  }),
  password: z.string({
    required_error: "Password is required",
  }),
  isAdmin: z.boolean().default(false),
});

// Product category schema for forms
const productCategorySchema = z.object({
  name: z.string({
    required_error: "Category name is required"
  }),
  slug: z.string({
    required_error: "Slug is required"
  }),
  description: z.string().optional(),
  display_order: z.coerce.number().default(0)
});

// Blog category schema for forms
const blogCategorySchema = z.object({
  name: z.string({
    required_error: "Category name is required"
  }),
  slug: z.string({
    required_error: "Slug is required"
  }),
  description: z.string().optional(),
  displayOrder: z.coerce.number().default(0)
});

// Blog post schema for forms
const blogPostSchema = z.object({
  categoryId: z.coerce.number({
    required_error: "Category is required"
  }),
  title: z.string({
    required_error: "Title is required"
  }),
  slug: z.string({
    required_error: "Slug is required"
  }),
  summary: z.string({
    required_error: "Summary is required"
  }),
  content: z.string({
    required_error: "Content is required"
  }),
  imageUrl: z.string().optional(),
  published: z.boolean().default(false),
  featured: z.boolean().default(false),
  metaTitle: z.string().optional(),
  metaDescription: z.string().optional()
});

// Store location schema for forms
const storeLocationSchema = z.object({
  name: z.string({
    required_error: "Store name is required"
  }),
  city: z.string({
    required_error: "City is required"
  }),
  address: z.string({
    required_error: "Address is required"
  }),
  full_address: z.string({
    required_error: "Full address is required"
  }),
  phone: z.string({
    required_error: "Phone number is required"
  }),
  hours: z.string({
    required_error: "Store hours summary is required"
  }),
  closed_days: z.string().optional(),
  image: z.string({
    required_error: "Store image URL is required"
  }),
  lat: z.string({
    required_error: "Latitude is required"
  }),
  lng: z.string({
    required_error: "Longitude is required"
  }),
  google_place_id: z.string().optional(),
  apple_maps_link: z.string().optional(),
  map_embed: z.string({
    required_error: "Map embed code is required"
  }),
  email: z.string().optional(),
  store_code: z.string().optional(),
  opening_hours: z.record(z.string()).default({}),
  services: z.array(z.string()).default([]),
  accepted_payments: z.array(z.string()).default([]),
  area_served: z.array(z.string()).default([]),
  public_transit: z.string().optional(),
  parking: z.string().optional(),
  year_established: z.coerce.number({
    required_error: "Year established is required"
  }),
  price_range: z.string({
    required_error: "Price range is required"
  }),
  social_profiles: z.object({
    facebook: z.string().optional(),
    instagram: z.string().optional(),
    twitter: z.string().optional(),
    yelp: z.string().optional()
  }).optional(),
  description: z.string({
    required_error: "Description is required"
  }),
  neighborhood_info: z.string().optional(),
  amenities: z.array(z.string()).default([])
});

// Product schema for forms
const productSchema = z.object({
  name: z.string({
    required_error: "Product name is required"
  }),
  category: z.string({
    required_error: "Category is required"
  }),
  categoryId: z.coerce.number().optional(),
  image: z.string({
    required_error: "Image URL is required"
  }),
  description: z.string({
    required_error: "Description is required"
  }),
  price: z.string().optional(),
  hidePrice: z.boolean().default(false),
  featured: z.boolean().default(false),
  featuredLabel: z.string().optional(),
  stock: z.coerce.number().optional()
});

// Type definitions based on schemas
type BrandFormValues = z.infer<typeof brandSchema>;
type CategoryFormValues = z.infer<typeof categorySchema>;
type UserFormValues = z.infer<typeof userSchema>;
type BlogCategoryFormValues = z.infer<typeof blogCategorySchema>;
type BlogPostFormValues = z.infer<typeof blogPostSchema>;
type StoreLocationFormValues = z.infer<typeof storeLocationSchema>;
type ProductFormValues = z.infer<typeof productSchema>;
type ProductCategoryFormValues = z.infer<typeof productCategorySchema>;

export default function AdminPage() {
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(true);
  const [adminData, setAdminData] = useState<any>(null);
  const [, navigate] = useLocation();
  const { toast } = useToast();
  
  // Newsletter subscriptions state
  const [deletingSubscriptionId, setDeletingSubscriptionId] = useState<number | null>(null);
  const { data: categories, isLoading: isCategoriesLoading } = useBrandCategories();
  const { data: featuredBrands, isLoading: isFeaturedBrandsLoading } = useFeaturedBrands();
  
  // Query for blog categories
  const { data: blogCategories = [], isLoading: isBlogCategoriesLoading } = useQuery<any[]>({
    queryKey: ['/api/blog-categories'],
    staleTime: 60000,
  });

  // Query for blog posts
  const { data: blogPosts = [], isLoading: isBlogPostsLoading } = useQuery<any[]>({
    queryKey: ['/api/admin/blog-posts'],
    staleTime: 30000,
  });
  
  // Query for store locations
  const { data: storeLocations = [], isLoading: isStoreLocationsLoading } = useQuery<any[]>({
    queryKey: ['/api/store-locations'],
    staleTime: 60000,
  });
  
  // Query for products
  const { data: products = [], isLoading: isProductsLoading } = useQuery<any[]>({
    queryKey: ['/api/products'],
    staleTime: 30000,
  });
  
  // Query for product categories
  const { data: productCategories = [], isLoading: isProductCategoriesLoading } = useQuery<any[]>({
    queryKey: ['/api/product-categories'],
    staleTime: 30000,
  });
  
  // Query for newsletter subscriptions
  const { 
    data: subscriptions = [], 
    isLoading: isSubscriptionsLoading,
    refetch: refetchSubscriptions
  } = useQuery<any[]>({
    queryKey: ['/api/admin/newsletter-subscriptions'],
    staleTime: 30000,
  });
  
  // Newsletter mutation for toggling subscription status
  const { 
    mutate: toggleSubscriptionStatus,
    isPending: isSubscriptionTogglePending 
  } = useMutation({
    mutationFn: ({ id, isActive }: { id: number; isActive: boolean }) => 
      apiRequest('PUT', `/api/admin/newsletter-subscriptions/${id}/toggle`, { is_active: isActive }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/newsletter-subscriptions'] });
      toast({
        title: "Subscription Updated",
        description: "Subscription status has been updated successfully",
      });
    },
    onError: (error) => {
      console.error("Error toggling subscription status:", error);
      toast({
        title: "Error",
        description: "Failed to update subscription status",
        variant: "destructive",
      });
    },
  });
  
  // Newsletter mutation for deleting a subscription
  const { 
    mutate: deleteSubscription,
    isPending: isSubscriptionDeletePending 
  } = useMutation({
    mutationFn: (id: number) => 
      apiRequest('DELETE', `/api/admin/newsletter-subscriptions/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/newsletter-subscriptions'] });
      setDeletingSubscriptionId(null);
      toast({
        title: "Subscription Deleted",
        description: "Newsletter subscription has been deleted successfully",
      });
    },
    onError: (error) => {
      console.error("Error deleting subscription:", error);
      toast({
        title: "Error",
        description: "Failed to delete subscription",
        variant: "destructive",
      });
    },
  });
  
  // State for delivery tab navigation
  const [deliveryActiveTab, setDeliveryActiveTab] = useState("overview");
  
  // State for brand management
  const [brandDialogOpen, setBrandDialogOpen] = useState(false);
  const [editingBrand, setEditingBrand] = useState<any>(null);
  const [deletingBrandId, setDeletingBrandId] = useState<number | null>(null);
  
  // State for category management
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any>(null);
  const [deletingCategoryId, setDeletingCategoryId] = useState<number | null>(null);
  
  // State for user management
  const [userDialogOpen, setUserDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [deletingUserId, setDeletingUserId] = useState<number | null>(null);
  
  // State for blog management
  const [blogCategoryDialogOpen, setBlogCategoryDialogOpen] = useState(false);
  const [editingBlogCategory, setEditingBlogCategory] = useState<any>(null);
  const [deletingBlogCategoryId, setDeletingBlogCategoryId] = useState<number | null>(null);
  
  const [blogPostDialogOpen, setBlogPostDialogOpen] = useState(false);
  const [editingBlogPost, setEditingBlogPost] = useState<any>(null);
  const [deletingBlogPostId, setDeletingBlogPostId] = useState<number | null>(null);
  
  // State for store location management
  const [storeLocationDialogOpen, setStoreLocationDialogOpen] = useState(false);
  const [storeHoursDialogOpen, setStoreHoursDialogOpen] = useState(false);
  const [editingStoreLocation, setEditingStoreLocation] = useState<any>(null);
  const [deletingStoreLocationId, setDeletingStoreLocationId] = useState<number | null>(null);
  const [isSeedingLocations, setIsSeedingLocations] = useState(false);
  
  // State for product category management
  const [productCategoryDialogOpen, setProductCategoryDialogOpen] = useState(false);
  const [editingProductCategory, setEditingProductCategory] = useState<any>(null);
  const [deletingProductCategoryId, setDeletingProductCategoryId] = useState<number | null>(null);
  
  // State for product management
  const [productDialogOpen, setProductDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [deletingProductId, setDeletingProductId] = useState<number | null>(null);
  
  // State for store hours management is now managed in the StoreHoursDialog component
  
  // Function to seed store locations from frontend data
  const seedStoreLocations = async () => {
    try {
      setIsSeedingLocations(true);
      await apiRequest('POST', '/api/admin/seed-store-locations');
      
      toast({
        title: "Store Locations Seeded",
        description: "Store locations have been successfully imported from frontend data.",
      });
      
      // Refresh the data
      queryClient.invalidateQueries({ queryKey: ['/api/store-locations'] });
    } catch (error) {
      console.error("Seed store locations error:", error);
      toast({
        title: "Error",
        description: "Failed to seed store locations",
        variant: "destructive",
      });
    } finally {
      setIsSeedingLocations(false);
    }
  };

  useEffect(() => {
    // Check if user is authenticated and is admin
    const checkAuth = async () => {
      console.log("[AdminPage] Starting auth check...");
      try {
        const response = await fetch('/api/auth/status', {
          credentials: 'include'
        });
        console.log("[AdminPage] Auth response status:", response.status);
        const data = await response.json();
        console.log("[AdminPage] Auth data:", { authenticated: data.authenticated, isAdmin: data.user?.isAdmin });
        
        if (!data.authenticated || !data.user?.isAdmin) {
          console.log("[AdminPage] User not authorized, redirecting to login");
          toast({
            title: "Unauthorized",
            description: "Please login with admin credentials",
            variant: "destructive",
          });
          navigate('/admin/login');
          return;
        }
        
        console.log("[AdminPage] Auth successful, setting admin data");
        setAdminData(data.user);
        setIsLoading(false);
      } catch (error) {
        console.error("[AdminPage] Auth check error:", error);
        toast({
          title: "Error",
          description: "Failed to verify authentication",
          variant: "destructive",
        });
        navigate('/admin/login');
      }
    };
    
    checkAuth();
  }, [navigate, toast]);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include'
      });
      
      toast({
        title: "Logged out",
        description: "You have been successfully logged out",
      });
      
      navigate('/admin/login');
    } catch (error) {
      console.error("Logout error:", error);
      toast({
        title: "Error",
        description: "Failed to logout",
        variant: "destructive",
      });
    }
  };
  
  // Brand form setup
  const brandForm = useForm<BrandFormValues>({
    resolver: zodResolver(brandSchema),
    defaultValues: {
      categoryId: 0,
      name: "",
      image: "",
      description: "",
      displayOrder: 0,
      imageSize: "medium",
    }
  });
  
  // Category form setup
  const categoryForm = useForm<CategoryFormValues>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      category: "",
      bgClass: "bg-gradient-to-br from-gray-900 to-gray-800",
      displayOrder: 0,
      intervalMs: 5000,
    }
  });
  
  // User form setup
  const userForm = useForm<UserFormValues>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      username: "",
      password: "",
      isAdmin: true,
    }
  });
  
  // Blog category form setup
  const blogCategoryForm = useForm<BlogCategoryFormValues>({
    resolver: zodResolver(blogCategorySchema),
    defaultValues: {
      name: "",
      slug: "",
      description: "",
      displayOrder: 0
    }
  });
  
  // Blog post form setup
  const blogPostForm = useForm<BlogPostFormValues>({
    resolver: zodResolver(blogPostSchema),
    defaultValues: {
      categoryId: 0,
      title: "",
      slug: "",
      summary: "",
      content: "",
      imageUrl: "",
      published: false,
      featured: false,
      metaTitle: "",
      metaDescription: ""
    }
  });
  
  // Product category form setup
  const productCategoryForm = useForm<ProductCategoryFormValues>({
    resolver: zodResolver(productCategorySchema),
    defaultValues: {
      name: "",
      slug: "",
      description: "",
      display_order: 0
    }
  });
  
  // Product form setup
  const productForm = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: "",
      category: "devices",
      image: "",
      description: "",
      price: "",
      hidePrice: false,
      featured: false,
      featuredLabel: "",
      stock: 0
    }
  });
  
  // Store location form setup
  const storeLocationForm = useForm<StoreLocationFormValues>({
    resolver: zodResolver(storeLocationSchema),
    defaultValues: {
      name: "",
      city: "",
      address: "",
      full_address: "",
      phone: "",
      hours: "",
      closed_days: "",
      image: "",
      lat: "",
      lng: "",
      google_place_id: "",
      apple_maps_link: "",
      map_embed: "",
      email: "",
      store_code: "",
      opening_hours: {},
      services: [],
      accepted_payments: [],
      area_served: [],
      public_transit: "",
      parking: "",
      year_established: new Date().getFullYear(),
      price_range: "$",
      social_profiles: {
        facebook: "",
        instagram: "",
        twitter: "",
        yelp: ""
      },
      description: "",
      neighborhood_info: "",
      amenities: []
    }
  });
  
  // Reset forms when dialog is opened/closed
  useEffect(() => {
    if (brandDialogOpen && editingBrand) {
      brandForm.reset({
        categoryId: editingBrand.categoryId,
        name: editingBrand.name,
        image: editingBrand.image,
        description: editingBrand.description,
        displayOrder: editingBrand.displayOrder || 0,
        imageSize: editingBrand.imageSize || "medium",
      });
    } else if (brandDialogOpen) {
      brandForm.reset({
        categoryId: categories?.[0]?.id || 0,
        name: "",
        image: "",
        description: "",
        displayOrder: 0,
        imageSize: "medium",
      });
    }
  }, [brandDialogOpen, editingBrand, brandForm, categories]);
  
  useEffect(() => {
    if (categoryDialogOpen && editingCategory) {
      categoryForm.reset({
        category: editingCategory.category,
        bgClass: editingCategory.bgClass || "bg-gradient-to-br from-gray-900 to-gray-800",
        displayOrder: editingCategory.displayOrder || 0,
        intervalMs: editingCategory.intervalMs || 5000,
      });
    } else if (categoryDialogOpen) {
      categoryForm.reset({
        category: "",
        bgClass: "bg-gradient-to-br from-gray-900 to-gray-800",
        displayOrder: 0,
        intervalMs: 5000,
      });
    }
  }, [categoryDialogOpen, editingCategory, categoryForm]);
  
  // Reset blog category form when dialog is opened/closed
  useEffect(() => {
    if (blogCategoryDialogOpen && editingBlogCategory) {
      blogCategoryForm.reset({
        name: editingBlogCategory.name,
        slug: editingBlogCategory.slug,
        description: editingBlogCategory.description || "",
        displayOrder: editingBlogCategory.displayOrder || 0
      });
    } else if (blogCategoryDialogOpen) {
      blogCategoryForm.reset({
        name: "",
        slug: "",
        description: "",
        displayOrder: 0
      });
    }
  }, [blogCategoryDialogOpen, editingBlogCategory, blogCategoryForm]);
  
  // Reset blog post form when dialog is opened/closed
  useEffect(() => {
    if (blogPostDialogOpen && editingBlogPost) {
      blogPostForm.reset({
        categoryId: editingBlogPost.categoryId,
        title: editingBlogPost.title,
        slug: editingBlogPost.slug,
        summary: editingBlogPost.summary,
        content: editingBlogPost.content,
        imageUrl: editingBlogPost.imageUrl || "",
        published: editingBlogPost.published || false,
        featured: editingBlogPost.featured || false,
        metaTitle: editingBlogPost.metaTitle || "",
        metaDescription: editingBlogPost.metaDescription || ""
      });
    } else if (blogPostDialogOpen) {
      blogPostForm.reset({
        categoryId: blogCategories?.[0]?.id || 0,
        title: "",
        slug: "",
        summary: "",
        content: "",
        imageUrl: "",
        published: false,
        featured: false,
        metaTitle: "",
        metaDescription: ""
      });
    }
  }, [blogPostDialogOpen, editingBlogPost, blogPostForm, blogCategories]);
  
  // Reset store location form when dialog is opened/closed
  useEffect(() => {
    if (storeLocationDialogOpen && editingStoreLocation) {
      storeLocationForm.reset({
        name: editingStoreLocation.name,
        city: editingStoreLocation.city,
        address: editingStoreLocation.address,
        full_address: editingStoreLocation.full_address,
        phone: editingStoreLocation.phone,
        hours: editingStoreLocation.hours,
        closed_days: editingStoreLocation.closed_days || "",
        image: editingStoreLocation.image,
        lat: editingStoreLocation.lat,
        lng: editingStoreLocation.lng,
        google_place_id: editingStoreLocation.google_place_id || "",
        apple_maps_link: editingStoreLocation.apple_maps_link || "",
        map_embed: editingStoreLocation.map_embed,
        email: editingStoreLocation.email || "",
        store_code: editingStoreLocation.store_code || "",
        opening_hours: editingStoreLocation.opening_hours || {},
        services: editingStoreLocation.services || [],
        accepted_payments: editingStoreLocation.accepted_payments || [],
        area_served: editingStoreLocation.area_served || [],
        public_transit: editingStoreLocation.public_transit || "",
        parking: editingStoreLocation.parking || "",
        year_established: editingStoreLocation.year_established,
        price_range: editingStoreLocation.price_range,
        social_profiles: editingStoreLocation.social_profiles || {
          facebook: "",
          instagram: "",
          twitter: "",
          yelp: ""
        },
        description: editingStoreLocation.description,
        neighborhood_info: editingStoreLocation.neighborhood_info || "",
        amenities: editingStoreLocation.amenities || []
      });
    } else if (storeLocationDialogOpen) {
      storeLocationForm.reset({
        name: "",
        city: "",
        address: "",
        full_address: "",
        phone: "",
        hours: "",
        closed_days: "",
        image: "",
        lat: "",
        lng: "",
        google_place_id: "",
        apple_maps_link: "",
        map_embed: "",
        email: "",
        store_code: "",
        opening_hours: {},
        services: [],
        accepted_payments: [],
        area_served: [],
        public_transit: "",
        parking: "",
        year_established: new Date().getFullYear(),
        price_range: "$",
        social_profiles: {
          facebook: "",
          instagram: "",
          twitter: "",
          yelp: ""
        },
        description: "",
        neighborhood_info: "",
        amenities: []
      });
    }
  }, [storeLocationDialogOpen, editingStoreLocation, storeLocationForm]);
  
  // Reset product category form when dialog is opened/closed
  useEffect(() => {
    if (productCategoryDialogOpen && editingProductCategory) {
      productCategoryForm.reset({
        name: editingProductCategory.name,
        slug: editingProductCategory.slug,
        description: editingProductCategory.description || "",
        display_order: editingProductCategory.display_order || 0
      });
    } else if (productCategoryDialogOpen) {
      productCategoryForm.reset({
        name: "",
        slug: "",
        description: "",
        display_order: 0
      });
    }
  }, [productCategoryDialogOpen, editingProductCategory, productCategoryForm]);

  // Reset product form when dialog is opened/closed
  useEffect(() => {
    if (productDialogOpen && editingProduct) {
      productForm.reset({
        name: editingProduct.name,
        category: editingProduct.category,
        image: editingProduct.image,
        description: editingProduct.description,
        price: editingProduct.price,
        hidePrice: editingProduct.hidePrice || false,
        featured: editingProduct.featured || false,
        featuredLabel: editingProduct.featuredLabel || "",
        stock: editingProduct.stock || 0
      });
    } else if (productDialogOpen) {
      productForm.reset({
        name: "",
        category: "devices",
        image: "",
        description: "",
        price: "",
        hidePrice: false,
        featured: false,
        featuredLabel: "",
        stock: 0
      });
    }
  }, [productDialogOpen, editingProduct, productForm]);
  
  // Store hours management is now handled in the StoreHoursDialog component
  
  // Product CRUD operations
  const handleAddProduct = () => {
    setEditingProduct(null);
    setProductDialogOpen(true);
  };
  
  const handleEditProduct = (product: any) => {
    setEditingProduct(product);
    setProductDialogOpen(true);
  };
  
  const handleDeleteProduct = (id: number) => {
    setDeletingProductId(id);
  };
  
  const confirmDeleteProduct = async () => {
    if (!deletingProductId) return;
    
    try {
      await apiRequest('DELETE', `/api/admin/products/${deletingProductId}`);
      
      queryClient.invalidateQueries({ queryKey: ['/api/products'] });
      
      toast({
        title: "Product Deleted",
        description: "The product has been successfully deleted",
      });
    } catch (error) {
      console.error("Delete product error:", error);
      toast({
        title: "Error",
        description: "Failed to delete product",
        variant: "destructive",
      });
    } finally {
      setDeletingProductId(null);
    }
  };
  
  const onProductSubmit = async (data: ProductFormValues) => {
    try {
      if (editingProduct) {
        // Update existing product
        await apiRequest('PUT', `/api/admin/products/${editingProduct.id}`, data);
        
        toast({
          title: "Product Updated",
          description: "The product has been successfully updated",
        });
      } else {
        // Create new product
        await apiRequest('POST', '/api/admin/products', data);
        
        toast({
          title: "Product Created",
          description: "The product has been successfully created",
        });
      }
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/products'] });
      
      // Close dialog
      setProductDialogOpen(false);
      setEditingProduct(null);
    } catch (error) {
      console.error("Product submit error:", error);
      toast({
        title: "Error",
        description: "Failed to save product",
        variant: "destructive",
      });
    }
  };

  // Brand CRUD operations
  const handleAddBrand = () => {
    setEditingBrand(null);
    setBrandDialogOpen(true);
  };
  
  const handleEditBrand = (brand: any) => {
    setEditingBrand(brand);
    setBrandDialogOpen(true);
  };
  
  const handleDeleteBrand = (id: number) => {
    setDeletingBrandId(id);
  };
  
  const confirmDeleteBrand = async () => {
    if (!deletingBrandId) return;
    
    try {
      await apiRequest('DELETE', `/api/admin/brands/${deletingBrandId}`);
      
      queryClient.invalidateQueries({ queryKey: ['/api/featured-brands'] });
      
      toast({
        title: "Brand Deleted",
        description: "The brand has been successfully deleted",
      });
    } catch (error) {
      console.error("Delete brand error:", error);
      toast({
        title: "Error",
        description: "Failed to delete brand",
        variant: "destructive",
      });
    } finally {
      setDeletingBrandId(null);
    }
  };
  
  const onBrandSubmit = async (data: BrandFormValues) => {
    try {
      if (editingBrand) {
        // Update existing brand
        await apiRequest('PUT', `/api/admin/brands/${editingBrand.id}`, data);
        
        toast({
          title: "Brand Updated",
          description: "The brand has been successfully updated",
        });
      } else {
        // Create new brand
        await apiRequest('POST', '/api/admin/brands', data);
        
        toast({
          title: "Brand Created",
          description: "The brand has been successfully created",
        });
      }
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/featured-brands'] });
      
      // Close dialog
      setBrandDialogOpen(false);
      setEditingBrand(null);
    } catch (error) {
      console.error("Brand submit error:", error);
      toast({
        title: "Error",
        description: "Failed to save brand",
        variant: "destructive",
      });
    }
  };
  
  // Category CRUD operations
  const handleAddCategory = () => {
    setEditingCategory(null);
    setCategoryDialogOpen(true);
  };
  
  const handleEditCategory = (category: any) => {
    setEditingCategory(category);
    setCategoryDialogOpen(true);
  };
  
  const handleDeleteCategory = (id: number) => {
    setDeletingCategoryId(id);
  };
  
  const confirmDeleteCategory = async () => {
    if (!deletingCategoryId) return;
    
    try {
      await apiRequest('DELETE', `/api/admin/brand-categories/${deletingCategoryId}`);
      
      queryClient.invalidateQueries({ queryKey: ['/api/brand-categories'] });
      queryClient.invalidateQueries({ queryKey: ['/api/featured-brands'] });
      
      toast({
        title: "Category Deleted",
        description: "The category has been successfully deleted",
      });
    } catch (error) {
      console.error("Delete category error:", error);
      toast({
        title: "Error",
        description: "Failed to delete category",
        variant: "destructive",
      });
    } finally {
      setDeletingCategoryId(null);
    }
  };
  
  const onCategorySubmit = async (data: CategoryFormValues) => {
    try {
      if (editingCategory) {
        // Update existing category
        await apiRequest('PUT', `/api/admin/brand-categories/${editingCategory.id}`, data);
        
        toast({
          title: "Category Updated",
          description: "The category has been successfully updated",
        });
      } else {
        // Create new category
        await apiRequest('POST', '/api/admin/brand-categories', data);
        
        toast({
          title: "Category Created",
          description: "The category has been successfully created",
        });
      }
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/brand-categories'] });
      queryClient.invalidateQueries({ queryKey: ['/api/featured-brands'] });
      
      // Close dialog
      setCategoryDialogOpen(false);
      setEditingCategory(null);
    } catch (error) {
      console.error("Category submit error:", error);
      toast({
        title: "Error",
        description: "Failed to save category",
        variant: "destructive",
      });
    }
  };
  
  // Product Category CRUD operations
  const handleAddProductCategory = () => {
    setEditingProductCategory(null);
    setProductCategoryDialogOpen(true);
  };
  
  const handleEditProductCategory = (category: any) => {
    setEditingProductCategory(category);
    setProductCategoryDialogOpen(true);
  };
  
  const handleDeleteProductCategory = (id: number) => {
    setDeletingProductCategoryId(id);
  };
  
  const confirmDeleteProductCategory = async () => {
    if (!deletingProductCategoryId) return;
    
    try {
      await apiRequest('DELETE', `/api/admin/product-categories/${deletingProductCategoryId}`);
      
      queryClient.invalidateQueries({ queryKey: ['/api/product-categories'] });
      queryClient.invalidateQueries({ queryKey: ['/api/products'] });
      
      toast({
        title: "Product Category Deleted",
        description: "The product category has been successfully deleted",
      });
    } catch (error) {
      console.error("Delete product category error:", error);
      toast({
        title: "Error",
        description: "Failed to delete product category",
        variant: "destructive",
      });
    } finally {
      setDeletingProductCategoryId(null);
    }
  };
  
  const onProductCategorySubmit = async (data: ProductCategoryFormValues) => {
    try {
      if (editingProductCategory) {
        // Update existing product category
        await apiRequest('PUT', `/api/admin/product-categories/${editingProductCategory.id}`, data);
        
        toast({
          title: "Product Category Updated",
          description: "The product category has been successfully updated",
        });
      } else {
        // Create new product category
        await apiRequest('POST', '/api/admin/product-categories', data);
        
        toast({
          title: "Product Category Created",
          description: "The product category has been successfully created",
        });
      }
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/product-categories'] });
      queryClient.invalidateQueries({ queryKey: ['/api/products'] });
      
      // Close dialog
      setProductCategoryDialogOpen(false);
      setEditingProductCategory(null);
    } catch (error) {
      console.error("Product category submit error:", error);
      toast({
        title: "Error",
        description: "Failed to save product category",
        variant: "destructive",
      });
    }
  };
  
  // User CRUD operations
  const handleAddUser = () => {
    setEditingUser(null);
    setUserDialogOpen(true);
  };
  
  const onUserSubmit = async (data: UserFormValues) => {
    try {
      await apiRequest('POST', '/api/admin/users', data);
      
      toast({
        title: "User Created",
        description: "The user has been successfully created",
      });
      
      // Close dialog
      setUserDialogOpen(false);
    } catch (error) {
      console.error("User submit error:", error);
      toast({
        title: "Error",
        description: "Failed to create user",
        variant: "destructive",
      });
    }
  };
  
  // Blog Category CRUD operations
  const onBlogCategorySubmit = async (data: BlogCategoryFormValues) => {
    try {
      if (editingBlogCategory) {
        // Update existing blog category
        await apiRequest('PUT', `/api/admin/blog-categories/${editingBlogCategory.id}`, data);
        
        toast({
          title: "Blog Category Updated",
          description: "The blog category has been successfully updated",
        });
      } else {
        // Create new blog category
        await apiRequest('POST', '/api/admin/blog-categories', data);
        
        toast({
          title: "Blog Category Created",
          description: "The blog category has been successfully created",
        });
      }
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/blog-categories'] });
      
      // Close dialog
      setBlogCategoryDialogOpen(false);
      setEditingBlogCategory(null);
    } catch (error) {
      console.error("Blog category submit error:", error);
      toast({
        title: "Error",
        description: "Failed to save blog category",
        variant: "destructive",
      });
    }
  };
  
  const confirmDeleteBlogCategory = async () => {
    if (!deletingBlogCategoryId) return;
    
    try {
      await apiRequest('DELETE', `/api/admin/blog-categories/${deletingBlogCategoryId}`);
      
      queryClient.invalidateQueries({ queryKey: ['/api/blog-categories'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/blog-posts'] });
      
      toast({
        title: "Blog Category Deleted",
        description: "The blog category has been successfully deleted",
      });
    } catch (error) {
      console.error("Delete blog category error:", error);
      toast({
        title: "Error",
        description: "Failed to delete blog category",
        variant: "destructive",
      });
    } finally {
      setDeletingBlogCategoryId(null);
    }
  };
  
  // Blog Post CRUD operations
  const onBlogPostSubmit = async (data: BlogPostFormValues) => {
    try {
      if (editingBlogPost) {
        // Update existing blog post
        await apiRequest('PUT', `/api/admin/blog-posts/${editingBlogPost.id}`, data);
        
        toast({
          title: "Blog Post Updated",
          description: "The blog post has been successfully updated",
        });
      } else {
        // Create new blog post
        await apiRequest('POST', '/api/admin/blog-posts', data);
        
        toast({
          title: "Blog Post Created",
          description: "The blog post has been successfully created",
        });
      }
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/admin/blog-posts'] });
      
      // Close dialog
      setBlogPostDialogOpen(false);
      setEditingBlogPost(null);
    } catch (error) {
      console.error("Blog post submit error:", error);
      toast({
        title: "Error",
        description: "Failed to save blog post",
        variant: "destructive",
      });
    }
  };
  
  const confirmDeleteBlogPost = async () => {
    if (!deletingBlogPostId) return;
    
    try {
      await apiRequest('DELETE', `/api/admin/blog-posts/${deletingBlogPostId}`);
      
      queryClient.invalidateQueries({ queryKey: ['/api/admin/blog-posts'] });
      
      toast({
        title: "Blog Post Deleted",
        description: "The blog post has been successfully deleted",
      });
    } catch (error) {
      console.error("Delete blog post error:", error);
      toast({
        title: "Error",
        description: "Failed to delete blog post",
        variant: "destructive",
      });
    } finally {
      setDeletingBlogPostId(null);
    }
  };
  
  // Store Location CRUD operations
  const onStoreLocationSubmit = async (data: StoreLocationFormValues) => {
    try {
      if (editingStoreLocation) {
        // Update existing store location
        await apiRequest('PUT', `/api/admin/store-locations/${editingStoreLocation.id}`, data);
        
        toast({
          title: "Store Location Updated",
          description: "The store location has been successfully updated",
        });
      } else {
        // Create new store location
        await apiRequest('POST', '/api/admin/store-locations', data);
        
        toast({
          title: "Store Location Created",
          description: "The store location has been successfully created",
        });
      }
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/store-locations'] });
      
      // Close dialog
      setStoreLocationDialogOpen(false);
      setEditingStoreLocation(null);
    } catch (error) {
      console.error("Store location submit error:", error);
      toast({
        title: "Error",
        description: "Failed to save store location",
        variant: "destructive",
      });
    }
  };
  
  const confirmDeleteStoreLocation = async () => {
    if (!deletingStoreLocationId) return;
    
    try {
      await apiRequest('DELETE', `/api/admin/store-locations/${deletingStoreLocationId}`);
      
      queryClient.invalidateQueries({ queryKey: ['/api/store-locations'] });
      
      toast({
        title: "Store Location Deleted",
        description: "The store location has been successfully deleted",
      });
    } catch (error) {
      console.error("Delete store location error:", error);
      toast({
        title: "Error",
        description: "Failed to delete store location",
        variant: "destructive",
      });
    } finally {
      setDeletingStoreLocationId(null);
    }
  };
  
  // Toggle subscription status handler
  const handleToggleSubscriptionStatus = (id: number, isActive: boolean) => {
    toggleSubscriptionStatus({ id, isActive });
  };
  
  // Delete subscription handler
  const handleDeleteSubscription = (id: number) => {
    setDeletingSubscriptionId(id);
  };
  
  // Confirm delete subscription
  const confirmDeleteSubscription = async () => {
    if (deletingSubscriptionId) {
      deleteSubscription(deletingSubscriptionId);
    }
  };
  
  // Export subscriptions in Excel, CSV or JSON format
  const handleExportSubscriptions = (format: 'excel' | 'csv' | 'json') => {
    if (!subscriptions || subscriptions.length === 0) {
      toast({
        title: "No data to export",
        description: "There are no newsletter subscriptions to export.",
        variant: "destructive",
      });
      return;
    }
    
    let content = '';
    let fileName = `newsletter-subscriptions-${new Date().toISOString().split('T')[0]}`;
    let blob: Blob;
    
    if (format === 'excel') {
      // Create Excel workbook with US Central time zone and separate date/time columns
      const headers = ['ID', 'Email', 'Status', 'Subscribed Date', 'Subscribed Time', 'Source', 'IP Address', 'Last Updated Date', 'Last Updated Time'];
      
      // Function to format date in US Central Time
      const formatDateInCentralTime = (dateStr: string) => {
        if (!dateStr) return ['', ''];
        
        // Create date object and format to US Central Time
        const date = new Date(dateStr);
        
        // Format for Central Time (UTC-6 or UTC-5 for daylight savings)
        const options: Intl.DateTimeFormatOptions = { 
          timeZone: 'America/Chicago'
        };
        
        // Format date (MM/DD/YYYY)
        const dateOptions: Intl.DateTimeFormatOptions = {
          ...options,
          year: 'numeric',
          month: '2-digit',
          day: '2-digit'
        };
        const formattedDate = new Intl.DateTimeFormat('en-US', dateOptions).format(date);
        
        // Format time (hh:mm:ss AM/PM)
        const timeOptions: Intl.DateTimeFormatOptions = {
          ...options,
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true
        };
        const formattedTime = new Intl.DateTimeFormat('en-US', timeOptions).format(date);
        
        return [formattedDate, formattedTime];
      };
      
      // Prepare data for Excel with separate date and time columns in US Central Time
      const data = subscriptions.map(sub => {
        const [subscribedDate, subscribedTime] = formatDateInCentralTime(sub.subscribed_at);
        const [lastUpdatedDate, lastUpdatedTime] = sub.last_updated ? 
          formatDateInCentralTime(sub.last_updated) : ['', ''];
        
        return [
          sub.id,
          sub.email,
          sub.is_active ? 'Active' : 'Inactive',
          subscribedDate,
          subscribedTime,
          sub.source || 'Website',
          sub.ip_address || '',
          lastUpdatedDate,
          lastUpdatedTime
        ];
      });
      
      // Create worksheet
      const ws = XLSX.utils.aoa_to_sheet([headers, ...data]);
      
      // Set column widths
      const cols = [
        { wch: 5 },  // ID
        { wch: 30 }, // Email
        { wch: 10 }, // Status
        { wch: 15 }, // Subscribed Date
        { wch: 15 }, // Subscribed Time
        { wch: 15 }, // Source
        { wch: 15 }, // IP Address
        { wch: 15 }, // Last Updated Date
        { wch: 15 }  // Last Updated Time
      ];
      ws['!cols'] = cols;
      
      // Create workbook
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Newsletter Subscribers');
      
      // Generate Excel file
      const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      fileName += '.xlsx';
    } else if (format === 'csv') {
      // Create CSV content with US Central Time
      const headers = ['ID', 'Email', 'Status', 'Subscribed Date', 'Subscribed Time', 'Source', 'IP Address', 'Last Updated Date', 'Last Updated Time'];
      content = headers.join(',') + '\n';
      
      // Function to format date in US Central Time (reuse from above)
      const formatDateInCentralTime = (dateStr: string) => {
        if (!dateStr) return ['', ''];
        
        // Create date object and format to US Central Time
        const date = new Date(dateStr);
        
        // Format for Central Time
        const options: Intl.DateTimeFormatOptions = { 
          timeZone: 'America/Chicago'
        };
        
        // Format date (MM/DD/YYYY)
        const dateOptions: Intl.DateTimeFormatOptions = {
          ...options,
          year: 'numeric',
          month: '2-digit',
          day: '2-digit'
        };
        const formattedDate = new Intl.DateTimeFormat('en-US', dateOptions).format(date);
        
        // Format time (hh:mm:ss AM/PM)
        const timeOptions: Intl.DateTimeFormatOptions = {
          ...options,
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true
        };
        const formattedTime = new Intl.DateTimeFormat('en-US', timeOptions).format(date);
        
        return [formattedDate, formattedTime];
      };
      
      subscriptions.forEach(sub => {
        const [subscribedDate, subscribedTime] = formatDateInCentralTime(sub.subscribed_at);
        const [lastUpdatedDate, lastUpdatedTime] = sub.last_updated ? 
          formatDateInCentralTime(sub.last_updated) : ['', ''];
          
        const row = [
          sub.id,
          `"${sub.email}"`,
          sub.is_active ? 'Active' : 'Inactive',
          `"${subscribedDate}"`,
          `"${subscribedTime}"`,
          `"${sub.source || 'Website'}"`,
          `"${sub.ip_address || ''}"`,
          `"${lastUpdatedDate}"`,
          `"${lastUpdatedTime}"`
        ];
        content += row.join(',') + '\n';
      });
      
      fileName += '.csv';
      blob = new Blob([content], { type: 'text/csv;charset=utf-8' });
    } else {
      // Create JSON content
      content = JSON.stringify(subscriptions, null, 2);
      fileName += '.json';
      blob = new Blob([content], { type: 'application/json' });
    }
    
    // Create and download the file
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({
      title: "Export Successful",
      description: `Newsletter subscriptions exported as ${format.toUpperCase()}.`,
    });
  };

  if (isLoading) {
    return (
      <MainLayout
        title="Admin Dashboard | Vape Cave"
        description="Admin dashboard for Vape Cave website management."
      >
        <div className="min-h-screen bg-gray-900 text-white p-4">
          <div className="flex justify-center items-center min-h-[calc(100vh-200px)]">
            <div className="animate-pulse flex flex-col items-center">
              <div className="h-12 w-36 bg-gray-700 rounded mb-4"></div>
              <div className="h-8 w-64 bg-gray-700 rounded"></div>
            </div>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout
      title="Admin Dashboard | Vape Cave"
      description="Admin dashboard for Vape Cave website management."
    >
      <div className="min-h-screen bg-gray-900 text-white p-4">
        <div className="container mx-auto pt-4 pb-16">
          <header className="flex justify-between items-center mb-8 border-b border-gray-700 pb-4">
            <div>
              <h1 className="text-3xl font-bold">Admin Dashboard</h1>
              <p className="text-gray-400 mt-1">Welcome back, {adminData?.username}</p>
            </div>
            <Button 
              variant="outline" 
              className="border-gray-600 hover:bg-gray-800"
              onClick={handleLogout}
            >
              Logout
            </Button>
          </header>

          <Tabs defaultValue="delivery" className="space-y-6">
            {/* Main Section Selector */}
            <div className="flex justify-center">
              <TabsList className="bg-gray-800 border border-gray-700 grid w-full max-w-lg grid-cols-3">
                <TabsTrigger value="delivery" className="text-base font-semibold" data-testid="tab-delivery-section">
                  🚚 Delivery
                </TabsTrigger>
                <TabsTrigger value="analytics" className="text-base font-semibold" data-testid="tab-analytics-section">
                  📊 Analytics
                </TabsTrigger>
                <TabsTrigger value="website" className="text-base font-semibold" data-testid="tab-website-section">
                  🌐 Website
                </TabsTrigger>
              </TabsList>
            </div>

            {/* Analytics Dashboard Section */}
            <TabsContent value="analytics" className="space-y-4">
              <AnalyticsDashboard />
            </TabsContent>

            {/* Website Management Section */}
            <TabsContent value="website" className="space-y-4">
              <Tabs defaultValue="brands" className="space-y-4">
                <div className="overflow-x-auto -mx-4 px-4">
                  <TabsList className="bg-gray-800 border border-gray-700 w-full md:w-auto mb-2">
                    <TabsTrigger className="flex-1 md:flex-none whitespace-nowrap text-xs md:text-sm" value="dashboard">Dashboard</TabsTrigger>
                    <TabsTrigger className="flex-1 md:flex-none whitespace-nowrap text-xs md:text-sm" value="products">Products</TabsTrigger>
                    <TabsTrigger className="flex-1 md:flex-none whitespace-nowrap text-xs md:text-sm" value="product-categories">Product Categories</TabsTrigger>
                    <TabsTrigger className="flex-1 md:flex-none whitespace-nowrap text-xs md:text-sm" value="brands">Brands</TabsTrigger>
                    <TabsTrigger className="flex-1 md:flex-none whitespace-nowrap text-xs md:text-sm" value="categories">Brand Categories</TabsTrigger>
                    <TabsTrigger className="flex-1 md:flex-none whitespace-nowrap text-xs md:text-sm" value="store-hours">Store Hours</TabsTrigger>
                    <TabsTrigger className="flex-1 md:flex-none whitespace-nowrap text-xs md:text-sm" value="blog">Blog</TabsTrigger>
                    <TabsTrigger className="flex-1 md:flex-none whitespace-nowrap text-xs md:text-sm" value="newsletter">Newsletter</TabsTrigger>
                    <TabsTrigger className="flex-1 md:flex-none whitespace-nowrap text-xs md:text-sm" value="settings">Settings</TabsTrigger>
                  </TabsList>
                </div>
            
            <TabsContent value="dashboard" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="bg-gray-800 border-gray-700">
                  <CardHeader className="pb-2">
                    <CardTitle>Categories</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold">{categories?.length || 0}</p>
                  </CardContent>
                </Card>
                
                <Card className="bg-gray-800 border-gray-700">
                  <CardHeader className="pb-2">
                    <CardTitle>Brands</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold">
                      {isFeaturedBrandsLoading ? (
                        <span className="animate-pulse">...</span>
                      ) : (
                        featuredBrands?.reduce((acc, cat) => acc + cat.brands.length, 0) || 0
                      )}
                    </p>
                  </CardContent>
                </Card>
                
                <Card className="bg-gray-800 border-gray-700">
                  <CardHeader className="pb-2">
                    <CardTitle>Website Status</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center">
                      <div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
                      <p>Online</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="product-categories" className="space-y-4">
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle>Product Categories</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-400 mb-4">
                    Manage product categories to organize your products. These categories will be available when adding or editing products.
                  </p>
                  <div className="flex justify-end mb-4">
                    <Button 
                      onClick={handleAddProductCategory}
                      className="bg-primary hover:bg-primary/90 flex items-center gap-2"
                    >
                      <Plus size={16} />
                      Add New Category
                    </Button>
                  </div>
                  
                  {isProductCategoriesLoading ? (
                    <div className="animate-pulse space-y-3">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="h-14 bg-gray-700 rounded"></div>
                      ))}
                    </div>
                  ) : productCategories && productCategories.length > 0 ? (
                    <div className="rounded-md border border-gray-700 overflow-x-auto">
                      <Table>
                        <TableHeader className="bg-gray-800">
                          <TableRow className="hover:bg-gray-700/50 border-gray-700">
                            <TableHead className="text-gray-400">Name</TableHead>
                            <TableHead className="text-gray-400 hidden md:table-cell">Slug</TableHead>
                            <TableHead className="text-gray-400 hidden md:table-cell">Display Order</TableHead>
                            <TableHead className="text-gray-400 text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {productCategories.map((category: any) => (
                            <TableRow key={category.id} className="hover:bg-gray-700/50 border-gray-700">
                              <TableCell className="font-medium">
                                {category.name}
                                {category.description && (
                                  <div className="text-xs text-gray-400 mt-1 line-clamp-1 md:hidden">
                                    {category.description}
                                  </div>
                                )}
                              </TableCell>
                              <TableCell className="hidden md:table-cell text-gray-400 font-mono text-xs">
                                {category.slug}
                              </TableCell>
                              <TableCell className="hidden md:table-cell text-gray-400">
                                {category.display_order ?? '0'}
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex justify-end gap-2">
                                  <Button 
                                    variant="ghost" 
                                    size="sm"
                                    className="h-8 w-8 p-0 text-gray-400 hover:text-white hover:bg-gray-700"
                                    onClick={() => handleEditProductCategory(category)}
                                  >
                                    <span className="sr-only">Edit</span>
                                    <Edit size={16} />
                                  </Button>
                                  <Button 
                                    variant="ghost" 
                                    size="sm"
                                    className="h-8 w-8 p-0 text-red-400 hover:text-red-300 hover:bg-gray-700"
                                    onClick={() => handleDeleteProductCategory(category.id)}
                                  >
                                    <span className="sr-only">Delete</span>
                                    <Trash2 size={16} />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-400">
                      <p>No product categories found. Click "Add New Category" to create your first category.</p>
                    </div>
                  )}
                </CardContent>
              </Card>
              
              {/* Product Category Dialog */}
              <Dialog open={productCategoryDialogOpen} onOpenChange={setProductCategoryDialogOpen}>
                <DialogContent className="bg-gray-800 text-white border-gray-700 sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>{editingProductCategory ? "Edit Product Category" : "Add New Product Category"}</DialogTitle>
                    <DialogDescription className="text-gray-400">
                      {editingProductCategory 
                        ? "Edit product category details below and save changes." 
                        : "Fill in the details to create a new product category."
                      }
                    </DialogDescription>
                  </DialogHeader>
                  
                  <Form {...productCategoryForm}>
                    <form onSubmit={productCategoryForm.handleSubmit(onProductCategorySubmit)} className="space-y-4">
                      <FormField
                        control={productCategoryForm.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Category Name</FormLabel>
                            <FormControl>
                              <Input
                                className="bg-gray-900 border-gray-700 text-white" 
                                placeholder="Enter category name"
                                {...field}
                                onChange={(e) => {
                                  field.onChange(e);
                                  // Auto-generate slug if slug field is empty or was auto-generated
                                  if (!productCategoryForm.getValues("slug") || 
                                      productCategoryForm.getValues("slug") === 
                                      productCategoryForm.getValues("name").toLowerCase().replace(/\s+/g, '-')) {
                                    productCategoryForm.setValue(
                                      "slug", 
                                      e.target.value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
                                    );
                                  }
                                }}
                              />
                            </FormControl>
                            <FormMessage className="text-red-400" />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={productCategoryForm.control}
                        name="slug"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Slug</FormLabel>
                            <FormControl>
                              <Input
                                className="bg-gray-900 border-gray-700 text-white font-mono text-sm" 
                                placeholder="enter-category-slug"
                                {...field}
                                onChange={(e) => {
                                  // Force lowercase and replace spaces with hyphens
                                  const sanitizedValue = e.target.value
                                    .toLowerCase()
                                    .replace(/\s+/g, '-')
                                    .replace(/[^a-z0-9-]/g, '');
                                  field.onChange(sanitizedValue);
                                }}
                              />
                            </FormControl>
                            <FormDescription className="text-gray-500 text-xs">
                              URL-friendly version of the name. Auto-generated but can be customized.
                            </FormDescription>
                            <FormMessage className="text-red-400" />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={productCategoryForm.control}
                        name="description"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Description</FormLabel>
                            <FormControl>
                              <Textarea
                                className="bg-gray-900 border-gray-700 text-white min-h-[80px]" 
                                placeholder="Enter category description (optional)"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage className="text-red-400" />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={productCategoryForm.control}
                        name="display_order"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Display Order</FormLabel>
                            <FormControl>
                              <Input
                                className="bg-gray-900 border-gray-700 text-white" 
                                type="number"
                                min={0}
                                {...field}
                              />
                            </FormControl>
                            <FormDescription className="text-gray-500 text-xs">
                              Lower numbers display first in category lists. Default is 0.
                            </FormDescription>
                            <FormMessage className="text-red-400" />
                          </FormItem>
                        )}
                      />
                      
                      <DialogFooter className="gap-2 sm:gap-0 pt-4">
                        <Button
                          type="button"
                          variant="outline"
                          className="border-gray-600 hover:bg-gray-700 text-gray-300"
                          onClick={() => setProductCategoryDialogOpen(false)}
                        >
                          Cancel
                        </Button>
                        <Button 
                          type="submit"
                          className="bg-primary hover:bg-primary/90"
                          disabled={productCategoryForm.formState.isSubmitting}
                        >
                          {productCategoryForm.formState.isSubmitting ? (
                            <div className="flex items-center gap-2">
                              <RefreshCcw size={16} className="animate-spin" />
                              Saving...
                            </div>
                          ) : editingProductCategory ? "Update Category" : "Create Category"}
                        </Button>
                      </DialogFooter>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
              
              {/* Delete Product Category Confirmation */}
              <AlertDialog 
                open={deletingProductCategoryId !== null} 
                onOpenChange={() => setDeletingProductCategoryId(null)}
              >
                <AlertDialogContent className="bg-gray-800 text-white border-gray-700">
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                    <AlertDialogDescription className="text-gray-400">
                      This will permanently delete this product category. This action cannot be undone.
                      Any products using this category will need to be reassigned to another category.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel className="bg-gray-700 text-white hover:bg-gray-600 border-gray-600">
                      Cancel
                    </AlertDialogCancel>
                    <AlertDialogAction 
                      className="bg-red-600 hover:bg-red-700"
                      onClick={confirmDeleteProductCategory}
                    >
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </TabsContent>
            
            <TabsContent value="products" className="space-y-4">
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle>Manage Products</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-400 mb-4">
                    This section allows you to add, edit, and delete products displayed on the Products page. You can also mark products as featured to display them on the home page.
                  </p>
                  <div className="flex justify-end mb-4">
                    <Button 
                      onClick={handleAddProduct}
                      className="bg-primary hover:bg-primary/90 flex items-center gap-2"
                    >
                      <Plus size={16} />
                      Add New Product
                    </Button>
                  </div>
                  
                  {isProductsLoading ? (
                    <div className="animate-pulse space-y-3">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="h-14 bg-gray-700 rounded"></div>
                      ))}
                    </div>
                  ) : products && products.length > 0 ? (
                    <div className="rounded-md border border-gray-700 overflow-x-auto">
                      <Table>
                        <TableHeader className="bg-gray-800">
                          <TableRow className="hover:bg-gray-700/50 border-gray-700">
                            <TableHead className="text-gray-400 whitespace-nowrap">Product</TableHead>
                            <TableHead className="text-gray-400 hidden md:table-cell">Category</TableHead>
                            <TableHead className="text-gray-400 hidden md:table-cell">Price</TableHead>
                            <TableHead className="text-gray-400 hidden md:table-cell">Featured</TableHead>
                            <TableHead className="text-gray-400 text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {products.map((product: any) => (
                            <TableRow key={product.id} className="hover:bg-gray-700/50 border-gray-700">
                              <TableCell className="font-medium flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded bg-gray-700 overflow-hidden border border-gray-600 hover:bg-gray-600 transition-all duration-300 cursor-pointer" 
                                  title="Click to see larger preview"
                                  onClick={() => {
                                    toast({
                                      title: "Product Preview",
                                      description: (
                                        <div className="mt-2">
                                          <div className="relative w-full max-w-md mx-auto">
                                            <img 
                                              src={product.image} 
                                              alt={product.name} 
                                              className="rounded-lg max-h-[300px] object-contain mx-auto border border-gray-600 bg-gray-700 p-2"
                                              onError={(e) => {
                                                (e.target as HTMLImageElement).src = 'https://placehold.co/300x300?text=No+Image';
                                              }}
                                            />
                                            <div className="mt-3 text-lg font-medium">{product.name}</div>
                                            <div className="mt-1 text-gray-300">{product.description}</div>
                                            <div className="mt-2 flex justify-between items-center">
                                              <div className="text-primary font-bold">${product.price}</div>
                                              {product.featured && (
                                                <Badge variant="outline" className="bg-primary/20 text-primary border-primary/30">
                                                  Featured
                                                </Badge>
                                              )}
                                            </div>
                                          </div>
                                        </div>
                                      ),
                                      duration: 10000,
                                    });
                                  }}
                                >
                                  <img 
                                    src={product.image} 
                                    alt={product.name} 
                                    className="w-full h-full object-contain" 
                                    onError={(e) => {
                                      (e.target as HTMLImageElement).src = 'https://placehold.co/100x100?text=Error';
                                    }}
                                  />
                                </div>
                                <div>
                                  <div>{product.name}</div>
                                  <div className="text-xs text-gray-400 md:hidden mt-1">
                                    <span className="font-medium">${product.price}</span>
                                    {product.category && (
                                      <span className="inline-block ml-2 px-2 py-1 bg-gray-700 rounded text-xs">
                                        {product.category}
                                      </span>
                                    )}
                                    {product.description && (
                                      <span className="block mt-1 line-clamp-2">{product.description}</span>
                                    )}
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell className="hidden md:table-cell">
                                <span className="inline-block px-2 py-1 bg-gray-700 rounded text-xs">
                                  {product.category}
                                </span>
                              </TableCell>
                              <TableCell className="hidden md:table-cell font-medium text-primary">
                                ${product.price}
                              </TableCell>
                              <TableCell className="hidden md:table-cell">
                                {product.featured ? (
                                  <Badge variant="outline" className="bg-primary/20 text-primary border-primary/30">
                                    {product.featuredLabel || 'Featured'}
                                  </Badge>
                                ) : (
                                  <span className="text-gray-500">—</span>
                                )}
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex justify-end gap-2">
                                  <Button 
                                    variant="ghost" 
                                    size="sm"
                                    className="h-8 w-8 p-0 text-gray-400 hover:text-white hover:bg-gray-700"
                                    onClick={() => handleEditProduct(product)}
                                  >
                                    <span className="sr-only">Edit</span>
                                    <Edit size={16} />
                                  </Button>
                                  <Button 
                                    variant="ghost" 
                                    size="sm"
                                    className="h-8 w-8 p-0 text-red-400 hover:text-red-300 hover:bg-gray-700"
                                    onClick={() => handleDeleteProduct(product.id)}
                                  >
                                    <span className="sr-only">Delete</span>
                                    <Trash2 size={16} />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-400">
                      <p>No products found. Click "Add New Product" to create your first product.</p>
                    </div>
                  )}
                </CardContent>
              </Card>
              
              {/* Product Dialog */}
              <Dialog open={productDialogOpen} onOpenChange={setProductDialogOpen}>
                <DialogContent className="bg-gray-800 text-white border-gray-700 sm:max-w-xl max-h-[90vh] overflow-y-auto mx-4 w-[calc(100%-2rem)]">
                  <DialogHeader>
                    <DialogTitle>{editingProduct ? "Edit Product" : "Add New Product"}</DialogTitle>
                    <DialogDescription className="text-gray-400">
                      {editingProduct 
                        ? "Edit product details below and save your changes." 
                        : "Fill in the product details to add it to your store."
                      }
                    </DialogDescription>
                  </DialogHeader>
                  
                  <Form {...productForm}>
                    <form onSubmit={productForm.handleSubmit(onProductSubmit)} className="space-y-4">
                      <FormField
                        control={productForm.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Product Name</FormLabel>
                            <FormControl>
                              <Input
                                className="bg-gray-900 border-gray-700 text-white" 
                                placeholder="Enter product name"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage className="text-red-400" />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={productForm.control}
                        name="category"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Category</FormLabel>
                            <Select 
                              onValueChange={(value) => {
                                field.onChange(value);
                                
                                // When category is selected, also update the categoryId field
                                if (productCategories && productCategories.length > 0) {
                                  const selectedCategory = productCategories.find((cat: any) => cat.slug === value);
                                  if (selectedCategory) {
                                    productForm.setValue('categoryId', selectedCategory.id);
                                  }
                                }
                              }}
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger className="bg-gray-900 border-gray-700 text-white">
                                  <SelectValue placeholder="Select a category" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent className="bg-gray-900 border-gray-700 text-white">
                                {isProductCategoriesLoading ? (
                                  <SelectItem 
                                    value="loading" 
                                    disabled
                                    className="hover:bg-gray-800 focus:bg-gray-800"
                                  >
                                    Loading categories...
                                  </SelectItem>
                                ) : productCategories && productCategories.length > 0 ? (
                                  productCategories.map((category: any) => (
                                    <SelectItem 
                                      key={category.id}
                                      value={category.slug}
                                      className="hover:bg-gray-800 focus:bg-gray-800"
                                    >
                                      {category.name}
                                    </SelectItem>
                                  ))
                                ) : (
                                  <>
                                    <SelectItem 
                                      value="devices" 
                                      className="hover:bg-gray-800 focus:bg-gray-800"
                                    >
                                      Devices
                                    </SelectItem>
                                    <SelectItem 
                                      value="pods" 
                                      className="hover:bg-gray-800 focus:bg-gray-800"
                                    >
                                      Pods
                                    </SelectItem>
                                    <SelectItem 
                                      value="juice" 
                                      className="hover:bg-gray-800 focus:bg-gray-800"
                                    >
                                      E-Juice
                                    </SelectItem>
                                    <SelectItem 
                                      value="disposables" 
                                      className="hover:bg-gray-800 focus:bg-gray-800"
                                    >
                                      Disposables
                                    </SelectItem>
                                    <SelectItem 
                                      value="accessories" 
                                      className="hover:bg-gray-800 focus:bg-gray-800"
                                    >
                                      Accessories
                                    </SelectItem>
                                  </>
                                )}
                              </SelectContent>
                            </Select>
                            <FormDescription className="text-gray-500 text-xs">
                              Select a product category. You can manage categories in the Product Categories tab.
                            </FormDescription>
                            <FormMessage className="text-red-400" />
                          </FormItem>
                        )}
                      />
                      
                      <input type="hidden" {...productForm.register('categoryId')} />
                      
                      <FormField
                        control={productForm.control}
                        name="price"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Price</FormLabel>
                            <FormControl>
                              <Input
                                className="bg-gray-900 border-gray-700 text-white" 
                                placeholder="29.99"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage className="text-red-400" />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={productForm.control}
                        name="image"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Product Image URL</FormLabel>
                            <FormControl>
                              <Input
                                className="bg-gray-900 border-gray-700 text-white" 
                                placeholder="https://example.com/image.jpg"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage className="text-red-400" />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={productForm.control}
                        name="description"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Description</FormLabel>
                            <FormControl>
                              <Textarea
                                className="bg-gray-900 border-gray-700 text-white min-h-[100px]" 
                                placeholder="Enter product description"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage className="text-red-400" />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={productForm.control}
                        name="stock"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Stock</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                className="bg-gray-900 border-gray-700 text-white" 
                                {...field}
                                onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                              />
                            </FormControl>
                            <FormMessage className="text-red-400" />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={productForm.control}
                        name="featured"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border border-gray-700 p-4">
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                                className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                              />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                              <FormLabel>
                                Feature on Homepage
                              </FormLabel>
                              <FormDescription className="text-gray-400 text-xs">
                                Display this product in the featured products section on the homepage
                              </FormDescription>
                            </div>
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={productForm.control}
                        name="featuredLabel"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Featured Label (Optional)</FormLabel>
                            <FormControl>
                              <Input
                                className="bg-gray-900 border-gray-700 text-white" 
                                placeholder="Best Seller, New Arrival, etc."
                                {...field}
                              />
                            </FormControl>
                            <FormDescription className="text-gray-400 text-xs">
                              Special label to display on the featured product (like "Best Seller" or "New Arrival")
                            </FormDescription>
                            <FormMessage className="text-red-400" />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={productForm.control}
                        name="hidePrice"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border border-gray-700 p-4">
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                                className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                              />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                              <FormLabel>
                                Hide Price
                              </FormLabel>
                              <FormDescription className="text-gray-400 text-xs">
                                Hide the price completely instead of showing $0.00
                              </FormDescription>
                            </div>
                          </FormItem>
                        )}
                      />
                      
                      <DialogFooter className="pt-4">
                        <Button 
                          type="button" 
                          variant="outline" 
                          className="border-gray-600 hover:bg-gray-700 hover:text-white mr-2"
                          onClick={() => setProductDialogOpen(false)}
                        >
                          Cancel
                        </Button>
                        <Button 
                          type="submit" 
                          className="bg-primary hover:bg-primary/90"
                          disabled={productForm.formState.isSubmitting}
                        >
                          {productForm.formState.isSubmitting ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Saving...
                            </>
                          ) : editingProduct ? "Update Product" : "Add Product"}
                        </Button>
                      </DialogFooter>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
              
              {/* Product Delete Confirmation */}
              <AlertDialog open={!!deletingProductId} onOpenChange={(open) => !open && setDeletingProductId(null)}>
                <AlertDialogContent className="bg-gray-800 text-white border-gray-700">
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                    <AlertDialogDescription className="text-gray-400">
                      This action cannot be undone. This will permanently delete the product.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel className="bg-gray-700 text-white hover:bg-gray-600 hover:text-white border-0">
                      Cancel
                    </AlertDialogCancel>
                    <AlertDialogAction 
                      onClick={(e) => {
                        e.preventDefault();
                        confirmDeleteProduct();
                      }}
                      className="bg-red-600 hover:bg-red-700 text-white focus:ring-red-600"
                    >
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </TabsContent>
            
            <TabsContent value="brands" className="space-y-4">
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle>Manage Brands</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-400 mb-4">
                    This section allows you to add, edit, and delete brands across all categories.
                  </p>
                  <div className="flex justify-end mb-4">
                    <Button 
                      onClick={handleAddBrand}
                      className="bg-primary hover:bg-primary/90 flex items-center gap-2"
                    >
                      <Plus size={16} />
                      Add New Brand
                    </Button>
                  </div>
                  
                  {isFeaturedBrandsLoading ? (
                    <div className="animate-pulse space-y-3">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="h-14 bg-gray-700 rounded"></div>
                      ))}
                    </div>
                  ) : featuredBrands && featuredBrands.length > 0 ? (
                    <div className="rounded-md border border-gray-700 overflow-x-auto">
                      <Table>
                        <TableHeader className="bg-gray-800">
                          <TableRow className="hover:bg-gray-700/50 border-gray-700">
                            <TableHead className="text-gray-400 whitespace-nowrap">Brand</TableHead>
                            <TableHead className="text-gray-400 hidden md:table-cell">Category</TableHead>
                            <TableHead className="text-gray-400 hidden md:table-cell">Description</TableHead>
                            <TableHead className="text-gray-400 text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {featuredBrands.map(category => (
                            category.brands.map(brand => (
                              <TableRow key={brand.id} className="hover:bg-gray-700/50 border-gray-700">
                                <TableCell className="font-medium flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                                  <div className="w-14 h-14 sm:w-16 sm:h-16 rounded bg-gray-700 overflow-hidden border border-gray-600 hover:bg-gray-600 transition-all duration-300 cursor-pointer" 
                                    title="Click to see larger preview"
                                    onClick={() => {
                                      toast({
                                        title: "Brand Preview",
                                        description: (
                                          <div className="mt-2">
                                            <div className="relative w-full max-w-md mx-auto">
                                              <BrandsCarousel 
                                                category={category.category}
                                                brands={[{ 
                                                  id: brand.id,
                                                  categoryId: brand.categoryId,
                                                  name: brand.name, 
                                                  image: brand.image, 
                                                  description: brand.description,
                                                  displayOrder: brand.displayOrder,
                                                  createdAt: brand.createdAt
                                                }]}
                                                debug={true}
                                              />
                                              <div className="mt-2 text-sm text-gray-400 text-center">
                                                Debug mode enabled - showing auto-sizing metrics
                                              </div>
                                            </div>
                                          </div>
                                        ),
                                        duration: 10000,
                                      });
                                    }}
                                  >
                                    <img 
                                      src={brand.image} 
                                      alt={brand.name} 
                                      className="w-full h-full object-contain" 
                                      onError={(e) => {
                                        (e.target as HTMLImageElement).src = 'https://placehold.co/100x100?text=Error';
                                      }}
                                    />
                                  </div>
                                  <div>
                                    <div>{brand.name}</div>
                                    <div className="text-xs text-gray-400 md:hidden mt-1">
                                      <span className="font-medium">{category.category}</span>
                                      {brand.description && (
                                        <span className="block mt-1 line-clamp-2">{brand.description}</span>
                                      )}
                                    </div>
                                  </div>
                                </TableCell>
                                <TableCell className="hidden md:table-cell">{category.category}</TableCell>
                                <TableCell className="hidden md:table-cell max-w-xs truncate">{brand.description}</TableCell>
                                <TableCell className="text-right">
                                  <div className="flex justify-end gap-2">
                                    <Button 
                                      variant="ghost" 
                                      size="sm"
                                      className="h-8 w-8 p-0 text-gray-400 hover:text-white hover:bg-gray-700"
                                      onClick={() => handleEditBrand({...brand, categoryId: category.id})}
                                    >
                                      <span className="sr-only">Edit</span>
                                      <Edit size={16} />
                                    </Button>
                                    <Button 
                                      variant="ghost" 
                                      size="sm"
                                      className="h-8 w-8 p-0 text-red-400 hover:text-red-300 hover:bg-gray-700"
                                      onClick={() => handleDeleteBrand(brand.id)}
                                    >
                                      <span className="sr-only">Delete</span>
                                      <Trash2 size={16} />
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-400">
                      <p>No brands found. Click "Add New Brand" to create your first brand.</p>
                    </div>
                  )}
                </CardContent>
              </Card>
              
              {/* Brand Dialog */}
              <Dialog open={brandDialogOpen} onOpenChange={setBrandDialogOpen}>
                <DialogContent className="bg-gray-800 text-white border-gray-700 sm:max-w-xl max-h-[90vh] overflow-y-auto mx-4 w-[calc(100%-2rem)]">
                  <DialogHeader>
                    <DialogTitle>{editingBrand ? "Edit Brand" : "Add New Brand"}</DialogTitle>
                    <DialogDescription className="text-gray-400">
                      {editingBrand 
                        ? "Edit brand details below and save your changes." 
                        : "Fill in the brand details to add it to your store."
                      }
                    </DialogDescription>
                  </DialogHeader>
                  
                  <Form {...brandForm}>
                    <form onSubmit={brandForm.handleSubmit(onBrandSubmit)} className="space-y-4">
                      <FormField
                        control={brandForm.control}
                        name="categoryId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Category</FormLabel>
                            <Select 
                              onValueChange={(value) => field.onChange(parseInt(value))}
                              defaultValue={field.value.toString()}
                            >
                              <FormControl>
                                <SelectTrigger className="bg-gray-900 border-gray-700 text-white">
                                  <SelectValue placeholder="Select a category" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent className="bg-gray-900 border-gray-700 text-white">
                                {categories?.map(category => (
                                  <SelectItem 
                                    key={category.id} 
                                    value={category.id.toString()}
                                    className="hover:bg-gray-800 focus:bg-gray-800"
                                  >
                                    {category.category}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage className="text-red-400" />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={brandForm.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Brand Name</FormLabel>
                            <FormControl>
                              <Input
                                className="bg-gray-900 border-gray-700 text-white" 
                                placeholder="Enter brand name"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage className="text-red-400" />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={brandForm.control}
                        name="image"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Brand Image</FormLabel>
                            <div className="space-y-3">
                              <FormControl>
                                <Input
                                  className="bg-gray-900 border-gray-700 text-white" 
                                  placeholder="https://example.com/image.jpg or upload below"
                                  {...field}
                                />
                              </FormControl>
                              
                              <div className="mt-2">
                                <div className="flex flex-col gap-2">
                                  <div className="flex items-center gap-2">
                                    <Label htmlFor="image-upload" className="text-sm text-gray-400">
                                      Or upload from your computer:
                                    </Label>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <div className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-gray-600 bg-gray-800 cursor-help">
                                          <Info className="h-3.5 w-3.5 text-gray-400" />
                                        </div>
                                      </TooltipTrigger>
                                      <TooltipContent side="right" className="max-w-xs bg-black text-white border-gray-700">
                                        <p className="font-semibold">Optimal Image Dimensions:</p>
                                        <p className="text-xs mt-1">700px width × 530px height</p>
                                        <p className="text-xs mt-1 text-gray-300">
                                          This size ensures your brand images fill available space with minimal distortion.
                                        </p>
                                      </TooltipContent>
                                    </Tooltip>
                                  </div>
                                  <Input
                                    id="image-upload"
                                    type="file"
                                    accept="image/*,.png,.jpg,.jpeg,.webp,.gif,.bmp,.tiff,.svg"
                                    className="bg-gray-900 border-gray-700 text-white cursor-pointer file:cursor-pointer file:border-0 file:bg-gray-800 file:text-white file:px-4 file:py-2 file:mr-4 file:hover:bg-gray-700"
                                    onChange={async (e) => {
                                      const file = e.target.files?.[0];
                                      if (file) {
                                        // Simple base64 encoding
                                        const reader = new FileReader();
                                        reader.onload = (event) => {
                                          if (event.target?.result) {
                                            field.onChange(event.target.result as string);
                                          }
                                        };
                                        reader.readAsDataURL(file);
                                      }
                                    }}
                                  />
                                </div>
                              </div>
                              
                              {field.value && (
                                <div className="mt-2 border border-gray-700 rounded p-2 bg-gray-800">
                                  <p className="text-xs text-gray-400 mb-2">Image Preview:</p>
                                  <div className="w-32 h-32 bg-gray-900 rounded flex items-center justify-center overflow-hidden">
                                    <img 
                                      src={field.value} 
                                      alt="Brand preview" 
                                      className="max-w-full max-h-full object-contain"
                                      onError={(e) => {
                                        (e.target as HTMLImageElement).src = 'https://placehold.co/100x100?text=Invalid+Image';
                                      }}
                                    />
                                  </div>
                                </div>
                              )}
                            </div>
                            <FormDescription className="text-gray-500 text-xs">
                              You can provide a URL or upload various image formats (PNG, JPG, JPEG, WEBP, GIF, BMP, TIFF, SVG).
                            </FormDescription>
                            <FormMessage className="text-red-400" />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={brandForm.control}
                        name="description"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Description</FormLabel>
                            <FormControl>
                              <Textarea
                                className="bg-gray-900 border-gray-700 text-white min-h-[100px]" 
                                placeholder="Enter brand description"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage className="text-red-400" />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={brandForm.control}
                        name="displayOrder"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Display Order</FormLabel>
                            <FormControl>
                              <Input
                                className="bg-gray-900 border-gray-700 text-white" 
                                type="number"
                                min={0}
                                {...field}
                              />
                            </FormControl>
                            <FormDescription className="text-gray-500 text-xs">
                              Lower numbers display first in the carousel. Default is 0.
                            </FormDescription>
                            <FormMessage className="text-red-400" />
                          </FormItem>
                        )}
                      />
                      
                      <DialogFooter className="gap-2 sm:gap-0 pt-4">
                        <Button
                          type="button"
                          variant="outline"
                          className="border-gray-600 hover:bg-gray-700 text-gray-300"
                          onClick={() => setBrandDialogOpen(false)}
                        >
                          Cancel
                        </Button>
                        <Button 
                          type="submit"
                          className="bg-primary hover:bg-primary/90"
                          disabled={brandForm.formState.isSubmitting}
                        >
                          {brandForm.formState.isSubmitting ? (
                            <div className="flex items-center gap-2">
                              <RefreshCcw size={16} className="animate-spin" />
                              Saving...
                            </div>
                          ) : editingBrand ? "Update Brand" : "Create Brand"}
                        </Button>
                      </DialogFooter>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
              
              {/* Delete Brand Confirmation */}
              <AlertDialog open={deletingBrandId !== null} onOpenChange={() => setDeletingBrandId(null)}>
                <AlertDialogContent className="bg-gray-800 text-white border-gray-700">
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                    <AlertDialogDescription className="text-gray-400">
                      This will permanently delete this brand. This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel className="bg-gray-700 text-white hover:bg-gray-600 border-gray-600">
                      Cancel
                    </AlertDialogCancel>
                    <AlertDialogAction 
                      className="bg-red-600 hover:bg-red-700"
                      onClick={confirmDeleteBrand}
                    >
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </TabsContent>
            
            <TabsContent value="categories" className="space-y-4">
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle>Brand Categories</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-400 mb-4">
                    Manage brand categories and their display settings.
                  </p>
                  <div className="flex justify-end mb-4">
                    <Button 
                      onClick={handleAddCategory}
                      className="bg-primary hover:bg-primary/90 flex items-center gap-2"
                    >
                      <Plus size={16} />
                      Add New Category
                    </Button>
                  </div>
                  
                  {isCategoriesLoading ? (
                    <div className="animate-pulse space-y-3">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="h-14 bg-gray-700 rounded"></div>
                      ))}
                    </div>
                  ) : categories && categories.length > 0 ? (
                    <div className="rounded-md border border-gray-700">
                      <Table>
                        <TableHeader className="bg-gray-800">
                          <TableRow className="hover:bg-gray-700/50 border-gray-700">
                            <TableHead className="text-gray-400">Category Name</TableHead>
                            <TableHead className="text-gray-400">Display Order</TableHead>
                            <TableHead className="text-gray-400">Brand Count</TableHead>
                            <TableHead className="text-gray-400 text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {categories.map(category => {
                            // Find matching category in featuredBrands to get brand count
                            const brandCount = featuredBrands?.find(fb => fb.id === category.id)?.brands.length || 0;
                            
                            return (
                              <TableRow key={category.id} className="hover:bg-gray-700/50 border-gray-700">
                                <TableCell className="font-medium">{category.category}</TableCell>
                                <TableCell>{category.displayOrder || 0}</TableCell>
                                <TableCell>{brandCount}</TableCell>
                                <TableCell className="text-right">
                                  <div className="flex justify-end gap-2">
                                    <Button 
                                      variant="ghost" 
                                      size="sm"
                                      className="h-8 w-8 p-0 text-gray-400 hover:text-white hover:bg-gray-700"
                                      onClick={() => handleEditCategory(category)}
                                    >
                                      <span className="sr-only">Edit</span>
                                      <Edit size={16} />
                                    </Button>
                                    <Button 
                                      variant="ghost" 
                                      size="sm"
                                      className="h-8 w-8 p-0 text-red-400 hover:text-red-300 hover:bg-gray-700"
                                      onClick={() => handleDeleteCategory(category.id)}
                                      disabled={brandCount > 0}
                                      title={brandCount > 0 ? "Cannot delete category with brands" : ""}
                                    >
                                      <span className="sr-only">Delete</span>
                                      <Trash2 size={16} />
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-400">
                      <p>No categories found. Click "Add New Category" to create your first category.</p>
                    </div>
                  )}
                </CardContent>
              </Card>
              
              {/* Category Dialog */}
              <Dialog open={categoryDialogOpen} onOpenChange={setCategoryDialogOpen}>
                <DialogContent className="bg-gray-800 text-white border-gray-700 sm:max-w-xl">
                  <DialogHeader>
                    <DialogTitle>{editingCategory ? "Edit Category" : "Add New Category"}</DialogTitle>
                    <DialogDescription className="text-gray-400">
                      {editingCategory 
                        ? "Edit category details below and save your changes." 
                        : "Fill in the category details to add it to your store."
                      }
                    </DialogDescription>
                  </DialogHeader>
                  
                  <Form {...categoryForm}>
                    <form onSubmit={categoryForm.handleSubmit(onCategorySubmit)} className="space-y-4">
                      <FormField
                        control={categoryForm.control}
                        name="category"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Category Name</FormLabel>
                            <FormControl>
                              <Input
                                className="bg-gray-900 border-gray-700 text-white" 
                                placeholder="Enter category name"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage className="text-red-400" />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={categoryForm.control}
                        name="bgClass"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Background Class</FormLabel>
                            <FormControl>
                              <Input
                                className="bg-gray-900 border-gray-700 text-white" 
                                placeholder="bg-gradient-to-br from-gray-900 to-gray-800"
                                {...field}
                              />
                            </FormControl>
                            <FormDescription className="text-gray-500 text-xs">
                              Tailwind CSS class for the background of this category in carousels.
                            </FormDescription>
                            <FormMessage className="text-red-400" />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={categoryForm.control}
                        name="displayOrder"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Display Order</FormLabel>
                            <FormControl>
                              <Input
                                className="bg-gray-900 border-gray-700 text-white" 
                                type="number"
                                min={0}
                                {...field}
                              />
                            </FormControl>
                            <FormDescription className="text-gray-500 text-xs">
                              Lower numbers display first on the homepage.
                            </FormDescription>
                            <FormMessage className="text-red-400" />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={categoryForm.control}
                        name="intervalMs"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Carousel Interval (ms)</FormLabel>
                            <FormControl>
                              <Input
                                className="bg-gray-900 border-gray-700 text-white" 
                                type="number"
                                min={1000}
                                step={500}
                                {...field}
                              />
                            </FormControl>
                            <FormDescription className="text-gray-500 text-xs">
                              Time in milliseconds between slides in the carousel (1000 = 1 second).
                            </FormDescription>
                            <FormMessage className="text-red-400" />
                          </FormItem>
                        )}
                      />
                      
                      <DialogFooter className="gap-2 sm:gap-0 pt-4">
                        <Button
                          type="button"
                          variant="outline"
                          className="border-gray-600 hover:bg-gray-700 text-gray-300"
                          onClick={() => setCategoryDialogOpen(false)}
                        >
                          Cancel
                        </Button>
                        <Button 
                          type="submit"
                          className="bg-primary hover:bg-primary/90"
                          disabled={categoryForm.formState.isSubmitting}
                        >
                          {categoryForm.formState.isSubmitting ? (
                            <div className="flex items-center gap-2">
                              <RefreshCcw size={16} className="animate-spin" />
                              Saving...
                            </div>
                          ) : editingCategory ? "Update Category" : "Create Category"}
                        </Button>
                      </DialogFooter>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
              
              {/* Delete Category Confirmation */}
              <AlertDialog open={deletingCategoryId !== null} onOpenChange={() => setDeletingCategoryId(null)}>
                <AlertDialogContent className="bg-gray-800 text-white border-gray-700">
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                    <AlertDialogDescription className="text-gray-400">
                      This will permanently delete this category. This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel className="bg-gray-700 text-white hover:bg-gray-600 border-gray-600">
                      Cancel
                    </AlertDialogCancel>
                    <AlertDialogAction 
                      className="bg-red-600 hover:bg-red-700"
                      onClick={confirmDeleteCategory}
                    >
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </TabsContent>
            
            <TabsContent value="store-hours" className="space-y-4">
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Manage Store Hours</CardTitle>
                  {storeLocations.length === 0 && (
                    <Button 
                      onClick={seedStoreLocations}
                      className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
                      disabled={isSeedingLocations}
                    >
                      {isSeedingLocations ? (
                        <>
                          <RefreshCcw size={16} className="animate-spin" />
                          Seeding...
                        </>
                      ) : (
                        <>
                          <RefreshCcw size={16} />
                          Seed Store Locations
                        </>
                      )}
                    </Button>
                  )}
                </CardHeader>
                <CardContent>
                  <p className="text-gray-400 mb-4">
                    {storeLocations.length === 0 
                      ? "No store locations found. Click the 'Seed Store Locations' button to import locations from the frontend data."
                      : "Update the operating hours for each of your store locations."}
                  </p>
                  
                  {isStoreLocationsLoading ? (
                    <div className="animate-pulse space-y-3">
                      {[1, 2].map((i) => (
                        <div key={i} className="h-14 bg-gray-700 rounded"></div>
                      ))}
                    </div>
                  ) : storeLocations && storeLocations.length > 0 ? (
                    <div className="space-y-8">
                      {storeLocations.map(location => (
                        <div key={location.id} className="rounded-lg border border-gray-700 overflow-hidden">
                          <div className="bg-gray-800 px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <div className="flex items-center gap-3">
                              <div className="w-12 h-12 rounded bg-gray-700 overflow-hidden border border-gray-600">
                                <img 
                                  src={location.image} 
                                  alt={location.name} 
                                  className="w-full h-full object-cover" 
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).src = 'https://placehold.co/100x100?text=Store';
                                  }}
                                />
                              </div>
                              <div>
                                <h3 className="font-medium text-lg">{location.name}</h3>
                                <p className="text-sm text-gray-400">{location.city} - {location.phone}</p>
                              </div>
                            </div>
                            <Button 
                              onClick={() => {
                                // Set up the store hours editing
                                setEditingStoreLocation(location);
                                setStoreHoursDialogOpen(true);
                              }}
                              className="bg-primary hover:bg-primary/90 flex items-center gap-2 text-sm"
                              size="sm"
                            >
                              <Clock size={14} />
                              Edit Hours
                            </Button>
                          </div>
                          
                          <div className="p-4 bg-gray-900">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <h4 className="text-sm font-medium mb-2">Regular Hours</h4>
                                <div className="space-y-1">
                                  {location.opening_hours && Object.entries(location.opening_hours).map(([day, hours]) => (
                                    <div key={day} className="flex justify-between text-sm">
                                      <span className="text-gray-400 font-medium w-28">{day}</span>
                                      <span>{String(hours)}</span>
                                    </div>
                                  ))}
                                  {(!location.opening_hours || Object.keys(location.opening_hours).length === 0) && (
                                    <div className="text-sm text-gray-400 italic">
                                      No regular hours set.
                                    </div>
                                  )}
                                </div>
                              </div>
                              
                              <div>
                                <h4 className="text-sm font-medium mb-2">Special Hours & Closures</h4>
                                {location.closed_days ? (
                                  <div className="space-y-1">
                                    <div className="text-sm text-gray-300">
                                      {location.closed_days}
                                    </div>
                                  </div>
                                ) : (
                                  <div className="text-sm text-gray-400 italic">
                                    No special hours or holiday closures set.
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-400">
                      <p>No store locations found. Please add store locations first to manage their hours.</p>
                    </div>
                  )}
                </CardContent>
              </Card>
              
              {/* Store Location Dialog */}
              <Dialog open={storeLocationDialogOpen} onOpenChange={setStoreLocationDialogOpen}>
                <DialogContent className="bg-gray-800 text-white border-gray-700 sm:max-w-2xl max-h-[90vh] overflow-y-auto mx-4 w-[calc(100%-2rem)]">
                  <DialogHeader>
                    <DialogTitle>{editingStoreLocation ? "Edit Store Location" : "Add New Store Location"}</DialogTitle>
                    <DialogDescription className="text-gray-400">
                      {editingStoreLocation 
                        ? "Edit store location details below and save your changes." 
                        : "Fill in the store location details to add it to your system."
                      }
                    </DialogDescription>
                  </DialogHeader>
                  
                  <Form {...storeLocationForm}>
                    <form onSubmit={storeLocationForm.handleSubmit(onStoreLocationSubmit)} className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={storeLocationForm.control}
                          name="name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Store Name</FormLabel>
                              <FormControl>
                                <Input
                                  className="bg-gray-900 border-gray-700 text-white" 
                                  placeholder="Vape Cave"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage className="text-red-400" />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={storeLocationForm.control}
                          name="city"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>City</FormLabel>
                              <FormControl>
                                <Input
                                  className="bg-gray-900 border-gray-700 text-white" 
                                  placeholder="Arlington"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage className="text-red-400" />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={storeLocationForm.control}
                          name="address"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Address</FormLabel>
                              <FormControl>
                                <Input
                                  className="bg-gray-900 border-gray-700 text-white" 
                                  placeholder="123 Main St"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage className="text-red-400" />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={storeLocationForm.control}
                          name="full_address"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Full Address</FormLabel>
                              <FormControl>
                                <Input
                                  className="bg-gray-900 border-gray-700 text-white" 
                                  placeholder="123 Main St, Arlington, TX 76010"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage className="text-red-400" />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={storeLocationForm.control}
                          name="phone"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Phone</FormLabel>
                              <FormControl>
                                <Input
                                  className="bg-gray-900 border-gray-700 text-white" 
                                  placeholder="(123) 456-7890"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage className="text-red-400" />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={storeLocationForm.control}
                          name="email"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Email (Optional)</FormLabel>
                              <FormControl>
                                <Input
                                  className="bg-gray-900 border-gray-700 text-white" 
                                  placeholder="store@example.com"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage className="text-red-400" />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <div className="border-t border-gray-700 pt-4">
                        <h3 className="font-medium mb-2">Location Map Information</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField
                            control={storeLocationForm.control}
                            name="lat"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Latitude</FormLabel>
                                <FormControl>
                                  <Input
                                    className="bg-gray-900 border-gray-700 text-white" 
                                    placeholder="32.735687"
                                    {...field}
                                  />
                                </FormControl>
                                <FormMessage className="text-red-400" />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={storeLocationForm.control}
                            name="lng"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Longitude</FormLabel>
                                <FormControl>
                                  <Input
                                    className="bg-gray-900 border-gray-700 text-white" 
                                    placeholder="-97.108066"
                                    {...field}
                                  />
                                </FormControl>
                                <FormMessage className="text-red-400" />
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>
                      
                      <div className="border-t border-gray-700 pt-4">
                        <h3 className="font-medium mb-2">More Information</h3>
                        <div className="grid grid-cols-1 gap-4">
                          <FormField
                            control={storeLocationForm.control}
                            name="description"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Store Description</FormLabel>
                                <FormControl>
                                  <Textarea
                                    className="bg-gray-900 border-gray-700 text-white min-h-[100px]" 
                                    placeholder="Enter a detailed description of this store location..."
                                    {...field}
                                  />
                                </FormControl>
                                <FormMessage className="text-red-400" />
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>
                      
                      <DialogFooter className="pt-4">
                        <Button 
                          type="submit" 
                          className="bg-primary hover:bg-primary/90 w-full sm:w-auto"
                          disabled={storeLocationForm.formState.isSubmitting}
                        >
                          {storeLocationForm.formState.isSubmitting ? (
                            <div className="flex items-center gap-2">
                              <RefreshCcw size={16} className="animate-spin" />
                              Saving...
                            </div>
                          ) : (
                            "Save Store Location"
                          )}
                        </Button>
                      </DialogFooter>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
              
              {/* Store Location Delete Confirmation */}
              <AlertDialog open={!!deletingStoreLocationId} onOpenChange={() => setDeletingStoreLocationId(null)}>
                <AlertDialogContent className="bg-gray-800 text-white border-gray-700">
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription className="text-gray-400">
                      This action cannot be undone. This will permanently delete the
                      store location and all associated data.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel className="hover:bg-gray-700 hover:text-white border-gray-600">Cancel</AlertDialogCancel>
                    <AlertDialogAction 
                      className="bg-red-600 hover:bg-red-700"
                      onClick={confirmDeleteStoreLocation}
                    >
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </TabsContent>
            
            <TabsContent value="blog" className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <Card className="bg-gray-800 border-gray-700">
                  <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                    <CardTitle>Blog Categories</CardTitle>
                    <Button 
                      onClick={() => {
                        setEditingBlogCategory(null);
                        setBlogCategoryDialogOpen(true);
                      }}
                      className="bg-primary hover:bg-primary/90 flex items-center gap-1 h-8 px-3"
                      size="sm"
                    >
                      <Plus size={14} />
                      <span className="hidden sm:inline">Add Category</span>
                      <span className="sm:hidden">Add</span>
                    </Button>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-400 mb-4 text-sm">
                      Manage your blog categories for organizing blog posts.
                    </p>
                    
                    {isBlogCategoriesLoading ? (
                      <div className="animate-pulse space-y-3">
                        {[1, 2, 3].map((i) => (
                          <div key={i} className="h-14 bg-gray-700 rounded"></div>
                        ))}
                      </div>
                    ) : blogCategories && blogCategories.length > 0 ? (
                      <div className="rounded-md border border-gray-700">
                        <Table>
                          <TableHeader className="bg-gray-800">
                            <TableRow className="hover:bg-gray-700/50 border-gray-700">
                              <TableHead className="text-gray-400">Name</TableHead>
                              <TableHead className="text-gray-400">Slug</TableHead>
                              <TableHead className="text-gray-400">Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {blogCategories.map((category: any) => (
                              <TableRow key={category.id} className="hover:bg-gray-700/50 border-gray-700">
                                <TableCell className="font-medium">{category.name}</TableCell>
                                <TableCell className="font-mono text-sm">{category.slug}</TableCell>
                                <TableCell>
                                  <div className="flex gap-2">
                                    <Button 
                                      variant="ghost" 
                                      size="sm"
                                      className="h-8 w-8 p-0 text-gray-400 hover:text-white hover:bg-gray-700"
                                      onClick={() => {
                                        setEditingBlogCategory(category);
                                        setBlogCategoryDialogOpen(true);
                                      }}
                                    >
                                      <span className="sr-only">Edit</span>
                                      <Edit size={16} />
                                    </Button>
                                    <Button 
                                      variant="ghost" 
                                      size="sm"
                                      className="h-8 w-8 p-0 text-red-400 hover:text-red-300 hover:bg-gray-700"
                                      onClick={() => setDeletingBlogCategoryId(category.id)}
                                    >
                                      <span className="sr-only">Delete</span>
                                      <Trash2 size={16} />
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-400">
                        <p>No blog categories found. Click "Add New Category" to create your first category.</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
                
                <Card className="bg-gray-800 border-gray-700">
                  <CardHeader>
                    <CardTitle>Recent Blog Posts</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-400 mb-4">
                      Quick summary of recent blog posts and their status.
                    </p>
                    {isBlogPostsLoading ? (
                      <div className="animate-pulse space-y-3">
                        {[1, 2, 3].map((i) => (
                          <div key={i} className="h-14 bg-gray-700 rounded"></div>
                        ))}
                      </div>
                    ) : blogPosts && blogPosts.length > 0 ? (
                      <div className="space-y-3">
                        {blogPosts.slice(0, 5).map((post: any) => (
                          <div key={post.id} className="flex items-center gap-3 p-3 border border-gray-700 rounded-md">
                            <div className="flex-1">
                              <div className="font-medium">{post.title}</div>
                              <div className="text-sm text-gray-400">{new Date(post.createdAt).toLocaleDateString()}</div>
                            </div>
                            <div className="flex items-center gap-2">
                              {post.published ? (
                                <div className="flex items-center text-sm text-green-500">
                                  <div className="w-2 h-2 rounded-full bg-green-500 mr-1"></div>
                                  Published
                                </div>
                              ) : (
                                <div className="flex items-center text-sm text-yellow-500">
                                  <div className="w-2 h-2 rounded-full bg-yellow-500 mr-1"></div>
                                  Draft
                                </div>
                              )}
                              <Button 
                                variant="ghost" 
                                size="sm"
                                className="h-8 w-8 p-0 text-gray-400 hover:text-white hover:bg-gray-700"
                                onClick={() => {
                                  setEditingBlogPost(post);
                                  setBlogPostDialogOpen(true);
                                }}
                              >
                                <span className="sr-only">Edit</span>
                                <Edit size={16} />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-400">
                        <p>No blog posts found. Add a blog category first, then create your first post.</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
              
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                  <CardTitle>Blog Posts</CardTitle>
                  <Button 
                    onClick={() => {
                      setEditingBlogPost(null);
                      setBlogPostDialogOpen(true);
                    }}
                    className="bg-primary hover:bg-primary/90 flex items-center gap-1 h-9 px-3"
                    size="sm"
                    disabled={!blogCategories || blogCategories.length === 0}
                  >
                    <Plus size={14} />
                    <span className="hidden sm:inline">Add New Post</span>
                    <span className="sm:hidden">Add Post</span>
                  </Button>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-400 mb-4">
                    Manage all your blog content from this section. Create, edit and publish articles.
                  </p>
                  
                  {isBlogPostsLoading ? (
                    <div className="animate-pulse space-y-3">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="h-14 bg-gray-700 rounded"></div>
                      ))}
                    </div>
                  ) : blogPosts && blogPosts.length > 0 ? (
                    <div className="rounded-md border border-gray-700 overflow-x-auto">
                      <Table>
                        <TableHeader className="bg-gray-800">
                          <TableRow className="hover:bg-gray-700/50 border-gray-700">
                            <TableHead className="text-gray-400">Title</TableHead>
                            <TableHead className="text-gray-400 hidden md:table-cell">Category</TableHead>
                            <TableHead className="text-gray-400">Status</TableHead>
                            <TableHead className="text-gray-400 hidden md:table-cell">Date</TableHead>
                            <TableHead className="text-gray-400 text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {blogPosts.map((post: any) => {
                            const category = blogCategories?.find((c: any) => c.id === post.categoryId);
                            return (
                              <TableRow key={post.id} className="hover:bg-gray-700/50 border-gray-700">
                                <TableCell className="font-medium">
                                  <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                                    <div className="flex items-center gap-2">
                                      {post.featured && (
                                        <Tooltip>
                                          <TooltipTrigger asChild>
                                            <div className="text-yellow-500">
                                              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                                              </svg>
                                            </div>
                                          </TooltipTrigger>
                                          <TooltipContent side="top" className="bg-black text-white border-gray-700">
                                            Featured Post
                                          </TooltipContent>
                                        </Tooltip>
                                      )}
                                      {post.title}
                                    </div>
                                    <div className="text-xs text-gray-400 md:hidden">
                                      {category?.name || 'Unknown'} • {new Date(post.createdAt).toLocaleDateString()}
                                    </div>
                                  </div>
                                </TableCell>
                                <TableCell className="hidden md:table-cell">{category?.name || 'Unknown'}</TableCell>
                                <TableCell>
                                  {post.published ? (
                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                                      Published
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                                      Draft
                                    </span>
                                  )}
                                </TableCell>
                                <TableCell className="hidden md:table-cell">{new Date(post.createdAt).toLocaleDateString()}</TableCell>
                                <TableCell className="text-right">
                                  <div className="flex justify-end gap-2">
                                    <Button 
                                      variant="ghost" 
                                      size="sm"
                                      className="h-8 w-8 p-0 text-gray-400 hover:text-white hover:bg-gray-700"
                                      onClick={() => {
                                        setEditingBlogPost(post);
                                        setBlogPostDialogOpen(true);
                                      }}
                                    >
                                      <span className="sr-only">Edit</span>
                                      <Edit size={16} />
                                    </Button>
                                    <Button 
                                      variant="ghost" 
                                      size="sm"
                                      className="h-8 w-8 p-0 text-red-400 hover:text-red-300 hover:bg-gray-700"
                                      onClick={() => setDeletingBlogPostId(post.id)}
                                    >
                                      <span className="sr-only">Delete</span>
                                      <Trash2 size={16} />
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-400">
                      <p>No blog posts found. Click "Add New Post" to create your first article.</p>
                      {(!blogCategories || blogCategories.length === 0) && (
                        <p className="mt-2 text-sm text-yellow-500">You need to create a blog category first before adding posts.</p>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
              
              {/* Blog Category Dialog */}
              <Dialog open={blogCategoryDialogOpen} onOpenChange={setBlogCategoryDialogOpen}>
                <DialogContent className="bg-gray-800 text-white border-gray-700 max-h-[90vh] overflow-y-auto mx-4 w-[calc(100%-2rem)]">
                  <DialogHeader>
                    <DialogTitle>{editingBlogCategory ? "Edit Blog Category" : "Add New Blog Category"}</DialogTitle>
                    <DialogDescription className="text-gray-400">
                      {editingBlogCategory 
                        ? "Edit blog category details below and save your changes." 
                        : "Fill in the category details to organize your blog content."
                      }
                    </DialogDescription>
                  </DialogHeader>
                  
                  <Form {...blogCategoryForm}>
                    <form onSubmit={blogCategoryForm.handleSubmit(onBlogCategorySubmit)} className="space-y-4">
                      <FormField
                        control={blogCategoryForm.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Category Name</FormLabel>
                            <FormControl>
                              <Input
                                className="bg-gray-900 border-gray-700 text-white" 
                                placeholder="Enter category name"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage className="text-red-400" />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={blogCategoryForm.control}
                        name="slug"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>URL Slug</FormLabel>
                            <FormControl>
                              <Input
                                className="bg-gray-900 border-gray-700 text-white" 
                                placeholder="Enter URL slug (e.g., vaping-tips)"
                                {...field}
                              />
                            </FormControl>
                            <FormDescription className="text-gray-500">
                              This will be used in the URL for this category (only lowercase letters, numbers, and hyphens)
                            </FormDescription>
                            <FormMessage className="text-red-400" />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={blogCategoryForm.control}
                        name="description"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Description</FormLabel>
                            <FormControl>
                              <Textarea
                                className="bg-gray-900 border-gray-700 text-white" 
                                placeholder="Enter category description"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage className="text-red-400" />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={blogCategoryForm.control}
                        name="displayOrder"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Display Order</FormLabel>
                            <FormControl>
                              <Input
                                className="bg-gray-900 border-gray-700 text-white" 
                                type="number"
                                placeholder="Enter display order (lower numbers appear first)"
                                {...field}
                              />
                            </FormControl>
                            <FormDescription className="text-gray-500">
                              Categories will be sorted by this number, lower numbers appear first
                            </FormDescription>
                            <FormMessage className="text-red-400" />
                          </FormItem>
                        )}
                      />
                    
                      <DialogFooter className="pt-4">
                        <Button 
                          type="submit" 
                          className="bg-primary hover:bg-primary/90"
                        >
                          {editingBlogCategory ? "Save Changes" : "Create Category"}
                        </Button>
                      </DialogFooter>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
              
              {/* Blog Post Dialog */}
              <Dialog open={blogPostDialogOpen} onOpenChange={setBlogPostDialogOpen}>
                <DialogContent className="bg-gray-800 text-white border-gray-700 sm:max-w-3xl max-h-[90vh] overflow-y-auto mx-4 w-[calc(100%-2rem)]">
                  <DialogHeader>
                    <DialogTitle>{editingBlogPost ? "Edit Blog Post" : "Add New Blog Post"}</DialogTitle>
                    <DialogDescription className="text-gray-400">
                      {editingBlogPost 
                        ? "Edit blog post details below and save your changes." 
                        : "Create a new blog post with the details below."
                      }
                    </DialogDescription>
                  </DialogHeader>
                  
                  <Form {...blogPostForm}>
                    <form onSubmit={blogPostForm.handleSubmit(onBlogPostSubmit)} className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={blogPostForm.control}
                          name="title"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Post Title</FormLabel>
                              <FormControl>
                                <Input
                                  className="bg-gray-900 border-gray-700 text-white" 
                                  placeholder="Enter post title"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage className="text-red-400" />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={blogPostForm.control}
                          name="slug"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>URL Slug</FormLabel>
                              <FormControl>
                                <Input
                                  className="bg-gray-900 border-gray-700 text-white" 
                                  placeholder="Enter URL slug (e.g., benefits-of-vaping)"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage className="text-red-400" />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={blogPostForm.control}
                          name="categoryId"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Category</FormLabel>
                              <Select 
                                onValueChange={(value) => field.onChange(parseInt(value))}
                                defaultValue={field.value ? field.value.toString() : undefined}
                              >
                                <FormControl>
                                  <SelectTrigger className="bg-gray-900 border-gray-700 text-white">
                                    <SelectValue placeholder="Select a category" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent className="bg-gray-900 border-gray-700 text-white">
                                  {blogCategories?.map((category: any) => (
                                    <SelectItem 
                                      key={category.id} 
                                      value={category.id.toString()}
                                      className="hover:bg-gray-800 focus:bg-gray-800"
                                    >
                                      {category.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage className="text-red-400" />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={blogPostForm.control}
                          name="imageUrl"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Featured Image URL</FormLabel>
                              <FormControl>
                                <Input
                                  className="bg-gray-900 border-gray-700 text-white" 
                                  placeholder="Enter image URL"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage className="text-red-400" />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <FormField
                        control={blogPostForm.control}
                        name="summary"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Summary</FormLabel>
                            <FormControl>
                              <Textarea
                                className="bg-gray-900 border-gray-700 text-white" 
                                placeholder="Enter post summary (appears in previews and snippets)"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage className="text-red-400" />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={blogPostForm.control}
                        name="content"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Post Content</FormLabel>
                            <FormControl>
                              <Textarea
                                className="bg-gray-900 border-gray-700 text-white min-h-[200px]" 
                                placeholder="Enter post content (markdown supported)"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage className="text-red-400" />
                          </FormItem>
                        )}
                      />
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={blogPostForm.control}
                          name="published"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border border-gray-700 p-4">
                              <div className="space-y-0.5">
                                <FormLabel className="text-base">
                                  Published
                                </FormLabel>
                                <FormDescription className="text-gray-500">
                                  Make this post visible to the public
                                </FormDescription>
                              </div>
                              <FormControl>
                                <Switch
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                  className="data-[state=checked]:bg-primary"
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={blogPostForm.control}
                          name="featured"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border border-gray-700 p-4">
                              <div className="space-y-0.5">
                                <FormLabel className="text-base">
                                  Featured Post
                                </FormLabel>
                                <FormDescription className="text-gray-500">
                                  Highlight this post in featured sections
                                </FormDescription>
                              </div>
                              <FormControl>
                                <Switch
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                  className="data-[state=checked]:bg-primary"
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <div className="space-y-3 pt-3 border-t border-gray-700">
                        <h4 className="text-sm font-medium text-gray-300">SEO Settings</h4>
                        
                        <FormField
                          control={blogPostForm.control}
                          name="metaTitle"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Meta Title</FormLabel>
                              <FormControl>
                                <Input
                                  className="bg-gray-900 border-gray-700 text-white" 
                                  placeholder="Enter SEO title (leave empty to use post title)"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage className="text-red-400" />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={blogPostForm.control}
                          name="metaDescription"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Meta Description</FormLabel>
                              <FormControl>
                                <Textarea
                                  className="bg-gray-900 border-gray-700 text-white" 
                                  placeholder="Enter SEO description (leave empty to use post summary)"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage className="text-red-400" />
                            </FormItem>
                          )}
                        />
                      </div>
                    
                      <DialogFooter className="pt-4">
                        <Button 
                          type="submit" 
                          className="bg-primary hover:bg-primary/90"
                        >
                          {editingBlogPost ? "Save Changes" : "Create Post"}
                        </Button>
                      </DialogFooter>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
              
              {/* Delete Blog Category Confirmation Dialog */}
              <AlertDialog open={!!deletingBlogCategoryId} onOpenChange={(open) => !open && setDeletingBlogCategoryId(null)}>
                <AlertDialogContent className="bg-gray-800 text-white border-gray-700">
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure you want to delete this category?</AlertDialogTitle>
                    <AlertDialogDescription className="text-gray-400">
                      This will permanently delete the blog category and all of its associated posts.
                      This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel className="bg-gray-700 text-white hover:bg-gray-600 border-gray-600">
                      Cancel
                    </AlertDialogCancel>
                    <AlertDialogAction 
                      className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
                      onClick={confirmDeleteBlogCategory}
                    >
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
              
              {/* Delete Blog Post Confirmation Dialog */}
              <AlertDialog open={!!deletingBlogPostId} onOpenChange={(open) => !open && setDeletingBlogPostId(null)}>
                <AlertDialogContent className="bg-gray-800 text-white border-gray-700">
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure you want to delete this post?</AlertDialogTitle>
                    <AlertDialogDescription className="text-gray-400">
                      This will permanently delete the blog post.
                      This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel className="bg-gray-700 text-white hover:bg-gray-600 border-gray-600">
                      Cancel
                    </AlertDialogCancel>
                    <AlertDialogAction 
                      className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
                      onClick={confirmDeleteBlogPost}
                    >
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </TabsContent>
            
            <TabsContent value="newsletter" className="space-y-4">
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Newsletter Subscriptions</CardTitle>
                  <Button 
                    variant="outline" 
                    className="border-gray-600 hover:bg-gray-700 text-gray-300 flex items-center gap-2"
                    onClick={() => {
                      // Force refetch subscriptions
                      refetchSubscriptions();
                    }}
                  >
                    <RefreshCcw size={16} />
                    Refresh
                  </Button>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-400 mb-4">
                    Manage your newsletter subscribers, export subscription data, and track subscription activity.
                  </p>
                  
                  <div className="flex flex-col md:flex-row justify-between mb-6 gap-4">
                    <div className="flex flex-wrap gap-2">
                      <Button
                        className="bg-primary hover:bg-primary/90 flex items-center gap-2"
                        onClick={() => handleExportSubscriptions('excel')}
                      >
                        <Download size={16} />
                        Export Excel
                      </Button>
                      <Button
                        variant="outline"
                        className="border-gray-600 hover:bg-gray-700 text-gray-300 flex items-center gap-2"
                        onClick={() => handleExportSubscriptions('csv')}
                      >
                        <Download size={16} />
                        Export CSV
                      </Button>
                      <Button
                        variant="outline"
                        className="border-gray-600 hover:bg-gray-700 text-gray-300 flex items-center gap-2"
                        onClick={() => handleExportSubscriptions('json')}
                      >
                        <Download size={16} />
                        Export JSON
                      </Button>
                    </div>
                    
                    <div className="flex items-center gap-2 text-sm text-gray-400">
                      <Clock size={16} />
                      <span>Last updated: {new Date().toLocaleString()}</span>
                    </div>
                  </div>
                  
                  {isSubscriptionsLoading ? (
                    <div className="animate-pulse space-y-3">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <div key={i} className="h-14 bg-gray-700 rounded"></div>
                      ))}
                    </div>
                  ) : subscriptions && subscriptions.length > 0 ? (
                    <div className="rounded-md border border-gray-700 overflow-x-auto">
                      <Table>
                        <TableHeader className="bg-gray-800">
                          <TableRow className="hover:bg-gray-700/50 border-gray-700">
                            <TableHead className="text-gray-400">Email</TableHead>
                            <TableHead className="text-gray-400 hidden md:table-cell">Status</TableHead>
                            <TableHead className="text-gray-400 hidden md:table-cell">Date</TableHead>
                            <TableHead className="text-gray-400 hidden lg:table-cell">Source</TableHead>
                            <TableHead className="text-gray-400 text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {subscriptions.map((subscription: any) => (
                            <TableRow key={subscription.id} className="hover:bg-gray-700/50 border-gray-700">
                              <TableCell className="font-medium">
                                {subscription.email}
                                <div className="text-xs text-gray-400 mt-1 md:hidden">
                                  {subscription.is_active ? (
                                    <Badge variant="outline" className="bg-green-900/20 text-green-400 border-green-800 text-xs">
                                      Active
                                    </Badge>
                                  ) : (
                                    <Badge variant="outline" className="bg-red-900/20 text-red-400 border-red-800 text-xs">
                                      Unsubscribed
                                    </Badge>
                                  )}
                                  <span className="ml-2">{new Date(subscription.subscribed_at).toLocaleDateString()}</span>
                                </div>
                              </TableCell>
                              <TableCell className="hidden md:table-cell">
                                {subscription.is_active ? (
                                  <Badge variant="outline" className="bg-green-900/20 text-green-400 border-green-800">
                                    Active
                                  </Badge>
                                ) : (
                                  <Badge variant="outline" className="bg-red-900/20 text-red-400 border-red-800">
                                    Unsubscribed
                                  </Badge>
                                )}
                              </TableCell>
                              <TableCell className="hidden md:table-cell text-gray-400">
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <span>{new Date(subscription.subscribed_at).toLocaleDateString()}</span>
                                  </TooltipTrigger>
                                  <TooltipContent className="bg-gray-900 border-gray-700 text-white">
                                    <p>Subscribed: {new Date(subscription.subscribed_at).toLocaleString()}</p>
                                    {subscription.last_updated && (
                                      <p>Last Updated: {new Date(subscription.last_updated).toLocaleString()}</p>
                                    )}
                                  </TooltipContent>
                                </Tooltip>
                              </TableCell>
                              <TableCell className="hidden lg:table-cell text-gray-400">
                                {subscription.source || "Website"}
                                {subscription.ip_address && (
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <span className="ml-2 cursor-help">
                                        <Info size={14} className="inline opacity-60" />
                                      </span>
                                    </TooltipTrigger>
                                    <TooltipContent className="bg-gray-900 border-gray-700 text-white">
                                      <p>IP: {subscription.ip_address}</p>
                                    </TooltipContent>
                                  </Tooltip>
                                )}
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex justify-end gap-2">
                                  <Button 
                                    variant="ghost" 
                                    size="sm"
                                    className={`h-8 px-2 ${subscription.is_active ? 'text-green-400 hover:text-green-300' : 'text-red-400 hover:text-red-300'} hover:bg-gray-700`}
                                    onClick={() => handleToggleSubscriptionStatus(subscription.id, !subscription.is_active)}
                                  >
                                    <span className="sr-only">{subscription.is_active ? 'Deactivate' : 'Activate'}</span>
                                    {subscription.is_active ? 'Active' : 'Inactive'}
                                  </Button>
                                  <Button 
                                    variant="ghost" 
                                    size="sm"
                                    className="h-8 w-8 p-0 text-red-400 hover:text-red-300 hover:bg-gray-700"
                                    onClick={() => handleDeleteSubscription(subscription.id)}
                                  >
                                    <span className="sr-only">Delete</span>
                                    <Trash2 size={16} />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  ) : (
                    <div className="text-center py-12 text-gray-400 flex flex-col items-center justify-center">
                      <AlertCircle className="h-12 w-12 mb-4 text-gray-500" />
                      <p className="text-lg font-medium">No newsletter subscriptions found</p>
                      <p className="text-sm mt-1">Subscriptions will appear here when customers sign up.</p>
                    </div>
                  )}
                </CardContent>
              </Card>
              
              {/* Delete Subscription Confirmation */}
              <AlertDialog 
                open={deletingSubscriptionId !== null} 
                onOpenChange={() => setDeletingSubscriptionId(null)}
              >
                <AlertDialogContent className="bg-gray-800 text-white border-gray-700">
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                    <AlertDialogDescription className="text-gray-400">
                      This will permanently delete this subscription from your database.
                      This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter className="gap-2 sm:gap-0">
                    <AlertDialogCancel className="border-gray-600 hover:bg-gray-700 text-gray-300">
                      Cancel
                    </AlertDialogCancel>
                    <AlertDialogAction
                      className="bg-red-600 hover:bg-red-700 text-white"
                      onClick={confirmDeleteSubscription}
                    >
                      {isSubscriptionDeletePending ? (
                        <div className="flex items-center gap-2">
                          <RefreshCcw size={16} className="animate-spin" />
                          Deleting...
                        </div>
                      ) : "Delete Subscription"}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </TabsContent>

            <TabsContent value="settings" className="space-y-4">
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle>Website Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-8">
                  {/* User Management Section */}
                  <div>
                    <h3 className="text-xl font-bold mb-4">User Management</h3>
                    <p className="text-gray-400 mb-4">
                      Add additional admin users who can access the dashboard.
                    </p>
                    <div className="flex justify-end mb-4">
                      <Button 
                        onClick={handleAddUser}
                        className="bg-primary hover:bg-primary/90 flex items-center gap-2"
                      >
                        <Plus size={16} />
                        Add New Admin User
                      </Button>
                    </div>
                    
                    {/* User Management Dialog */}
                    <Dialog open={userDialogOpen} onOpenChange={setUserDialogOpen}>
                      <DialogContent className="bg-gray-800 text-white border-gray-700 sm:max-w-md">
                        <DialogHeader>
                          <DialogTitle>Create Admin User</DialogTitle>
                          <DialogDescription className="text-gray-400">
                            Add a new administrator who can access all dashboard features.
                          </DialogDescription>
                        </DialogHeader>
                        
                        <Form {...userForm}>
                          <form onSubmit={userForm.handleSubmit(onUserSubmit)} className="space-y-4">
                            <FormField
                              control={userForm.control}
                              name="username"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Username</FormLabel>
                                  <FormControl>
                                    <Input
                                      className="bg-gray-900 border-gray-700 text-white" 
                                      placeholder="Enter username"
                                      autoComplete="off"
                                      {...field}
                                    />
                                  </FormControl>
                                  <FormMessage className="text-red-400" />
                                </FormItem>
                              )}
                            />
                            
                            <FormField
                              control={userForm.control}
                              name="password"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Password</FormLabel>
                                  <FormControl>
                                    <Input
                                      className="bg-gray-900 border-gray-700 text-white" 
                                      type="password"
                                      placeholder="Enter password"
                                      autoComplete="new-password"
                                      {...field}
                                    />
                                  </FormControl>
                                  <FormDescription className="text-gray-500 text-xs">
                                    Password must be at least 6 characters.
                                  </FormDescription>
                                  <FormMessage className="text-red-400" />
                                </FormItem>
                              )}
                            />
                            
                            <FormField
                              control={userForm.control}
                              name="isAdmin"
                              render={({ field }) => (
                                <FormItem className="hidden">
                                  <FormControl>
                                    <input type="hidden" {...field} value="true" />
                                  </FormControl>
                                </FormItem>
                              )}
                            />
                            
                            <DialogFooter className="gap-2 sm:gap-0 pt-4">
                              <Button
                                type="button"
                                variant="outline"
                                className="border-gray-600 hover:bg-gray-700 text-gray-300"
                                onClick={() => setUserDialogOpen(false)}
                              >
                                Cancel
                              </Button>
                              <Button 
                                type="submit"
                                className="bg-primary hover:bg-primary/90"
                                disabled={userForm.formState.isSubmitting}
                              >
                                {userForm.formState.isSubmitting ? (
                                  <div className="flex items-center gap-2">
                                    <RefreshCcw size={16} className="animate-spin" />
                                    Creating...
                                  </div>
                                ) : "Create Admin User"}
                              </Button>
                            </DialogFooter>
                          </form>
                        </Form>
                      </DialogContent>
                    </Dialog>
                  </div>
                  
                  {/* Store Information Section */}
                  <div>
                    <h3 className="text-xl font-bold mb-4">About the Admin Dashboard</h3>
                    <div className="space-y-4 text-gray-300">
                      <p>This admin dashboard allows you to manage your vape shop's content:</p>
                      <ul className="list-disc list-inside space-y-2 pl-4">
                        <li>
                          <strong>Brands Management:</strong> Add, edit, and delete product brands. 
                          Each brand requires a name, image URL, and description.
                        </li>
                        <li>
                          <strong>Categories Management:</strong> Create and manage brand categories.
                          Categories are used to organize brands in the carousel display.
                        </li>
                        <li>
                          <strong>User Management:</strong> Add additional admin users who can access the dashboard.
                        </li>
                      </ul>
                      
                      <div className="p-4 bg-gray-700/50 rounded-md mt-4">
                        <h4 className="font-semibold mb-2">Tips:</h4>
                        <ul className="list-disc list-inside space-y-1 pl-4 text-sm">
                          <li>Use high-quality, consistent brand images for the best appearance</li>
                          <li>Set display order to control the sequence of categories and brands</li>
                          <li>Carousel interval controls how fast the brand slides change</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
              </Tabs>
            </TabsContent>

            {/* Delivery Management Section */}
            <TabsContent value="delivery" className="space-y-4">
              <Tabs value={deliveryActiveTab} onValueChange={setDeliveryActiveTab} className="space-y-4">
                <div className="overflow-x-auto -mx-4 px-4">
                  <TabsList className="bg-gray-800 border border-gray-700 w-full md:w-auto mb-2">
                    <TabsTrigger className="flex-1 md:flex-none whitespace-nowrap text-xs md:text-sm" value="overview">Overview</TabsTrigger>
                    <TabsTrigger className="flex-1 md:flex-none whitespace-nowrap text-xs md:text-sm" value="hero">Home</TabsTrigger>
                    <TabsTrigger className="flex-1 md:flex-none whitespace-nowrap text-xs md:text-sm" value="featured">Featured</TabsTrigger>
                    <TabsTrigger className="flex-1 md:flex-none whitespace-nowrap text-xs md:text-sm" value="categories">Categories</TabsTrigger>
                    <TabsTrigger className="flex-1 md:flex-none whitespace-nowrap text-xs md:text-sm" value="customers">Customers</TabsTrigger>
                    <TabsTrigger className="flex-1 md:flex-none whitespace-nowrap text-xs md:text-sm" value="products">Products</TabsTrigger>
                    <TabsTrigger className="flex-1 md:flex-none whitespace-nowrap text-xs md:text-sm" value="orders">Orders</TabsTrigger>
                    <TabsTrigger className="flex-1 md:flex-none whitespace-nowrap text-xs md:text-sm" value="windows">Windows</TabsTrigger>
                    <TabsTrigger className="flex-1 md:flex-none whitespace-nowrap text-xs md:text-sm" value="promotions">Promos</TabsTrigger>
                    <TabsTrigger className="flex-1 md:flex-none whitespace-nowrap text-xs md:text-sm" value="settings">Settings</TabsTrigger>
                  </TabsList>
                </div>

                <TabsContent value="overview" className="space-y-4">
                  <DeliveryOverviewTab onNavigateToTab={setDeliveryActiveTab} />
                </TabsContent>

                <TabsContent value="hero" className="space-y-4">
                  <HeroSlidesManagement />
                  <CategoryBannersManagement />
                </TabsContent>

                <TabsContent value="featured" className="space-y-4">
                  <FeaturedProductsManagement />
                </TabsContent>

                <TabsContent value="categories" className="space-y-4">
                  <CategoryBrandManagement />
                </TabsContent>

                <TabsContent value="customers" className="space-y-4">
                  <DeliveryCustomersTab />
                </TabsContent>

                <TabsContent value="products" className="space-y-4">
                  <DeliveryProductsTab />
                </TabsContent>

                <TabsContent value="orders" className="space-y-4">
                  <DeliveryOrdersTab />
                </TabsContent>

                <TabsContent value="windows" className="space-y-4">
                  <DeliveryWindowsTab />
                </TabsContent>

                <TabsContent value="promotions" className="space-y-4">
                  <AdminPromotions />
                </TabsContent>

                <TabsContent value="settings" className="space-y-4">
                  <DeliveryFeeSettings />

                  <DriverNotificationSettings />

                  <Card className="bg-gray-800 border-gray-700">
                    <CardHeader>
                      <CardTitle>Delivery Settings</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <SettingsManagement />
                    </CardContent>
                  </Card>

                  <Card className="bg-gray-800 border-gray-700">
                    <CardHeader>
                      <CardTitle>Clover POS Integration</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-400 mb-4">
                        Connect your Clover account to automatically sync products from your POS system.
                      </p>
                      <CloverIntegration />
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Store Hours Dialog */}
      <StoreHoursDialog
        open={storeHoursDialogOpen}
        onOpenChange={setStoreHoursDialogOpen}
        storeLocation={editingStoreLocation}
        onSave={async (data) => {
          if (!editingStoreLocation) return;
          
          try {
            // Prepare the update data
            const updateData = {
              opening_hours: data.opening_hours,
              closed_days: data.closed_days,
              hours: data.hours
            };
            
            // Update the store location
            await apiRequest('PUT', `/api/admin/store-locations/${editingStoreLocation.id}/hours`, updateData);
            
            // Success notification
            toast({
              title: "Hours Updated",
              description: `Store hours for ${editingStoreLocation.name} have been updated successfully`,
            });
            
            // Refresh the data
            queryClient.invalidateQueries({ queryKey: ['/api/store-locations'] });
            
            // Close the dialog
            setStoreHoursDialogOpen(false);
            setEditingStoreLocation(null);
          } catch (error) {
            console.error("Update store hours error:", error);
            toast({
              title: "Error",
              description: "Failed to update store hours",
              variant: "destructive",
            });
          }
        }}
      />
    </MainLayout>
  );
}