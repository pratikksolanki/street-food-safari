import { useQuery } from "@tanstack/react-query";

import { listFavorites } from "@/api/endpoints";

// Assumes favorites fit in a single page for the foreseeable future — switch
// to useInfiniteQuery if the real-world cap ever exceeds this.
const FAVORITES_LIMIT = 100;

export const favoritesQueryKey = ["me", "favorites"] as const;

export function useFavorites() {
  return useQuery({
    queryKey: favoritesQueryKey,
    queryFn: ({ signal }) => listFavorites({ limit: FAVORITES_LIMIT }, { signal }),
    staleTime: 0,
  });
}

// Derived selector — consumers only re-render when the set contents change.
// Used by detail screens / future cards that need a fast membership check.
export function useFavoriteIds() {
  return useQuery({
    queryKey: favoritesQueryKey,
    queryFn: ({ signal }) => listFavorites({ limit: FAVORITES_LIMIT }, { signal }),
    staleTime: 0,
    select: (data) => new Set(data.data.map((v) => v.id)),
  });
}
