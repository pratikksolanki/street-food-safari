import { Router } from "express";
import { store, getVendor, serializeVendor } from "../store.js";
import { readPagination, paginate } from "../schemas.js";

const router = Router();

// `city` and `cuisine` accept either a single string (?city=Tokyo) or
// repeated params (?city=Tokyo&city=Berlin). Multiple values within a
// dimension are OR'd; the two dimensions are AND'd.
//
// The response envelope also carries `byCity` / `byCuisine` facets with
// drill-down semantics: each facet is computed with *its own* filter dropped
// but all other constraints applied. That's exactly what a filter UI needs to
// show "which values are still viable given my other selections" without a
// second request per toggle.
router.get("/vendors", (req, res) => {
  const cities = asLowerList(req.query.city);
  const cuisines = asLowerList(req.query.cuisine);

  const filtered = store.vendors.filter(
    (v) => matchesCity(v, cities) && matchesCuisine(v, cuisines),
  );
  const page = paginate(filtered, readPagination(req.query));
  res.json({
    ...page,
    data: page.data.map(serializeVendor),
    ...buildFacets({ cities, cuisines }),
  });
});

function asLowerList(value) {
  if (value === undefined || value === null || value === "") return [];
  const list = Array.isArray(value) ? value : [value];
  return list
    .map((v) => (v === undefined || v === null ? "" : String(v).trim().toLowerCase()))
    .filter(Boolean);
}

function matchesCity(vendor, cities) {
  return cities.length === 0 || cities.includes(vendor.city.toLowerCase());
}

function matchesCuisine(vendor, cuisines) {
  return cuisines.length === 0 || cuisines.includes(vendor.cuisine.toLowerCase());
}

function matchesText(vendor, q) {
  if (!q) return true;
  return (
    vendor.name.toLowerCase().includes(q) ||
    vendor.cuisine.toLowerCase().includes(q) ||
    vendor.city.toLowerCase().includes(q)
  );
}

// Drill-down facets: byCity counts with the city filter DROPPED (so the UI
// can tell the user which cities would be viable if they toggled one in), and
// byCuisine counts with cuisine DROPPED. `q` and the *other* dimension still
// constrain each count. Callers that don't pass `q` just get the pure
// filter-dimension drill-down.
function buildFacets({ q = "", cities = [], cuisines = [] } = {}) {
  const forCityFacet = store.vendors.filter(
    (v) => matchesText(v, q) && matchesCuisine(v, cuisines),
  );
  const forCuisineFacet = store.vendors.filter(
    (v) => matchesText(v, q) && matchesCity(v, cities),
  );
  const byCity = Object.fromEntries(
    store.cities.map((c) => [c, forCityFacet.filter((v) => v.city === c).length]),
  );
  const byCuisine = Object.fromEntries(
    store.cuisines.map((c) => [c, forCuisineFacet.filter((v) => v.cuisine === c).length]),
  );
  return { byCity, byCuisine };
}

router.get("/vendors/:id", (req, res) => {
  const vendor = getVendor(req.params.id);
  if (!vendor) return res.status(404).json({ error: "VENDOR_NOT_FOUND" });
  res.json(serializeVendor(vendor));
});

router.get("/vendors/:id/menu", (req, res) => {
  const vendor = getVendor(req.params.id);
  if (!vendor) return res.status(404).json({ error: "VENDOR_NOT_FOUND" });
  res.json({ vendorId: vendor.id, items: vendor.menu });
});

// Same dimension filters as /vendors (OR-within, AND-across), additionally
// gated by the free-text `q` match against name/cuisine/city. An empty `q`
// still returns empty — search is query-led; filter-only browsing belongs on
// /vendors. Response also includes `byCity`/`byCuisine` facets so the filter
// UI can show query-aware drill-down counts in a single round trip.
router.get("/search", (req, res) => {
  const q = String(req.query.q ?? "").trim().toLowerCase();
  const pagination = readPagination(req.query);
  if (!q) {
    return res.json({
      page: pagination.page,
      limit: pagination.limit,
      total: 0,
      totalPages: 1,
      data: [],
      byCity: {},
      byCuisine: {},
    });
  }
  const cities = asLowerList(req.query.city);
  const cuisines = asLowerList(req.query.cuisine);
  const matched = store.vendors.filter(
    (v) => matchesText(v, q) && matchesCity(v, cities) && matchesCuisine(v, cuisines),
  );
  const page = paginate(matched, pagination);
  res.json({
    ...page,
    data: page.data.map(serializeVendor),
    ...buildFacets({ q, cities, cuisines }),
  });
});

export default router;
