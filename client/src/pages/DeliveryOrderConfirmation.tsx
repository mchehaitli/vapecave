import { useQuery } from "@tanstack/react-query";
import { useLocation, useParams } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { GlobalHeader } from "@/components/GlobalHeader";
import { GlobalFooter } from "@/components/GlobalFooter";
import { DeliveryCategoryNav } from "@/components/DeliveryCategoryNav";
import { 
  CheckCircle2, 
  Package, 
  MapPin, 
  Calendar, 
  Clock, 
  CreditCard, 
  Banknote,
  Loader2,
  AlertCircle,
  ShoppingBag,
  Truck
} from "lucide-react";

interface OrderItem {
  id: number;
  orderId: number;
  productId: number;
  quantity: number;
  price: string;
  product?: {
    id: number;
    name: string;
    image: string;
    category: string;
  };
}

interface Order {
  id: number;
  customerId: number;
  deliveryWindowId: number;
  deliveryAddress: string;
  subtotal: string;
  tax: string;
  deliveryFee: string;
  total: string;
  status: string;
  paymentMethod: string;
  paymentStatus: string;
  cardLast4?: string;
  cardBrand?: string;
  createdAt: string;
  items?: OrderItem[];
}

interface DeliveryWindow {
  id: number;
  date: string;
  startTime: string;
  endTime: string;
}

export default function DeliveryOrderConfirmation() {
  const params = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const orderId = params.id;

  // Fetch order details
  const { data: order, isLoading: isLoadingOrder, error: orderError } = useQuery<Order>({
    queryKey: ['/api/delivery/orders', orderId],
    queryFn: async () => {
      const response = await fetch(`/api/delivery/orders/${orderId}`, {
        credentials: 'include',
      });
      if (!response.ok) {
        throw new Error('Failed to fetch order');
      }
      return response.json();
    },
    enabled: !!orderId,
  });

  // Fetch delivery windows to get the selected window details
  const { data: deliveryWindows = [] } = useQuery<DeliveryWindow[]>({
    queryKey: ['/api/delivery/windows'],
    queryFn: async () => {
      const response = await fetch('/api/delivery/windows');
      if (!response.ok) throw new Error('Failed to fetch delivery windows');
      return response.json();
    },
    enabled: !!order,
  });

  const selectedWindow = deliveryWindows.find(w => w.id === order?.deliveryWindowId);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'confirmed':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
      case 'preparing':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400';
      case 'out_for_delivery':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400';
      case 'delivered':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'cancelled':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  const formatStatus = (status: string) => {
    return status
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  if (isLoadingOrder) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <GlobalHeader />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
            <p className="text-muted-foreground">Loading your order...</p>
          </div>
        </div>
        <GlobalFooter />
      </div>
    );
  }

  if (orderError || !order) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <GlobalHeader />
        <div className="flex-1 container mx-auto px-4 py-12">
          <Card className="max-w-2xl mx-auto text-center py-16">
            <CardContent>
              <AlertCircle className="h-16 w-16 text-destructive mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-2">Order Not Found</h2>
              <p className="text-muted-foreground mb-6">
                We couldn't find the order you're looking for.
              </p>
              <Button onClick={() => setLocation('/delivery/account')} data-testid="button-view-orders">
                View My Orders
              </Button>
            </CardContent>
          </Card>
        </div>
        <GlobalFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <GlobalHeader />
      <DeliveryCategoryNav />
      
      <main className="flex-1 container mx-auto px-4 py-12">
        <div className="max-w-3xl mx-auto">
          {/* Success Header */}
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="h-10 w-10 text-green-600 dark:text-green-400" />
            </div>
            <h1 className="text-3xl font-bold mb-2" data-testid="text-order-confirmed">
              Order Confirmed!
            </h1>
            <p className="text-muted-foreground">
              Thank you for your order. We'll notify you when it's on its way.
            </p>
          </div>

          {/* Order Info Card */}
          <Card className="mb-6">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Order #{order.id}
                </CardTitle>
                <Badge className={getStatusColor(order.status)} data-testid="badge-order-status">
                  {formatStatus(order.status)}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                Placed on {formatDate(order.createdAt)}
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Delivery Info */}
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    Delivery Address
                  </div>
                  <p className="text-sm" data-testid="text-delivery-address">{order.deliveryAddress}</p>
                </div>

                {selectedWindow && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      Delivery Window
                    </div>
                    <p className="text-sm" data-testid="text-delivery-window">
                      {formatDate(selectedWindow.date)}
                      <br />
                      <span className="flex items-center gap-1 mt-1">
                        <Clock className="h-3 w-3" />
                        {selectedWindow.startTime} - {selectedWindow.endTime}
                      </span>
                    </p>
                  </div>
                )}
              </div>

              <Separator />

              {/* Payment Info */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {order.paymentMethod === 'credit_card' ? (
                    <CreditCard className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Banknote className="h-4 w-4 text-muted-foreground" />
                  )}
                  <span className="text-sm">
                    {order.paymentMethod === 'credit_card' 
                      ? `Card ending in ${order.cardLast4 || '****'}`
                      : 'Cash on Delivery'}
                  </span>
                </div>
                <Badge variant={order.paymentStatus === 'paid' ? 'default' : 'secondary'}>
                  {order.paymentStatus === 'paid' ? 'Paid' : 'Payment Due on Delivery'}
                </Badge>
              </div>

              <Separator />

              {/* Order Items */}
              <div className="space-y-4">
                <h3 className="font-medium flex items-center gap-2">
                  <ShoppingBag className="h-4 w-4" />
                  Order Items
                </h3>
                <div className="space-y-3">
                  {order.items && order.items.length > 0 ? (
                    order.items.map((item) => (
                      <div key={item.id} className="flex gap-3" data-testid={`order-item-${item.id}`}>
                        {item.product?.image && (
                          <img
                            src={item.product.image}
                            alt={item.product?.name || 'Product'}
                            className="w-16 h-16 object-contain bg-muted rounded p-1"
                          />
                        )}
                        <div className="flex-1">
                          <p className="font-medium text-sm">
                            {item.product?.name || `Product #${item.productId}`}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Qty: {item.quantity} × ${item.price}
                          </p>
                        </div>
                        <p className="font-medium">
                          ${(parseFloat(item.price) * item.quantity).toFixed(2)}
                        </p>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">Order items not available</p>
                  )}
                </div>
              </div>

              <Separator />

              {/* Order Totals */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span data-testid="text-order-subtotal">${parseFloat(order.subtotal).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Tax</span>
                  <span data-testid="text-order-tax">${parseFloat(order.tax || "0").toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Delivery Fee</span>
                  <span data-testid="text-order-delivery-fee">${parseFloat(order.deliveryFee).toFixed(2)}</span>
                </div>
                <Separator />
                <div className="flex justify-between font-bold text-lg">
                  <span>Total</span>
                  <span data-testid="text-order-total">${parseFloat(order.total).toFixed(2)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* What's Next */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Truck className="h-5 w-5" />
                What's Next?
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs font-bold text-primary">1</span>
                  </div>
                  <div>
                    <p className="font-medium">Order Confirmation</p>
                    <p className="text-sm text-muted-foreground">
                      You'll receive an email confirmation shortly.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs font-bold text-primary">2</span>
                  </div>
                  <div>
                    <p className="font-medium">Order Preparation</p>
                    <p className="text-sm text-muted-foreground">
                      We'll prepare your order for delivery.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs font-bold text-primary">3</span>
                  </div>
                  <div>
                    <p className="font-medium">Delivery</p>
                    <p className="text-sm text-muted-foreground">
                      Your order will arrive during your selected delivery window.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button onClick={() => setLocation('/delivery/account')} data-testid="button-view-orders">
              View My Orders
            </Button>
            <Button variant="outline" onClick={() => setLocation('/delivery/shop')} data-testid="button-continue-shopping">
              Continue Shopping
            </Button>
          </div>
        </div>
      </main>

      <GlobalFooter />
    </div>
  );
}
