import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { User, Package, Lock, MapPin, Phone, Mail, ChevronRight, Edit2, Save, X, RefreshCw, ShoppingCart, Download } from "lucide-react";
import { DeliveryHeader } from "@/components/DeliveryHeader";
import { DeliveryCategoryNav } from "@/components/DeliveryCategoryNav";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useInactivityTimeout } from "@/hooks/useInactivityTimeout";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { DeliveryCustomer, DeliveryOrder, DeliveryOrderItem, DeliveryProduct } from "@shared/schema";
import { DeliveryFooter } from "@/components/DeliveryFooter";

interface OrderWithItems extends DeliveryOrder {
  items?: Array<DeliveryOrderItem & { product?: DeliveryProduct }>;
}


export default function DeliveryAccount() {
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState<"profile" | "orders">("profile");
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editForm, setEditForm] = useState({
    fullName: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    zipCode: ""
  });
  const { toast } = useToast();

  useInactivityTimeout({
    timeoutMinutes: 30,
    warningMinutes: 2,
  });

  // Fetch customer data
  const { data: customer, isLoading: isLoadingCustomer } = useQuery<DeliveryCustomer>({
    queryKey: ['/api/delivery/customers/me'],
    queryFn: async () => {
      const response = await fetch('/api/delivery/customers/me', {
        credentials: 'include',
      });
      if (!response.ok) {
        setLocation('/delivery/login');
        throw new Error('Not authenticated');
      }
      return response.json();
    },
  });

  // Fetch customer orders with items
  const { data: orders = [], isLoading: isLoadingOrders } = useQuery<OrderWithItems[]>({
    queryKey: ['/api/delivery/orders/my-orders'],
    queryFn: async () => {
      const response = await fetch('/api/delivery/orders/my-orders', {
        credentials: 'include',
      });
      if (!response.ok) {
        throw new Error('Failed to fetch orders');
      }
      return response.json();
    },
  });

  // Profile update mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (data: typeof editForm) => {
      const res = await apiRequest("PATCH", "/api/delivery/customers/me", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/delivery/customers/me'] });
      toast({ title: "Profile Updated", description: "Your profile has been updated successfully." });
      setIsEditingProfile(false);
    },
    onError: (error: any) => {
      toast({ title: "Update Failed", description: error.message || "Failed to update profile.", variant: "destructive" });
    },
  });

  const startEditingProfile = () => {
    if (customer) {
      setEditForm({
        fullName: customer.fullName || "",
        phone: customer.phone || "",
        address: customer.address || "",
        city: customer.city || "",
        state: customer.state || "",
        zipCode: customer.zipCode || ""
      });
      setIsEditingProfile(true);
    }
  };

  const cancelEditing = () => {
    setIsEditingProfile(false);
  };

  const saveProfile = () => {
    updateProfileMutation.mutate(editForm);
  };

  // Reorder mutation
  const reorderMutation = useMutation({
    mutationFn: async (orderId: number) => {
      const res = await apiRequest("POST", `/api/delivery/orders/${orderId}/reorder`);
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/delivery/cart'] });
      if (data.unavailableItems?.length > 0) {
        toast({ 
          title: "Partial Reorder", 
          description: `Added ${data.addedCount} item(s) to cart. ${data.unavailableItems.length} item(s) are no longer available.` 
        });
      } else {
        toast({ title: "Added to Cart", description: data.message });
      }
      setLocation('/delivery/cart');
    },
    onError: (error: any) => {
      toast({ title: "Reorder Failed", description: error.message || "Failed to reorder items.", variant: "destructive" });
    },
  });

  const handleReorder = (orderId: number) => {
    reorderMutation.mutate(orderId);
  };

  const handleDownloadReceipt = async (orderId: number) => {
    try {
      const response = await fetch(`/api/delivery/orders/${orderId}/receipt`, {
        credentials: 'include'
      });
      if (!response.ok) {
        throw new Error('Failed to download receipt');
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `receipt-${orderId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast({ title: "Downloaded", description: "Receipt downloaded successfully." });
    } catch (error) {
      toast({ title: "Download Failed", description: "Failed to download receipt.", variant: "destructive" });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'confirmed':
        return 'text-blue-600 bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400';
      case 'preparing':
        return 'text-purple-600 bg-purple-100 dark:bg-purple-900/20 dark:text-purple-400';
      case 'out_for_delivery':
        return 'text-orange-600 bg-orange-100 dark:bg-orange-900/20 dark:text-orange-400';
      case 'delivered':
        return 'text-green-600 bg-green-100 dark:bg-green-900/20 dark:text-green-400';
      case 'cancelled':
        return 'text-red-600 bg-red-100 dark:bg-red-900/20 dark:text-red-400';
      default:
        return 'text-muted-foreground bg-muted';
    }
  };

  const formatStatus = (status: string) => {
    return status
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  if (isLoadingCustomer) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <DeliveryHeader showSearch={false} showBackButton={true} />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading your account...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!customer) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <DeliveryHeader showSearch={false} customerName={customer.fullName} showBackButton={true} />
      <DeliveryCategoryNav />

      <main className="flex-1 container mx-auto px-4 py-6">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2" data-testid="text-account-title">My Account</h1>
          <p className="text-muted-foreground">Manage your profile and view order history</p>
        </div>

        <div className="grid lg:grid-cols-[280px_1fr] gap-6">
          {/* Sidebar Navigation */}
          <aside className="space-y-2">
            <Card className="overflow-hidden">
              <CardContent className="p-0">
                <nav className="flex flex-col">
                  <button
                    onClick={() => setActiveTab("profile")}
                    className={`flex items-center gap-3 px-4 py-3 text-left transition-colors ${
                      activeTab === "profile"
                        ? "bg-primary text-primary-foreground"
                        : "hover:bg-muted"
                    }`}
                    data-testid="button-nav-profile"
                  >
                    <User className="h-5 w-5" />
                    <span className="font-medium">Profile</span>
                  </button>
                  <Separator />
                  <button
                    onClick={() => setActiveTab("orders")}
                    className={`flex items-center gap-3 px-4 py-3 text-left transition-colors ${
                      activeTab === "orders"
                        ? "bg-primary text-primary-foreground"
                        : "hover:bg-muted"
                    }`}
                    data-testid="button-nav-orders"
                  >
                    <Package className="h-5 w-5" />
                    <span className="font-medium">Order History</span>
                  </button>
                  <Separator />
                  <Link href="/delivery/change-password" className="flex items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-muted">
                    <Lock className="h-5 w-5" />
                    <span className="font-medium">Change Password</span>
                    <ChevronRight className="h-4 w-4 ml-auto" />
                  </Link>
                </nav>
              </CardContent>
            </Card>
          </aside>

          {/* Main Content Area */}
          <div className="space-y-6">
            {activeTab === "profile" && (
              <motion.div
                key="profile"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.2 }}
              >
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <User className="h-5 w-5" />
                        Profile Information
                      </CardTitle>
                      <CardDescription>
                        Your personal information for delivery service
                      </CardDescription>
                    </div>
                    {!isEditingProfile && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={startEditingProfile}
                        className="gap-2"
                        data-testid="button-edit-profile"
                      >
                        <Edit2 className="h-4 w-4" />
                        Edit Profile
                      </Button>
                    )}
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {isEditingProfile ? (
                      <>
                        {/* Edit Form */}
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor="fullName">Full Name</Label>
                            <Input
                              id="fullName"
                              value={editForm.fullName}
                              onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })}
                              placeholder="Enter your full name"
                              data-testid="input-edit-fullname"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="phone">Phone Number</Label>
                            <Input
                              id="phone"
                              value={editForm.phone}
                              onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                              placeholder="(123) 456-7890"
                              data-testid="input-edit-phone"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="address">Street Address</Label>
                            <Input
                              id="address"
                              value={editForm.address}
                              onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                              placeholder="123 Main St"
                              data-testid="input-edit-address"
                            />
                          </div>
                          <div className="grid grid-cols-3 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="city">City</Label>
                              <Input
                                id="city"
                                value={editForm.city}
                                onChange={(e) => setEditForm({ ...editForm, city: e.target.value })}
                                placeholder="City"
                                data-testid="input-edit-city"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="state">State</Label>
                              <Input
                                id="state"
                                value={editForm.state}
                                onChange={(e) => setEditForm({ ...editForm, state: e.target.value })}
                                placeholder="TX"
                                maxLength={2}
                                data-testid="input-edit-state"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="zipCode">ZIP Code</Label>
                              <Input
                                id="zipCode"
                                value={editForm.zipCode}
                                onChange={(e) => setEditForm({ ...editForm, zipCode: e.target.value })}
                                placeholder="75034"
                                maxLength={10}
                                data-testid="input-edit-zipcode"
                              />
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex gap-3 justify-end mt-6">
                          <Button
                            variant="outline"
                            onClick={cancelEditing}
                            disabled={updateProfileMutation.isPending}
                            data-testid="button-cancel-edit"
                          >
                            <X className="h-4 w-4 mr-2" />
                            Cancel
                          </Button>
                          <Button
                            onClick={saveProfile}
                            disabled={updateProfileMutation.isPending}
                            data-testid="button-save-profile"
                          >
                            <Save className="h-4 w-4 mr-2" />
                            {updateProfileMutation.isPending ? "Saving..." : "Save Changes"}
                          </Button>
                        </div>

                        <div className="p-4 bg-muted/50 rounded-lg">
                          <p className="text-sm text-muted-foreground">
                            Note: Email address cannot be changed. Contact support if you need to update your email.
                          </p>
                        </div>
                      </>
                    ) : (
                      <>
                        {/* Full Name */}
                        <div className="flex items-start gap-4">
                          <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                            <User className="h-6 w-6 text-primary" />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-muted-foreground mb-1">Full Name</p>
                            <p className="text-lg font-semibold" data-testid="text-customer-name">
                              {customer.fullName}
                            </p>
                          </div>
                        </div>

                        <Separator />

                        {/* Email */}
                        <div className="flex items-start gap-4">
                          <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                            <Mail className="h-6 w-6 text-primary" />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-muted-foreground mb-1">Email Address</p>
                            <p className="text-lg font-semibold" data-testid="text-customer-email">
                              {customer.email}
                            </p>
                          </div>
                        </div>

                        <Separator />

                        {/* Phone */}
                        <div className="flex items-start gap-4">
                          <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                            <Phone className="h-6 w-6 text-primary" />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-muted-foreground mb-1">Phone Number</p>
                            <p className="text-lg font-semibold" data-testid="text-customer-phone">
                              {customer.phone}
                            </p>
                          </div>
                        </div>

                        <Separator />

                        {/* Delivery Address */}
                        <div className="flex items-start gap-4">
                          <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                            <MapPin className="h-6 w-6 text-primary" />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-muted-foreground mb-1">Delivery Address</p>
                            <p className="text-lg font-semibold" data-testid="text-customer-address">
                              {customer.address}
                            </p>
                            <p className="text-muted-foreground">
                              {customer.city}, {customer.state} {customer.zipCode}
                            </p>
                          </div>
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {activeTab === "orders" && (
              <motion.div
                key="orders"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.2 }}
              >
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Package className="h-5 w-5" />
                      Order History
                    </CardTitle>
                    <CardDescription>
                      View all your past and current orders
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {isLoadingOrders ? (
                      <div className="text-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                        <p className="text-muted-foreground">Loading orders...</p>
                      </div>
                    ) : orders.length === 0 ? (
                      <div className="text-center py-12">
                        <Package className="h-16 w-16 text-muted-foreground/50 mx-auto mb-4" />
                        <h3 className="text-xl font-semibold mb-2">No orders yet</h3>
                        <p className="text-muted-foreground mb-6">
                          Start shopping to see your orders here
                        </p>
                        <Link href="/delivery/shop">
                          <Button className="bg-primary hover:bg-primary/90" data-testid="button-start-shopping">
                            Start Shopping
                          </Button>
                        </Link>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {orders.map((order) => (
                          <Card
                            key={order.id}
                            className="overflow-hidden"
                            style={{
                              boxShadow: '0 0 0 1px rgba(255, 113, 0, 0.1), 0 0 4px rgba(255, 113, 0, 0.05)',
                            }}
                            data-testid={`card-order-${order.id}`}
                          >
                            <CardContent className="p-6">
                              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
                                <div>
                                  <div className="flex items-center gap-3 mb-2">
                                    <h3 className="text-lg font-semibold" data-testid={`text-order-id-${order.id}`}>
                                      Order #{order.id}
                                    </h3>
                                    <span
                                      className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${getStatusColor(
                                        order.status
                                      )}`}
                                      data-testid={`badge-status-${order.id}`}
                                    >
                                      {formatStatus(order.status)}
                                    </span>
                                  </div>
                                  <p className="text-sm text-muted-foreground">
                                    Placed on {formatDate(order.createdAt?.toString() || '')}
                                  </p>
                                </div>
                                <div className="text-right">
                                  <p className="text-sm text-muted-foreground mb-1">Total</p>
                                  <p className="text-2xl font-bold text-primary" data-testid={`text-order-total-${order.id}`}>
                                    ${parseFloat(order.total).toFixed(2)}
                                  </p>
                                </div>
                              </div>

                              {/* Order Items */}
                              {order.items && order.items.length > 0 && (
                                <div className="mt-4 pt-4 border-t">
                                  <p className="text-sm font-medium text-muted-foreground mb-3">Items</p>
                                  <div className="space-y-3">
                                    {order.items.map((item) => (
                                      <div key={item.id} className="flex gap-3 items-center" data-testid={`order-item-${order.id}-${item.id}`}>
                                        {item.product?.image && (
                                          <img
                                            src={item.product.image}
                                            alt={item.product?.name || 'Product'}
                                            className="w-12 h-12 object-contain bg-muted rounded-md border p-0.5"
                                          />
                                        )}
                                        <div className="flex-1 min-w-0">
                                          <p className="text-sm font-medium truncate">
                                            {item.product?.name || `Product #${item.productId}`}
                                          </p>
                                          <p className="text-xs text-muted-foreground">
                                            Qty: {item.quantity} × ${parseFloat(item.price).toFixed(2)}
                                          </p>
                                        </div>
                                        <p className="text-sm font-medium">
                                          ${(parseFloat(item.price) * item.quantity).toFixed(2)}
                                        </p>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              <div className="mt-4 pt-4 border-t">
                                <div className="flex justify-between text-sm mb-2">
                                  <span className="text-muted-foreground">Subtotal</span>
                                  <span className="font-medium">${parseFloat(order.subtotal).toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                  <span className="text-muted-foreground">Delivery Fee</span>
                                  <span className="font-medium">${parseFloat(order.deliveryFee).toFixed(2)}</span>
                                </div>
                              </div>

                              {/* Reorder and Receipt Buttons */}
                              <div className="mt-4 pt-4 border-t flex justify-end gap-2">
                                <Button
                                  variant="outline"
                                  onClick={() => handleDownloadReceipt(order.id)}
                                  className="gap-2"
                                  data-testid={`button-receipt-${order.id}`}
                                >
                                  <Download className="h-4 w-4" />
                                  Receipt
                                </Button>
                                <Button
                                  onClick={() => handleReorder(order.id)}
                                  disabled={reorderMutation.isPending}
                                  className="gap-2"
                                  data-testid={`button-reorder-${order.id}`}
                                >
                                  {reorderMutation.isPending ? (
                                    <>
                                      <RefreshCw className="h-4 w-4 animate-spin" />
                                      Adding to Cart...
                                    </>
                                  ) : (
                                    <>
                                      <ShoppingCart className="h-4 w-4" />
                                      Reorder
                                    </>
                                  )}
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </div>
        </div>
      </main>
      
      <DeliveryFooter />
    </div>
  );
}
