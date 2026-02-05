import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { RefreshCcw, CheckCircle, XCircle, Link as LinkIcon, Unlink } from "lucide-react";

interface CloverStatus {
  connected: boolean;
  merchantId?: string;
  connectionType?: 'api_token' | 'oauth';
  message?: string;
  error?: string;
}

export default function CloverIntegration() {
  const { toast } = useToast();
  const [isSyncing, setIsSyncing] = useState(false);

  // Check OAuth connection status
  const { data: status, isLoading } = useQuery<CloverStatus>({
    queryKey: ['/api/admin/clover/oauth/status'],
  });

  // Disconnect mutation
  const disconnectMutation = useMutation({
    mutationFn: async () => {
      return apiRequest('DELETE', '/api/admin/clover/oauth/disconnect');
    },
    onSuccess: () => {
      toast({
        title: "Disconnected",
        description: "Clover account has been disconnected successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/clover/oauth/status'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to disconnect Clover account",
        variant: "destructive",
      });
    },
  });

  // Manual sync handler
  const handleSync = async () => {
    setIsSyncing(true);
    try {
      await apiRequest('POST', '/api/admin/clover/sync');
      toast({
        title: "Sync Complete",
        description: "Products have been synced from Clover successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/products'] });
    } catch (error: any) {
      toast({
        title: "Sync Failed",
        description: error.message || "Failed to sync products from Clover",
        variant: "destructive",
      });
    } finally {
      setIsSyncing(false);
    }
  };

  // Connect to Clover (redirect to OAuth)
  const handleConnect = () => {
    window.location.href = '/api/admin/clover/oauth/authorize';
  };

  if (isLoading) {
    return (
      <Card className="bg-gray-900 border-gray-700 p-6">
        <div className="flex items-center justify-center">
          <RefreshCcw className="animate-spin mr-2" size={20} />
          <span className="text-gray-400">Checking connection status...</span>
        </div>
      </Card>
    );
  }

  return (
    <Card className="bg-gray-900 border-gray-700 p-6">
      <div className="space-y-4">
        {/* Connection Status */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {status?.connected ? (
              <>
                <CheckCircle className="text-green-500" size={24} />
                <div>
                  <p className="font-semibold text-green-400">Connected</p>
                  {status.merchantId && (
                    <p className="text-xs text-gray-400">Merchant ID: {status.merchantId}</p>
                  )}
                  {status.connectionType === 'api_token' && (
                    <p className="text-xs text-green-500">Connected via API Token - Auto-sync every 5 minutes</p>
                  )}
                </div>
              </>
            ) : (
              <>
                <XCircle className="text-gray-500" size={24} />
                <div>
                  <p className="font-semibold text-gray-400">Not Connected</p>
                  <p className="text-xs text-gray-500">Connect your Clover account to sync products</p>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-2">
          {status?.connected ? (
            <>
              <Button
                onClick={handleSync}
                disabled={isSyncing}
                className="bg-primary hover:bg-primary/90 flex items-center gap-2"
                data-testid="button-sync-clover"
              >
                {isSyncing ? (
                  <>
                    <RefreshCcw size={16} className="animate-spin" />
                    Syncing...
                  </>
                ) : (
                  <>
                    <RefreshCcw size={16} />
                    Sync Now
                  </>
                )}
              </Button>
              {/* Only show disconnect for OAuth connections, not API token */}
              {status.connectionType === 'oauth' && (
                <Button
                  onClick={() => disconnectMutation.mutate()}
                  disabled={disconnectMutation.isPending}
                  variant="outline"
                  className="border-gray-600 hover:bg-gray-700 text-gray-300 flex items-center gap-2"
                  data-testid="button-disconnect-clover"
                >
                  {disconnectMutation.isPending ? (
                    <>
                      <RefreshCcw size={16} className="animate-spin" />
                      Disconnecting...
                    </>
                  ) : (
                    <>
                      <Unlink size={16} />
                      Disconnect
                    </>
                  )}
                </Button>
              )}
            </>
          ) : (
            <Button
              onClick={handleConnect}
              className="bg-primary hover:bg-primary/90 flex items-center gap-2"
              data-testid="button-connect-clover"
            >
              <LinkIcon size={16} />
              Connect to Clover
            </Button>
          )}
        </div>

        {/* Info Message */}
        {!status?.connected && (
          <div className="bg-gray-800 border border-gray-700 rounded p-4 mt-4">
            <p className="text-sm text-gray-400">
              Click "Connect to Clover" to securely link your Clover merchant account. 
              You'll be redirected to Clover to authorize this connection. Once connected, 
              your product inventory will automatically sync every 5 minutes.
            </p>
          </div>
        )}
      </div>
    </Card>
  );
}
