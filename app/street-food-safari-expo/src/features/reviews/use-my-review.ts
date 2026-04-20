import { useInfiniteQuery } from "@tanstack/react-query";

import { listReviews } from "@/api/endpoints";
import type { Review } from "@/api/schemas";
import { getClientIdSync } from "@/lib/client-id";

import { reviewsQueryKey } from "./use-reviews";

// Derived selector — no extra network call. Shares `reviewsQueryKey` with
// `useReviews` so both subscribe to the same cache entry. Walks every loaded
// page (user's review might be on page N > 1 on cold-start if they posted
// long ago and many others posted after; in practice it's on page 1).
export function useMyReview(vendorId: string): Review | null {
  const query = useInfiniteQuery({
    queryKey: reviewsQueryKey(vendorId),
    // queryFn + pageParam are the same as useReviews; RQ dedupes by key.
    queryFn: ({ pageParam, signal }) =>
      listReviews(vendorId, { page: pageParam, limit: 20 }, { signal }),
    initialPageParam: 1 as number,
    getNextPageParam: (last) => (last.page < last.totalPages ? last.page + 1 : undefined),
    enabled: !!vendorId,
    staleTime: 30_000,
    select: (data): Review | null => {
      const clientId = getClientIdSync();
      for (const page of data.pages) {
        const found = page.data.find((r) => r.clientId === clientId);
        if (found) return found;
      }
      return null;
    },
  });
  return query.data ?? null;
}
