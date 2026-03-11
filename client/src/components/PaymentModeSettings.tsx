import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { CreditCard, Banknote, Loader2 } from "lucide-react";

export default function PaymentModeSettings() {
  const { toast } = useToast();
  const [mode, setMode] = useState<string>("online");

  const { data: setting, isLoading } = useQuery<{ key: string; value: string } | null>({
    queryKey: ["/api/settings", "payment_mode"],
    queryFn: async () => {
      const res = await fetch("/api/settings/payment_mode");
      if (!res.ok) return null;
      return res.json();
    },
  });

  useEffect(() => {
    if (setting?.value) {
      setMode(setting.value);
    }
  }, [setting]);

  const updateMutation = useMutation({
    mutationFn: async (value: string) => {
      const res = await apiRequest("PUT", "/api/admin/settings/payment_mode", {
        value,
        description: "Payment mode: online (Clover card payments) or pay_on_delivery (cash only)",
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/settings", "payment_mode"] });
      toast({ title: "Payment mode updated" });
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const handleToggle = (newMode: string) => {
    setMode(newMode);
    updateMutation.mutate(newMode);
  };

  if (isLoading) {
    return (
      <Card className="bg-gray-800 border-gray-700">
        <CardContent className="flex items-center justify-center p-8">
          <Loader2 className="h-6 w-6 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gray-800 border-gray-700">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          Payment Mode
        </CardTitle>
        <CardDescription>
          Control how customers pay for delivery orders
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => handleToggle("pay_on_delivery")}
            className={`p-4 rounded-lg border-2 text-left transition-all ${
              mode === "pay_on_delivery"
                ? "border-orange-500 bg-orange-500/10"
                : "border-gray-600 hover:border-gray-500"
            }`}
            disabled={updateMutation.isPending}
          >
            <Banknote className={`h-6 w-6 mb-2 ${mode === "pay_on_delivery" ? "text-orange-400" : "text-gray-400"}`} />
            <Label className="text-sm font-semibold block cursor-pointer">Pay on Delivery</Label>
            <p className="text-xs text-gray-400 mt-1">
              Driver collects card payment on delivery using handheld terminal. Online checkout is hidden.
            </p>
          </button>
          <button
            type="button"
            onClick={() => handleToggle("online")}
            className={`p-4 rounded-lg border-2 text-left transition-all ${
              mode === "online"
                ? "border-blue-500 bg-blue-500/10"
                : "border-gray-600 hover:border-gray-500"
            }`}
            disabled={updateMutation.isPending}
          >
            <CreditCard className={`h-6 w-6 mb-2 ${mode === "online" ? "text-blue-400" : "text-gray-400"}`} />
            <Label className="text-sm font-semibold block cursor-pointer">Online Payments</Label>
            <p className="text-xs text-gray-400 mt-1">
              Customers can pay with credit/debit card via Clover hosted checkout.
            </p>
          </button>
        </div>
        {updateMutation.isPending && (
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <Loader2 className="h-4 w-4 animate-spin" />
            Updating...
          </div>
        )}
        <p className="text-xs text-gray-500">
          Current mode: <span className="font-medium text-gray-300">{mode === "online" ? "Online Payments" : "Pay on Delivery"}</span>
        </p>
      </CardContent>
    </Card>
  );
}
