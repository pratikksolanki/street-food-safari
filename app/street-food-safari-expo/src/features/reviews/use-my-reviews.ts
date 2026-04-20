import { useInfiniteQuery } from "@tanstack/react-query";

import { listMyReviews } from "@/api/endpoints";

const PAGE_SIZE = 20;

export const myReviewsQueryKey = ["me", "reviews"] as const;

// Every review this client has ever written, across all vendors. The server
// does the join, so each row ships with vendor context — no N+1 lookups
// from the "My Reviews" screen.
export function useMyReviews() {
  return useInfiniteQuery({
    queryKey: myReviewsQueryKey,
    queryFn: ({ pageParam, signal }) =>
      listMyReviews({ page: pageParam, limit: PAGE_SIZE }, { signal }),
    initialPageParam: 1 as number,
    getNextPageParam: (last) => (last.page < last.totalPages ? last.page + 1 : undefined),
    staleTime: 0,
  });
}
