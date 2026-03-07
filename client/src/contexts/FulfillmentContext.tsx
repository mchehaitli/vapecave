import { createContext, useContext, useState, type ReactNode } from "react";

type FulfillmentMode = "delivery" | "pickup";

interface FulfillmentContextType {
  fulfillmentMode: FulfillmentMode;
  setFulfillmentMode: (mode: FulfillmentMode) => void;
}

const FulfillmentContext = createContext<FulfillmentContextType | undefined>(undefined);

export function FulfillmentProvider({ children }: { children: ReactNode }) {
  const [fulfillmentMode, setFulfillmentModeState] = useState<FulfillmentMode>(() => {
    const stored = localStorage.getItem("fulfillmentMode");
    return (stored === "pickup" || stored === "delivery") ? stored : "delivery";
  });

  const setFulfillmentMode = (mode: FulfillmentMode) => {
    localStorage.setItem("fulfillmentMode", mode);
    setFulfillmentModeState(mode);
  };

  return (
    <FulfillmentContext.Provider value={{ fulfillmentMode, setFulfillmentMode }}>
      {children}
    </FulfillmentContext.Provider>
  );
}

export function useFulfillment() {
  const context = useContext(FulfillmentContext);
  if (!context) {
    throw new Error("useFulfillment must be used within a FulfillmentProvider");
  }
  return context;
}
