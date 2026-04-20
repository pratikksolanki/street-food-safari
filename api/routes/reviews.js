import { Router } from "express";

import { reviewInputSchema, zodFieldErrors, readPagination, paginate } from "../schemas.js";
import { deleteMyReview, getVendor, getReviews, upsertReview } from "../store.js";

const router = Router({ mergeParams: true });

router.get("/", (req, res) => {
  const vendor = getVendor(req.params.id);
  if (!vendor) return res.status(404).json({ error: "VENDOR_NOT_FOUND" });

  const sorted = [...getReviews(vendor.id)].sort((a, b) =>
    b.createdAt.localeCompare(a.createdAt)
  );
  const page = paginate(sorted, readPagination(req.query));
  res.json(page);
});

router.post("/", (req, res) => {
  const vendor = getVendor(req.params.id);
  if (!vendor) return res.status(404).json({ error: "VENDOR_NOT_FOUND" });

  // Reviews are public but edit-in-place requires the client to identify
  // itself — same header convention as /me/favorites.
  const clientId = req.headers["x-client-id"];
  if (typeof clientId !== "string" || clientId.length === 0) {
    return res.status(400).json({ error: "MISSING_CLIENT_ID" });
  }

  const parsed = reviewInputSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      error: "VALIDATION_ERROR",
      fieldErrors: zodFieldErrors(parsed.error),
    });
  }

  // Upsert: if this client already has a review for this vendor, replace it
  // in place; otherwise append. One review per (vendor, client).
  const review = upsertReview(vendor.id, clientId, parsed.data);
  res.status(201).json({ review });
});

// Deletes the caller's review for this vendor. Idempotent — 204 either way.
// We don't 404 on "you never reviewed" because the client might be retrying
// a flaky request.
router.delete("/", (req, res) => {
  const vendor = getVendor(req.params.id);
  if (!vendor) return res.status(404).json({ error: "VENDOR_NOT_FOUND" });

  const clientId = req.headers["x-client-id"];
  if (typeof clientId !== "string" || clientId.length === 0) {
    return res.status(400).json({ error: "MISSING_CLIENT_ID" });
  }

  deleteMyReview(vendor.id, clientId);
  res.status(204).send();
});

export default router;
