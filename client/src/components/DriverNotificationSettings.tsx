import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Mail, Loader2 } from "lucide-react";

interface NotificationSettings {
  driverEmail: string;
}

export default function DriverNotificationSettings() {
  const { toast } = useToast();

  const { data: settings, isLoading } = useQuery<NotificationSettings>({
    queryKey: ['/api/admin/delivery/notification-settings'],
  });

  const [driverEmail, setDriverEmail] = useState<string>('vapecavetx@gmail.com');

  useEffect(() => {
    if (settings) {
      setDriverEmail(settings.driverEmail);
    }
  }, [settings]);

  const updateMutation = useMutation({
    mutationFn: async (data: NotificationSettings) => {
      return apiRequest('PATCH', '/api/admin/delivery/notification-settings', data);
    },
    onSuccess: () => {
      toast({
        title: "Settings Updated",
        description: "Driver notification email has been saved successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/delivery/notification-settings'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update notification settings",
        variant: "destructive",
      });
    },
  });

  const handleSave = () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(driverEmail)) {
      toast({
        title: "Invalid Email",
        description: "Please enter a valid email address",
        variant: "destructive",
      });
      return;
    }
    updateMutation.mutate({ driverEmail });
  };

  if (isLoading) {
    return (
      <Card className="bg-gray-900 border-gray-700">
        <CardContent className="pt-6">
          <div className="flex items-center justify-center">
            <Loader2 className="animate-spin mr-2" size={20} />
            <span className="text-gray-400">Loading settings...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gray-900 border-gray-700">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Mail className="text-blue-500" size={24} />
          Driver Notification Settings
        </CardTitle>
        <CardDescription className="text-gray-400">
          Configure email address for receiving order notifications
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-3">
          <Label htmlFor="driverEmail" className="text-white text-base">
            Driver Email Address
          </Label>
          <p className="text-sm text-gray-400">
            This email will receive notifications for every new order placed, including customer info, delivery details, and payment method.
          </p>
          <Input
            id="driverEmail"
            type="email"
            value={driverEmail}
            onChange={(e) => setDriverEmail(e.target.value)}
            placeholder="vapecavetx@gmail.com"
            className="bg-gray-800 border-gray-600 text-white"
            data-testid="input-driver-email"
          />
        </div>

        <Button
          onClick={handleSave}
          disabled={updateMutation.isPending}
          className="w-full bg-blue-600 hover:bg-blue-700"
          data-testid="button-save-notification-settings"
        >
          {updateMutation.isPending ? (
            <>
              <Loader2 className="animate-spin mr-2" size={16} />
              Saving...
            </>
          ) : (
            'Save Notification Settings'
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
