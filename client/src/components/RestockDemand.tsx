import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Bell, Package, Users, Send, AlertCircle } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface RestockEntry {
  productId: number;
  productName: string;
  productImage: string | null;
  currentStock: string | null;
  waitingCount: number;
  customers: Array<{ id: number; email: string; fullName: string }>;
}

export default function RestockDemand() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: entries = [], isLoading, isError } = useQuery<RestockEntry[]>({
    queryKey: ["/api/admin/restock-requests"],
  });

  const notifyMutation = useMutation({
    mutationFn: (productId: number) =>
      apiRequest("POST", `/api/admin/restock-requests/${productId}/notify`),
    onSuccess: (_data, productId) => {
      toast({ title: "Notifications sent!", description: "Customers have been emailed about this restock." });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/restock-requests"] });
    },
    onError: () => {
      toast({ title: "Failed to send notifications", description: "Please try again.", variant: "destructive" });
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-3 p-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full bg-gray-800" />
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

  if (entries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground">
        <Bell className="w-12 h-12 mb-4 opacity-20" />
        <p className="text-lg font-medium">No pending restock requests</p>
        <p className="text-sm mt-1 opacity-70">When customers request notifications for out-of-stock products, they'll appear here.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <Bell className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-semibold text-foreground">Restock Demand</h2>
        </div>
        <Badge variant="secondary" className="bg-gray-800 text-gray-300">
          <Users className="w-3 h-3 mr-1" />
          {entries.reduce((sum, e) => sum + e.waitingCount, 0)} customers waiting
        </Badge>
      </div>

      <div className="rounded-xl border border-border/50 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-border/50 bg-gray-900/50">
              <TableHead className="text-gray-400 font-medium w-12"></TableHead>
              <TableHead className="text-gray-400 font-medium">Product</TableHead>
              <TableHead className="text-gray-400 font-medium text-center">Current Stock</TableHead>
              <TableHead className="text-gray-400 font-medium text-center">Waiting</TableHead>
              <TableHead className="text-gray-400 font-medium text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {entries.map((entry) => {
              const stock = entry.currentStock ? parseFloat(entry.currentStock) : 0;
              const isRestocked = stock > 0;
              const isPending = notifyMutation.isPending && notifyMutation.variables === entry.productId;

              return (
                <TableRow key={entry.productId} className="border-border/50 hover:bg-gray-800/30">
                  <TableCell className="p-2">
                    <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-800 flex-shrink-0 flex items-center justify-center">
                      {entry.productImage ? (
                        <img
                          src={entry.productImage}
                          alt={entry.productName}
                          className="w-full h-full object-contain p-1"
                        />
                      ) : (
                        <Package className="w-6 h-6 text-gray-600" />
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <p className="font-medium text-sm text-foreground leading-tight">{entry.productName}</p>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge
                      variant="outline"
                      className={`text-xs font-semibold ${
                        isRestocked
                          ? "border-green-600 text-green-400 bg-green-950/30"
                          : "border-red-600 text-red-400 bg-red-950/30"
                      }`}
                    >
                      {isRestocked ? `${stock} in stock` : "Out of stock"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-muted-foreground" />
                      <span className="text-sm font-semibold text-foreground">{entry.waitingCount}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      size="sm"
                      variant="default"
                      className="bg-primary hover:bg-primary/90 text-black text-xs font-semibold gap-1.5"
                      disabled={isPending}
                      onClick={() => notifyMutation.mutate(entry.productId)}
                    >
                      <Send className="w-3.5 h-3.5" />
                      {isPending ? "Sending..." : "Notify Waitlist"}
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
