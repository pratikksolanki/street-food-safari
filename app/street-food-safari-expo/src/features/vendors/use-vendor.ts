import { useQuery } from "@tanstack/react-query";

import { getVendor } from "@/api/endpoints";

export const vendorDetailQueryKey = (id: string) => ["vendors", "detail", id] as const;

export function useVendor(id: string) {
  return useQuery({
    queryKey: vendorDetailQueryKey(id),
    queryFn: ({ signal }) => getVendor(id, { signal }),
    enabled: !!id,
    staleTime: 30_000,
  });
}
