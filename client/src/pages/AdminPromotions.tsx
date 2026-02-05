import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient, useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { apiRequest } from "@/lib/queryClient";
import { Promotion } from "@shared/schema";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Tag, Plus, Pencil, Trash2, Calendar, Loader2 } from "lucide-react";

const promotionFormSchema = z.object({
  code: z.string().min(1, "Promo code is required").transform((val) => val.toUpperCase()),
  description: z.string().optional(),
  discountType: z.enum(["percentage", "fixed"]),
  discountValue: z.coerce.number().min(0.01, "Discount value must be greater than 0"),
  minimumOrderAmount: z.coerce.number().min(0).optional(),
  maxUsageCount: z.coerce.number().min(1).optional().nullable(),
  maxUsagePerCustomer: z.coerce.number().min(1).default(1),
  validFrom: z.string().min(1, "Valid from date is required"),
  validUntil: z.string().min(1, "Valid until date is required"),
  enabled: z.boolean().default(true),
});

type PromotionFormValues = z.infer<typeof promotionFormSchema>;

function getPromotionStatus(promotion: Promotion): { status: string; variant: "default" | "secondary" | "destructive" | "outline" } {
  const now = new Date();
  const validFrom = new Date(promotion.validFrom);
  const validUntil = new Date(promotion.validUntil);

  if (!promotion.enabled) {
    return { status: "Inactive", variant: "secondary" };
  }
  if (now > validUntil) {
    return { status: "Expired", variant: "destructive" };
  }
  if (now < validFrom) {
    return { status: "Scheduled", variant: "outline" };
  }
  return { status: "Active", variant: "default" };
}

function formatDateDisplay(date: Date | string): string {
  const d = new Date(date);
  return format(d, "MMM d, yyyy");
}

function formatDateForInput(date: Date | string): string {
  const d = new Date(date);
  return format(d, "yyyy-MM-dd");
}

export default function AdminPromotions() {
  const queryClient = useQueryClient();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPromotion, setEditingPromotion] = useState<Promotion | null>(null);
  const [deletingPromotionId, setDeletingPromotionId] = useState<number | null>(null);

  const { data: promotions = [], isLoading } = useQuery<Promotion[]>({
    queryKey: ["/api/admin/promotions"],
  });

  const form = useForm<PromotionFormValues>({
    resolver: zodResolver(promotionFormSchema),
    defaultValues: {
      code: "",
      description: "",
      discountType: "percentage",
      discountValue: 0,
      minimumOrderAmount: 0,
      maxUsageCount: null,
      maxUsagePerCustomer: 1,
      validFrom: "",
      validUntil: "",
      enabled: true,
    },
  });

  useEffect(() => {
    if (dialogOpen && editingPromotion) {
      form.reset({
        code: editingPromotion.code,
        description: editingPromotion.description || "",
        discountType: editingPromotion.discountType as "percentage" | "fixed",
        discountValue: parseFloat(editingPromotion.discountValue),
        minimumOrderAmount: editingPromotion.minimumOrderAmount ? parseFloat(editingPromotion.minimumOrderAmount) : 0,
        maxUsageCount: editingPromotion.maxUsageCount,
        maxUsagePerCustomer: editingPromotion.maxUsagePerCustomer || 1,
        validFrom: formatDateForInput(editingPromotion.validFrom),
        validUntil: formatDateForInput(editingPromotion.validUntil),
        enabled: editingPromotion.enabled,
      });
    } else if (dialogOpen) {
      form.reset({
        code: "",
        description: "",
        discountType: "percentage",
        discountValue: 0,
        minimumOrderAmount: 0,
        maxUsageCount: null,
        maxUsagePerCustomer: 1,
        validFrom: "",
        validUntil: "",
        enabled: true,
      });
    }
  }, [dialogOpen, editingPromotion, form]);

  const createMutation = useMutation({
    mutationFn: async (data: PromotionFormValues) => {
      const payload = {
        ...data,
        validFrom: new Date(data.validFrom).toISOString(),
        validUntil: new Date(data.validUntil).toISOString(),
        maxUsageCount: data.maxUsageCount || null,
        minimumOrderAmount: data.minimumOrderAmount || 0,
      };
      const res = await apiRequest("POST", "/api/admin/promotions", payload);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/promotions"] });
      setDialogOpen(false);
      setEditingPromotion(null);
      toast({
        title: "Promotion Created",
        description: "The promotion has been created successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create promotion",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: PromotionFormValues }) => {
      const payload = {
        ...data,
        validFrom: new Date(data.validFrom).toISOString(),
        validUntil: new Date(data.validUntil).toISOString(),
        maxUsageCount: data.maxUsageCount || null,
        minimumOrderAmount: data.minimumOrderAmount || 0,
      };
      const res = await apiRequest("PATCH", `/api/admin/promotions/${id}`, payload);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/promotions"] });
      setDialogOpen(false);
      setEditingPromotion(null);
      toast({
        title: "Promotion Updated",
        description: "The promotion has been updated successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update promotion",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/admin/promotions/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/promotions"] });
      setDeletingPromotionId(null);
      toast({
        title: "Promotion Deleted",
        description: "The promotion has been deleted successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete promotion",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: PromotionFormValues) => {
    if (editingPromotion) {
      updateMutation.mutate({ id: editingPromotion.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (promotion: Promotion) => {
    setEditingPromotion(promotion);
    setDialogOpen(true);
  };

  const handleDelete = (id: number) => {
    setDeletingPromotionId(id);
  };

  const confirmDelete = () => {
    if (deletingPromotionId) {
      deleteMutation.mutate(deletingPromotionId);
    }
  };

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="container mx-auto py-6 space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Tag className="h-5 w-5" />
            Promotions Management
          </CardTitle>
          <Button
            onClick={() => {
              setEditingPromotion(null);
              setDialogOpen(true);
            }}
            data-testid="button-create-promotion"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Promotion
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : promotions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No promotions found. Create your first promotion to get started.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Discount Type</TableHead>
                  <TableHead>Discount Value</TableHead>
                  <TableHead>Min Order</TableHead>
                  <TableHead>Usage</TableHead>
                  <TableHead>Validity Period</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {promotions.map((promotion) => {
                  const { status, variant } = getPromotionStatus(promotion);
                  const now = new Date();
                  const validUntil = new Date(promotion.validUntil);
                  const isExpired = now > validUntil;

                  return (
                    <TableRow key={promotion.id} data-testid={`row-promotion-${promotion.id}`}>
                      <TableCell className="font-mono font-bold" data-testid={`text-code-${promotion.id}`}>
                        {promotion.code}
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate" data-testid={`text-description-${promotion.id}`}>
                        {promotion.description || "-"}
                      </TableCell>
                      <TableCell className="capitalize" data-testid={`text-discountType-${promotion.id}`}>
                        {promotion.discountType}
                      </TableCell>
                      <TableCell data-testid={`text-discountValue-${promotion.id}`}>
                        {promotion.discountType === "percentage"
                          ? `${promotion.discountValue}%`
                          : `$${promotion.discountValue}`}
                      </TableCell>
                      <TableCell data-testid={`text-minOrder-${promotion.id}`}>
                        {promotion.minimumOrderAmount && parseFloat(promotion.minimumOrderAmount) > 0
                          ? `$${promotion.minimumOrderAmount}`
                          : "-"}
                      </TableCell>
                      <TableCell data-testid={`text-usage-${promotion.id}`}>
                        {promotion.currentUsageCount} / {promotion.maxUsageCount ?? "∞"}
                      </TableCell>
                      <TableCell data-testid={`text-validity-${promotion.id}`}>
                        <div className={`flex items-center gap-1 ${isExpired ? "text-destructive" : ""}`}>
                          <Calendar className="h-3 w-3" />
                          <span>
                            {formatDateDisplay(promotion.validFrom)} - {formatDateDisplay(promotion.validUntil)}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell data-testid={`text-status-${promotion.id}`}>
                        <Badge variant={variant}>{status}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => handleEdit(promotion)}
                            data-testid={`button-edit-${promotion.id}`}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => handleDelete(promotion.id)}
                            data-testid={`button-delete-${promotion.id}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle data-testid="dialog-title">
              {editingPromotion ? "Edit Promotion" : "Create Promotion"}
            </DialogTitle>
            <DialogDescription>
              {editingPromotion
                ? "Update the promotion details below."
                : "Fill in the details to create a new promotion."}
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Promo Code</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="e.g., SUMMER20"
                        className="uppercase"
                        onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                        data-testid="input-code"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder="Describe the promotion..."
                        data-testid="input-description"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="discountType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Discount Type</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-discountType">
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="percentage">Percentage</SelectItem>
                          <SelectItem value="fixed">Fixed Amount</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="discountValue"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Discount Value {form.watch("discountType") === "percentage" ? "(%)" : "($)"}
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="number"
                          step="0.01"
                          min="0"
                          data-testid="input-discountValue"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="minimumOrderAmount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Minimum Order Amount ($)</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0 for no minimum"
                        data-testid="input-minimumOrderAmount"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="maxUsageCount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Max Total Usage</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="number"
                          min="1"
                          placeholder="Leave empty for unlimited"
                          value={field.value ?? ""}
                          onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : null)}
                          data-testid="input-maxUsageCount"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="maxUsagePerCustomer"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Max Usage Per Customer</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="number"
                          min="1"
                          data-testid="input-maxUsagePerCustomer"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="validFrom"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Valid From</FormLabel>
                      <FormControl>
                        <Input {...field} type="date" data-testid="input-validFrom" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="validUntil"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Valid Until</FormLabel>
                      <FormControl>
                        <Input {...field} type="date" data-testid="input-validUntil" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="enabled"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel>Enabled</FormLabel>
                      <div className="text-sm text-muted-foreground">
                        Enable this promotion for customers to use
                      </div>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        data-testid="switch-enabled"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setDialogOpen(false)}
                  data-testid="button-cancel"
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting} data-testid="button-submit">
                  {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  {editingPromotion ? "Update" : "Create"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deletingPromotionId !== null} onOpenChange={(open) => !open && setDeletingPromotionId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Promotion</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this promotion? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-testid="button-confirm-delete"
            >
              {deleteMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
