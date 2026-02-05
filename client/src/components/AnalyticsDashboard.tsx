import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend } from "recharts";
import { DollarSign, ShoppingCart, Users, TrendingUp, Package, CreditCard, Banknote, RefreshCcw, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { format, subDays } from "date-fns";

interface AnalyticsSummary {
  totalOrders: number;
  totalRevenue: string;
  totalPaidRevenue: string;
  averageOrderValue: string;
  totalRefunds: string;
  ordersByStatus: {
    pending: number;
    confirmed: number;
    out_for_delivery: number;
    delivered: number;
    cancelled: number;
  };
  ordersByPaymentMethod: {
    cash: number;
    card: number;
  };
  paymentStatus: {
    paid: number;
    pending: number;
    refunded: number;
  };
}

interface SalesByDate {
  date: string;
  orders: number;
  revenue: number;
}

interface TopProduct {
  productId: number;
  name: string;
  quantitySold: number;
  revenue: number;
}

interface CustomerAnalytics {
  totalCustomers: number;
  byStatus: {
    approved: number;
    pending: number;
    rejected: number;
  };
  topCustomers: {
    customerId: number;
    name: string;
    orderCount: number;
    totalSpent: number;
  }[];
}

const COLORS = ["#FF7100", "#24A90D", "#FB475E", "#3B82F6", "#8B5CF6"];
const STATUS_COLORS: Record<string, string> = {
  pending: "#F59E0B",
  confirmed: "#3B82F6",
  out_for_delivery: "#8B5CF6",
  delivered: "#10B981",
  cancelled: "#EF4444"
};

export default function AnalyticsDashboard() {
  const [dateRange, setDateRange] = useState("30");

  const { data: summary, isLoading: summaryLoading, refetch: refetchSummary } = useQuery<AnalyticsSummary>({
    queryKey: ["/api/admin/analytics/summary"],
  });

  const { data: salesData, isLoading: salesLoading, refetch: refetchSales } = useQuery<SalesByDate[]>({
    queryKey: ["/api/admin/analytics/sales-by-date", dateRange],
    queryFn: async () => {
      const res = await fetch(`/api/admin/analytics/sales-by-date?days=${dateRange}`);
      if (!res.ok) throw new Error("Failed to fetch sales data");
      return res.json();
    },
  });

  const { data: topProducts, isLoading: productsLoading, refetch: refetchProducts } = useQuery<TopProduct[]>({
    queryKey: ["/api/admin/analytics/top-products"],
  });

  const { data: customerData, isLoading: customersLoading, refetch: refetchCustomers } = useQuery<CustomerAnalytics>({
    queryKey: ["/api/admin/analytics/customers"],
  });

  const handleRefresh = () => {
    refetchSummary();
    refetchSales();
    refetchProducts();
    refetchCustomers();
  };

  const orderStatusData = summary ? [
    { name: "Pending", value: summary.ordersByStatus.pending, color: STATUS_COLORS.pending },
    { name: "Confirmed", value: summary.ordersByStatus.confirmed, color: STATUS_COLORS.confirmed },
    { name: "Out for Delivery", value: summary.ordersByStatus.out_for_delivery, color: STATUS_COLORS.out_for_delivery },
    { name: "Delivered", value: summary.ordersByStatus.delivered, color: STATUS_COLORS.delivered },
    { name: "Cancelled", value: summary.ordersByStatus.cancelled, color: STATUS_COLORS.cancelled },
  ].filter(item => item.value > 0) : [];

  const paymentMethodData = summary ? [
    { name: "Card", value: summary.ordersByPaymentMethod.card, color: "#3B82F6" },
    { name: "Cash", value: summary.ordersByPaymentMethod.cash, color: "#10B981" },
  ].filter(item => item.value > 0) : [];

  const customerStatusData = customerData ? [
    { name: "Approved", value: customerData.byStatus.approved, color: "#10B981" },
    { name: "Pending", value: customerData.byStatus.pending, color: "#F59E0B" },
    { name: "Rejected", value: customerData.byStatus.rejected, color: "#EF4444" },
  ].filter(item => item.value > 0) : [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">Analytics Dashboard</h2>
          <p className="text-gray-400 mt-1">Monitor your delivery service performance</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-36 bg-gray-800 border-gray-700" data-testid="select-date-range">
              <SelectValue placeholder="Date range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="14">Last 14 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="60">Last 60 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
          <Button 
            variant="outline" 
            size="icon" 
            onClick={handleRefresh}
            className="border-gray-700"
            data-testid="button-refresh-analytics"
          >
            <RefreshCcw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-gray-900 border-gray-700" data-testid="card-total-revenue">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            {summaryLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <>
                <div className="text-2xl font-bold text-white">${summary?.totalPaidRevenue || "0.00"}</div>
                <p className="text-xs text-gray-500">From {summary?.paymentStatus.paid || 0} paid orders</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="bg-gray-900 border-gray-700" data-testid="card-total-orders">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Total Orders</CardTitle>
            <ShoppingCart className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            {summaryLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <>
                <div className="text-2xl font-bold text-white">{summary?.totalOrders || 0}</div>
                <p className="text-xs text-gray-500">{summary?.ordersByStatus.delivered || 0} delivered</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="bg-gray-900 border-gray-700" data-testid="card-avg-order-value">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Avg Order Value</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            {summaryLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <>
                <div className="text-2xl font-bold text-white">${summary?.averageOrderValue || "0.00"}</div>
                <p className="text-xs text-gray-500">Per delivered order</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="bg-gray-900 border-gray-700" data-testid="card-total-customers">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Total Customers</CardTitle>
            <Users className="h-4 w-4 text-pink-500" />
          </CardHeader>
          <CardContent>
            {customersLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <>
                <div className="text-2xl font-bold text-white">{customerData?.totalCustomers || 0}</div>
                <p className="text-xs text-gray-500">{customerData?.byStatus.approved || 0} approved</p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="bg-gray-900 border-gray-700" data-testid="chart-sales-over-time">
          <CardHeader>
            <CardTitle className="text-white">Sales Over Time</CardTitle>
            <CardDescription>Revenue and order count for the last {dateRange} days</CardDescription>
          </CardHeader>
          <CardContent>
            {salesLoading ? (
              <Skeleton className="h-[300px] w-full" />
            ) : salesData && salesData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={salesData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis 
                    dataKey="date" 
                    stroke="#9CA3AF"
                    tick={{ fill: '#9CA3AF', fontSize: 12 }}
                    tickFormatter={(value) => format(new Date(value), 'MMM d')}
                  />
                  <YAxis yAxisId="left" stroke="#9CA3AF" tick={{ fill: '#9CA3AF', fontSize: 12 }} />
                  <YAxis yAxisId="right" orientation="right" stroke="#9CA3AF" tick={{ fill: '#9CA3AF', fontSize: 12 }} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px' }}
                    labelStyle={{ color: '#F3F4F6' }}
                    formatter={(value: number, name: string) => [
                      name === 'revenue' ? `$${value.toFixed(2)}` : value,
                      name === 'revenue' ? 'Revenue' : 'Orders'
                    ]}
                    labelFormatter={(label) => format(new Date(label), 'MMM d, yyyy')}
                  />
                  <Legend />
                  <Line yAxisId="left" type="monotone" dataKey="revenue" stroke="#FF7100" strokeWidth={2} name="Revenue" dot={false} />
                  <Line yAxisId="right" type="monotone" dataKey="orders" stroke="#24A90D" strokeWidth={2} name="Orders" dot={false} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-gray-500">
                No sales data available for this period
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-gray-900 border-gray-700" data-testid="chart-order-status">
          <CardHeader>
            <CardTitle className="text-white">Order Status Breakdown</CardTitle>
            <CardDescription>Distribution of orders by current status</CardDescription>
          </CardHeader>
          <CardContent>
            {summaryLoading ? (
              <Skeleton className="h-[300px] w-full" />
            ) : orderStatusData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={orderStatusData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {orderStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px' }}
                    labelStyle={{ color: '#F3F4F6' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-gray-500">
                No order data available
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="bg-gray-900 border-gray-700" data-testid="chart-top-products">
          <CardHeader>
            <CardTitle className="text-white">Top Selling Products</CardTitle>
            <CardDescription>Products ranked by quantity sold</CardDescription>
          </CardHeader>
          <CardContent>
            {productsLoading ? (
              <Skeleton className="h-[300px] w-full" />
            ) : topProducts && topProducts.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={topProducts.slice(0, 8)} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis type="number" stroke="#9CA3AF" tick={{ fill: '#9CA3AF', fontSize: 12 }} />
                  <YAxis 
                    type="category" 
                    dataKey="name" 
                    stroke="#9CA3AF" 
                    tick={{ fill: '#9CA3AF', fontSize: 11 }}
                    width={120}
                    tickFormatter={(value) => value.length > 15 ? `${value.slice(0, 15)}...` : value}
                  />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px' }}
                    labelStyle={{ color: '#F3F4F6' }}
                    formatter={(value: number, name: string) => [
                      name === 'revenue' ? `$${value.toFixed(2)}` : value,
                      name === 'revenue' ? 'Revenue' : 'Qty Sold'
                    ]}
                  />
                  <Bar dataKey="quantitySold" fill="#FF7100" radius={[0, 4, 4, 0]} name="Qty Sold" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-gray-500">
                No product data available
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-gray-900 border-gray-700" data-testid="chart-payment-methods">
          <CardHeader>
            <CardTitle className="text-white">Payment Methods</CardTitle>
            <CardDescription>Orders by payment method</CardDescription>
          </CardHeader>
          <CardContent>
            {summaryLoading ? (
              <Skeleton className="h-[300px] w-full" />
            ) : paymentMethodData.length > 0 ? (
              <div className="flex flex-col items-center">
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={paymentMethodData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {paymentMethodData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px' }}
                      labelStyle={{ color: '#F3F4F6' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex gap-6 mt-4">
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5 text-blue-500" />
                    <span className="text-gray-300">Card: {summary?.ordersByPaymentMethod.card || 0}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Banknote className="h-5 w-5 text-green-500" />
                    <span className="text-gray-300">Cash: {summary?.ordersByPaymentMethod.cash || 0}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-gray-500">
                No payment data available
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="bg-gray-900 border-gray-700" data-testid="card-top-customers">
          <CardHeader>
            <CardTitle className="text-white">Top Customers</CardTitle>
            <CardDescription>Customers ranked by total spending</CardDescription>
          </CardHeader>
          <CardContent>
            {customersLoading ? (
              <Skeleton className="h-[250px] w-full" />
            ) : customerData?.topCustomers && customerData.topCustomers.length > 0 ? (
              <div className="space-y-3">
                {customerData.topCustomers.slice(0, 5).map((customer, index) => (
                  <div 
                    key={customer.customerId} 
                    className="flex items-center justify-between p-3 bg-gray-800 rounded-lg"
                    data-testid={`row-top-customer-${index}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-orange-500/20 flex items-center justify-center">
                        <span className="text-orange-500 font-semibold text-sm">{index + 1}</span>
                      </div>
                      <div>
                        <p className="text-white font-medium">{customer.name}</p>
                        <p className="text-gray-500 text-sm">{customer.orderCount} orders</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-green-500 font-semibold">${customer.totalSpent.toFixed(2)}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-[250px] flex items-center justify-center text-gray-500">
                No customer data available
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-gray-900 border-gray-700" data-testid="card-customer-status">
          <CardHeader>
            <CardTitle className="text-white">Customer Status</CardTitle>
            <CardDescription>Distribution by approval status</CardDescription>
          </CardHeader>
          <CardContent>
            {customersLoading ? (
              <Skeleton className="h-[250px] w-full" />
            ) : customerStatusData.length > 0 ? (
              <div className="flex flex-col items-center">
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie
                      data={customerStatusData}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={70}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, value }) => `${name}: ${value}`}
                    >
                      {customerStatusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px' }}
                      labelStyle={{ color: '#F3F4F6' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="grid grid-cols-3 gap-4 mt-4 w-full">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-green-500">{customerData?.byStatus.approved || 0}</p>
                    <p className="text-xs text-gray-500">Approved</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-yellow-500">{customerData?.byStatus.pending || 0}</p>
                    <p className="text-xs text-gray-500">Pending</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-red-500">{customerData?.byStatus.rejected || 0}</p>
                    <p className="text-xs text-gray-500">Rejected</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-[250px] flex items-center justify-center text-gray-500">
                No customer data available
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {summary && parseFloat(summary.totalRefunds) > 0 && (
        <Card className="bg-gray-900 border-gray-700" data-testid="card-refunds-summary">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <ArrowDownRight className="h-5 w-5 text-red-500" />
              Refunds Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-8">
              <div>
                <p className="text-3xl font-bold text-red-500">${summary.totalRefunds}</p>
                <p className="text-sm text-gray-500">Total Refunded</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-gray-400">{summary.paymentStatus.refunded}</p>
                <p className="text-sm text-gray-500">Refunded Orders</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
