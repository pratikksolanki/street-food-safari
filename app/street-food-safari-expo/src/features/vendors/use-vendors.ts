import { keepPreviousData, useInfiniteQuery } from "@tanstack/react-query";

import { listVendors, type ListVendorsParams } from "@/api/endpoints";

export type VendorFilters = Omit<ListVendorsParams, "page" | "limit">;

const PAGE_SIZE = 20;

export const vendorsListQueryKey = (filters: VendorFilters) =>
  ["vendors", "list", filters] as const;

export function useVendors(filters: VendorFilters = {}) {
  return useInfiniteQuery({
    queryKey: vendorsListQueryKey(filters),
    queryFn: ({ pageParam, signal }) =>
      listVendors({ ...filters, page: pageParam, limit: PAGE_SIZE }, { signal }),
    initialPageParam: 1 as number,
    getNextPageParam: (last) => (last.page < last.totalPages ? last.page + 1 : undefined),
    staleTime: 60_000,
    // Hold the previous filter's results on screen while the new ones load,
    // instead of flashing to empty -> skeleton -> new data on every filter tap.
    placeholderData: keepPreviousData,
  });
}
