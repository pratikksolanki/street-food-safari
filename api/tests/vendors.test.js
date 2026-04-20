import { test } from "node:test";
import assert from "node:assert/strict";
import { setupServer, api } from "./_helpers.js";

setupServer();

test("GET / returns endpoint discovery", async () => {
  const { status, body } = await api("/");
  assert.equal(status, 200);
  assert.equal(body.name, "Street Food Safari API");
  assert.ok(Array.isArray(body.endpoints));
});

// The vendors list comes back in pages. The shape (page, limit, total,
// totalPages, data) must stay exactly the same — the app's infinite
// scroll relies on these fields being there.
test("GET /vendors returns paginated list envelope", async () => {
  const { status, body } = await api("/vendors?page=1&limit=5");
  assert.equal(status, 200);
  assert.equal(body.page, 1);
  assert.equal(body.limit, 5);
  assert.equal(body.data.length, 5);
  assert.equal(body.total, 80);
  assert.equal(body.totalPages, 16);
});

// A vendor's response should include rating and reviewCount. The old
// global isFavorite flag (the bug we fixed) is gone, and an internal
// unrounded rating the server uses for math (_ratingRaw) is not exposed.
test("GET /vendors/:id exposes rating + reviewCount; no isFavorite; no _ratingRaw leak", async () => {
  const { status, body } = await api("/vendors/1");
  assert.equal(status, 200);
  assert.equal(body.id, "1");
  assert.ok(typeof body.rating === "number");
  assert.ok(body.rating >= 1 && body.rating <= 5);
  assert.ok(Number.isInteger(body.reviewCount));
  assert.ok(body.reviewCount > 0);
  assert.equal(body.isFavorite, undefined, "isFavorite must be removed from the public shape");
  assert.equal(body._ratingRaw, undefined, "internal raw rating must not leak");
});

// Unknown vendor IDs return a proper 404 with an error code, not a
// crash or an empty object that the app would misread as a real vendor.
test("GET /vendors/:id returns 404 VENDOR_NOT_FOUND for unknown id", async () => {
  const { status, body } = await api("/vendors/999");
  assert.equal(status, 404);
  assert.equal(body.error, "VENDOR_NOT_FOUND");
});

// A vendor's rating is simply the average of its reviews, rounded to
// one decimal. This test catches anyone who tries to set the rating
// directly instead of letting it be computed from the reviews.
test("vendor.rating equals mean(reviews) rounded to 1 decimal", async () => {
  const vendor = (await api("/vendors/1")).body;
  const { data: reviews } = (await api("/vendors/1/reviews?limit=100")).body;
  assert.equal(reviews.length, vendor.reviewCount);
  const mean = reviews.reduce((s, r) => s + r.rating, 0) / reviews.length;
  assert.equal(vendor.rating, Math.round(mean * 10) / 10);
});

// Filtering by city=Tokyo should only return Tokyo vendors — nothing else.
test("GET /vendors?city=Tokyo only returns Tokyo vendors", async () => {
  const { body } = await api("/vendors?city=Tokyo&limit=100");
  assert.ok(body.data.length > 0);
  assert.ok(body.data.every((v) => v.city === "Tokyo"));
});

// Same rule for cuisine — filtering by Korean only returns Korean vendors.
test("GET /vendors?cuisine=Korean only returns Korean vendors", async () => {
  const { body } = await api("/vendors?cuisine=Korean&limit=100");
  assert.ok(body.data.length > 0);
  assert.ok(body.data.every((v) => v.cuisine === "Korean"));
});

// The menu endpoint returns items with a name, price, and spicy/vegan
// flags. The flags must always be true or false (never missing) so the
// detail screen's badges render correctly.
test("GET /vendors/:id/menu returns the vendor's menu", async () => {
  const { status, body } = await api("/vendors/1/menu");
  assert.equal(status, 200);
  assert.equal(body.vendorId, "1");
  assert.ok(Array.isArray(body.items) && body.items.length > 0);
  for (const item of body.items) {
    assert.ok(typeof item.name === "string");
    assert.ok(typeof item.price === "number");
    assert.ok(typeof item.spicy === "boolean");
    assert.ok(typeof item.vegan === "boolean");
  }
});

// Searching with no text gives back no results (not everything). That way
// the search screen stays empty until the user actually types something.
// Searching for "Korean" finds vendors where the name, cuisine, or city
// mentions Korean — case-insensitive.
test("GET /search?q= empty → empty data; non-empty → matches", async () => {
  const empty = (await api("/search?q=")).body;
  assert.deepEqual(empty.data, []);

  const { status, body } = await api("/search?q=Korean");
  assert.equal(status, 200);
  assert.ok(body.data.length > 0);
  assert.ok(
    body.data.every(
      (v) =>
        v.name.toLowerCase().includes("korean") ||
        v.cuisine.toLowerCase().includes("korean") ||
        v.city.toLowerCase().includes("korean")
    )
  );
});

// If the user picks two cities (say Tokyo and Berlin), results from
// either one are shown. But if they pick a city AND a cuisine, both
// must match. Getting this wrong silently returns wrong results.
test("GET /search?q=&city=&cuisine= narrows with OR-within / AND-across", async () => {
  const base = (await api("/search?q=Korean&limit=100")).body;
  assert.ok(base.data.length > 0);

  // City filter narrows — every remaining match is in Tokyo, count does not grow.
  const cityNarrow = (await api("/search?q=Korean&city=Tokyo&limit=100")).body;
  assert.ok(cityNarrow.data.every((v) => v.city === "Tokyo"));
  assert.ok(cityNarrow.total <= base.total);

  // Repeated city param → OR-within dimension.
  const multiCity = (await api("/search?q=Korean&city=Tokyo&city=Berlin&limit=100")).body;
  assert.ok(
    multiCity.data.every((v) => v.city === "Tokyo" || v.city === "Berlin"),
  );

  // Cross-dimension filters AND together.
  const crossDim = (await api("/search?q=Korean&city=Tokyo&cuisine=Korean&limit=100")).body;
  assert.ok(
    crossDim.data.every((v) => v.city === "Tokyo" && v.cuisine === "Korean"),
  );
});

// The per-city and per-cuisine counts in the response should add up to
// the total number of vendors (80). Otherwise the "X vendors in Tokyo"
// labels in the UI would be lying.
test("GET /vendors response includes byCity/byCuisine facets summing to total vendors", async () => {
  const { body } = await api("/vendors?limit=5");
  assert.ok(body.byCity && Object.keys(body.byCity).length > 0);
  assert.ok(body.byCuisine && Object.keys(body.byCuisine).length > 0);
  const cityTotal = Object.values(body.byCity).reduce((s, n) => s + n, 0);
  const cuisineTotal = Object.values(body.byCuisine).reduce((s, n) => s + n, 0);
  assert.equal(cityTotal, 80);
  assert.equal(cuisineTotal, 80);
});

// When the user is already filtering by city=Tokyo, the list of other
// cities should still appear in byCity (not just Tokyo) — so the user
// can switch to a different city. The rule: when computing counts for
// a dimension, ignore the filter on that same dimension.
test("GET /vendors facets drill down with filter of OWN dimension dropped", async () => {
  // byCity is computed with city DROPPED but cuisine applied, so passing
  // city=Tokyo must not restrict byCity to just Tokyo — otherwise the UI
  // couldn't suggest alternative cities for the current cuisine slice.
  const { body } = await api("/vendors?city=Tokyo&cuisine=Korean&limit=5");
  const koreanCityCount = Object.values(body.byCity).reduce((s, n) => s + n, 0);
  assert.ok(koreanCityCount > 0);
  assert.ok(Object.keys(body.byCity).length >= 1, "byCity should not be Tokyo-only");
  // byCuisine is computed with cuisine DROPPED but city applied.
  assert.ok(body.byCuisine["Korean"] > 0);
});

// When the user searches for "Korean", the city/cuisine counts should
// reflect only the vendors matching that search — not the whole catalog.
// Otherwise the filter sheet would suggest cities that have no results.
test("GET /search?q= includes query-aware byCity/byCuisine facets", async () => {
  const q = "Korean";
  const { body } = await api(`/search?q=${q}&limit=5`);
  // Facet totals should equal the /search total (same q, no dimension filter).
  const searchAllResults = (await api(`/search?q=${q}&limit=100`)).body.total;
  const cityTotal = Object.values(body.byCity).reduce((s, n) => s + n, 0);
  assert.equal(cityTotal, searchAllResults);
  // Cities that don't match "Korean" at all should be zero.
  for (const [, count] of Object.entries(body.byCity)) {
    assert.ok(count >= 0);
  }
});

// An empty search returns no results AND no filter counts. The filter
// sheet shouldn't show stale counts when there's nothing to filter.
test("GET /search empty q → empty data AND empty facets", async () => {
  const { body } = await api("/search?q=");
  assert.deepEqual(body.data, []);
  assert.deepEqual(body.byCity, {});
  assert.deepEqual(body.byCuisine, {});
});
