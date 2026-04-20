import { z } from "zod";

import { apiClient } from "./client";
import {
  addFavoriteResponseSchema,
  facetedVendorsSchema,
  menuResponseSchema,
  paginatedMyReviewsSchema,
  paginatedReviewsSchema,
  paginatedVendorsSchema,
  reviewInputSchema,
  submitReviewResponseSchema,
  vendorSchema,
  type ReviewInput,
} from "./schemas";

type Opts = { signal?: AbortSignal };

// Vendors --------------------------------------------------------------------

export type ListVendorsParams = {
  page?: number;
  limit?: number;
  /** Single value or array — server OR-matches within this dimension. */
  city?: string | string[];
  /** Single value or array — server OR-matches within this dimension. */
  cuisine?: string | string[];
};

export function listVendors(params: ListVendorsParams = {}, opts: Opts = {}) {
  return apiClient.get("/vendors", facetedVendorsSchema, {
    query: params,
    signal: opts.signal,
  });
}

export function getVendor(id: string, opts: Opts = {}) {
  return apiClient.get(`/vendors/${encodeURIComponent(id)}`, vendorSchema, {
    signal: opts.signal,
  });
}

export function getMenu(id: string, opts: Opts = {}) {
  return apiClient.get(`/vendors/${encodeURIComponent(id)}/menu`, menuResponseSchema, {
    signal: opts.signal,
  });
}

// Reviews --------------------------------------------------------------------

export type ListReviewsParams = { page?: number; limit?: number };

export function listReviews(vendorId: string, params: ListReviewsParams = {}, opts: Opts = {}) {
  return apiClient.get(
    `/vendors/${encodeURIComponent(vendorId)}/reviews`,
    paginatedReviewsSchema,
    { query: params, signal: opts.signal },
  );
}

export function submitReview(vendorId: string, input: ReviewInput, opts: Opts = {}) {
  // Parse client-side first so the form can surface field errors without a
  // round trip; the server revalidates with the same schema.
  const body = reviewInputSchema.parse(input);
  return apiClient.post(
    `/vendors/${encodeURIComponent(vendorId)}/reviews`,
    submitReviewResponseSchema,
    body,
    { signal: opts.signal },
  );
}

// Deletes the caller's review for this vendor (server identifies it by the
// injected X-Client-Id). Idempotent on the server.
export function deleteMyReview(vendorId: string, opts: Opts = {}) {
  return apiClient.delete(`/vendors/${encodeURIComponent(vendorId)}/reviews`, z.void(), {
    signal: opts.signal,
  });
}

// Search ---------------------------------------------------------------------

export type SearchParams = {
  page?: number;
  limit?: number;
  /** Single value or array — server OR-matches within this dimension. */
  city?: string | string[];
  /** Single value or array — server OR-matches within this dimension. */
  cuisine?: string | string[];
};

export function search(q: string, params: SearchParams = {}, opts: Opts = {}) {
  return apiClient.get("/search", facetedVendorsSchema, {
    query: { q, ...params },
    signal: opts.signal,
  });
}

// Favorites (X-Client-Id is injected by apiClient) ---------------------------

export type ListFavoritesParams = { page?: number; limit?: number };

export function listFavorites(params: ListFavoritesParams = {}, opts: Opts = {}) {
  return apiClient.get("/me/favorites", paginatedVendorsSchema, {
    query: params,
    signal: opts.signal,
  });
}

export function addFavorite(vendorId: string, opts: Opts = {}) {
  return apiClient.post(
    "/me/favorites",
    addFavoriteResponseSchema,
    { vendorId },
    { signal: opts.signal },
  );
}

export function removeFavorite(vendorId: string, opts: Opts = {}) {
  return apiClient.delete(`/me/favorites/${encodeURIComponent(vendorId)}`, z.void(), {
    signal: opts.signal,
  });
}

// My reviews (aggregate across all vendors, X-Client-Id injected) ------------

export type ListMyReviewsParams = { page?: number; limit?: number };

export function listMyReviews(params: ListMyReviewsParams = {}, opts: Opts = {}) {
  return apiClient.get("/me/reviews", paginatedMyReviewsSchema, {
    query: params,
    signal: opts.signal,
  });
}
