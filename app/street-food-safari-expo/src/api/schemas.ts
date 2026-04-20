import { z } from "zod";

// Domain primitives ----------------------------------------------------------

export const menuItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  price: z.number(),
  spicy: z.boolean(),
  vegan: z.boolean(),
});
export type MenuItem = z.infer<typeof menuItemSchema>;

export const vendorSchema = z.object({
  id: z.string(),
  name: z.string(),
  cuisine: z.string(),
  city: z.string(),
  priceLevel: z.string(),
  thumbnail: z.string().url(),
  description: z.string(),
  location: z.object({ lat: z.number(), lng: z.number() }),
  menu: z.array(menuItemSchema),
  isFeatured: z.boolean(),
  // Null when a vendor has zero reviews. Server recomputes on write.
  rating: z.number().nullable(),
  reviewCount: z.number().int().nonnegative(),
});
export type Vendor = z.infer<typeof vendorSchema>;

export const reviewSchema = z.object({
  id: z.string(),
  vendorId: z.string(),
  // Opaque — matches the author's `X-Client-Id`. The client uses it only to
  // tell its own review from others.
  clientId: z.string(),
  rating: z.number().int().min(1).max(5),
  comment: z.string(),
  createdAt: z.string(),
});
export type Review = z.infer<typeof reviewSchema>;

// Shared by the review form and the server route — same schema, two places of
// enforcement. The form can parse against this directly for instant feedback.
export const reviewInputSchema = z.object({
  rating: z.number().int().min(1).max(5),
  comment: z.string().trim().min(1).max(500),
});
export type ReviewInput = z.infer<typeof reviewInputSchema>;

export const favoriteInputSchema = z.object({
  vendorId: z.string().min(1),
});
export type FavoriteInput = z.infer<typeof favoriteInputSchema>;

// Response envelopes ---------------------------------------------------------

export function paginatedSchema<T extends z.ZodTypeAny>(item: T) {
  return z.object({
    page: z.number().int().positive(),
    limit: z.number().int().positive(),
    total: z.number().int().nonnegative(),
    totalPages: z.number().int().positive(),
    data: z.array(item),
  });
}

export type Paginated<T> = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  data: T[];
};

export const paginatedVendorsSchema = paginatedSchema(vendorSchema);
export const paginatedReviewsSchema = paginatedSchema(reviewSchema);

// /vendors and /search ride on the same envelope but also carry drill-down
// facets (each dimension's count is computed with its own filter dropped).
// Other paginated-vendor endpoints (e.g. /me/favorites) don't return these,
// so it's its own schema rather than a required field on the base.
export const facetMapSchema = z.record(z.string(), z.number());
export const facetedVendorsSchema = paginatedVendorsSchema.extend({
  byCity: facetMapSchema,
  byCuisine: facetMapSchema,
});
export type FacetMap = z.infer<typeof facetMapSchema>;

// A review with enough vendor context to render a "My Reviews" card without
// an N+1 fetch. Matches the shape of GET /me/reviews.
export const myReviewSchema = reviewSchema.extend({
  vendor: z.object({
    id: z.string(),
    name: z.string(),
    city: z.string(),
    cuisine: z.string(),
    priceLevel: z.string(),
    thumbnail: z.string().url(),
  }),
});
export type MyReview = z.infer<typeof myReviewSchema>;

export const paginatedMyReviewsSchema = paginatedSchema(myReviewSchema);

export const menuResponseSchema = z.object({
  vendorId: z.string(),
  items: z.array(menuItemSchema),
});

export const submitReviewResponseSchema = z.object({ review: reviewSchema });

export const addFavoriteResponseSchema = z.object({
  favorited: z.literal(true),
  vendor: vendorSchema,
});
