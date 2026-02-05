import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import JSZip from "jszip";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Eye, CheckCircle, XCircle, Clock, AlertCircle, Package, Edit, Mail, Trash2, Upload, ChevronLeft, ChevronRight, RefreshCw, Download, DollarSign } from "lucide-react";
import type { DeliveryBrand } from "@shared/schema";

interface DeliveryCustomer {
  id: number;
  firebaseUid: string;
  email: string;
  fullName: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  photoIdUrl: string;
  approvalStatus: "pending" | "approved" | "rejected";
  rejectionReason?: string;
  createdAt: string;
}

interface DeliveryOrder {
  id: number;
  customerId: number;
  windowId: number;
  items: any[];
  subtotal: string;
  deliveryFee: string;
  total: string;
  status: string;
  paymentStatus?: string;
  paymentMethod?: string;
  deliveryNotes?: string;
  createdAt: string;
  customerName?: string;
  refundAmount?: string;
  refundReason?: string;
  refundedAt?: string;
  cloverRefundId?: string;
  deliveryWindow?: string;
}

interface DeliveryWindow {
  id: number;
  date: string;
  startTime: string;
  endTime: string;
  capacity: number;
  currentBookings: number;
  enabled: boolean;
}

// Dashboard Overview Tab
export function DeliveryOverviewTab({ onNavigateToTab }: { onNavigateToTab?: (tab: string) => void } = {}) {
  const { toast } = useToast();
  
  // Fetch all relevant data
  const { data: orders = [], isLoading: isLoadingOrders } = useQuery<DeliveryOrder[]>({
    queryKey: ["/api/admin/delivery/orders"],
  });
  
  const { data: customers = [], isLoading: isLoadingCustomers } = useQuery<DeliveryCustomer[]>({
    queryKey: ["/api/admin/delivery/customers"],
  });
  
  const { data: productsData, isLoading: isLoadingProducts } = useQuery<{ products: any[]; totalCount: number }>({
    queryKey: ["/api/admin/delivery/products", 1, 1000, "", "all", "all"],
    queryFn: async () => {
      const res = await fetch("/api/admin/delivery/products?page=1&limit=1000", {
        credentials: 'include'
      });
      if (!res.ok) return { products: [], totalCount: 0 };
      return res.json();
    }
  });
  
  const isLoading = isLoadingOrders || isLoadingCustomers || isLoadingProducts;
  
  const products = productsData?.products || [];
  
  // Calculate metrics
  const today = new Date().toISOString().split('T')[0];
  const todayOrders = orders.filter(o => o.createdAt.startsWith(today));
  const pendingOrders = orders.filter(o => o.status === 'pending' || o.status === 'confirmed');
  const todayRevenue = todayOrders.reduce((sum, o) => sum + parseFloat(o.total || '0'), 0);
  const pendingCustomers = customers.filter(c => c.approvalStatus === 'pending');
  const lowStockProducts = products.filter(p => {
    const qty = parseFloat(p.stockQuantity || '0');
    return p.enabled && qty > 0 && qty <= 5;
  });
  const outOfStockProducts = products.filter(p => {
    const qty = parseFloat(p.stockQuantity || '0');
    return p.enabled && qty === 0;
  });
  
  // Recent orders (last 5)
  const recentOrders = [...orders]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-500/20 text-yellow-400';
      case 'confirmed': return 'bg-blue-500/20 text-blue-400';
      case 'out-for-delivery': return 'bg-purple-500/20 text-purple-400';
      case 'delivered': return 'bg-green-500/20 text-green-400';
      case 'cancelled': return 'bg-red-500/20 text-red-400';
      default: return 'bg-gray-500/20 text-gray-400';
    }
  };
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-900/50 to-blue-800/30 border-blue-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-300 font-medium">Today's Orders</p>
                <p className="text-3xl font-bold text-white mt-1">{todayOrders.length}</p>
              </div>
              <div className="h-12 w-12 bg-blue-500/20 rounded-full flex items-center justify-center">
                <Package className="h-6 w-6 text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-green-900/50 to-green-800/30 border-green-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-300 font-medium">Today's Revenue</p>
                <p className="text-3xl font-bold text-white mt-1">${todayRevenue.toFixed(2)}</p>
              </div>
              <div className="h-12 w-12 bg-green-500/20 rounded-full flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-green-400" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-yellow-900/50 to-yellow-800/30 border-yellow-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-yellow-300 font-medium">Pending Orders</p>
                <p className="text-3xl font-bold text-white mt-1">{pendingOrders.length}</p>
              </div>
              <div className="h-12 w-12 bg-yellow-500/20 rounded-full flex items-center justify-center">
                <Clock className="h-6 w-6 text-yellow-400" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-purple-900/50 to-purple-800/30 border-purple-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-purple-300 font-medium">Pending Approvals</p>
                <p className="text-3xl font-bold text-white mt-1">{pendingCustomers.length}</p>
              </div>
              <div className="h-12 w-12 bg-purple-500/20 rounded-full flex items-center justify-center">
                <Eye className="h-6 w-6 text-purple-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Alerts Section */}
      {(lowStockProducts.length > 0 || outOfStockProducts.length > 0 || pendingCustomers.length > 0) && (
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-orange-400" />
              Attention Required
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {outOfStockProducts.length > 0 && (
              <div className="flex items-center justify-between p-3 bg-red-900/20 border border-red-700/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-red-500/20 rounded-full flex items-center justify-center">
                    <XCircle className="h-5 w-5 text-red-400" />
                  </div>
                  <div>
                    <p className="font-medium text-red-300">Out of Stock Products</p>
                    <p className="text-sm text-gray-400">{outOfStockProducts.length} enabled products have 0 stock</p>
                  </div>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="border-red-600 text-red-400 hover:bg-red-900/20"
                  onClick={() => onNavigateToTab?.('products')}
                >
                  View Products
                </Button>
              </div>
            )}
            
            {lowStockProducts.length > 0 && (
              <div className="flex items-center justify-between p-3 bg-yellow-900/20 border border-yellow-700/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-yellow-500/20 rounded-full flex items-center justify-center">
                    <AlertCircle className="h-5 w-5 text-yellow-400" />
                  </div>
                  <div>
                    <p className="font-medium text-yellow-300">Low Stock Warning</p>
                    <p className="text-sm text-gray-400">{lowStockProducts.length} products with 5 or fewer items</p>
                  </div>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="border-yellow-600 text-yellow-400 hover:bg-yellow-900/20"
                  onClick={() => onNavigateToTab?.('products')}
                >
                  View Products
                </Button>
              </div>
            )}
            
            {pendingCustomers.length > 0 && (
              <div className="flex items-center justify-between p-3 bg-purple-900/20 border border-purple-700/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-purple-500/20 rounded-full flex items-center justify-center">
                    <Eye className="h-5 w-5 text-purple-400" />
                  </div>
                  <div>
                    <p className="font-medium text-purple-300">Customer Approvals Pending</p>
                    <p className="text-sm text-gray-400">{pendingCustomers.length} customers awaiting ID verification</p>
                  </div>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="border-purple-600 text-purple-400 hover:bg-purple-900/20"
                  onClick={() => onNavigateToTab?.('customers')}
                >
                  Review Now
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}
      
      {/* Recent Orders */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle>Recent Orders</CardTitle>
        </CardHeader>
        <CardContent>
          {recentOrders.length === 0 ? (
            <p className="text-gray-400 text-center py-8">No orders yet</p>
          ) : (
            <div className="space-y-3">
              {recentOrders.map((order) => (
                <div key={order.id} className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className="text-center">
                      <p className="text-xs text-gray-400">Order</p>
                      <p className="font-bold">#{order.id}</p>
                    </div>
                    <div>
                      <p className="font-medium">{order.customerName || 'Customer'}</p>
                      <p className="text-sm text-gray-400">
                        {new Date(order.createdAt).toLocaleDateString()} at {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <Badge className={getStatusColor(order.status)}>
                      {order.status.replace(/-/g, ' ')}
                    </Badge>
                    <p className="font-bold text-green-400">${parseFloat(order.total).toFixed(2)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-6">
            <p className="text-sm text-gray-400">Total Customers</p>
            <p className="text-2xl font-bold mt-1">{customers.length}</p>
            <p className="text-xs text-green-400 mt-2">
              {customers.filter(c => c.approvalStatus === 'approved').length} approved
            </p>
          </CardContent>
        </Card>
        
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-6">
            <p className="text-sm text-gray-400">Total Orders</p>
            <p className="text-2xl font-bold mt-1">{orders.length}</p>
            <p className="text-xs text-green-400 mt-2">
              {orders.filter(o => o.status === 'delivered').length} delivered
            </p>
          </CardContent>
        </Card>
        
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-6">
            <p className="text-sm text-gray-400">Active Products</p>
            <p className="text-2xl font-bold mt-1">{products.filter(p => p.enabled).length}</p>
            <p className="text-xs text-gray-400 mt-2">
              of {products.length} total
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export function DeliveryCustomersTab() {
  const { toast } = useToast();
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedCustomer, setSelectedCustomer] = useState<DeliveryCustomer | null>(null);
  const [photoDialog, setPhotoDialog] = useState(false);
  const [approveDialog, setApproveDialog] = useState(false);
  const [rejectDialog, setRejectDialog] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [editDialog, setEditDialog] = useState(false);
  const [editForm, setEditForm] = useState({
    fullName: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    zipCode: "",
  });
  const [statusChangeDialog, setStatusChangeDialog] = useState(false);
  const [newStatus, setNewStatus] = useState<"approved" | "rejected" | "pending">("pending");
  const [statusChangeReason, setStatusChangeReason] = useState("");
  const [resendCredentialsDialog, setResendCredentialsDialog] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState(false);

  const { data: customers, isLoading } = useQuery<DeliveryCustomer[]>({
    queryKey: ["/api/admin/delivery/customers"],
  });

  const approveMutation = useMutation({
    mutationFn: async (customerId: number) => {
      const res = await apiRequest("PATCH", `/api/admin/delivery/customers/${customerId}/approval`, { 
        status: 'approved' 
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/delivery/customers"] });
      toast({ title: "Customer Approved", description: "Activation link sent to customer's email to create their password." });
      setApproveDialog(false);
      setSelectedCustomer(null);
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to approve customer.", variant: "destructive" });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async ({ customerId, reason }: { customerId: number; reason: string }) => {
      const res = await apiRequest("PATCH", `/api/admin/delivery/customers/${customerId}/approval`, { 
        status: 'rejected',
        rejectionReason: reason 
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/delivery/customers"] });
      toast({ title: "Customer Rejected", description: "Rejection email sent." });
      setRejectDialog(false);
      setSelectedCustomer(null);
      setRejectionReason("");
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to reject customer.", variant: "destructive" });
    },
  });

  const editMutation = useMutation({
    mutationFn: async ({ customerId, data }: { customerId: number; data: typeof editForm }) => {
      const res = await apiRequest("PATCH", `/api/admin/delivery/customers/${customerId}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/delivery/customers"] });
      toast({ title: "Customer Updated", description: "Customer information has been updated successfully." });
      setEditDialog(false);
      setSelectedCustomer(null);
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update customer information.", variant: "destructive" });
    },
  });

  const handleEditClick = (customer: DeliveryCustomer) => {
    setSelectedCustomer(customer);
    setEditForm({
      fullName: customer.fullName,
      phone: customer.phone,
      address: customer.address.split(',')[0],
      city: customer.city,
      state: customer.state,
      zipCode: customer.zipCode,
    });
    setEditDialog(true);
  };

  const handleEditSubmit = () => {
    if (!selectedCustomer) return;
    editMutation.mutate({ customerId: selectedCustomer.id, data: editForm });
  };

  const resendCredentialsMutation = useMutation({
    mutationFn: async (customerId: number) => {
      const res = await apiRequest("POST", `/api/admin/delivery/customers/${customerId}/resend-credentials`, {});
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/delivery/customers"] });
      toast({ 
        title: "Activation Link Sent", 
        description: "A new password setup link has been sent to the customer's email." 
      });
      setResendCredentialsDialog(false);
      setSelectedCustomer(null);
    },
    onError: () => {
      toast({ 
        title: "Error", 
        description: "Failed to send activation link.", 
        variant: "destructive" 
      });
    },
  });

  const statusChangeMutation = useMutation({
    mutationFn: async ({ customerId, status, reason }: { customerId: number; status: string; reason?: string }) => {
      const res = await apiRequest("PATCH", `/api/admin/delivery/customers/${customerId}/approval`, { 
        status,
        rejectionReason: reason 
      });
      return res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/delivery/customers"] });
      const statusText = variables.status === 'approved' ? 'approved' : variables.status === 'rejected' ? 'rejected' : 'set to pending';
      toast({ title: "Status Updated", description: `Customer status ${statusText} and notification email sent.` });
      setStatusChangeDialog(false);
      setSelectedCustomer(null);
      setNewStatus("pending");
      setStatusChangeReason("");
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update customer status.", variant: "destructive" });
    },
  });

  const handleStatusChange = () => {
    if (!selectedCustomer) return;
    
    if (newStatus === 'rejected' && !statusChangeReason.trim()) {
      toast({ title: "Reason Required", description: "Please provide a reason for rejection.", variant: "destructive" });
      return;
    }
    
    statusChangeMutation.mutate({ 
      customerId: selectedCustomer.id, 
      status: newStatus,
      reason: statusChangeReason 
    });
  };

  const deleteCustomerMutation = useMutation({
    mutationFn: async (customerId: number) => {
      const res = await apiRequest("DELETE", `/api/admin/delivery/customers/${customerId}`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/delivery/customers"] });
      toast({ 
        title: "Customer Deleted", 
        description: "Customer has been permanently removed from the system." 
      });
      setDeleteDialog(false);
      setSelectedCustomer(null);
    },
    onError: () => {
      toast({ 
        title: "Error", 
        description: "Failed to delete customer.", 
        variant: "destructive" 
      });
    },
  });

  const filteredCustomers = customers?.filter(c =>
    statusFilter === "all" || c.approvalStatus === statusFilter
  ) || [];

  const downloadCSV = async () => {
    if (!filteredCustomers || filteredCustomers.length === 0) {
      toast({ title: "No Data", description: "No customers to export.", variant: "destructive" });
      return;
    }

    toast({ title: "Preparing Export", description: "Downloading customer data and photo IDs..." });

    const zip = new JSZip();

    // Create CSV
    const headers = ["ID", "Name", "Email", "Phone", "Address", "City", "State", "ZIP", "Status", "Created Date", "Rejection Reason", "Photo ID File"];
    const rows = filteredCustomers.map(customer => {
      let photoFileName = "";
      if (customer.photoIdUrl) {
        // Determine file extension from data URL or path
        const ext = customer.photoIdUrl.includes('image/png') ? 'png' : 'jpg';
        photoFileName = `photo-id-${customer.id}.${ext}`;
      }
      return [
        customer.id,
        customer.fullName,
        customer.email,
        customer.phone,
        customer.address,
        customer.city,
        customer.state,
        customer.zipCode,
        customer.approvalStatus,
        new Date(customer.createdAt).toLocaleDateString(),
        customer.rejectionReason || "",
        photoFileName
      ];
    });

    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(","))
    ].join("\n");

    // Add CSV to ZIP
    zip.file(`delivery-customers-${new Date().toISOString().split('T')[0]}.csv`, csvContent);

    // Download and add photo IDs to ZIP
    const photoFolder = zip.folder("photo-ids");
    let downloadedPhotos = 0;

    for (const customer of filteredCustomers) {
      if (customer.photoIdUrl) {
        try {
          let blob: Blob;
          
          // Handle data URLs (base64 encoded images)
          if (customer.photoIdUrl.startsWith('data:')) {
            // Extract base64 data and convert to blob
            const arr = customer.photoIdUrl.split(',');
            const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/jpeg';
            const bstr = atob(arr[1]);
            let n = bstr.length;
            const u8arr = new Uint8Array(n);
            while (n--) {
              u8arr[n] = bstr.charCodeAt(n);
            }
            blob = new Blob([u8arr], { type: mime });
          } 
          // Handle file paths
          else {
            const photoUrl = customer.photoIdUrl.startsWith('http') 
              ? customer.photoIdUrl 
              : `${window.location.origin}${customer.photoIdUrl}`;
            
            const response = await fetch(photoUrl);
            if (!response.ok) {
              throw new Error(`HTTP error! status: ${response.status}`);
            }
            blob = await response.blob();
          }
          
          if (blob && blob.size > 0) {
            // Determine file extension from MIME type
            const ext = blob.type.includes('png') ? 'png' : 'jpg';
            photoFolder?.file(`photo-id-${customer.id}.${ext}`, blob);
            downloadedPhotos++;
          } else {
            console.warn(`Empty blob for customer ${customer.id}`);
          }
        } catch (error) {
          console.error(`Failed to download photo for customer ${customer.id}:`, error);
        }
      }
    }

    // Generate and download ZIP file
    const zipBlob = await zip.generateAsync({ type: "blob" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(zipBlob);
    link.setAttribute("href", url);
    link.setAttribute("download", `delivery-customers-export-${new Date().toISOString().split('T')[0]}.zip`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({ 
      title: "Export Complete", 
      description: `Exported ${filteredCustomers.length} customers and ${downloadedPhotos} photo IDs.` 
    });
  };

  return (
    <>
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Delivery Customer Approvals</CardTitle>
          <Button
            onClick={downloadCSV}
            variant="outline"
            size="sm"
            className="border-gray-600 hover:bg-gray-700"
            data-testid="button-download-csv"
          >
            <Download className="h-4 w-4 mr-2" />
            Export Data & Photos
          </Button>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 mb-4">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48 bg-gray-700 border-gray-600" data-testid="filter-status">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent className="bg-gray-700 border-gray-600">
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {isLoading ? (
            <div className="animate-pulse space-y-3">
              {[1, 2, 3].map((i) => <div key={i} className="h-14 bg-gray-700 rounded"></div>)}
            </div>
          ) : filteredCustomers.length > 0 ? (
            <div className="rounded-md border border-gray-700 overflow-x-auto">
              <Table>
                <TableHeader className="bg-gray-800">
                  <TableRow className="hover:bg-gray-700/50 border-gray-700">
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Address</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCustomers.map((customer) => (
                    <TableRow key={customer.id} className="hover:bg-gray-700/50 border-gray-700">
                      <TableCell className="font-medium">{customer.fullName}</TableCell>
                      <TableCell className="text-gray-400 text-sm">{customer.email}</TableCell>
                      <TableCell className="text-gray-400 text-sm">
                        {customer.address.split(',')[0]}, {customer.city}, {customer.state} {customer.zipCode}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Badge 
                            className={
                              customer.approvalStatus === "approved" ? "bg-green-600" :
                              customer.approvalStatus === "rejected" ? "bg-red-600" :
                              "bg-yellow-600"
                            }
                          >
                            {customer.approvalStatus}
                          </Badge>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 px-2 text-xs text-gray-400 hover:text-gray-300"
                            onClick={() => {
                              setSelectedCustomer(customer);
                              setNewStatus(customer.approvalStatus as "approved" | "rejected" | "pending");
                              setStatusChangeDialog(true);
                            }}
                            data-testid={`button-change-status-${customer.id}`}
                          >
                            Change
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell className="text-gray-400 text-sm">
                        {new Date(customer.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 px-2 text-blue-400 hover:text-blue-300 hover:bg-gray-700"
                            onClick={() => { setSelectedCustomer(customer); setPhotoDialog(true); }}
                            data-testid={`button-view-photo-${customer.id}`}
                          >
                            <Eye size={16} className="mr-1" />
                            Photo ID
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 px-2 text-gray-400 hover:text-gray-300 hover:bg-gray-700"
                            onClick={() => handleEditClick(customer)}
                            data-testid={`button-edit-${customer.id}`}
                          >
                            <Edit size={16} className="mr-1" />
                            Edit
                          </Button>
                          {customer.approvalStatus === "pending" && (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 px-2 text-green-400 hover:text-green-300 hover:bg-gray-700"
                                onClick={() => { setSelectedCustomer(customer); setApproveDialog(true); }}
                                data-testid={`button-approve-${customer.id}`}
                              >
                                <CheckCircle size={16} className="mr-1" />
                                Approve
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 px-2 text-red-400 hover:text-red-300 hover:bg-gray-700"
                                onClick={() => { setSelectedCustomer(customer); setRejectDialog(true); }}
                                data-testid={`button-reject-${customer.id}`}
                              >
                                <XCircle size={16} className="mr-1" />
                                Reject
                              </Button>
                            </>
                          )}
                          {customer.approvalStatus === "approved" && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 px-2 text-orange-400 hover:text-orange-300 hover:bg-gray-700"
                              onClick={() => { setSelectedCustomer(customer); setResendCredentialsDialog(true); }}
                              data-testid={`button-resend-${customer.id}`}
                            >
                              <Mail size={16} className="mr-1" />
                              Send Activation Link
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 px-2 text-red-400 hover:text-red-300 hover:bg-gray-700"
                            onClick={() => { setSelectedCustomer(customer); setDeleteDialog(true); }}
                            data-testid={`button-delete-${customer.id}`}
                          >
                            <Trash2 size={16} className="mr-1" />
                            Delete
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-12 text-gray-400">
              <AlertCircle className="h-12 w-12 mb-4 mx-auto text-gray-500" />
              <p>No customers found</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Photo ID Dialog */}
      <Dialog open={photoDialog} onOpenChange={setPhotoDialog}>
        <DialogContent className="bg-gray-800 text-white border-gray-700 max-w-2xl">
          <DialogHeader>
            <DialogTitle>Photo ID - {selectedCustomer?.fullName}</DialogTitle>
          </DialogHeader>
          <div className="mt-4">
            <img 
              src={selectedCustomer?.photoIdUrl} 
              alt="Photo ID" 
              className="w-full rounded border border-gray-700"
              data-testid="img-photo-id"
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* Approve Dialog */}
      <Dialog open={approveDialog} onOpenChange={setApproveDialog}>
        <DialogContent className="bg-gray-800 text-white border-gray-700">
          <DialogHeader>
            <DialogTitle>Approve Customer</DialogTitle>
            <DialogDescription className="text-gray-400">
              This will enable the customer's account and send them a temporary password via email.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setApproveDialog(false)} className="border-gray-600">
              Cancel
            </Button>
            <Button
              onClick={() => selectedCustomer && approveMutation.mutate(selectedCustomer.id)}
              className="bg-green-600 hover:bg-green-700"
              disabled={approveMutation.isPending}
              data-testid="button-confirm-approve"
            >
              {approveMutation.isPending ? "Approving..." : "Approve Customer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={rejectDialog} onOpenChange={setRejectDialog}>
        <DialogContent className="bg-gray-800 text-white border-gray-700">
          <DialogHeader>
            <DialogTitle>Reject Customer</DialogTitle>
            <DialogDescription className="text-gray-400">
              Please provide a reason for rejection (will be sent to customer via email).
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="rejection-reason">Rejection Reason</Label>
            <Textarea
              id="rejection-reason"
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              className="mt-2 bg-gray-700 border-gray-600"
              placeholder="e.g., Photo ID is not clear enough, please resubmit..."
              data-testid="input-rejection-reason"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialog(false)} className="border-gray-600">
              Cancel
            </Button>
            <Button
              onClick={() => selectedCustomer && rejectMutation.mutate({ customerId: selectedCustomer.id, reason: rejectionReason })}
              className="bg-red-600 hover:bg-red-700"
              disabled={rejectMutation.isPending || !rejectionReason.trim()}
              data-testid="button-confirm-reject"
            >
              {rejectMutation.isPending ? "Rejecting..." : "Reject Customer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Resend Credentials Dialog */}
      <Dialog open={resendCredentialsDialog} onOpenChange={setResendCredentialsDialog}>
        <DialogContent className="bg-gray-800 text-white border-gray-700">
          <DialogHeader>
            <DialogTitle>Send New Activation Link</DialogTitle>
            <DialogDescription className="text-gray-400">
              This will generate a new password setup link and send it to the customer's email.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 text-sm text-gray-300">
            <p className="mb-2">Customer: <span className="font-semibold text-white">{selectedCustomer?.fullName}</span></p>
            <p className="mb-4">Email: <span className="font-semibold text-white">{selectedCustomer?.email}</span></p>
            <p className="text-orange-400">
              Note: The customer will receive a secure activation link to create their password. The link expires in 48 hours.
            </p>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setResendCredentialsDialog(false)} 
              className="border-gray-600"
              data-testid="button-cancel-resend"
            >
              Cancel
            </Button>
            <Button
              onClick={() => selectedCustomer && resendCredentialsMutation.mutate(selectedCustomer.id)}
              className="bg-orange-600 hover:bg-orange-700"
              disabled={resendCredentialsMutation.isPending}
              data-testid="button-confirm-resend"
            >
              {resendCredentialsMutation.isPending ? "Sending..." : "Send Activation Link"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Customer Dialog */}
      <Dialog open={deleteDialog} onOpenChange={setDeleteDialog}>
        <DialogContent className="bg-gray-800 text-white border-gray-700">
          <DialogHeader>
            <DialogTitle>Delete Customer</DialogTitle>
            <DialogDescription className="text-gray-400">
              This action cannot be undone. This will permanently delete the customer from the database.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 text-sm text-gray-300">
            <p className="mb-2">Customer: <span className="font-semibold text-white">{selectedCustomer?.fullName}</span></p>
            <p className="mb-4">Email: <span className="font-semibold text-white">{selectedCustomer?.email}</span></p>
            <p className="text-red-400 font-semibold">
              Warning: This will permanently remove all customer data. The customer can sign up again with the same email if needed.
            </p>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setDeleteDialog(false)} 
              className="border-gray-600"
              data-testid="button-cancel-delete"
            >
              Cancel
            </Button>
            <Button
              onClick={() => selectedCustomer && deleteCustomerMutation.mutate(selectedCustomer.id)}
              className="bg-red-600 hover:bg-red-700"
              disabled={deleteCustomerMutation.isPending}
              data-testid="button-confirm-delete"
            >
              {deleteCustomerMutation.isPending ? "Deleting..." : "Delete Customer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Customer Dialog */}
      <Dialog open={editDialog} onOpenChange={setEditDialog}>
        <DialogContent className="bg-gray-800 text-white border-gray-700 max-w-xl">
          <DialogHeader>
            <DialogTitle>Edit Customer Information</DialogTitle>
            <DialogDescription className="text-gray-400">
              Update customer contact and address details.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div>
              <Label htmlFor="edit-fullName">Full Name</Label>
              <Input
                id="edit-fullName"
                value={editForm.fullName}
                onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })}
                className="mt-2 bg-gray-700 border-gray-600"
                data-testid="input-edit-fullName"
              />
            </div>
            <div>
              <Label htmlFor="edit-phone">Phone</Label>
              <Input
                id="edit-phone"
                value={editForm.phone}
                onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                className="mt-2 bg-gray-700 border-gray-600"
                data-testid="input-edit-phone"
              />
            </div>
            <div>
              <Label htmlFor="edit-address">Street Address</Label>
              <Input
                id="edit-address"
                value={editForm.address}
                onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                className="mt-2 bg-gray-700 border-gray-600"
                data-testid="input-edit-address"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-city">City</Label>
                <Input
                  id="edit-city"
                  value={editForm.city}
                  onChange={(e) => setEditForm({ ...editForm, city: e.target.value })}
                  className="mt-2 bg-gray-700 border-gray-600"
                  data-testid="input-edit-city"
                />
              </div>
              <div>
                <Label htmlFor="edit-state">State</Label>
                <Input
                  id="edit-state"
                  value={editForm.state}
                  onChange={(e) => setEditForm({ ...editForm, state: e.target.value })}
                  className="mt-2 bg-gray-700 border-gray-600"
                  data-testid="input-edit-state"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="edit-zipCode">ZIP Code</Label>
              <Input
                id="edit-zipCode"
                value={editForm.zipCode}
                onChange={(e) => setEditForm({ ...editForm, zipCode: e.target.value })}
                className="mt-2 bg-gray-700 border-gray-600"
                data-testid="input-edit-zipCode"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialog(false)} className="border-gray-600">
              Cancel
            </Button>
            <Button
              onClick={handleEditSubmit}
              className="bg-blue-600 hover:bg-blue-700"
              disabled={editMutation.isPending}
              data-testid="button-confirm-edit"
            >
              {editMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Status Change Dialog */}
      <Dialog open={statusChangeDialog} onOpenChange={setStatusChangeDialog}>
        <DialogContent className="bg-gray-800 text-white border-gray-700">
          <DialogHeader>
            <DialogTitle>Change Customer Status</DialogTitle>
            <DialogDescription className="text-gray-400">
              Update the approval status for {selectedCustomer?.fullName}. An email notification will be sent.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div>
              <Label htmlFor="new-status">New Status</Label>
              <Select value={newStatus} onValueChange={(value: "approved" | "rejected" | "pending") => setNewStatus(value)}>
                <SelectTrigger className="mt-2 bg-gray-700 border-gray-600" data-testid="select-new-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-gray-700 border-gray-600">
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {newStatus === 'rejected' && (
              <div>
                <Label htmlFor="status-change-reason">Rejection Reason</Label>
                <Textarea
                  id="status-change-reason"
                  value={statusChangeReason}
                  onChange={(e) => setStatusChangeReason(e.target.value)}
                  className="mt-2 bg-gray-700 border-gray-600"
                  placeholder="Provide a reason for rejection..."
                  data-testid="input-status-change-reason"
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setStatusChangeDialog(false)} className="border-gray-600">
              Cancel
            </Button>
            <Button
              onClick={handleStatusChange}
              className={
                newStatus === 'approved' ? "bg-green-600 hover:bg-green-700" :
                newStatus === 'rejected' ? "bg-red-600 hover:bg-red-700" :
                "bg-yellow-600 hover:bg-yellow-700"
              }
              disabled={statusChangeMutation.isPending}
              data-testid="button-confirm-status-change"
            >
              {statusChangeMutation.isPending ? "Updating..." : "Update Status"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

interface DeliveryProduct {
  id: number;
  name: string;
  price: string;
  stockQuantity: string;
  enabled: boolean;
}

export function DeliveryOrdersTab() {
  const { toast } = useToast();
  const [selectedOrder, setSelectedOrder] = useState<DeliveryOrder | null>(null);
  const [orderDialog, setOrderDialog] = useState(false);
  const [refundDialog, setRefundDialog] = useState(false);
  const [refundOrder, setRefundOrder] = useState<DeliveryOrder | null>(null);
  const [refundAmount, setRefundAmount] = useState("");
  const [refundReason, setRefundReason] = useState("");
  
  // Delete order state
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [deleteOrder, setDeleteOrder] = useState<DeliveryOrder | null>(null);
  
  // Manual order creation state
  const [manualOrderDialog, setManualOrderDialog] = useState(false);
  const [manualOrderCustomerId, setManualOrderCustomerId] = useState<number | null>(null);
  const [manualOrderItems, setManualOrderItems] = useState<Array<{ productId: number; quantity: number; productName: string; price: string }>>([]);
  const [manualOrderReason, setManualOrderReason] = useState("");
  const [manualOrderNotes, setManualOrderNotes] = useState("");
  const [manualOrderSendEmail, setManualOrderSendEmail] = useState(true);
  const [productSearch, setProductSearch] = useState("");
  
  // Search and filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [paymentFilter, setPaymentFilter] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState<string>("all");
  
  // Bulk selection state
  const [selectedOrders, setSelectedOrders] = useState<number[]>([]);
  const [bulkStatusDialog, setBulkStatusDialog] = useState(false);
  const [bulkStatus, setBulkStatus] = useState<string>("confirmed");

  const { data: orders, isLoading } = useQuery<DeliveryOrder[]>({
    queryKey: ["/api/admin/delivery/orders"],
  });

  // Fetch customers for manual order creation
  const { data: customers = [] } = useQuery<DeliveryCustomer[]>({
    queryKey: ["/api/admin/delivery/customers"],
  });
  
  // Fetch products for manual order creation
  const { data: productsData } = useQuery<{ products: DeliveryProduct[] }>({
    queryKey: ["/api/admin/delivery/products", 1, 1000],
    queryFn: async () => {
      const res = await fetch("/api/admin/delivery/products?page=1&limit=1000&enabled=enabled", {
        credentials: 'include'
      });
      if (!res.ok) return { products: [] };
      return res.json();
    },
    enabled: manualOrderDialog
  });
  const availableProducts = productsData?.products || [];

  // Delete order mutation
  const deleteMutation = useMutation({
    mutationFn: async (orderId: number) => {
      return apiRequest("DELETE", `/api/admin/delivery/orders/${orderId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/delivery/orders"] });
      toast({ title: "Order Deleted", description: "Order has been deleted successfully." });
      setDeleteDialog(false);
      setDeleteOrder(null);
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to delete order.", variant: "destructive" });
    },
  });

  // Create manual order mutation
  const manualOrderMutation = useMutation({
    mutationFn: async (data: { customerId: number; items: Array<{ productId: number; quantity: number }>; reason: string; notes: string; sendEmail: boolean }) => {
      return apiRequest("POST", "/api/admin/delivery/orders/manual", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/delivery/orders"] });
      toast({ title: "Replacement Order Created", description: "Replacement order has been created successfully." });
      resetManualOrderForm();
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to create replacement order.", variant: "destructive" });
    },
  });

  const resetManualOrderForm = () => {
    setManualOrderDialog(false);
    setManualOrderCustomerId(null);
    setManualOrderItems([]);
    setManualOrderReason("");
    setManualOrderNotes("");
    setManualOrderSendEmail(true);
    setProductSearch("");
  };

  const addItemToManualOrder = (product: DeliveryProduct) => {
    const existing = manualOrderItems.find(i => i.productId === product.id);
    if (existing) {
      setManualOrderItems(prev => prev.map(i => 
        i.productId === product.id ? { ...i, quantity: i.quantity + 1 } : i
      ));
    } else {
      setManualOrderItems(prev => [...prev, { 
        productId: product.id, 
        quantity: 1, 
        productName: product.name,
        price: product.price
      }]);
    }
    setProductSearch("");
  };

  const removeItemFromManualOrder = (productId: number) => {
    setManualOrderItems(prev => prev.filter(i => i.productId !== productId));
  };

  const updateItemQuantity = (productId: number, quantity: number) => {
    if (quantity < 1) {
      removeItemFromManualOrder(productId);
    } else {
      setManualOrderItems(prev => prev.map(i => 
        i.productId === productId ? { ...i, quantity } : i
      ));
    }
  };

  const handleCreateManualOrder = () => {
    if (!manualOrderCustomerId || manualOrderItems.length === 0) {
      toast({ title: "Error", description: "Please select a customer and add at least one item.", variant: "destructive" });
      return;
    }
    manualOrderMutation.mutate({
      customerId: manualOrderCustomerId,
      items: manualOrderItems.map(i => ({ productId: i.productId, quantity: i.quantity })),
      reason: manualOrderReason,
      notes: manualOrderNotes,
      sendEmail: manualOrderSendEmail
    });
  };

  // Filter orders based on search and filters
  const filteredOrders = orders?.filter(order => {
    // Search filter (order ID or customer name)
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch = !searchQuery || 
      order.id.toString().includes(searchQuery) ||
      (order.customerName?.toLowerCase().includes(searchLower));
    
    // Status filter
    const matchesStatus = statusFilter === "all" || order.status === statusFilter;
    
    // Payment status filter (treat undefined/null as "pending")
    const effectivePaymentStatus = order.paymentStatus || "pending";
    const matchesPayment = paymentFilter === "all" || effectivePaymentStatus === paymentFilter;
    
    // Date filter
    let matchesDate = true;
    if (dateFilter !== "all") {
      const orderDate = new Date(order.createdAt);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (dateFilter === "today") {
        matchesDate = orderDate >= today;
      } else if (dateFilter === "week") {
        const weekAgo = new Date(today);
        weekAgo.setDate(weekAgo.getDate() - 7);
        matchesDate = orderDate >= weekAgo;
      } else if (dateFilter === "month") {
        const monthAgo = new Date(today);
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        matchesDate = orderDate >= monthAgo;
      }
    }
    
    return matchesSearch && matchesStatus && matchesPayment && matchesDate;
  }) || [];

  // Toggle single order selection
  const toggleOrderSelection = (orderId: number) => {
    setSelectedOrders(prev => 
      prev.includes(orderId) 
        ? prev.filter(id => id !== orderId)
        : [...prev, orderId]
    );
  };

  // Check if all filtered orders are selected
  const allFilteredSelected = filteredOrders.length > 0 && filteredOrders.every(o => selectedOrders.includes(o.id));
  const someFilteredSelected = filteredOrders.some(o => selectedOrders.includes(o.id));

  // Toggle all orders selection
  const toggleAllOrders = () => {
    if (allFilteredSelected) {
      // Remove all filtered orders from selection
      setSelectedOrders(prev => prev.filter(id => !filteredOrders.some(o => o.id === id)));
    } else {
      // Add all filtered orders to selection
      const filteredIds = filteredOrders.map(o => o.id);
      setSelectedOrders(prev => Array.from(new Set([...prev, ...filteredIds])));
    }
  };

  // Clear filters
  const clearFilters = () => {
    setSearchQuery("");
    setStatusFilter("all");
    setPaymentFilter("all");
    setDateFilter("all");
  };

  const statusMutation = useMutation({
    mutationFn: async ({ orderId, status }: { orderId: number; status: string }) => {
      const res = await apiRequest("PATCH", `/api/admin/delivery/orders/${orderId}/status`, { status });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/delivery/orders"] });
      toast({ title: "Order Updated", description: "Order status updated successfully." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update order status.", variant: "destructive" });
    },
  });

  const refundMutation = useMutation({
    mutationFn: async ({ orderId, refundAmount, refundReason }: { orderId: number; refundAmount: string; refundReason: string }) => {
      const res = await apiRequest("POST", `/api/admin/delivery/orders/${orderId}/refund`, { refundAmount, refundReason });
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/delivery/orders"] });
      toast({ title: "Refund Processed", description: data.message || "Refund processed successfully." });
      setRefundDialog(false);
      setRefundOrder(null);
      setRefundAmount("");
      setRefundReason("");
    },
    onError: (error: any) => {
      toast({ title: "Refund Failed", description: error.message || "Failed to process refund.", variant: "destructive" });
    },
  });

  const openRefundDialog = (order: DeliveryOrder) => {
    setRefundOrder(order);
    setRefundAmount(order.total);
    setRefundReason("");
    setRefundDialog(true);
  };

  const handleRefund = () => {
    if (!refundOrder || !refundAmount || !refundReason.trim()) {
      toast({ title: "Error", description: "Please enter refund amount and reason.", variant: "destructive" });
      return;
    }
    refundMutation.mutate({ orderId: refundOrder.id, refundAmount, refundReason: refundReason.trim() });
  };

  const handleDownloadReceipt = async (orderId: number) => {
    try {
      const response = await fetch(`/api/admin/orders/${orderId}/receipt`, {
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

  // Bulk status update mutation
  const bulkStatusMutation = useMutation({
    mutationFn: async ({ orderIds, status }: { orderIds: number[]; status: string }) => {
      const results = await Promise.all(
        orderIds.map(orderId => 
          apiRequest("PATCH", `/api/admin/delivery/orders/${orderId}/status`, { status })
        )
      );
      return results;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/delivery/orders"] });
      toast({ title: "Bulk Update Complete", description: `Updated ${selectedOrders.length} orders to "${bulkStatus.replace(/_/g, " ")}"` });
      setSelectedOrders([]);
      setBulkStatusDialog(false);
    },
    onError: () => {
      toast({ title: "Error", description: "Some orders failed to update.", variant: "destructive" });
    },
  });

  const handleBulkStatusUpdate = () => {
    if (selectedOrders.length === 0) return;
    bulkStatusMutation.mutate({ orderIds: selectedOrders, status: bulkStatus });
  };

  return (
    <>
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Delivery Orders</CardTitle>
          <Button
            onClick={() => setManualOrderDialog(true)}
            className="bg-orange-600 hover:bg-orange-700"
          >
            <Package size={16} className="mr-2" />
            Create Replacement Order
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search and Filters */}
          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap gap-3">
              <div className="flex-1 min-w-[200px]">
                <Input
                  placeholder="Search by order ID or customer name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-gray-700 border-gray-600"
                  data-testid="input-order-search"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[150px] bg-gray-700 border-gray-600" data-testid="select-status-filter">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent className="bg-gray-700 border-gray-600">
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="confirmed">Confirmed</SelectItem>
                  <SelectItem value="out_for_delivery">Out for Delivery</SelectItem>
                  <SelectItem value="delivered">Delivered</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
              <Select value={paymentFilter} onValueChange={setPaymentFilter}>
                <SelectTrigger className="w-[150px] bg-gray-700 border-gray-600" data-testid="select-payment-filter">
                  <SelectValue placeholder="Payment" />
                </SelectTrigger>
                <SelectContent className="bg-gray-700 border-gray-600">
                  <SelectItem value="all">All Payments</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="refunded">Refunded</SelectItem>
                </SelectContent>
              </Select>
              <Select value={dateFilter} onValueChange={setDateFilter}>
                <SelectTrigger className="w-[140px] bg-gray-700 border-gray-600" data-testid="select-date-filter">
                  <SelectValue placeholder="Date" />
                </SelectTrigger>
                <SelectContent className="bg-gray-700 border-gray-600">
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="week">This Week</SelectItem>
                  <SelectItem value="month">This Month</SelectItem>
                </SelectContent>
              </Select>
              {(searchQuery || statusFilter !== "all" || paymentFilter !== "all" || dateFilter !== "all") && (
                <Button variant="ghost" size="sm" onClick={clearFilters} className="text-gray-400 hover:text-white">
                  <XCircle size={16} className="mr-1" /> Clear
                </Button>
              )}
            </div>
            
            {/* Bulk Actions Bar */}
            {selectedOrders.length > 0 && (
              <div className="flex items-center gap-3 p-3 bg-blue-900/30 border border-blue-700 rounded-lg">
                <span className="text-sm text-blue-300">{selectedOrders.length} order(s) selected</span>
                <Button
                  size="sm"
                  onClick={() => setBulkStatusDialog(true)}
                  className="bg-blue-600 hover:bg-blue-700"
                  data-testid="button-bulk-status"
                >
                  <Edit size={14} className="mr-1" /> Update Status
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedOrders([])}
                  className="text-gray-400 hover:text-white"
                >
                  Clear Selection
                </Button>
              </div>
            )}
            
            {/* Results count */}
            <div className="text-sm text-gray-400">
              Showing {filteredOrders.length} of {orders?.length || 0} orders
            </div>
          </div>
          
          {isLoading ? (
            <div className="animate-pulse space-y-3">
              {[1, 2, 3].map((i) => <div key={i} className="h-14 bg-gray-700 rounded"></div>)}
            </div>
          ) : filteredOrders.length > 0 ? (
            <div className="rounded-md border border-gray-700 overflow-x-auto">
              <Table>
                <TableHeader className="bg-gray-800">
                  <TableRow className="hover:bg-gray-700/50 border-gray-700">
                    <TableHead className="w-[50px]">
                      <Checkbox
                        checked={allFilteredSelected}
                        ref={(el) => {
                          if (el) {
                            (el as any).indeterminate = someFilteredSelected && !allFilteredSelected;
                          }
                        }}
                        onCheckedChange={toggleAllOrders}
                        data-testid="checkbox-select-all"
                      />
                    </TableHead>
                    <TableHead>Order ID</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Payment</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOrders.map((order) => (
                    <TableRow key={order.id} className={`hover:bg-gray-700/50 border-gray-700 ${selectedOrders.includes(order.id) ? 'bg-blue-900/20' : ''}`}>
                      <TableCell>
                        <Checkbox
                          checked={selectedOrders.includes(order.id)}
                          onCheckedChange={() => toggleOrderSelection(order.id)}
                          data-testid={`checkbox-order-${order.id}`}
                        />
                      </TableCell>
                      <TableCell className="font-medium">#{order.id}</TableCell>
                      <TableCell className="text-gray-400">
                        {order.customerName || `Customer #${order.customerId}`}
                      </TableCell>
                      <TableCell className="text-gray-400">${order.total}</TableCell>
                      <TableCell>
                        <Badge className={
                          order.status === "delivered" ? "bg-green-600" :
                          order.status === "out_for_delivery" ? "bg-blue-600" :
                          order.status === "confirmed" ? "bg-yellow-600" :
                          order.status === "cancelled" ? "bg-red-600" :
                          "bg-gray-600"
                        }>
                          {order.status.replace(/_/g, " ")}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={
                          order.paymentStatus === "paid" ? "bg-green-600" :
                          order.paymentStatus === "refunded" ? "bg-purple-600" :
                          "bg-gray-600"
                        }>
                          {order.paymentStatus || "pending"}
                        </Badge>
                        {order.paymentStatus === "refunded" && order.refundAmount && (
                          <span className="text-xs text-purple-400 ml-1">(${order.refundAmount})</span>
                        )}
                      </TableCell>
                      <TableCell className="text-gray-400 text-sm">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 px-2 text-blue-400 hover:text-blue-300 hover:bg-gray-700"
                            onClick={() => { setSelectedOrder(order); setOrderDialog(true); }}
                            data-testid={`button-view-order-${order.id}`}
                          >
                            <Eye size={16} className="mr-1" />
                            View
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 px-2 text-green-400 hover:text-green-300 hover:bg-gray-700"
                            onClick={() => handleDownloadReceipt(order.id)}
                            data-testid={`button-receipt-order-${order.id}`}
                          >
                            <Download size={16} className="mr-1" />
                            Receipt
                          </Button>
                          {order.paymentStatus !== "refunded" && order.paymentStatus === "paid" && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 px-2 text-purple-400 hover:text-purple-300 hover:bg-gray-700"
                              onClick={() => openRefundDialog(order)}
                              data-testid={`button-refund-order-${order.id}`}
                            >
                              <DollarSign size={16} className="mr-1" />
                              Refund
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 px-2 text-red-400 hover:text-red-300 hover:bg-gray-700"
                            onClick={() => { setDeleteOrder(order); setDeleteDialog(true); }}
                            data-testid={`button-delete-order-${order.id}`}
                          >
                            <Trash2 size={16} />
                          </Button>
                          <Select
                            value={order.status}
                            onValueChange={(status) => statusMutation.mutate({ orderId: order.id, status })}
                          >
                            <SelectTrigger className="w-32 h-8 bg-gray-700 border-gray-600" data-testid={`select-status-${order.id}`}>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-gray-700 border-gray-600">
                              <SelectItem value="pending">Pending</SelectItem>
                              <SelectItem value="confirmed">Confirmed</SelectItem>
                              <SelectItem value="out_for_delivery">Out for Delivery</SelectItem>
                              <SelectItem value="delivered">Delivered</SelectItem>
                              <SelectItem value="cancelled">Cancelled</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-12 text-gray-400">
              <Package className="h-12 w-12 mb-4 mx-auto text-gray-500" />
              <p>No orders found</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Order Details Dialog */}
      <Dialog open={orderDialog} onOpenChange={setOrderDialog}>
        <DialogContent className="bg-gray-800 text-white border-gray-700 max-w-2xl">
          <DialogHeader>
            <DialogTitle>Order #{selectedOrder?.id}</DialogTitle>
          </DialogHeader>
          <div className="mt-4 space-y-4">
            <div>
              <Label className="text-gray-400">Customer</Label>
              <p className="text-white">{selectedOrder?.customerName || `Customer #${selectedOrder?.customerId}`}</p>
            </div>
            <div>
              <Label className="text-gray-400">Delivery Window</Label>
              <p className="text-white">{selectedOrder?.deliveryWindow || "Not specified"}</p>
            </div>
            <div>
              <Label className="text-gray-400">Items</Label>
              <div className="mt-2 space-y-2">
                {selectedOrder?.items?.map((item: any, idx: number) => (
                  <div key={idx} className="flex justify-between text-sm">
                    <span>{item.name} x{item.quantity}</span>
                    <span>${item.price}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="border-t border-gray-700 pt-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Subtotal</span>
                <span>${selectedOrder?.subtotal}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Delivery Fee</span>
                <span>${selectedOrder?.deliveryFee}</span>
              </div>
              <div className="flex justify-between font-bold mt-2">
                <span>Total</span>
                <span>${selectedOrder?.total}</span>
              </div>
            </div>
            {selectedOrder?.deliveryNotes && (
              <div>
                <Label className="text-gray-400">Delivery Notes</Label>
                <p className="text-white text-sm mt-1">{selectedOrder.deliveryNotes}</p>
              </div>
            )}
            {selectedOrder?.paymentStatus === "refunded" && (
              <div className="bg-purple-900/30 border border-purple-700 rounded-lg p-4">
                <Label className="text-purple-400">Refund Information</Label>
                <div className="mt-2 space-y-1 text-sm">
                  <p><span className="text-gray-400">Amount:</span> <span className="text-white">${selectedOrder.refundAmount}</span></p>
                  <p><span className="text-gray-400">Reason:</span> <span className="text-white">{selectedOrder.refundReason}</span></p>
                  {selectedOrder.refundedAt && (
                    <p><span className="text-gray-400">Date:</span> <span className="text-white">{new Date(selectedOrder.refundedAt).toLocaleString()}</span></p>
                  )}
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Refund Dialog */}
      <Dialog open={refundDialog} onOpenChange={setRefundDialog}>
        <DialogContent className="bg-gray-800 text-white border-gray-700">
          <DialogHeader>
            <DialogTitle>Process Refund</DialogTitle>
            <DialogDescription className="text-gray-400">
              Process a refund for Order #{refundOrder?.id}. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4 space-y-4">
            <div className="bg-gray-700/50 rounded-lg p-4">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Order Total:</span>
                <span className="text-white font-medium">${refundOrder?.total}</span>
              </div>
              <div className="flex justify-between text-sm mt-1">
                <span className="text-gray-400">Payment Method:</span>
                <span className="text-white">{refundOrder?.paymentMethod === 'credit_card' ? 'Credit Card' : 'Cash'}</span>
              </div>
            </div>
            <div>
              <Label className="text-gray-300">Refund Amount</Label>
              <div className="relative mt-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">$</span>
                <Input
                  type="number"
                  step="0.01"
                  min="0.01"
                  max={refundOrder?.total}
                  value={refundAmount}
                  onChange={(e) => setRefundAmount(e.target.value)}
                  className="pl-7 bg-gray-700 border-gray-600"
                  placeholder="Enter refund amount"
                  data-testid="input-refund-amount"
                />
              </div>
              <p className="text-xs text-gray-400 mt-1">Max: ${refundOrder?.total}</p>
            </div>
            <div>
              <Label className="text-gray-300">Refund Reason</Label>
              <Textarea
                value={refundReason}
                onChange={(e) => setRefundReason(e.target.value)}
                className="mt-1 bg-gray-700 border-gray-600"
                placeholder="Enter reason for refund (required)"
                rows={3}
                data-testid="input-refund-reason"
              />
            </div>
            {refundOrder?.paymentMethod === 'credit_card' && (
              <div className="bg-yellow-900/30 border border-yellow-700 rounded-lg p-3 text-yellow-300 text-sm">
                <AlertCircle size={16} className="inline mr-2" />
                This will process a refund through Clover and refund the customer's card.
              </div>
            )}
          </div>
          <DialogFooter className="mt-6">
            <Button
              variant="outline"
              onClick={() => setRefundDialog(false)}
              className="border-gray-600"
              data-testid="button-cancel-refund"
            >
              Cancel
            </Button>
            <Button
              onClick={handleRefund}
              disabled={refundMutation.isPending || !refundAmount || !refundReason.trim()}
              className="bg-purple-600 hover:bg-purple-700"
              data-testid="button-confirm-refund"
            >
              {refundMutation.isPending ? "Processing..." : "Process Refund"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Status Update Dialog */}
      <Dialog open={bulkStatusDialog} onOpenChange={setBulkStatusDialog}>
        <DialogContent className="bg-gray-800 text-white border-gray-700">
          <DialogHeader>
            <DialogTitle>Bulk Status Update</DialogTitle>
            <DialogDescription className="text-gray-400">
              Update status for {selectedOrders.length} selected order(s).
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4 space-y-4">
            <div>
              <Label className="text-gray-300">New Status</Label>
              <Select value={bulkStatus} onValueChange={setBulkStatus}>
                <SelectTrigger className="mt-2 bg-gray-700 border-gray-600" data-testid="select-bulk-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-gray-700 border-gray-600">
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="confirmed">Confirmed</SelectItem>
                  <SelectItem value="out_for_delivery">Out for Delivery</SelectItem>
                  <SelectItem value="delivered">Delivered</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="bg-yellow-900/30 border border-yellow-700 rounded-lg p-3 text-yellow-300 text-sm">
              <AlertCircle size={16} className="inline mr-2" />
              This will update {selectedOrders.length} order(s) to "{bulkStatus.replace(/_/g, " ")}".
            </div>
          </div>
          <DialogFooter className="mt-6">
            <Button
              variant="outline"
              onClick={() => setBulkStatusDialog(false)}
              className="border-gray-600"
              data-testid="button-cancel-bulk"
            >
              Cancel
            </Button>
            <Button
              onClick={handleBulkStatusUpdate}
              disabled={bulkStatusMutation.isPending}
              className="bg-blue-600 hover:bg-blue-700"
              data-testid="button-confirm-bulk"
            >
              {bulkStatusMutation.isPending ? "Updating..." : "Update All"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Order Confirmation Dialog */}
      <Dialog open={deleteDialog} onOpenChange={setDeleteDialog}>
        <DialogContent className="bg-gray-800 text-white border-gray-700">
          <DialogHeader>
            <DialogTitle>Delete Order</DialogTitle>
            <DialogDescription className="text-gray-400">
              Are you sure you want to delete Order #{deleteOrder?.id}? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4 bg-red-900/30 border border-red-700 rounded-lg p-4">
            <p className="text-red-300 text-sm">
              <AlertCircle size={16} className="inline mr-2" />
              Deleting this order will permanently remove all order data including items and payment information.
            </p>
          </div>
          <DialogFooter className="mt-6">
            <Button
              variant="outline"
              onClick={() => { setDeleteDialog(false); setDeleteOrder(null); }}
              className="border-gray-600"
            >
              Cancel
            </Button>
            <Button
              onClick={() => deleteOrder && deleteMutation.mutate(deleteOrder.id)}
              disabled={deleteMutation.isPending}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete Order"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Manual Replacement Order Dialog */}
      <Dialog open={manualOrderDialog} onOpenChange={(open) => { if (!open) resetManualOrderForm(); else setManualOrderDialog(true); }}>
        <DialogContent className="bg-gray-800 text-white border-gray-700 max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-orange-400">Create Replacement Order</DialogTitle>
            <DialogDescription className="text-gray-400">
              Create a replacement order for a defective or incorrect item. The customer will receive this order at no charge.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4 space-y-4">
            {/* Customer Selection */}
            <div>
              <Label className="text-gray-300">Select Customer</Label>
              <Select 
                value={manualOrderCustomerId?.toString() || ""} 
                onValueChange={(v) => setManualOrderCustomerId(parseInt(v))}
              >
                <SelectTrigger className="mt-2 bg-gray-700 border-gray-600">
                  <SelectValue placeholder="Choose a customer..." />
                </SelectTrigger>
                <SelectContent className="bg-gray-700 border-gray-600 max-h-60">
                  {customers.filter(c => c.approvalStatus === 'approved').map((customer) => (
                    <SelectItem key={customer.id} value={customer.id.toString()}>
                      {customer.fullName} - {customer.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Product Search and Add */}
            <div>
              <Label className="text-gray-300">Add Products</Label>
              <div className="relative mt-2">
                <Input
                  placeholder="Search products..."
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  className="bg-gray-700 border-gray-600"
                />
                {productSearch && (
                  <div className="absolute z-10 w-full mt-1 bg-gray-700 border border-gray-600 rounded-lg max-h-40 overflow-y-auto">
                    {availableProducts
                      .filter(p => p.name.toLowerCase().includes(productSearch.toLowerCase()))
                      .slice(0, 10)
                      .map(product => (
                        <div
                          key={product.id}
                          className="p-2 hover:bg-gray-600 cursor-pointer flex justify-between items-center"
                          onClick={() => addItemToManualOrder(product)}
                        >
                          <span>{product.name}</span>
                          <span className="text-gray-400 text-sm">${product.price}</span>
                        </div>
                      ))}
                    {availableProducts.filter(p => p.name.toLowerCase().includes(productSearch.toLowerCase())).length === 0 && (
                      <div className="p-2 text-gray-400">No products found</div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Selected Items */}
            {manualOrderItems.length > 0 && (
              <div>
                <Label className="text-gray-300 mb-2 block">Order Items</Label>
                <div className="bg-gray-700/50 rounded-lg p-3 space-y-2">
                  {manualOrderItems.map((item) => (
                    <div key={item.productId} className="flex items-center justify-between">
                      <span className="flex-1">{item.productName}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-gray-400">${item.price}</span>
                        <Input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => updateItemQuantity(item.productId, parseInt(e.target.value) || 1)}
                          className="w-16 h-8 bg-gray-600 border-gray-500 text-center"
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 px-2 text-red-400 hover:text-red-300"
                          onClick={() => removeItemFromManualOrder(item.productId)}
                        >
                          <Trash2 size={14} />
                        </Button>
                      </div>
                    </div>
                  ))}
                  <div className="border-t border-gray-600 pt-2 mt-2 flex justify-between font-medium">
                    <span>Value (will be discounted):</span>
                    <span className="text-orange-400">
                      ${manualOrderItems.reduce((sum, i) => sum + parseFloat(i.price) * i.quantity, 0).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Reason */}
            <div>
              <Label className="text-gray-300">Reason for Replacement</Label>
              <Select value={manualOrderReason} onValueChange={setManualOrderReason}>
                <SelectTrigger className="mt-2 bg-gray-700 border-gray-600">
                  <SelectValue placeholder="Select a reason..." />
                </SelectTrigger>
                <SelectContent className="bg-gray-700 border-gray-600">
                  <SelectItem value="Wrong item delivered">Wrong item delivered</SelectItem>
                  <SelectItem value="Defective product">Defective product</SelectItem>
                  <SelectItem value="Damaged during delivery">Damaged during delivery</SelectItem>
                  <SelectItem value="Missing items from order">Missing items from order</SelectItem>
                  <SelectItem value="Customer service courtesy">Customer service courtesy</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Additional Notes */}
            <div>
              <Label className="text-gray-300">Additional Notes (Optional)</Label>
              <Textarea
                value={manualOrderNotes}
                onChange={(e) => setManualOrderNotes(e.target.value)}
                className="mt-2 bg-gray-700 border-gray-600"
                placeholder="Any additional information..."
                rows={2}
              />
            </div>

            {/* Send Email Checkbox */}
            <div className="flex items-center gap-2">
              <Checkbox
                id="sendEmail"
                checked={manualOrderSendEmail}
                onCheckedChange={(checked) => setManualOrderSendEmail(!!checked)}
              />
              <Label htmlFor="sendEmail" className="text-gray-300 cursor-pointer">
                Send confirmation email to customer
              </Label>
            </div>

            <div className="bg-orange-900/30 border border-orange-700 rounded-lg p-3 text-orange-300 text-sm">
              <AlertCircle size={16} className="inline mr-2" />
              This replacement order will be created with a $0.00 total. The full value will be shown as a discount.
            </div>
          </div>
          <DialogFooter className="mt-6">
            <Button
              variant="outline"
              onClick={resetManualOrderForm}
              className="border-gray-600"
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateManualOrder}
              disabled={manualOrderMutation.isPending || !manualOrderCustomerId || manualOrderItems.length === 0 || !manualOrderReason}
              className="bg-orange-600 hover:bg-orange-700"
            >
              {manualOrderMutation.isPending ? "Creating..." : "Create Replacement Order"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

type WeeklyTemplate = {
  id: number;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  capacity: number;
  enabled: boolean;
};

const DAYS_OF_WEEK = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday"
];

export function DeliveryWindowsTab() {
  const { toast } = useToast();
  const [createDialog, setCreateDialog] = useState(false);
  const [selectedDay, setSelectedDay] = useState(0);
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [capacity, setCapacity] = useState("10");

  const { data: templates, isLoading } = useQuery<WeeklyTemplate[]>({
    queryKey: ["/api/admin/delivery/weekly-templates"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/admin/delivery/weekly-templates", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/delivery/weekly-templates"] });
      toast({ title: "Time Window Created", description: "Weekly time window created successfully." });
      setCreateDialog(false);
      setSelectedDay(0);
      setStartTime("");
      setEndTime("");
      setCapacity("10");
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to create time window.", variant: "destructive" });
    },
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ templateId, enabled }: { templateId: number; enabled: boolean }) => {
      const res = await apiRequest("PATCH", `/api/admin/delivery/weekly-templates/${templateId}`, { enabled });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/delivery/weekly-templates"] });
      toast({ title: "Window Updated", description: "Time window status updated." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update window.", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (templateId: number) => {
      const res = await apiRequest("DELETE", `/api/admin/delivery/weekly-templates/${templateId}`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/delivery/weekly-templates"] });
      toast({ title: "Window Deleted", description: "Time window deleted successfully." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to delete window.", variant: "destructive" });
    },
  });

  // Group templates by day of week
  const templatesByDay = templates?.reduce((acc, template) => {
    if (!acc[template.dayOfWeek]) {
      acc[template.dayOfWeek] = [];
    }
    acc[template.dayOfWeek].push(template);
    return acc;
  }, {} as Record<number, WeeklyTemplate[]>) || {};

  return (
    <>
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Weekly Delivery Schedule</CardTitle>
              <p className="text-sm text-gray-400 mt-1">Set recurring time windows for each day of the week</p>
            </div>
            <Button
              onClick={() => setCreateDialog(true)}
              className="bg-primary hover:bg-primary/90"
              data-testid="button-create-window"
            >
              Add Time Window
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="animate-pulse space-y-3">
              {[1, 2, 3, 4, 5, 6, 7].map((i) => <div key={i} className="h-20 bg-gray-700 rounded"></div>)}
            </div>
          ) : (
            <div className="space-y-4">
              {DAYS_OF_WEEK.map((day, dayIndex) => {
                const dayTemplates = templatesByDay[dayIndex] || [];
                return (
                  <div key={dayIndex} className="border border-gray-700 rounded-lg p-4 bg-gray-750">
                    <h3 className="text-lg font-semibold mb-3 text-white">{day}</h3>
                    {dayTemplates.length > 0 ? (
                      <div className="space-y-2">
                        {dayTemplates.map((template) => (
                          <div 
                            key={template.id} 
                            className="flex items-center justify-between bg-gray-700 rounded-md p-3"
                          >
                            <div className="flex items-center gap-4">
                              <div>
                                <p className="text-sm font-medium text-white">
                                  {template.startTime} - {template.endTime}
                                </p>
                                <p className="text-xs text-gray-400">
                                  Capacity: {template.capacity} orders
                                </p>
                              </div>
                              <Badge className={template.enabled ? "bg-green-600" : "bg-gray-600"}>
                                {template.enabled ? "Active" : "Disabled"}
                              </Badge>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 px-2 hover:bg-gray-600"
                                onClick={() => toggleMutation.mutate({ 
                                  templateId: template.id, 
                                  enabled: !template.enabled 
                                })}
                                data-testid={`button-toggle-${template.id}`}
                              >
                                {template.enabled ? "Disable" : "Enable"}
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 px-2 hover:bg-red-600 text-red-400"
                                onClick={() => deleteMutation.mutate(template.id)}
                                data-testid={`button-delete-${template.id}`}
                              >
                                Delete
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-400 italic">No delivery windows set for this day</p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Window Dialog */}
      <Dialog open={createDialog} onOpenChange={setCreateDialog}>
        <DialogContent className="bg-gray-800 text-white border-gray-700">
          <DialogHeader>
            <DialogTitle>Add Weekly Time Window</DialogTitle>
            <p className="text-sm text-gray-400 mt-1">This will repeat every week on the selected day</p>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="day-select">Day of Week</Label>
              <Select
                value={selectedDay.toString()}
                onValueChange={(value) => setSelectedDay(parseInt(value))}
              >
                <SelectTrigger className="mt-2 bg-gray-700 border-gray-600" data-testid="select-day">
                  <SelectValue placeholder="Select a day" />
                </SelectTrigger>
                <SelectContent className="bg-gray-700 border-gray-600">
                  {DAYS_OF_WEEK.map((day, index) => (
                    <SelectItem key={index} value={index.toString()}>
                      {day}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="start-time">Start Time</Label>
                <Input
                  id="start-time"
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="mt-2 bg-gray-700 border-gray-600"
                  data-testid="input-start-time"
                />
              </div>
              <div>
                <Label htmlFor="end-time">End Time</Label>
                <Input
                  id="end-time"
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="mt-2 bg-gray-700 border-gray-600"
                  data-testid="input-end-time"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="capacity">Capacity (max orders)</Label>
              <Input
                id="capacity"
                type="number"
                value={capacity}
                onChange={(e) => setCapacity(e.target.value)}
                className="mt-2 bg-gray-700 border-gray-600"
                data-testid="input-capacity"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialog(false)} className="border-gray-600">
              Cancel
            </Button>
            <Button
              onClick={() => createMutation.mutate({ 
                dayOfWeek: selectedDay,
                startTime, 
                endTime, 
                capacity: parseInt(capacity),
                enabled: true 
              })}
              className="bg-primary hover:bg-primary/90"
              disabled={createMutation.isPending || !startTime || !endTime}
              data-testid="button-save-window"
            >
              {createMutation.isPending ? "Creating..." : "Add Time Window"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

interface DeliveryProduct {
  id: number;
  cloverItemId: string | null;
  name: string;
  price: string;
  image: string;
  description: string;
  category: string;
  displayOrder: number | null;
  badge: string | null;
  isFeaturedSlideshow: boolean | null;
  slideshowPosition: number | null;
  stockQuantity: string | null;
  enabled: boolean | null;
  createdAt: string;
  updatedAt: string;
}

interface CloverSyncResult {
  message: string;
  synced: number;
  updated: number;
  created: number;
  timestamp: string;
}

interface PaginatedProductsResponse {
  products: DeliveryProduct[];
  totalCount: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface SyncStatus {
  lastSyncTime: string | null;
  nextSyncTime: string | null;
  autoSyncEnabled: boolean;
  syncIntervalMinutes: number;
}

export function DeliveryProductsTab() {
  const { toast } = useToast();
  const [syncResult, setSyncResult] = useState<CloverSyncResult | null>(null);
  const [inventoryRefreshResult, setInventoryRefreshResult] = useState<{ refreshed: number; timestamp: string } | null>(null);
  
  // Pagination and filter states
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(50);
  const [searchInput, setSearchInput] = useState(""); // Local input state
  const [search, setSearch] = useState(""); // Debounced search for query
  const [category, setCategory] = useState<string>("all");
  const [enabledFilter, setEnabledFilter] = useState<string>("all");
  const [sortField, setSortField] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  
  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);
  
  // Product management states
  const [productDialogOpen, setProductDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<DeliveryProduct | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingProductId, setDeletingProductId] = useState<number | null>(null);
  const [productForm, setProductForm] = useState({
    name: "",
    description: "",
    price: "",
    salePrice: "",
    category: "",
    stockQuantity: "",
    enabled: true,
  });

  // Bulk selection states
  const [selectedProducts, setSelectedProducts] = useState<Set<number>>(new Set());
  const [bulkEditDialogOpen, setBulkEditDialogOpen] = useState(false);
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false);
  const [bulkEditForm, setBulkEditForm] = useState({
    price: "",
    salePrice: "",
    stockQuantity: "",
    enabled: null as boolean | null,
    isFeaturedSlideshow: null as boolean | null,
    showOnHomePage: null as boolean | null,
    badge: "",
    imageUrl: "",
    brandId: null as number | null,
    productLineId: null as number | null,
  });
  const [bulkImageFile, setBulkImageFile] = useState<File | null>(null);
  const [brandFilter, setBrandFilter] = useState<string>("all");

  // Fetch delivery brands for assignment
  const { data: deliveryBrands = [] } = useQuery<DeliveryBrand[]>({
    queryKey: ['/api/delivery/brands'],
  });

  // Fetch product lines for assignment
  const { data: deliveryProductLines = [] } = useQuery<{ id: number; name: string; brandId: number; isActive: boolean }[]>({
    queryKey: ['/api/admin/delivery/product-lines'],
  });

  const { data, isLoading, error } = useQuery<PaginatedProductsResponse>({
    queryKey: ["/api/admin/delivery/products", page, limit, search, category, enabledFilter],
    queryFn: async () => {
      // Construct query params inside queryFn to use current values
      const queryParams = new URLSearchParams();
      queryParams.append("page", page.toString());
      queryParams.append("limit", limit.toString());
      if (search) queryParams.append("search", search);
      if (category && category !== "all") queryParams.append("category", category);
      if (enabledFilter !== "all") queryParams.append("enabled", enabledFilter);
      
      const url = `/api/admin/delivery/products?${queryParams.toString()}`;
      console.log('Fetching products from:', url);
      
      const res = await fetch(url, {
        credentials: 'include'
      });
      
      if (!res.ok) {
        const errorText = await res.text();
        console.error('Products fetch failed:', res.status, errorText);
        throw new Error(`Failed to fetch products: ${res.status} ${errorText}`);
      }
      
      const responseData = await res.json();
      console.log('Products response:', responseData);
      return responseData;
    },
  });
  
  // Log any errors
  if (error) {
    console.error('Query error:', error);
  }

  const { data: syncStatus } = useQuery<SyncStatus>({
    queryKey: ["/api/admin/clover/sync-status"],
    refetchInterval: 10000, // Refresh every 10 seconds
  });

  const testConnectionMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/admin/clover/test-connection", {});
      return res.json();
    },
    onSuccess: (data) => {
      if (data.success) {
        toast({ 
          title: "✓ Connection Successful", 
          description: `Connected to Clover! Found ${data.itemsAvailable} items. Environment: ${data.apiBase}`,
          className: "bg-green-900 border-green-700"
        });
      } else {
        const suggestions = data.suggestions?.join('\n• ') || '';
        toast({ 
          title: "Connection Failed", 
          description: `${data.error}\n\nSuggestions:\n• ${suggestions}`,
          variant: "destructive",
          className: "whitespace-pre-line"
        });
      }
    },
    onError: (error: any) => {
      toast({ 
        title: "Test Failed", 
        description: error.message || "Failed to test Clover connection", 
        variant: "destructive" 
      });
    },
  });

  const syncMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/admin/clover/sync", {});
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `Sync failed: ${res.status}`);
      }
      return res.json();
    },
    onSuccess: (data: CloverSyncResult) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/delivery/products"] });
      setSyncResult(data);
      toast({ 
        title: "Products Synced", 
        description: `${data.created} new products, ${data.updated} updated` 
      });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message || "Failed to sync products from Clover.", variant: "destructive" });
    },
  });

  const refreshInventoryMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/admin/clover/refresh-inventory", {});
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `Refresh failed: ${res.status}`);
      }
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/delivery/products"] });
      setInventoryRefreshResult(data);
      toast({ 
        title: "Inventory Refreshed", 
        description: `${data.refreshed} products updated with latest stock levels` 
      });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message || "Failed to refresh inventory from Clover.", variant: "destructive" });
    },
  });

  const toggleEnabledMutation = useMutation({
    mutationFn: async ({ productId, enabled }: { productId: number; enabled: boolean }) => {
      const res = await apiRequest("PATCH", `/api/admin/delivery/products/${productId}`, { enabled });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/delivery/products"] });
      toast({ title: "Product Updated", description: "Product visibility updated successfully." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update product.", variant: "destructive" });
    },
  });

  const updateProductMutation = useMutation({
    mutationFn: async ({ productId, data }: { productId: number; data: Partial<DeliveryProduct> }) => {
      const res = await apiRequest("PATCH", `/api/admin/delivery/products/${productId}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/delivery/products"] });
      toast({ title: "Product Updated", description: "Product settings updated successfully." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update product.", variant: "destructive" });
    },
  });

  const uploadImageMutation = useMutation({
    mutationFn: async ({ productId, file }: { productId: number; file: File }) => {
      // Step 1: Request presigned URL from backend
      const urlRes = await fetch('/api/admin/delivery/products/upload-url', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: file.name,
          size: file.size,
          contentType: file.type || 'application/octet-stream',
        }),
      });
      
      if (!urlRes.ok) throw new Error('Failed to get upload URL');
      const { uploadURL, objectPath } = await urlRes.json();
      
      // Step 2: Upload file directly to cloud storage
      const uploadRes = await fetch(uploadURL, {
        method: 'PUT',
        body: file,
        headers: { 'Content-Type': file.type || 'application/octet-stream' },
      });
      
      if (!uploadRes.ok) throw new Error('Failed to upload file to storage');
      
      // Step 3: Update product with the object path
      const updateRes = await fetch(`/api/admin/delivery/products/${productId}/image`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ objectPath }),
      });
      
      if (!updateRes.ok) throw new Error('Failed to update product');
      return updateRes.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/delivery/products"] });
      toast({ title: "Image Uploaded", description: "Product image uploaded successfully." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to upload image.", variant: "destructive" });
    },
  });

  const handleImageUpload = (productId: number, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({ title: "Error", description: "Image must be less than 5MB", variant: "destructive" });
        return;
      }
      uploadImageMutation.mutate({ productId, file });
    }
  };

  const createProductMutation = useMutation({
    mutationFn: async (data: typeof productForm) => {
      const res = await apiRequest("POST", "/api/admin/delivery/products", {
        name: data.name,
        description: data.description || null,
        price: data.price,
        salePrice: data.salePrice && data.salePrice.trim() !== "" && data.salePrice !== "0" ? data.salePrice : null,
        category: data.category || null,
        stockQuantity: data.stockQuantity || null,
        enabled: data.enabled,
        displayOrder: 0,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/delivery/products"] });
      toast({ title: "Product Created", description: "Product has been created successfully." });
      setProductDialogOpen(false);
      setProductForm({ name: "", description: "", price: "", salePrice: "", category: "", stockQuantity: "", enabled: true });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to create product.", variant: "destructive" });
    },
  });

  const editProductMutation = useMutation({
    mutationFn: async ({ productId, data }: { productId: number; data: typeof productForm }) => {
      const res = await apiRequest("PATCH", `/api/admin/delivery/products/${productId}`, {
        name: data.name,
        description: data.description || null,
        price: data.price,
        salePrice: data.salePrice && data.salePrice.trim() !== "" && data.salePrice !== "0" ? data.salePrice : null,
        category: data.category || null,
        stockQuantity: data.stockQuantity || null,
        enabled: data.enabled,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/delivery/products"] });
      queryClient.invalidateQueries({ queryKey: ["/api/delivery/products"] });
      toast({ title: "Product Updated", description: "Product has been updated successfully." });
      setProductDialogOpen(false);
      setEditingProduct(null);
      setProductForm({ name: "", description: "", price: "", salePrice: "", category: "", stockQuantity: "", enabled: true });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update product.", variant: "destructive" });
    },
  });

  const deleteProductMutation = useMutation({
    mutationFn: async (productId: number) => {
      const res = await apiRequest("DELETE", `/api/admin/delivery/products/${productId}`, {});
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/delivery/products"] });
      toast({ title: "Product Deleted", description: "Product has been deleted successfully." });
      setDeleteDialogOpen(false);
      setDeletingProductId(null);
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to delete product.", variant: "destructive" });
    },
  });

  const bulkUpdateMutation = useMutation({
    mutationFn: async ({ productIds, updates }: { productIds: number[]; updates: any }) => {
      const res = await apiRequest("PATCH", `/api/admin/delivery/products/bulk`, { productIds, updates });
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/delivery/products"] });
      toast({ title: "Bulk Update Complete", description: data.message });
      setBulkEditDialogOpen(false);
      setSelectedProducts(new Set());
      setBulkEditForm({ price: "", salePrice: "", stockQuantity: "", enabled: null, isFeaturedSlideshow: null, showOnHomePage: null, badge: "", imageUrl: "", brandId: null, productLineId: null });
      setBulkImageFile(null);
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update products.", variant: "destructive" });
    },
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: async (productIds: number[]) => {
      const res = await apiRequest("DELETE", `/api/admin/delivery/products/bulk`, { productIds });
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/delivery/products"] });
      toast({ title: "Bulk Delete Complete", description: data.message });
      setBulkDeleteDialogOpen(false);
      setSelectedProducts(new Set());
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to delete products.", variant: "destructive" });
    },
  });

  const handleAddProduct = () => {
    setEditingProduct(null);
    setProductForm({ name: "", description: "", price: "", salePrice: "", category: "", stockQuantity: "", enabled: true });
    setProductDialogOpen(true);
  };

  const handleEditProduct = (product: DeliveryProduct) => {
    setEditingProduct(product);
    setProductForm({
      name: product.name,
      description: product.description || "",
      price: product.price,
      salePrice: product.salePrice || "",
      category: product.category || "",
      stockQuantity: product.stockQuantity || "",
      enabled: product.enabled || false,
    });
    setProductDialogOpen(true);
  };

  const handleDeleteProduct = (productId: number) => {
    setDeletingProductId(productId);
    setDeleteDialogOpen(true);
  };

  const handleSaveProduct = () => {
    if (!productForm.name || !productForm.price) {
      toast({ title: "Error", description: "Name and price are required.", variant: "destructive" });
      return;
    }

    if (editingProduct) {
      editProductMutation.mutate({ productId: editingProduct.id, data: productForm });
    } else {
      createProductMutation.mutate(productForm);
    }
  };

  // Extract unique categories from products for filter
  const categories = data?.products 
    ? Array.from(new Set(data.products.map(p => p.category).filter(Boolean))) as string[]
    : [];

  // Handle search input change (debounced via useEffect)
  const handleSearchChange = (value: string) => {
    setSearchInput(value);
  };

  const handleCategoryChange = (value: string) => {
    setCategory(value);
    setPage(1);
  };

  const handleEnabledFilterChange = (value: string) => {
    setEnabledFilter(value);
    setPage(1);
  };

  // Sorting handler
  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  // Sort products
  const sortedProducts = data?.products ? [...data.products].sort((a, b) => {
    if (!sortField) return 0;
    
    let aVal: number | string = 0;
    let bVal: number | string = 0;
    
    if (sortField === "stock") {
      aVal = parseInt(a.stockQuantity || "0") || 0;
      bVal = parseInt(b.stockQuantity || "0") || 0;
    } else if (sortField === "price") {
      aVal = parseFloat(a.price || "0") || 0;
      bVal = parseFloat(b.price || "0") || 0;
    } else if (sortField === "name") {
      aVal = (a.name || "").toLowerCase();
      bVal = (b.name || "").toLowerCase();
    }
    
    if (aVal < bVal) return sortDirection === "asc" ? -1 : 1;
    if (aVal > bVal) return sortDirection === "asc" ? 1 : -1;
    return 0;
  }) : [];

  // Bulk selection handlers
  const handleSelectAll = () => {
    if (selectedProducts.size === data?.products.length) {
      setSelectedProducts(new Set());
    } else {
      setSelectedProducts(new Set(data?.products.map(p => p.id) || []));
    }
  };

  const handleToggleProduct = (productId: number) => {
    const newSelection = new Set(selectedProducts);
    if (newSelection.has(productId)) {
      newSelection.delete(productId);
    } else {
      newSelection.add(productId);
    }
    setSelectedProducts(newSelection);
  };

  const handleBulkEnable = () => {
    if (selectedProducts.size === 0) return;
    bulkUpdateMutation.mutate({ productIds: Array.from(selectedProducts), updates: { enabled: true } });
  };

  const handleBulkDisable = () => {
    if (selectedProducts.size === 0) return;
    bulkUpdateMutation.mutate({ productIds: Array.from(selectedProducts), updates: { enabled: false } });
  };

  const handleBulkEdit = () => {
    if (selectedProducts.size === 0) return;
    setBulkEditDialogOpen(true);
  };

  const handleBulkDelete = () => {
    if (selectedProducts.size === 0) return;
    setBulkDeleteDialogOpen(true);
  };

  const handleSaveBulkEdit = async () => {
    if (selectedProducts.size === 0) {
      toast({ title: "No Selection", description: "Please select at least one product.", variant: "destructive" });
      return;
    }
    
    const updates: any = {};
    
    if (bulkEditForm.price) updates.price = bulkEditForm.price;
    if (bulkEditForm.salePrice && bulkEditForm.salePrice.trim() !== "" && bulkEditForm.salePrice !== "0") {
      updates.salePrice = bulkEditForm.salePrice;
    } else if (bulkEditForm.salePrice === "0" || bulkEditForm.salePrice === "") {
      updates.salePrice = null; // Clear sale price when 0 or empty
    }
    if (bulkEditForm.stockQuantity) updates.stockQuantity = bulkEditForm.stockQuantity;
    if (bulkEditForm.enabled !== null) updates.enabled = bulkEditForm.enabled;
    if (bulkEditForm.isFeaturedSlideshow !== null) updates.isFeaturedSlideshow = bulkEditForm.isFeaturedSlideshow;
    if (bulkEditForm.showOnHomePage !== null) updates.showOnHomePage = bulkEditForm.showOnHomePage;
    if (bulkEditForm.badge !== undefined) updates.badge = bulkEditForm.badge || null;

    // Handle brand assignment
    if (bulkEditForm.brandId !== null) {
      updates.brandId = bulkEditForm.brandId === 0 ? null : bulkEditForm.brandId;
    }

    // Handle product line assignment
    if (bulkEditForm.productLineId !== null) {
      updates.productLineId = bulkEditForm.productLineId === 0 ? null : bulkEditForm.productLineId;
    }

    // Handle bulk image upload using object storage
    if (bulkImageFile) {
      try {
        // Step 1: Request presigned URL from backend
        const urlRes = await fetch('/api/admin/delivery/products/upload-url', {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: bulkImageFile.name,
            size: bulkImageFile.size,
            contentType: bulkImageFile.type || 'application/octet-stream',
          }),
        });
        
        if (!urlRes.ok) throw new Error('Failed to get upload URL');
        const { uploadURL, objectPath } = await urlRes.json();
        
        // Step 2: Upload file directly to cloud storage
        const uploadRes = await fetch(uploadURL, {
          method: 'PUT',
          body: bulkImageFile,
          headers: { 'Content-Type': bulkImageFile.type || 'application/octet-stream' },
        });
        
        if (!uploadRes.ok) throw new Error('Failed to upload file to storage');
        
        // Step 3: Use the object path for all selected products
        updates.image = objectPath;
      } catch (error) {
        toast({ title: "Error", description: "Failed to upload image.", variant: "destructive" });
        return;
      }
    }

    if (Object.keys(updates).length === 0) {
      toast({ title: "No Changes", description: "Please select at least one field to update.", variant: "destructive" });
      return;
    }

    bulkUpdateMutation.mutate({ productIds: Array.from(selectedProducts), updates });
  };

  // Only show full loading state on initial load, not during refetches
  if (isLoading && !data) {
    return <div className="text-center py-8">Loading products...</div>;
  }

  return (
    <>
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle>Delivery Products</CardTitle>
              <p className="text-sm text-gray-400 mt-2">
                Manage products synced from Clover POS. Only enabled products appear in the customer delivery portal.
              </p>
            </div>
            <div className="flex gap-2 flex-wrap">
              <Button
                onClick={handleAddProduct}
                className="bg-green-600 hover:bg-green-700"
                data-testid="button-add-product"
              >
                <Package className="h-4 w-4 mr-2" />
                Add Product
              </Button>
              <Button
                onClick={() => testConnectionMutation.mutate()}
                disabled={testConnectionMutation.isPending}
                variant="outline"
                className="border-blue-600 text-blue-400 hover:bg-blue-900/20"
                data-testid="button-test-connection"
              >
                {testConnectionMutation.isPending ? "Testing..." : "Test Connection"}
              </Button>
              <Button
                onClick={() => refreshInventoryMutation.mutate()}
                disabled={refreshInventoryMutation.isPending}
                variant="outline"
                className="border-gray-600"
                data-testid="button-refresh-inventory"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                {refreshInventoryMutation.isPending ? "Refreshing..." : "Refresh Inventory"}
              </Button>
              <Button
                onClick={() => syncMutation.mutate()}
                disabled={syncMutation.isPending}
                className="bg-primary hover:bg-primary/90"
                data-testid="button-sync-clover"
              >
                {syncMutation.isPending ? "Syncing..." : "Sync from Clover"}
              </Button>
            </div>
          </div>
          
          {/* Auto-Sync Status */}
          {syncStatus && (
            <div className="mt-4 p-3 bg-blue-900/30 border border-blue-700 rounded">
              <p className="text-sm">
                <strong>Auto-Sync:</strong> Enabled (every {syncStatus.syncIntervalMinutes} minutes)<br />
                {syncStatus.lastSyncTime && (
                  <>
                    <strong>Last Sync:</strong> {new Date(syncStatus.lastSyncTime).toLocaleString()}<br />
                  </>
                )}
                {syncStatus.nextSyncTime && (
                  <>
                    <strong>Next Sync:</strong> {new Date(syncStatus.nextSyncTime).toLocaleString()}
                  </>
                )}
              </p>
            </div>
          )}

          {syncResult && (
            <div className="mt-4 p-3 bg-green-900/30 border border-green-700 rounded">
              <p className="text-sm">
                <strong>Manual Sync:</strong> {new Date(syncResult.timestamp).toLocaleString()}<br />
                {syncResult.created} new, {syncResult.updated} updated, {syncResult.synced} total
              </p>
            </div>
          )}
          {inventoryRefreshResult && (
            <div className="mt-4 p-3 bg-purple-900/30 border border-purple-700 rounded">
              <p className="text-sm">
                <strong>Inventory Refresh:</strong> {new Date(inventoryRefreshResult.timestamp).toLocaleString()}<br />
                {inventoryRefreshResult.refreshed} products updated
              </p>
            </div>
          )}

          {/* Search and Filter Controls */}
          <div className="mt-4 grid grid-cols-1 md:grid-cols-4 gap-3">
            <div className="md:col-span-2">
              <Input
                placeholder="Search products..."
                value={searchInput}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="bg-gray-700 border-gray-600"
                data-testid="input-search-products"
              />
            </div>
            <Select value={category} onValueChange={handleCategoryChange}>
              <SelectTrigger className="bg-gray-700 border-gray-600" data-testid="select-category-filter">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map(cat => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={enabledFilter} onValueChange={handleEnabledFilterChange}>
              <SelectTrigger className="bg-gray-700 border-gray-600" data-testid="select-enabled-filter">
                <SelectValue placeholder="All Products" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Products</SelectItem>
                <SelectItem value="true">Enabled Only</SelectItem>
                <SelectItem value="false">Disabled Only</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {!data || !data.products || data.products.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No products found. {!search && !category && enabledFilter === "all" ? 'Click "Sync from Clover" to import products.' : 'Try adjusting your filters.'}</p>
            </div>
          ) : (
            <>
              <div className="mb-4 flex justify-between items-center">
                <p className="text-sm text-gray-400">
                  Showing {data?.products?.length || 0} of {data?.totalCount || 0} products
                </p>
                <Select value={limit.toString()} onValueChange={(value) => { setLimit(parseInt(value)); setPage(1); }}>
                  <SelectTrigger className="w-32 bg-gray-700 border-gray-600" data-testid="select-items-per-page">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="25">25 per page</SelectItem>
                    <SelectItem value="50">50 per page</SelectItem>
                    <SelectItem value="100">100 per page</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {selectedProducts.size > 0 && (
                <div className="mb-4 p-3 bg-blue-900/30 border border-blue-700 rounded-lg flex items-center justify-between">
                  <span className="text-sm font-medium text-blue-200">
                    {selectedProducts.size} product{selectedProducts.size > 1 ? 's' : ''} selected
                  </span>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleBulkEnable}
                      disabled={bulkUpdateMutation.isPending}
                      data-testid="button-bulk-enable"
                    >
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Enable All
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleBulkDisable}
                      disabled={bulkUpdateMutation.isPending}
                      data-testid="button-bulk-disable"
                    >
                      <XCircle className="h-4 w-4 mr-1" />
                      Disable All
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleBulkEdit}
                      disabled={bulkUpdateMutation.isPending}
                      data-testid="button-bulk-edit"
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Bulk Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={handleBulkDelete}
                      disabled={bulkDeleteMutation.isPending}
                      data-testid="button-bulk-delete"
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Delete Selected
                    </Button>
                  </div>
                </div>
              )}

              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-gray-700">
                      <TableHead className="w-12">
                        <Checkbox
                          checked={selectedProducts.size === data?.products.length && data?.products.length > 0}
                          onCheckedChange={handleSelectAll}
                          data-testid="checkbox-select-all"
                        />
                      </TableHead>
                      <TableHead 
                        className="cursor-pointer hover:bg-gray-700/50 select-none"
                        onClick={() => handleSort("name")}
                      >
                        <div className="flex items-center gap-1">
                          Product
                          {sortField === "name" && (
                            <span className="text-xs">{sortDirection === "asc" ? "↑" : "↓"}</span>
                          )}
                        </div>
                      </TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead 
                        className="cursor-pointer hover:bg-gray-700/50 select-none"
                        onClick={() => handleSort("price")}
                      >
                        <div className="flex items-center gap-1">
                          Price
                          {sortField === "price" && (
                            <span className="text-xs">{sortDirection === "asc" ? "↑" : "↓"}</span>
                          )}
                        </div>
                      </TableHead>
                      <TableHead 
                        className="cursor-pointer hover:bg-gray-700/50 select-none"
                        onClick={() => handleSort("stock")}
                      >
                        <div className="flex items-center gap-1">
                          Stock
                          {sortField === "stock" && (
                            <span className="text-xs">{sortDirection === "asc" ? "↑" : "↓"}</span>
                          )}
                        </div>
                      </TableHead>
                      <TableHead>Image</TableHead>
                      <TableHead>Featured</TableHead>
                      <TableHead>Badge</TableHead>
                      <TableHead>Enabled</TableHead>
                      <TableHead>Display Order</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedProducts.map((product) => (
                      <TableRow key={product.id} className="border-gray-700">
                        <TableCell>
                          <Checkbox
                            checked={selectedProducts.has(product.id)}
                            onCheckedChange={() => handleToggleProduct(product.id)}
                            data-testid={`checkbox-product-${product.id}`}
                          />
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {product.image && (
                              <img src={product.image} alt={product.name} className="w-10 h-10 object-cover rounded" />
                            )}
                            <div>
                              <div className="font-medium">{product.name}</div>
                              {product.description && (
                                <div className="text-xs text-gray-400 max-w-xs truncate">{product.description}</div>
                              )}
                              <div className="text-xs text-gray-500">ID: {product.cloverItemId || product.id}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">{product.category}</TableCell>
                        <TableCell className="text-sm font-medium">
                          {product.salePrice ? (
                            <div className="flex flex-col">
                              <span className="text-red-400">${product.salePrice}</span>
                              <span className="text-gray-500 text-xs line-through">${product.price}</span>
                            </div>
                          ) : (
                            <span>${product.price}</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {product.stockQuantity !== null ? (
                            <Badge variant={parseInt(product.stockQuantity) === 0 ? "destructive" : parseInt(product.stockQuantity) < 10 ? "secondary" : "default"}>
                              {product.stockQuantity}
                            </Badge>
                          ) : (
                            <span className="text-gray-500">N/A</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <label 
                            htmlFor={`image-upload-${product.id}`} 
                            className="cursor-pointer flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300"
                          >
                            <Upload className="h-4 w-4" />
                            Upload
                          </label>
                          <input
                            id={`image-upload-${product.id}`}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => handleImageUpload(product.id, e)}
                            data-testid={`input-upload-image-${product.id}`}
                          />
                        </TableCell>
                        <TableCell>
                          <input
                            type="checkbox"
                            checked={product.isFeaturedSlideshow || false}
                            onChange={(e) => updateProductMutation.mutate({ 
                              productId: product.id, 
                              data: { isFeaturedSlideshow: e.target.checked } 
                            })}
                            className="h-4 w-4"
                            data-testid={`checkbox-featured-${product.id}`}
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            value={product.badge || ""}
                            onChange={(e) => {
                              const value = e.target.value;
                              updateProductMutation.mutate({ 
                                productId: product.id, 
                                data: { badge: value || null } 
                              });
                            }}
                            placeholder="e.g. NEW, SALE"
                            className="w-24 bg-gray-700 border-gray-600 text-xs"
                            data-testid={`input-badge-${product.id}`}
                          />
                        </TableCell>
                        <TableCell>
                          <input
                            type="checkbox"
                            checked={product.enabled || false}
                            onChange={(e) => toggleEnabledMutation.mutate({ 
                              productId: product.id, 
                              enabled: e.target.checked 
                            })}
                            className="h-4 w-4"
                            data-testid={`checkbox-enabled-${product.id}`}
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            value={product.displayOrder || ""}
                            onChange={(e) => {
                              const value = e.target.value ? parseInt(e.target.value) : null;
                              updateProductMutation.mutate({ 
                                productId: product.id, 
                                data: { displayOrder: value } 
                              });
                            }}
                            placeholder="Order"
                            className="w-20 bg-gray-700 border-gray-600 text-xs"
                            data-testid={`input-order-${product.id}`}
                          />
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex gap-2 justify-end">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditProduct(product)}
                              className="text-blue-400 hover:text-blue-300 hover:bg-blue-900/20"
                              data-testid={`button-edit-${product.id}`}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteProduct(product.id)}
                              className="text-red-400 hover:text-red-300 hover:bg-red-900/20"
                              data-testid={`button-delete-${product.id}`}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination Controls */}
              <div className="mt-4 flex justify-between items-center">
                <div className="text-sm text-gray-400">
                  Page {data?.page || 1} of {data?.totalPages || 1}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={!data || data.page === 1}
                    className="border-gray-600"
                    data-testid="button-prev-page"
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(p => Math.min(data?.totalPages || 1, p + 1))}
                    disabled={!data || data.page === data.totalPages}
                    className="border-gray-600"
                    data-testid="button-next-page"
                  >
                    Next
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Product Form Dialog */}
      <Dialog open={productDialogOpen} onOpenChange={setProductDialogOpen}>
        <DialogContent className="bg-gray-800 text-white border-gray-700 max-w-md">
          <DialogHeader>
            <DialogTitle>{editingProduct ? "Edit Product" : "Add New Product"}</DialogTitle>
            <DialogDescription className="text-gray-400">
              {editingProduct ? "Update product information" : "Add a new product manually"}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="product-name">Product Name *</Label>
              <Input
                id="product-name"
                value={productForm.name}
                onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                className="bg-gray-900 border-gray-700 text-white"
                placeholder="Enter product name"
                data-testid="input-product-name"
              />
            </div>
            
            <div>
              <Label htmlFor="product-description">Description</Label>
              <Textarea
                id="product-description"
                value={productForm.description}
                onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                className="bg-gray-900 border-gray-700 text-white"
                placeholder="Enter product description"
                rows={3}
                data-testid="input-product-description"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="product-price">Price *</Label>
                <Input
                  id="product-price"
                  type="number"
                  step="0.01"
                  value={productForm.price}
                  onChange={(e) => setProductForm({ ...productForm, price: e.target.value })}
                  className="bg-gray-900 border-gray-700 text-white"
                  placeholder="0.00"
                  data-testid="input-product-price"
                />
              </div>
              
              <div>
                <Label htmlFor="product-sale-price" className="flex items-center gap-2">
                  Sale Price
                  <span className="text-xs text-red-400 font-normal">(website only)</span>
                </Label>
                <Input
                  id="product-sale-price"
                  type="number"
                  step="0.01"
                  value={productForm.salePrice}
                  onChange={(e) => setProductForm({ ...productForm, salePrice: e.target.value })}
                  className="bg-gray-900 border-gray-700 text-white"
                  placeholder="Leave empty for no sale"
                  data-testid="input-product-sale-price"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="product-stock">Stock Quantity</Label>
                <Input
                  id="product-stock"
                  type="number"
                  value={productForm.stockQuantity}
                  onChange={(e) => setProductForm({ ...productForm, stockQuantity: e.target.value })}
                  className="bg-gray-900 border-gray-700 text-white"
                  placeholder="0"
                  data-testid="input-product-stock"
                />
              </div>
              
              <div>
                <Label htmlFor="product-category">Category</Label>
                <Input
                  id="product-category"
                  value={productForm.category}
                  onChange={(e) => setProductForm({ ...productForm, category: e.target.value })}
                  className="bg-gray-900 border-gray-700 text-white"
                  placeholder="e.g. Vapes, Accessories"
                  data-testid="input-product-category"
                />
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="product-enabled"
                checked={productForm.enabled}
                onChange={(e) => setProductForm({ ...productForm, enabled: e.target.checked })}
                className="h-4 w-4"
                data-testid="checkbox-product-enabled"
              />
              <Label htmlFor="product-enabled">Enable product in delivery portal</Label>
            </div>
          </div>
          
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              className="border-gray-600 hover:bg-gray-700 text-gray-300"
              onClick={() => setProductDialogOpen(false)}
              data-testid="button-cancel-product"
            >
              Cancel
            </Button>
            <Button
              type="button"
              className="bg-primary hover:bg-primary/90"
              onClick={handleSaveProduct}
              disabled={createProductMutation.isPending || editProductMutation.isPending}
              data-testid="button-save-product"
            >
              {createProductMutation.isPending || editProductMutation.isPending ? "Saving..." : editingProduct ? "Update Product" : "Create Product"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="bg-gray-800 text-white border-gray-700 max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Product</DialogTitle>
            <DialogDescription className="text-gray-400">
              Are you sure you want to delete this product? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              className="border-gray-600 hover:bg-gray-700 text-gray-300"
              onClick={() => setDeleteDialogOpen(false)}
              data-testid="button-cancel-delete"
            >
              Cancel
            </Button>
            <Button
              type="button"
              className="bg-red-600 hover:bg-red-700"
              onClick={() => deletingProductId && deleteProductMutation.mutate(deletingProductId)}
              disabled={deleteProductMutation.isPending}
              data-testid="button-confirm-delete"
            >
              {deleteProductMutation.isPending ? "Deleting..." : "Delete Product"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Edit Dialog */}
      <Dialog open={bulkEditDialogOpen} onOpenChange={setBulkEditDialogOpen}>
        <DialogContent className="bg-gray-800 text-white border-gray-700 max-w-2xl">
          <DialogHeader>
            <DialogTitle>Bulk Edit Products</DialogTitle>
            <DialogDescription className="text-gray-400">
              Update {selectedProducts.size} selected product{selectedProducts.size > 1 ? 's' : ''}. Leave fields empty to keep current values.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-gray-300">Price ($)</Label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="Leave empty to keep current"
                  value={bulkEditForm.price}
                  onChange={(e) => setBulkEditForm({ ...bulkEditForm, price: e.target.value })}
                  className="bg-gray-700 border-gray-600 text-white"
                  data-testid="input-bulk-price"
                />
              </div>
              <div>
                <Label className="text-gray-300 flex items-center gap-2">
                  Sale Price ($)
                  <span className="text-xs text-red-400 font-normal">(website only)</span>
                </Label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="Enter price or 0 to remove sale"
                  value={bulkEditForm.salePrice}
                  onChange={(e) => setBulkEditForm({ ...bulkEditForm, salePrice: e.target.value })}
                  className="bg-gray-700 border-gray-600 text-white"
                  data-testid="input-bulk-sale-price"
                />
              </div>
            </div>
            
            <div>
              <Label className="text-gray-300">Stock Quantity</Label>
              <Input
                type="number"
                placeholder="Leave empty to keep current"
                value={bulkEditForm.stockQuantity}
                onChange={(e) => setBulkEditForm({ ...bulkEditForm, stockQuantity: e.target.value })}
                className="bg-gray-700 border-gray-600 text-white"
                data-testid="input-bulk-stock"
              />
            </div>

            <div>
              <Label className="text-gray-300">Badge</Label>
              <Input
                placeholder="Leave empty to keep current, or type 'none' to remove"
                value={bulkEditForm.badge}
                onChange={(e) => setBulkEditForm({ ...bulkEditForm, badge: e.target.value })}
                className="bg-gray-700 border-gray-600 text-white"
                data-testid="input-bulk-badge"
              />
            </div>

            <div>
              <Label className="text-gray-300">Upload Image</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      if (file.size > 5 * 1024 * 1024) {
                        toast({ title: "Error", description: "Image must be less than 5MB", variant: "destructive" });
                        return;
                      }
                      setBulkImageFile(file);
                    }
                  }}
                  className="bg-gray-700 border-gray-600 text-white file:bg-gray-600 file:text-white file:border-0 file:mr-2"
                  data-testid="input-bulk-image-file"
                />
                {bulkImageFile && (
                  <span className="text-sm text-green-400 whitespace-nowrap">
                    {bulkImageFile.name}
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Upload an image to apply to all selected products (max 5MB)
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-gray-300">Enabled Status</Label>
                <Select 
                  value={bulkEditForm.enabled === null ? "keep" : bulkEditForm.enabled ? "true" : "false"}
                  onValueChange={(value) => setBulkEditForm({ ...bulkEditForm, enabled: value === "keep" ? null : value === "true" })}
                >
                  <SelectTrigger className="bg-gray-700 border-gray-600" data-testid="select-bulk-enabled">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="keep">Keep Current</SelectItem>
                    <SelectItem value="true">Enabled</SelectItem>
                    <SelectItem value="false">Disabled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-gray-300">Featured Status</Label>
                <Select 
                  value={bulkEditForm.isFeaturedSlideshow === null ? "keep" : bulkEditForm.isFeaturedSlideshow ? "true" : "false"}
                  onValueChange={(value) => setBulkEditForm({ ...bulkEditForm, isFeaturedSlideshow: value === "keep" ? null : value === "true" })}
                >
                  <SelectTrigger className="bg-gray-700 border-gray-600" data-testid="select-bulk-featured">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="keep">Keep Current</SelectItem>
                    <SelectItem value="true">Featured</SelectItem>
                    <SelectItem value="false">Not Featured</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-gray-300">Show on Home Page</Label>
                <Select 
                  value={bulkEditForm.showOnHomePage === null ? "keep" : bulkEditForm.showOnHomePage ? "true" : "false"}
                  onValueChange={(value) => setBulkEditForm({ ...bulkEditForm, showOnHomePage: value === "keep" ? null : value === "true" })}
                >
                  <SelectTrigger className="bg-gray-700 border-gray-600" data-testid="select-bulk-homepage">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="keep">Keep Current</SelectItem>
                    <SelectItem value="true">Show on Home</SelectItem>
                    <SelectItem value="false">Hide from Home</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500 mt-1">
                  Products shown in category carousels on the home page
                </p>
              </div>
            </div>

            <div>
              <Label className="text-gray-300">Assign to Brand</Label>
              <Select 
                value={bulkEditForm.brandId == null ? "keep" : bulkEditForm.brandId === 0 ? "none" : String(bulkEditForm.brandId)}
                onValueChange={(value) => setBulkEditForm({ ...bulkEditForm, brandId: value === "keep" ? null : value === "none" ? 0 : parseInt(value), productLineId: null })}
              >
                <SelectTrigger className="bg-gray-700 border-gray-600" data-testid="select-bulk-brand">
                  <SelectValue placeholder="Keep current brand" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="keep">Keep Current</SelectItem>
                  <SelectItem value="none">Remove Brand</SelectItem>
                  {deliveryBrands.filter(b => b.isActive).sort((a, b) => a.name.localeCompare(b.name)).map(brand => (
                    <SelectItem key={brand.id} value={brand.id.toString()}>{brand.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500 mt-1">
                Assign selected products to a delivery brand for category organization
              </p>
            </div>

            <div>
              <Label className="text-gray-300">Assign to Product Line</Label>
              <Select 
                value={bulkEditForm.productLineId == null ? "keep" : bulkEditForm.productLineId === 0 ? "none" : String(bulkEditForm.productLineId)}
                onValueChange={(value) => setBulkEditForm({ ...bulkEditForm, productLineId: value === "keep" ? null : value === "none" ? 0 : parseInt(value) })}
              >
                <SelectTrigger className="bg-gray-700 border-gray-600" data-testid="select-bulk-product-line">
                  <SelectValue placeholder="Keep current product line" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="keep">Keep Current</SelectItem>
                  <SelectItem value="none">Remove Product Line</SelectItem>
                  {deliveryProductLines
                    .filter(pl => pl.isActive && (bulkEditForm.brandId === null || bulkEditForm.brandId === 0 || pl.brandId === bulkEditForm.brandId))
                    .sort((a, b) => a.name.localeCompare(b.name))
                    .map(productLine => {
                      const brand = deliveryBrands.find(b => b.id === productLine.brandId);
                      return (
                        <SelectItem key={productLine.id} value={productLine.id.toString()}>
                          {productLine.name}{brand ? ` (${brand.name})` : ''}
                        </SelectItem>
                      );
                    })}
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500 mt-1">
                Assign products to a product line (subcategory within a brand)
              </p>
            </div>
          </div>
          
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              className="border-gray-600 hover:bg-gray-700 text-gray-300"
              onClick={() => {
                setBulkEditDialogOpen(false);
                setBulkEditForm({ price: "", salePrice: "", stockQuantity: "", enabled: null, isFeaturedSlideshow: null, showOnHomePage: null, badge: "", imageUrl: "", brandId: null, productLineId: null });
                setBulkImageFile(null);
              }}
              data-testid="button-cancel-bulk-edit"
            >
              Cancel
            </Button>
            <Button
              type="button"
              className="bg-primary hover:bg-primary/90"
              onClick={handleSaveBulkEdit}
              disabled={bulkUpdateMutation.isPending}
              data-testid="button-save-bulk-edit"
            >
              {bulkUpdateMutation.isPending ? "Updating..." : "Update Products"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Delete Confirmation Dialog */}
      <Dialog open={bulkDeleteDialogOpen} onOpenChange={setBulkDeleteDialogOpen}>
        <DialogContent className="bg-gray-800 text-white border-gray-700 max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Multiple Products</DialogTitle>
            <DialogDescription className="text-gray-400">
              Are you sure you want to delete {selectedProducts.size} product{selectedProducts.size > 1 ? 's' : ''}? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              className="border-gray-600 hover:bg-gray-700 text-gray-300"
              onClick={() => setBulkDeleteDialogOpen(false)}
              data-testid="button-cancel-bulk-delete"
            >
              Cancel
            </Button>
            <Button
              type="button"
              className="bg-red-600 hover:bg-red-700"
              onClick={() => bulkDeleteMutation.mutate(Array.from(selectedProducts))}
              disabled={bulkDeleteMutation.isPending}
              data-testid="button-confirm-bulk-delete"
            >
              {bulkDeleteMutation.isPending ? "Deleting..." : `Delete ${selectedProducts.size} Product${selectedProducts.size > 1 ? 's' : ''}`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
