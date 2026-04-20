import { randomUUID } from "node:crypto";

import { seedStore, CITIES, CUISINES } from "./seed.js";

const { vendors, reviews } = seedStore();
const favorites = new Map();

export const store = { vendors, reviews, favorites, cities: CITIES, cuisines: CUISINES };

export function getVendor(id) {
  return vendors.find((v) => v.id === id);
}

export function getReviews(vendorId) {
  return reviews.get(vendorId) ?? [];
}

// Recompute mean + count from the review array. Store the raw mean on the
// vendor; round at read time in `serializeVendor` so precision isn't lost
// across many writes. Count is exact.
export function recomputeVendorStats(vendorId) {
  const vendor = getVendor(vendorId);
  if (!vendor) return;
  const list = getReviews(vendorId);
  vendor.reviewCount = list.length;
  vendor._ratingRaw = list.length
    ? list.reduce((sum, r) => sum + r.rating, 0) / list.length
    : null;
}

for (const vendor of vendors) recomputeVendorStats(vendor.id);

export function serializeVendor(vendor) {
  const { _ratingRaw, ...rest } = vendor;
  const rating = _ratingRaw == null ? null : Math.round(_ratingRaw * 10) / 10;
  return { ...rest, rating };
}

// One review per client per vendor. If the client already has a review for
// this vendor, replace it in place (preserving id is not worth it — the
// timestamps refresh too so the edited review floats to the top of the
// createdAt-desc sort). Otherwise append. Returns the stored review.
export function upsertReview(vendorId, clientId, input) {
  const list = reviews.get(vendorId) ?? [];
  const existingIdx = list.findIndex((r) => r.clientId === clientId);
  const review = {
    id: existingIdx >= 0 ? list[existingIdx].id : randomUUID(),
    vendorId,
    clientId,
    rating: input.rating,
    comment: input.comment,
    createdAt: new Date().toISOString(),
  };
  if (existingIdx >= 0) list[existingIdx] = review;
  else list.push(review);
  reviews.set(vendorId, list);
  recomputeVendorStats(vendorId);
  return review;
}

// Cross-vendor aggregate: every review this client has written, sorted by
// createdAt desc, each carrying a minimal vendor snapshot (name/city/cuisine/
// priceLevel/thumbnail) so the client can render a "My Reviews" list without
// extra round trips. 
export function getMyReviewsWithVendor(clientId) {
  const out = [];
  for (const [vendorId, list] of reviews) {
    const vendor = getVendor(vendorId);
    if (!vendor) continue;
    for (const r of list) {
      if (r.clientId !== clientId) continue;
      out.push({
        ...r,
        vendor: {
          id: vendor.id,
          name: vendor.name,
          city: vendor.city,
          cuisine: vendor.cuisine,
          priceLevel: vendor.priceLevel,
          thumbnail: vendor.thumbnail,
        },
      });
    }
  }
  out.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return out;
}

// Remove this client's review for the given vendor, if any. Idempotent —
// returns true if something was removed, false otherwise.
export function deleteMyReview(vendorId, clientId) {
  const list = reviews.get(vendorId);
  if (!list) return false;
  const next = list.filter((r) => r.clientId !== clientId);
  if (next.length === list.length) return false;
  reviews.set(vendorId, next);
  recomputeVendorStats(vendorId);
  return true;
}

export function getFavoritesFor(clientId) {
  let set = favorites.get(clientId);
  if (!set) {
    set = new Set();
    favorites.set(clientId, set);
  }
  return set;
}
