import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Bell, Package, Users, Send, AlertCircle, Trash2, Clock, CheckCircle2 } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface RestockRequestRow {
  id: number;
  productId: number;
  productName: string;
  productImage: string | null;
  currentStock: string | null;
  customerEmail: string;
  customerFullName: string;
  status: string;
  createdAt: string;
  notifiedAt: string | null;
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" });
}

function ProductCell({ image, name }: { image: string | null; name: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-800 flex-shrink-0 flex items-center justify-center">
        {image ? (
          <img src={image} alt={name} className="w-full h-full object-contain p-1" />
        ) : (
          <Package className="w-5 h-5 text-gray-600" />
        )}
      </div>
      <span className="font-medium text-sm text-foreground leading-tight line-clamp-2">{name}</span>
    </div>
  );
}

export default function RestockDemand() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: allRequests = [], isLoading, isError } = useQuery<RestockRequestRow[]>({
    queryKey: ["/api/admin/restock-requests"],
  });

  const pendingList = allRequests.filter(r => r.status === "pending");
  const historyList = allRequests.filter(r => r.status === "notified");

  const pendingByProduct = pendingList.reduce<Record<number, RestockRequestRow[]>>((acc, r) => {
    if (!acc[r.productId]) acc[r.productId] = [];
    acc[r.productId].push(r);
    return acc;
  }, {});

  const notifyMutation = useMutation({
    mutationFn: (productId: number) =>
      apiRequest("POST", `/api/admin/restock-requests/${productId}/notify`),
    onSuccess: (_data, productId) => {
      const count = pendingByProduct[productId]?.length ?? 0;
      toast({ title: "Notifications sent!", description: `${count} customer${count !== 1 ? "s" : ""} emailed about this restock.` });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/restock-requests"] });
    },
    onError: () => {
      toast({ title: "Failed to send notifications", description: "Please try again.", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) =>
      apiRequest("DELETE", `/api/admin/restock-requests/${id}`),
    onSuccess: () => {
      toast({ title: "Request removed", description: "The restock request has been deleted." });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/restock-requests"] });
    },
    onError: () => {
      toast({ title: "Failed to delete", description: "Please try again.", variant: "destructive" });
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-3 p-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-14 w-full bg-gray-800" />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex items-center gap-3 text-red-400 p-6">
        <AlertCircle className="w-5 h-5 flex-shrink-0" />
        <p className="text-sm">Failed to load restock demand data. Please refresh the page.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">

      <section className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold text-foreground">Pending Requests</h2>
          </div>
          <Badge variant="secondary" className="bg-gray-800 text-gray-300">
            <Users className="w-3 h-3 mr-1" />
            {pendingList.length} waiting
          </Badge>
        </div>

        {pendingList.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center text-muted-foreground rounded-xl border border-border/40 bg-gray-900/30">
            <Bell className="w-10 h-10 mb-3 opacity-20" />
            <p className="text-sm font-medium">No pending restock requests</p>
            <p className="text-xs mt-1 opacity-60">When customers request back-in-stock alerts, they'll appear here.</p>
          </div>
        ) : (
          <div className="rounded-xl border border-border/50 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="border-border/50 bg-gray-900/50">
                  <TableHead className="text-gray-400 font-medium">Product</TableHead>
                  <TableHead className="text-gray-400 font-medium">Customer Email</TableHead>
                  <TableHead className="text-gray-400 font-medium">Date Requested</TableHead>
                  <TableHead className="text-gray-400 font-medium text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingList.map((row) => {
                  const isNotifyPending = notifyMutation.isPending && notifyMutation.variables === row.productId;
                  const isDeletePending = deleteMutation.isPending && deleteMutation.variables === row.id;
                  const waitlistSize = pendingByProduct[row.productId]?.length ?? 1;

                  return (
                    <TableRow key={row.id} className="border-border/50 hover:bg-gray-800/30">
                      <TableCell className="py-3">
                        <ProductCell image={row.productImage} name={row.productName} />
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground py-3">
                        {row.customerEmail}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground py-3 whitespace-nowrap">
                        {formatDate(row.createdAt)}
                      </TableCell>
                      <TableCell className="text-right py-3">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-red-800 text-red-400 hover:bg-red-950/40 hover:text-red-300 text-xs gap-1.5 h-8"
                            disabled={isDeletePending || deleteMutation.isPending}
                            onClick={() => deleteMutation.mutate(row.id)}
                          >
                            <Trash2 className="w-3 h-3" />
                            {isDeletePending ? "Removing..." : "Delete"}
                          </Button>
                          <Button
                            size="sm"
                            variant="default"
                            className="bg-primary hover:bg-primary/90 text-black text-xs font-semibold gap-1.5 h-8"
                            disabled={isNotifyPending || notifyMutation.isPending}
                            onClick={() => notifyMutation.mutate(row.productId)}
                            title={`Notify all ${waitlistSize} customer${waitlistSize !== 1 ? "s" : ""} waiting for this product`}
                          >
                            <Send className="w-3 h-3" />
                            {isNotifyPending ? "Sending..." : `Notify ${waitlistSize > 1 ? `(${waitlistSize})` : "Waitlist"}`}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-green-500" />
            <h2 className="text-lg font-semibold text-foreground">Notification History</h2>
          </div>
          <Badge variant="secondary" className="bg-gray-800 text-gray-300">
            {historyList.length} notified
          </Badge>
        </div>

        {historyList.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center text-muted-foreground rounded-xl border border-border/40 bg-gray-900/30">
            <CheckCircle2 className="w-10 h-10 mb-3 opacity-20" />
            <p className="text-sm font-medium">No notifications sent yet</p>
            <p className="text-xs mt-1 opacity-60">Notified customers will appear here as a historical log.</p>
          </div>
        ) : (
          <div className="rounded-xl border border-border/50 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="border-border/50 bg-gray-900/50">
                  <TableHead className="text-gray-400 font-medium">Product</TableHead>
                  <TableHead className="text-gray-400 font-medium">Customer Email</TableHead>
                  <TableHead className="text-gray-400 font-medium">Date Requested</TableHead>
                  <TableHead className="text-gray-400 font-medium">Date Notified</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {historyList.map((row) => (
                  <TableRow key={row.id} className="border-border/50 hover:bg-gray-800/30">
                    <TableCell className="py-3">
                      <ProductCell image={row.productImage} name={row.productName} />
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground py-3">
                      {row.customerEmail}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground py-3 whitespace-nowrap">
                      {formatDate(row.createdAt)}
                    </TableCell>
                    <TableCell className="py-3 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
                        <span className="text-sm text-green-400">{row.notifiedAt ? formatDate(row.notifiedAt) : "—"}</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </section>

    </div>
  );
}
