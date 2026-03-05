import { createContext, useContext, useState, type ReactNode } from "react";

type FulfillmentMode = "delivery" | "pickup";

interface FulfillmentContextType {
  fulfillmentMode: FulfillmentMode;
  setFulfillmentMode: (mode: FulfillmentMode) => void;
}

const FulfillmentContext = createContext<FulfillmentContextType | undefined>(undefined);

export function FulfillmentProvider({ children }: { children: ReactNode }) {
  const [fulfillmentMode, setFulfillmentMode] = useState<FulfillmentMode>("delivery");

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
