import { useState } from "react";
import { useAllSettings } from "@/hooks/useSettings";
import { useMutation, useQuery } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Save, Settings, UserCog, Shield, UserPlus } from "lucide-react";
import { Separator } from "@/components/ui/separator";

interface AdminUser {
  id: number;
  username: string;
  isAdmin: boolean;
}

export default function SettingsManagement() {
  const { data: settings, isLoading } = useAllSettings();
  const { toast } = useToast();
  const [editedValues, setEditedValues] = useState<Record<string, string>>({});
  
  // Admin management state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [newUsername, setNewUsername] = useState("");
  const [newAdminUsername, setNewAdminUsername] = useState("");
  const [newAdminPassword, setNewAdminPassword] = useState("");
  const [newAdminConfirmPassword, setNewAdminConfirmPassword] = useState("");

  // Get current user info from auth status
  const { data: authStatus } = useQuery({
    queryKey: ["/api/auth/status"],
  });
  
  const currentUserId = authStatus?.user?.id;
  
  // Get all admin users
  const { data: adminUsers } = useQuery<AdminUser[]>({
    queryKey: ["/api/admin/users"],
  });

  const updateSetting = useMutation({
    mutationFn: async ({ key, value }: { key: string; value: string }) => {
      const response = await apiRequest("PUT", `/api/admin/settings/${key}`, { value });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings"] });
      toast({
        title: "Success",
        description: "Setting updated successfully",
      });
      setEditedValues({});
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update setting",
        variant: "destructive",
      });
    },
  });
  
  // Change password mutation
  const changePasswordMutation = useMutation({
    mutationFn: async ({ currentPassword, newPassword }: { currentPassword: string; newPassword: string }) => {
      const response = await apiRequest("PATCH", `/api/admin/users/${currentUserId}/password`, {
        currentPassword,
        newPassword,
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Password changed successfully",
      });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to change password",
        variant: "destructive",
      });
    },
  });
  
  // Change username mutation
  const changeUsernameMutation = useMutation({
    mutationFn: async (newUsername: string) => {
      const response = await apiRequest("PATCH", `/api/admin/users/${currentUserId}/username`, {
        newUsername,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/status"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({
        title: "Success",
        description: "Username changed successfully",
      });
      setNewUsername("");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to change username",
        variant: "destructive",
      });
    },
  });
  
  // Create admin mutation
  const createAdminMutation = useMutation({
    mutationFn: async ({ username, password }: { username: string; password: string }) => {
      const response = await apiRequest("POST", "/api/admin/users", {
        username,
        password,
        isAdmin: true,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({
        title: "Success",
        description: "New admin user created successfully",
      });
      setNewAdminUsername("");
      setNewAdminPassword("");
      setNewAdminConfirmPassword("");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create admin user",
        variant: "destructive",
      });
    },
  });

  const handleSave = (key: string) => {
    const value = editedValues[key];
    if (value !== undefined) {
      updateSetting.mutate({ key, value });
    }
  };

  const handleChange = (key: string, value: string) => {
    setEditedValues(prev => ({ ...prev, [key]: value }));
  };

  const getDisplayValue = (key: string, originalValue: string) => {
    return editedValues[key] !== undefined ? editedValues[key] : originalValue;
  };

  const getFriendlyName = (key: string): string => {
    const names: Record<string, string> = {
      "delivery_radius_miles": "Delivery Radius (miles)",
    };
    return names[key] || key.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase());
  };

  const getDescription = (key: string): string => {
    const descriptions: Record<string, string> = {
      "delivery_radius_miles": "Maximum delivery distance from the Frisco store location",
    };
    return descriptions[key] || "";
  };
  
  // Admin management handlers
  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      toast({
        title: "Error",
        description: "Passwords do not match",
        variant: "destructive",
      });
      return;
    }
    
    if (newPassword.length < 6) {
      toast({
        title: "Error",
        description: "Password must be at least 6 characters long",
        variant: "destructive",
      });
      return;
    }
    
    changePasswordMutation.mutate({ currentPassword, newPassword });
  };
  
  const handleChangeUsername = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newUsername.trim()) {
      toast({
        title: "Error",
        description: "Username cannot be empty",
        variant: "destructive",
      });
      return;
    }
    
    changeUsernameMutation.mutate(newUsername);
  };
  
  const handleCreateAdmin = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newAdminPassword !== newAdminConfirmPassword) {
      toast({
        title: "Error",
        description: "Passwords do not match",
        variant: "destructive",
      });
      return;
    }
    
    if (newAdminPassword.length < 6) {
      toast({
        title: "Error",
        description: "Password must be at least 6 characters long",
        variant: "destructive",
      });
      return;
    }
    
    createAdminMutation.mutate({ username: newAdminUsername, password: newAdminPassword });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8" data-testid="settings-loading">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Settings className="h-6 w-6" />
        <h2 className="text-2xl font-bold">System Settings</h2>
      </div>

      <div className="grid gap-4">
        {settings?.map((setting) => {
          const hasChanges = editedValues[setting.key] !== undefined;
          const currentValue = getDisplayValue(setting.key, setting.value);

          return (
            <Card key={setting.key} data-testid={`setting-card-${setting.key}`}>
              <CardHeader>
                <CardTitle>{getFriendlyName(setting.key)}</CardTitle>
                <CardDescription>
                  {setting.description || getDescription(setting.key)}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-4 items-end">
                  <div className="flex-1">
                    <Label htmlFor={`setting-${setting.key}`}>Value</Label>
                    <Input
                      id={`setting-${setting.key}`}
                      type={setting.key.includes("miles") ? "number" : "text"}
                      value={currentValue}
                      onChange={(e) => handleChange(setting.key, e.target.value)}
                      data-testid={`input-${setting.key}`}
                    />
                  </div>
                  <Button
                    onClick={() => handleSave(setting.key)}
                    disabled={!hasChanges || updateSetting.isPending}
                    data-testid={`button-save-${setting.key}`}
                  >
                    {updateSetting.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Save
                      </>
                    )}
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  Last updated: {new Date(setting.updatedAt).toLocaleString()}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Separator className="my-8" />

      {/* Admin Management Section */}
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <UserCog className="h-6 w-6" />
          <h2 className="text-2xl font-bold">Admin Account Management</h2>
        </div>

        {/* List of Admin Users */}
        <Card data-testid="admin-users-card">
          <CardHeader>
            <CardTitle>Current Admin Users</CardTitle>
            <CardDescription>
              List of all administrators who have access to this portal
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {adminUsers?.map((user) => (
                <div key={user.id} className="flex items-center gap-2 p-2 bg-muted rounded">
                  <Shield className="h-4 w-4 text-primary" />
                  <span className="font-medium">{user.username}</span>
                  {user.id === currentUserId && (
                    <span className="text-xs text-muted-foreground ml-auto">(You)</span>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="grid md:grid-cols-2 gap-4">
          {/* Change Password Form */}
          <Card data-testid="change-password-card">
            <CardHeader>
              <CardTitle>Change Your Password</CardTitle>
              <CardDescription>
                Update your admin account password
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleChangePassword} className="space-y-4">
                <div>
                  <Label htmlFor="current-password">Current Password</Label>
                  <Input
                    id="current-password"
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    required
                    data-testid="input-current-password"
                  />
                </div>
                <div>
                  <Label htmlFor="new-password">New Password</Label>
                  <Input
                    id="new-password"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    minLength={6}
                    data-testid="input-new-password"
                  />
                </div>
                <div>
                  <Label htmlFor="confirm-password">Confirm New Password</Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    minLength={6}
                    data-testid="input-confirm-password"
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full"
                  disabled={!currentUserId || changePasswordMutation.isPending}
                  data-testid="button-change-password"
                >
                  {changePasswordMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Changing...
                    </>
                  ) : (
                    "Change Password"
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Change Username Form */}
          <Card data-testid="change-username-card">
            <CardHeader>
              <CardTitle>Change Your Username</CardTitle>
              <CardDescription>
                Update your admin account username
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleChangeUsername} className="space-y-4">
                <div>
                  <Label htmlFor="current-username">Current Username</Label>
                  <Input
                    id="current-username"
                    value={authStatus?.user?.username || ""}
                    disabled
                    data-testid="input-current-username"
                  />
                </div>
                <div>
                  <Label htmlFor="new-username">New Username</Label>
                  <Input
                    id="new-username"
                    type="text"
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                    required
                    data-testid="input-new-username"
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full"
                  disabled={!currentUserId || changeUsernameMutation.isPending}
                  data-testid="button-change-username"
                >
                  {changeUsernameMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Changing...
                    </>
                  ) : (
                    "Change Username"
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Create New Admin Form */}
        <Card data-testid="create-admin-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5" />
              Add New Admin User
            </CardTitle>
            <CardDescription>
              Create a new administrator account with full portal access
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateAdmin} className="space-y-4">
              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="new-admin-username">Username</Label>
                  <Input
                    id="new-admin-username"
                    type="text"
                    value={newAdminUsername}
                    onChange={(e) => setNewAdminUsername(e.target.value)}
                    required
                    data-testid="input-new-admin-username"
                  />
                </div>
                <div>
                  <Label htmlFor="new-admin-password">Password</Label>
                  <Input
                    id="new-admin-password"
                    type="password"
                    value={newAdminPassword}
                    onChange={(e) => setNewAdminPassword(e.target.value)}
                    required
                    minLength={6}
                    data-testid="input-new-admin-password"
                  />
                </div>
                <div>
                  <Label htmlFor="new-admin-confirm-password">Confirm Password</Label>
                  <Input
                    id="new-admin-confirm-password"
                    type="password"
                    value={newAdminConfirmPassword}
                    onChange={(e) => setNewAdminConfirmPassword(e.target.value)}
                    required
                    minLength={6}
                    data-testid="input-new-admin-confirm-password"
                  />
                </div>
              </div>
              <Button
                type="submit"
                disabled={!currentUserId || createAdminMutation.isPending}
                data-testid="button-create-admin"
              >
                {createAdminMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <UserPlus className="mr-2 h-4 w-4" />
                    Create Admin User
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
