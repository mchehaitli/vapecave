import { useState, useEffect } from "react";
import { Link, useLocation, useSearch } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { User, Package, Lock, MapPin, Phone, Mail, ChevronRight, RefreshCw, ShoppingCart, Download, AlertCircle, Bell, BellOff, Trash2, PackageSearch } from "lucide-react";
import { DeliveryHeader } from "@/components/DeliveryHeader";
import { DeliveryCategoryNav } from "@/components/DeliveryCategoryNav";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useInactivityTimeout } from "@/hooks/useInactivityTimeout";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { DeliveryCustomer, DeliveryOrder, DeliveryOrderItem, DeliveryProduct } from "@shared/schema";
import { DeliveryFooter } from "@/components/DeliveryFooter";

interface OrderWithItems extends DeliveryOrder {
  items?: Array<DeliveryOrderItem & { product?: DeliveryProduct }>;
}

interface NotificationPreferences {
  customerId: number;
  restockEmail: boolean;
  restockSms: boolean;
  orderEmail: boolean;
  orderSms: boolean;
  promoEmail: boolean;
  promoSms: boolean;
}

interface RestockAlertItem {
  id: number;
  productId: number;
  productName: string;
  productImage: string | null;
  currentStock: string | null;
  status: string;
  createdAt: string;
}

export default function DeliveryAccount() {
  const [, setLocation] = useLocation();
  const search = useSearch();
  const params = new URLSearchParams(search);
  type AccountTab = "profile" | "orders" | "restock-alerts" | "notification-preferences";
  function isAccountTab(v: string | null): v is AccountTab {
    return v === "profile" || v === "orders" || v === "restock-alerts" || v === "notification-preferences";
  }
  const rawTab = params.get("tab");
  const initialTab: AccountTab = isAccountTab(rawTab) ? rawTab : "profile";
  const [activeTab, setActiveTab] = useState<AccountTab>(initialTab);
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

  // Fetch restock alerts
  const { data: restockAlerts = [], isLoading: isLoadingRestockAlerts } = useQuery<RestockAlertItem[]>({
    queryKey: ['/api/delivery/restock-requests'],
    queryFn: async () => {
      const response = await fetch('/api/delivery/restock-requests', {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch restock alerts');
      return response.json();
    },
    enabled: activeTab === 'restock-alerts',
  });

  // Fetch notification preferences
  const { data: notifPrefs, isLoading: isLoadingPrefs } = useQuery<NotificationPreferences>({
    queryKey: ['/api/delivery/notification-preferences'],
    queryFn: async () => {
      const response = await fetch('/api/delivery/notification-preferences', {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch preferences');
      return response.json();
    },
    enabled: activeTab === 'notification-preferences',
  });

  // Staged local state for notification preferences (initialized from fetched data)
  const defaultPrefs: Omit<NotificationPreferences, 'customerId'> = {
    restockEmail: true,
    restockSms: false,
    orderEmail: true,
    orderSms: false,
    promoEmail: true,
    promoSms: false,
  };
  const [stagedPrefs, setStagedPrefs] = useState<Omit<NotificationPreferences, 'customerId'>>(defaultPrefs);
  const [prefsModified, setPrefsModified] = useState(false);

  // Sync staged state when server data loads
  useEffect(() => {
    if (notifPrefs) {
      setStagedPrefs({
        restockEmail: notifPrefs.restockEmail,
        restockSms: notifPrefs.restockSms,
        orderEmail: notifPrefs.orderEmail,
        orderSms: notifPrefs.orderSms,
        promoEmail: notifPrefs.promoEmail,
        promoSms: notifPrefs.promoSms,
      });
      setPrefsModified(false);
    }
  }, [notifPrefs]);

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

  // Remove restock alert mutation
  const removeRestockMutation = useMutation({
    mutationFn: async (productId: number) => {
      const res = await apiRequest("DELETE", `/api/delivery/restock-requests/${productId}`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/delivery/restock-requests'] });
      toast({ title: "Alert Removed", description: "Restock alert has been removed." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to remove restock alert.", variant: "destructive" });
    },
  });

  // Update notification preferences mutation (saves all staged prefs at once)
  const updatePrefsMutation = useMutation({
    mutationFn: async (prefs: Partial<NotificationPreferences>) => {
      const res = await apiRequest("PUT", `/api/delivery/notification-preferences`, prefs);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/delivery/notification-preferences'] });
      setPrefsModified(false);
      toast({ title: "Preferences Saved", description: "Your notification preferences have been updated." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to save preferences.", variant: "destructive" });
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

  const handleStagePref = (key: keyof Omit<NotificationPreferences, 'customerId'>, value: boolean) => {
    setStagedPrefs(prev => ({ ...prev, [key]: value }));
    setPrefsModified(true);
  };

  const handleSavePrefs = () => {
    updatePrefsMutation.mutate(stagedPrefs);
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
                  <button
                    onClick={() => setActiveTab("restock-alerts")}
                    className={`flex items-center gap-3 px-4 py-3 text-left transition-colors ${
                      activeTab === "restock-alerts"
                        ? "bg-primary text-primary-foreground"
                        : "hover:bg-muted"
                    }`}
                    data-testid="button-nav-restock-alerts"
                  >
                    <PackageSearch className="h-5 w-5" />
                    <span className="font-medium">Restock Alerts</span>
                  </button>
                  <Separator />
                  <button
                    onClick={() => setActiveTab("notification-preferences")}
                    className={`flex items-center gap-3 px-4 py-3 text-left transition-colors ${
                      activeTab === "notification-preferences"
                        ? "bg-primary text-primary-foreground"
                        : "hover:bg-muted"
                    }`}
                    data-testid="button-nav-notification-preferences"
                  >
                    <Bell className="h-5 w-5" />
                    <span className="font-medium">Notification Settings</span>
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
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <User className="h-5 w-5" />
                      Profile Information
                    </CardTitle>
                    <CardDescription>
                      Your personal information for delivery service
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
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

                    <Separator />

                    {/* Contact notice for profile changes */}
                    <div className="p-4 bg-muted/50 rounded-lg flex items-start gap-3">
                      <AlertCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium">Need to update your information?</p>
                        <p className="text-sm text-muted-foreground mt-1">
                          For any changes to your profile, please contact us for authorization.
                        </p>
                        <a 
                          href="mailto:vapecavetx@gmail.com" 
                          className="inline-flex items-center gap-2 mt-2 text-sm font-semibold text-primary hover:underline"
                        >
                          <Mail className="h-4 w-4" />
                          vapecavetx@gmail.com
                        </a>
                      </div>
                    </div>
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
                                  {order.paymentMethodDisplay && (
                                    <p className="text-xs text-muted-foreground mt-1">
                                      {order.paymentMethodDisplay}
                                    </p>
                                  )}
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
                                <div className="flex justify-between text-sm mb-2">
                                  <span className="text-muted-foreground">Delivery Fee</span>
                                  <span className="font-medium">${parseFloat(order.deliveryFee).toFixed(2)}</span>
                                </div>
                                {parseFloat(order.tax || '0') > 0 && (
                                  <div className="flex justify-between text-sm mb-2">
                                    <span className="text-muted-foreground">Tax (8.25%)</span>
                                    <span className="font-medium">${parseFloat(order.tax).toFixed(2)}</span>
                                  </div>
                                )}
                                {order.discount && parseFloat(order.discount) > 0 && (
                                  <div className="flex justify-between text-sm mb-2">
                                    <span className="text-muted-foreground">Discount</span>
                                    <span className="font-medium text-green-500">-${parseFloat(order.discount).toFixed(2)}</span>
                                  </div>
                                )}
                                <div className="flex justify-between text-sm font-semibold mt-2 pt-2 border-t">
                                  <span>Total</span>
                                  <span className="text-orange-500">${parseFloat(order.total).toFixed(2)}</span>
                                </div>
                              </div>

                              {/* Reorder and Receipt Buttons */}
                              <div className="mt-4 pt-4 border-t flex justify-end gap-2">
                                {(order.status === 'delivered' || order.status === 'picked_up') && (
                                  <Button
                                    variant="outline"
                                    onClick={() => handleDownloadReceipt(order.id)}
                                    className="gap-2"
                                    data-testid={`button-receipt-${order.id}`}
                                  >
                                    <Download className="h-4 w-4" />
                                    Receipt
                                  </Button>
                                )}
                                <Button
                                  onClick={() => handleReorder(order.id)}
                                  disabled={reorderMutation.isPending}
                                  className="gap-2"
                                  data-testid={`button-reorder-${order.id}`}
                                >
                                  {reorderMutation.isPending ? (
                                    <>
                                      <RefreshCw className="h-4 w-4 animate-spin" />
                                      Adding...
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

            {activeTab === "restock-alerts" && (
              <motion.div
                key="restock-alerts"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.2 }}
              >
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <PackageSearch className="h-5 w-5" />
                      Restock Alerts
                    </CardTitle>
                    <CardDescription>
                      Products you're waiting to be restocked. You'll be notified by email when they're available.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {isLoadingRestockAlerts ? (
                      <div className="text-center py-12">
                        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mx-auto mb-4"></div>
                        <p className="text-muted-foreground">Loading your alerts...</p>
                      </div>
                    ) : restockAlerts.length === 0 ? (
                      <div className="text-center py-12">
                        <PackageSearch className="h-16 w-16 text-muted-foreground/40 mx-auto mb-4" />
                        <h3 className="text-xl font-semibold mb-2">No restock alerts</h3>
                        <p className="text-muted-foreground mb-6">
                          When a product you want is out of stock, tap "Notify Me" to get alerted when it's back.
                        </p>
                        <Link href="/delivery/shop">
                          <Button variant="outline" className="gap-2">
                            <ShoppingCart className="h-4 w-4" />
                            Browse Products
                          </Button>
                        </Link>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {restockAlerts.map((alert) => (
                          <div
                            key={alert.id}
                            className="flex items-center gap-4 p-4 rounded-lg border bg-card hover:bg-muted/30 transition-colors"
                          >
                            {alert.productImage ? (
                              <img
                                src={alert.productImage}
                                alt={alert.productName}
                                className="w-14 h-14 object-contain rounded-md border bg-white p-1 flex-shrink-0"
                              />
                            ) : (
                              <div className="w-14 h-14 rounded-md border bg-muted flex items-center justify-center flex-shrink-0">
                                <PackageSearch className="h-6 w-6 text-muted-foreground" />
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold truncate">{alert.productName}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge variant="secondary" className="text-xs">
                                  Waiting for Restock
                                </Badge>
                                <span className="text-xs text-muted-foreground">
                                  Since {formatDate(alert.createdAt)}
                                </span>
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-destructive hover:text-destructive hover:bg-destructive/10 flex-shrink-0 gap-1.5"
                              onClick={() => removeRestockMutation.mutate(alert.productId)}
                              disabled={removeRestockMutation.isPending}
                            >
                              <Trash2 className="h-4 w-4" />
                              <span className="hidden sm:inline">Remove Alert</span>
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {activeTab === "notification-preferences" && (
              <motion.div
                key="notification-preferences"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.2 }}
              >
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Bell className="h-5 w-5" />
                      Notification Settings
                    </CardTitle>
                    <CardDescription>
                      Choose how you'd like to be notified about orders, restocks, and promotions.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {isLoadingPrefs ? (
                      <div className="text-center py-12">
                        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mx-auto mb-4"></div>
                        <p className="text-muted-foreground">Loading preferences...</p>
                      </div>
                    ) : (
                      <div className="space-y-6">
                        {/* Restock Notifications */}
                        <div>
                          <div className="flex items-center gap-2 mb-3">
                            <PackageSearch className="h-4 w-4 text-muted-foreground" />
                            <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">Restock Alerts</h3>
                          </div>
                          <div className="space-y-3 pl-6">
                            <div className="flex items-center justify-between py-2">
                              <div>
                                <Label htmlFor="restock-email" className="font-medium cursor-pointer">Email Notifications</Label>
                                <p className="text-sm text-muted-foreground">Get emailed when waitlisted products are back in stock</p>
                              </div>
                              <Switch
                                id="restock-email"
                                checked={stagedPrefs.restockEmail}
                                onCheckedChange={(v) => handleStagePref('restockEmail', v)}
                                disabled={updatePrefsMutation.isPending}
                              />
                            </div>
                            <Separator />
                            <div className="flex items-center justify-between py-2">
                              <div>
                                <Label htmlFor="restock-sms" className="font-medium cursor-pointer">SMS Notifications</Label>
                                <p className="text-sm text-muted-foreground">Get a text message when your waitlisted items are available</p>
                                <Badge variant="outline" className="text-xs mt-1">Coming Soon</Badge>
                              </div>
                              <Switch
                                id="restock-sms"
                                checked={stagedPrefs.restockSms}
                                onCheckedChange={(v) => handleStagePref('restockSms', v)}
                                disabled={updatePrefsMutation.isPending}
                              />
                            </div>
                          </div>
                        </div>

                        <Separator />

                        {/* Order Notifications */}
                        <div>
                          <div className="flex items-center gap-2 mb-3">
                            <Package className="h-4 w-4 text-muted-foreground" />
                            <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">Order Updates</h3>
                          </div>
                          <div className="space-y-3 pl-6">
                            <div className="flex items-center justify-between py-2">
                              <div>
                                <Label htmlFor="order-email" className="font-medium cursor-pointer">Email Notifications</Label>
                                <p className="text-sm text-muted-foreground">Order confirmations, status updates, and delivery notices</p>
                              </div>
                              <Switch
                                id="order-email"
                                checked={stagedPrefs.orderEmail}
                                onCheckedChange={(v) => handleStagePref('orderEmail', v)}
                                disabled={updatePrefsMutation.isPending}
                              />
                            </div>
                            <Separator />
                            <div className="flex items-center justify-between py-2">
                              <div>
                                <Label htmlFor="order-sms" className="font-medium cursor-pointer">SMS Notifications</Label>
                                <p className="text-sm text-muted-foreground">Text updates for your delivery status</p>
                                <Badge variant="outline" className="text-xs mt-1">Coming Soon</Badge>
                              </div>
                              <Switch
                                id="order-sms"
                                checked={stagedPrefs.orderSms}
                                onCheckedChange={(v) => handleStagePref('orderSms', v)}
                                disabled={updatePrefsMutation.isPending}
                              />
                            </div>
                          </div>
                        </div>

                        <Separator />

                        {/* Promo Notifications */}
                        <div>
                          <div className="flex items-center gap-2 mb-3">
                            <Mail className="h-4 w-4 text-muted-foreground" />
                            <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">Promotions & Deals</h3>
                          </div>
                          <div className="space-y-3 pl-6">
                            <div className="flex items-center justify-between py-2">
                              <div>
                                <Label htmlFor="promo-email" className="font-medium cursor-pointer">Email Notifications</Label>
                                <p className="text-sm text-muted-foreground">Special deals, new arrivals, and exclusive offers</p>
                              </div>
                              <Switch
                                id="promo-email"
                                checked={stagedPrefs.promoEmail}
                                onCheckedChange={(v) => handleStagePref('promoEmail', v)}
                                disabled={updatePrefsMutation.isPending}
                              />
                            </div>
                            <Separator />
                            <div className="flex items-center justify-between py-2">
                              <div>
                                <Label htmlFor="promo-sms" className="font-medium cursor-pointer">SMS Notifications</Label>
                                <p className="text-sm text-muted-foreground">Flash sales and time-sensitive promos via text</p>
                                <Badge variant="outline" className="text-xs mt-1">Coming Soon</Badge>
                              </div>
                              <Switch
                                id="promo-sms"
                                checked={stagedPrefs.promoSms}
                                onCheckedChange={(v) => handleStagePref('promoSms', v)}
                                disabled={updatePrefsMutation.isPending}
                              />
                            </div>
                          </div>
                        </div>

                        <div className="p-4 bg-muted/50 rounded-lg flex items-start gap-3">
                          <BellOff className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                          <p className="text-sm text-muted-foreground">
                            SMS notifications are coming soon. Your preferences will be saved and activated when the feature launches.
                          </p>
                        </div>

                        {/* Save button */}
                        <div className="flex items-center justify-between pt-2">
                          {prefsModified && (
                            <p className="text-sm text-muted-foreground italic">You have unsaved changes.</p>
                          )}
                          <Button
                            className="ml-auto"
                            onClick={handleSavePrefs}
                            disabled={updatePrefsMutation.isPending || !prefsModified}
                          >
                            {updatePrefsMutation.isPending ? (
                              <>
                                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                                Saving...
                              </>
                            ) : (
                              "Save Preferences"
                            )}
                          </Button>
                        </div>
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
