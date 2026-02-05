import { useQuery } from "@tanstack/react-query";
import type { Setting } from "@shared/schema";

export function useSetting(key: string) {
  return useQuery<Setting>({
    queryKey: ["/api/settings", key],
    queryFn: async () => {
      const response = await fetch(`/api/settings/${key}`);
      if (!response.ok) {
        if (response.status === 404) {
          return null;
        }
        throw new Error("Failed to fetch setting");
      }
      return response.json();
    },
  });
}

export function useAllSettings() {
  return useQuery<Setting[]>({
    queryKey: ["/api/settings"],
  });
}

export function useDeliveryRadiusMiles(): number {
  const { data } = useSetting("delivery_radius_miles");
  return data ? parseInt(data.value) : 15;
}
