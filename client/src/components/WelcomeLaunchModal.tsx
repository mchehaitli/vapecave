import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface WelcomeLaunchModalProps {
  open: boolean;
  onClose: () => void;
}

export default function WelcomeLaunchModal({ open, onClose }: WelcomeLaunchModalProps) {
  return (
    <Dialog open={open}>
      <DialogContent
        className="max-w-lg"
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">
            Welcome to the New Vape Cave Portal! 🚀
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 text-sm text-muted-foreground">
          <p>We are thrilled to roll out our brand new online system! Here is what's new:</p>

          <div className="space-y-3">
            <p>
              <span className="font-semibold text-foreground">📦 Delivery &amp; Pick Up:</span>{" "}
              You can now easily toggle between local delivery or in-store pickup using the buttons at the top of the page.
            </p>
            <p>
              <span className="font-semibold text-foreground">🔔 Restock Alerts:</span>{" "}
              See a favorite product that is out of stock? Click the "🔔 Notify Me" button, and we'll email you the second it hits our shelves again!
            </p>
          </div>

          <div className="rounded-lg border border-border bg-muted/40 p-4 space-y-2">
            <p className="font-semibold text-foreground">🛠️ Pardon Our Dust (Launch Phase)</p>
            <p>
              We are still in our launch phase, which means you might experience a few minor glitches or slight inventory discrepancies. Don't worry—we are actively fixing these as they happen!
            </p>
            <p>
              If you run into any issues at all, please reach out to us directly at:{" "}
              <a
                href="mailto:vapecavetx@gmail.com"
                className="text-primary underline underline-offset-2 font-medium"
              >
                vapecavetx@gmail.com
              </a>
            </p>
          </div>
        </div>

        <Button className="w-full mt-2" onClick={onClose}>
          Got it, let's shop!
        </Button>
      </DialogContent>
    </Dialog>
  );
}
