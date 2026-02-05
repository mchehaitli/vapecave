import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { DollarSign, Loader2 } from "lucide-react";

interface DeliveryFeeSettings {
  feeType: 'flat' | 'per_mile' | 'per_item' | 'combined';
  flatFee: string;
  perMileFee: string;
  perItemFee: string;
}

export default function DeliveryFeeSettings() {
  const { toast } = useToast();

  // Fetch current settings
  const { data: settings, isLoading } = useQuery<DeliveryFeeSettings>({
    queryKey: ['/api/admin/delivery/fee-settings'],
  });

  // Local state for form
  const [feeType, setFeeType] = useState<string>('flat');
  const [flatFee, setFlatFee] = useState<string>('10.00');
  const [perMileFee, setPerMileFee] = useState<string>('1.50');
  const [perItemFee, setPerItemFee] = useState<string>('0.50');

  // Update local state when settings load
  useEffect(() => {
    if (settings) {
      setFeeType(settings.feeType);
      setFlatFee(settings.flatFee);
      setPerMileFee(settings.perMileFee);
      setPerItemFee(settings.perItemFee);
    }
  }, [settings]);

  // Update settings mutation
  const updateMutation = useMutation({
    mutationFn: async (data: DeliveryFeeSettings) => {
      return apiRequest('PATCH', '/api/admin/delivery/fee-settings', data);
    },
    onSuccess: () => {
      toast({
        title: "Settings Updated",
        description: "Delivery fee settings have been saved successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/delivery/fee-settings'] });
      queryClient.invalidateQueries({ queryKey: ['/api/delivery/fee-settings'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update delivery fee settings",
        variant: "destructive",
      });
    },
  });

  const handleSave = () => {
    updateMutation.mutate({
      feeType: feeType as any,
      flatFee,
      perMileFee,
      perItemFee,
    });
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
          <DollarSign className="text-green-500" size={24} />
          Delivery Fee Configuration
        </CardTitle>
        <CardDescription className="text-gray-400">
          Configure how delivery fees are calculated for customer orders
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Fee Type Selection */}
        <div className="space-y-3">
          <Label className="text-white text-base">Fee Type</Label>
          <RadioGroup value={feeType} onValueChange={setFeeType}>
            <div className="flex items-center space-x-2 p-3 bg-gray-800 rounded-lg hover:bg-gray-750 transition-colors">
              <RadioGroupItem value="flat" id="flat" data-testid="radio-fee-type-flat" />
              <Label htmlFor="flat" className="text-gray-300 cursor-pointer flex-1">
                <div className="font-medium">Flat Rate</div>
                <div className="text-sm text-gray-500">Single fee per order regardless of distance or items</div>
              </Label>
            </div>
            
            <div className="flex items-center space-x-2 p-3 bg-gray-800 rounded-lg hover:bg-gray-750 transition-colors">
              <RadioGroupItem value="per_mile" id="per_mile" data-testid="radio-fee-type-per-mile" />
              <Label htmlFor="per_mile" className="text-gray-300 cursor-pointer flex-1">
                <div className="font-medium">Per Mile</div>
                <div className="text-sm text-gray-500">Fee multiplied by delivery distance in miles</div>
              </Label>
            </div>
            
            <div className="flex items-center space-x-2 p-3 bg-gray-800 rounded-lg hover:bg-gray-750 transition-colors">
              <RadioGroupItem value="per_item" id="per_item" data-testid="radio-fee-type-per-item" />
              <Label htmlFor="per_item" className="text-gray-300 cursor-pointer flex-1">
                <div className="font-medium">Per Item</div>
                <div className="text-sm text-gray-500">Fee multiplied by number of items in order</div>
              </Label>
            </div>
            
            <div className="flex items-center space-x-2 p-3 bg-gray-800 rounded-lg hover:bg-gray-750 transition-colors">
              <RadioGroupItem value="combined" id="combined" data-testid="radio-fee-type-combined" />
              <Label htmlFor="combined" className="text-gray-300 cursor-pointer flex-1">
                <div className="font-medium">Combined (Per Mile + Per Item)</div>
                <div className="text-sm text-gray-500">Apply both per-mile and per-item fees together</div>
              </Label>
            </div>
          </RadioGroup>
        </div>

        {/* Fee Amount Inputs */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Flat Fee */}
          <div className={`space-y-2 ${feeType !== 'flat' ? 'opacity-50' : ''}`}>
            <Label htmlFor="flatFee" className="text-white">
              Flat Fee ($)
            </Label>
            <Input
              id="flatFee"
              data-testid="input-flat-fee"
              type="number"
              step="0.01"
              min="0"
              value={flatFee}
              onChange={(e) => setFlatFee(e.target.value)}
              disabled={feeType !== 'flat'}
              className="bg-gray-800 border-gray-700 text-white"
              placeholder="5.00"
            />
            <p className="text-xs text-gray-500">Used when fee type is "Flat Rate"</p>
          </div>

          {/* Per Mile Fee */}
          <div className={`space-y-2 ${feeType !== 'per_mile' && feeType !== 'combined' ? 'opacity-50' : ''}`}>
            <Label htmlFor="perMileFee" className="text-white">
              Per Mile Fee ($)
            </Label>
            <Input
              id="perMileFee"
              data-testid="input-per-mile-fee"
              type="number"
              step="0.01"
              min="0"
              value={perMileFee}
              onChange={(e) => setPerMileFee(e.target.value)}
              disabled={feeType !== 'per_mile' && feeType !== 'combined'}
              className="bg-gray-800 border-gray-700 text-white"
              placeholder="1.50"
            />
            <p className="text-xs text-gray-500">Multiplied by distance in miles</p>
          </div>

          {/* Per Item Fee */}
          <div className={`space-y-2 ${feeType !== 'per_item' && feeType !== 'combined' ? 'opacity-50' : ''}`}>
            <Label htmlFor="perItemFee" className="text-white">
              Per Item Fee ($)
            </Label>
            <Input
              id="perItemFee"
              data-testid="input-per-item-fee"
              type="number"
              step="0.01"
              min="0"
              value={perItemFee}
              onChange={(e) => setPerItemFee(e.target.value)}
              disabled={feeType !== 'per_item' && feeType !== 'combined'}
              className="bg-gray-800 border-gray-700 text-white"
              placeholder="0.50"
            />
            <p className="text-xs text-gray-500">Multiplied by item count</p>
          </div>
        </div>

        {/* Example Calculation */}
        <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
          <h4 className="text-white font-medium mb-2">Example Calculation</h4>
          <div className="text-sm text-gray-400 space-y-1">
            {feeType === 'flat' && (
              <p>Order with any items at any distance: <span className="text-green-500 font-medium">${flatFee}</span></p>
            )}
            {feeType === 'per_mile' && (
              <p>Order 5 miles away: <span className="text-green-500 font-medium">${(parseFloat(perMileFee) * 5).toFixed(2)}</span></p>
            )}
            {feeType === 'per_item' && (
              <p>Order with 3 items: <span className="text-green-500 font-medium">${(parseFloat(perItemFee) * 3).toFixed(2)}</span></p>
            )}
            {feeType === 'combined' && (
              <p>Order with 3 items, 5 miles away: <span className="text-green-500 font-medium">${((parseFloat(perMileFee) * 5) + (parseFloat(perItemFee) * 3)).toFixed(2)}</span></p>
            )}
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button
            onClick={handleSave}
            disabled={updateMutation.isPending}
            className="bg-green-600 hover:bg-green-700 text-white"
            data-testid="button-save-fee-settings"
          >
            {updateMutation.isPending ? (
              <>
                <Loader2 className="animate-spin mr-2" size={16} />
                Saving...
              </>
            ) : (
              'Save Settings'
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
