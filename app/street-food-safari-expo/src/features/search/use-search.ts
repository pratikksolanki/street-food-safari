import { keepPreviousData, useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { useDeferredValue } from "react";

import { search, type SearchParams } from "@/api/endpoints";

const MIN_QUERY_LENGTH = 2;
const PAGE_SIZE = 20;

export type SearchFilters = Pick<SearchParams, "city" | "cuisine">;

export const searchQueryKey = (query: string, filters: SearchFilters) =>
  ["search", query, filters] as const;

export const searchFacetsQueryKey = (query: string, filters: SearchFilters) =>
  ["search-facets", query, filters] as const;

// useDeferredValue defers re-renders during concurrent updates — acts as a
// frame-accurate debounce for typeahead without a timer. The input stays
// responsive; the query key (and therefore the fetch) lags one frame behind.
export function useSearch(query: string, filters: SearchFilters = {}) {
  const deferred = useDeferredValue(query.trim());
  const enabled = deferred.length >= MIN_QUERY_LENGTH;

  const result = useInfiniteQuery({
    queryKey: searchQueryKey(deferred, filters),
    queryFn: ({ pageParam, signal }) =>
      search(
        deferred,
        { ...filters, page: pageParam, limit: PAGE_SIZE },
        { signal },
      ),
    initialPageParam: 1 as number,
    getNextPageParam: (last) =>
      last.page < last.totalPages ? last.page + 1 : undefined,
    enabled,
    staleTime: 0,
  });

  return {
    ...result,
    query,
    deferredQuery: deferred,
    isTypingAhead: query !== deferred,
  };
}

// Lean sibling of useSearch for the filter sheet: fetches just page-1 of
// /search (limit=1) purely to read the `byCity`/`byCuisine` facets. Keyed on
// draft filters so each toggle inside the sheet hits its own cache entry,
// without disturbing the parent's committed infinite query.
export function useSearchFacets(query: string, filters: SearchFilters = {}) {
  const q = query.trim();
  return useQuery({
    queryKey: searchFacetsQueryKey(q, filters),
    queryFn: ({ signal }) =>
      search(q, { ...filters, page: 1, limit: 1 }, { signal }),
    enabled: q.length >= MIN_QUERY_LENGTH,
    staleTime: 30 * 60_000,
    // Hold the previous facet set while the new one fetches so chips stay
    // mounted across draft toggles — otherwise the sheet content flashes
    // empty → loaded every time the user taps a chip.
    placeholderData: keepPreviousData,
  });
}
