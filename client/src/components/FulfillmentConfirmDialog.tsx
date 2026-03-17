import { motion } from "framer-motion";
import { Truck, Store, ArrowRight } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useFulfillment } from "@/contexts/FulfillmentContext";

interface FulfillmentConfirmDialogProps {
  open: boolean;
  onContinue: () => void;
  onCancel: () => void;
}

export function FulfillmentConfirmDialog({ open, onContinue, onCancel }: FulfillmentConfirmDialogProps) {
  const { fulfillmentMode, setFulfillmentMode } = useFulfillment();

  return (
    <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) onCancel(); }}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Confirm Order Type</DialogTitle>
          <DialogDescription>
            Is this order for delivery or in-store pickup?
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center gap-6 py-4">
          <div
            className="relative flex items-center rounded-full bg-muted/60 border border-border p-1 w-full max-w-[240px]"
            role="radiogroup"
            aria-label="Fulfillment method"
          >
            <motion.div
              className={`absolute top-1 bottom-1 w-[calc(50%-4px)] rounded-full ${
                fulfillmentMode === 'delivery' ? 'bg-green-500' : 'bg-yellow-400'
              }`}
              initial={false}
              animate={{ x: fulfillmentMode === 'delivery' ? 0 : '100%' }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
              style={{ left: '4px' }}
            />
            <button
              onClick={() => setFulfillmentMode('delivery')}
              role="radio"
              aria-checked={fulfillmentMode === 'delivery'}
              aria-label="Delivery"
              className={`relative z-10 flex items-center justify-center gap-2 rounded-full px-4 py-2.5 text-sm font-medium transition-colors flex-1 ${
                fulfillmentMode === 'delivery'
                  ? 'text-white'
                  : 'text-muted-foreground hover:text-foreground cursor-pointer'
              }`}
            >
              <Truck className="w-4 h-4" />
              Delivery
            </button>
            <button
              onClick={() => setFulfillmentMode('pickup')}
              role="radio"
              aria-checked={fulfillmentMode === 'pickup'}
              aria-label="Pickup"
              className={`relative z-10 flex items-center justify-center gap-2 rounded-full px-4 py-2.5 text-sm font-medium transition-colors flex-1 ${
                fulfillmentMode === 'pickup'
                  ? 'text-black'
                  : 'text-muted-foreground hover:text-foreground cursor-pointer'
              }`}
            >
              <Store className="w-4 h-4" />
              Pickup
            </button>
          </div>

          <div className="text-center text-sm text-muted-foreground">
            {fulfillmentMode === 'delivery' ? (
              <p>Your order will be <span className="font-semibold text-green-600">delivered</span> to your address.</p>
            ) : (
              <p>Your order will be ready for <span className="font-semibold text-yellow-600">pickup</span> at our Frisco store.</p>
            )}
          </div>
        </div>

        <div className="flex gap-3">
          <Button variant="outline" className="flex-1" onClick={onCancel}>
            Cancel
          </Button>
          <Button className="flex-1" onClick={onContinue}>
            Continue
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
