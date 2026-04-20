import { useInfiniteQuery } from "@tanstack/react-query";

import { listReviews } from "@/api/endpoints";

const PAGE_SIZE = 20;

export const reviewsQueryKey = (vendorId: string) =>
  ["vendors", "detail", vendorId, "reviews"] as const;

export function useReviews(vendorId: string) {
  return useInfiniteQuery({
    queryKey: reviewsQueryKey(vendorId),
    queryFn: ({ pageParam, signal }) =>
      listReviews(vendorId, { page: pageParam, limit: PAGE_SIZE }, { signal }),
    initialPageParam: 1 as number,
    getNextPageParam: (last) => (last.page < last.totalPages ? last.page + 1 : undefined),
    enabled: !!vendorId,
    staleTime: 30_000,
  });
}
