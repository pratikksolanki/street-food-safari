import { Router } from "express";
import {
  store,
  getVendor,
  serializeVendor,
  getFavoritesFor,
  getMyReviewsWithVendor,
} from "../store.js";
import { favoriteBodySchema, readPagination, paginate } from "../schemas.js";

const router = Router();

// Every route on this sub-router requires X-Client-Id. Missing header → 400
// (not 401 — we're not offering auth semantics; the header is a self-asserted
// client identifier, see ARCHITECTURE.md §7).
router.use((req, res, next) => {
  const clientId = req.get("X-Client-Id");
  if (!clientId) return res.status(400).json({ error: "MISSING_CLIENT_ID" });
  req.clientId = clientId;
  next();
});

router.get("/favorites", (req, res) => {
  const set = getFavoritesFor(req.clientId);
  const items = store.vendors.filter((v) => set.has(v.id)).map(serializeVendor);
  res.json(paginate(items, readPagination(req.query)));
});

router.post("/favorites", (req, res) => {
  const parsed = favoriteBodySchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "VALIDATION_ERROR" });
  }
  const vendor = getVendor(parsed.data.vendorId);
  if (!vendor) return res.status(404).json({ error: "VENDOR_NOT_FOUND" });

  const set = getFavoritesFor(req.clientId);
  set.add(vendor.id);
  res.status(200).json({ favorited: true, vendor: serializeVendor(vendor) });
});

router.delete("/favorites/:vendorId", (req, res) => {
  const set = getFavoritesFor(req.clientId);
  set.delete(req.params.vendorId);
  res.status(204).end();
});

// Every review this client has written, across all vendors. Each row ships
// with a minimal vendor snapshot so the "My Reviews" screen can render name
// + city + cuisine + price without an N+1 vendor fetch.
router.get("/reviews", (req, res) => {
  const all = getMyReviewsWithVendor(req.clientId);
  res.json(paginate(all, readPagination(req.query)));
});

export default router;
