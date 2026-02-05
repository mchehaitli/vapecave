import { useQuery } from "@tanstack/react-query";
import { X } from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { SiteSettings } from "@shared/schema";

export function TopInfoBar() {
  const [isDismissed, setIsDismissed] = useState(() => {
    return localStorage.getItem("infoBarDismissed") === "true";
  });

  const { data: settings } = useQuery<SiteSettings>({
    queryKey: ['/api/site-settings'],
  });

  const handleDismiss = () => {
    setIsDismissed(true);
    localStorage.setItem("infoBarDismissed", "true");
  };

  if (isDismissed || !settings?.infoBarEnabled || !settings?.infoBarMessage) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ height: 0, opacity: 0 }}
        animate={{ height: "auto", opacity: 1 }}
        exit={{ height: 0, opacity: 0 }}
        transition={{ duration: 0.3 }}
        className="bg-primary text-primary-foreground overflow-hidden"
        data-testid="top-info-bar"
      >
        <div className="container mx-auto px-4 py-2 flex items-center justify-between">
          <div className="flex-1 text-center text-sm font-medium">
            {settings.infoBarMessage}
          </div>
          <button
            onClick={handleDismiss}
            className="ml-4 hover:opacity-80 transition-opacity"
            aria-label="Dismiss announcement"
            data-testid="button-dismiss-info-bar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
