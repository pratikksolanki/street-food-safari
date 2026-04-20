import { test } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { setupServer, api, jsonPost, withClient } from "./_helpers.js";

setupServer();

// Reviews return newest-first. If this breaks, the detail screen would
// show old reviews at the top and new ones buried at the bottom.
test("GET /vendors/:id/reviews returns paginated list, createdAt descending", async () => {
  const { status, body } = await api("/vendors/1/reviews");
  assert.equal(status, 200);
  assert.equal(body.page, 1);
  assert.ok(body.data.length > 0);
  for (let i = 1; i < body.data.length; i++) {
    assert.ok(
      body.data[i - 1].createdAt >= body.data[i].createdAt,
      "reviews must be ordered by createdAt desc"
    );
  }
  for (const r of body.data) {
    assert.equal(r.vendorId, "1");
    assert.ok(Number.isInteger(r.rating) && r.rating >= 1 && r.rating <= 5);
    assert.ok(typeof r.comment === "string" && r.comment.length > 0);
    assert.ok(r.id);
    assert.ok(r.createdAt);
  }
});

// Asking for reviews of a vendor that doesn't exist should return an error
// instead of an empty list.
test("GET /vendors/:id/reviews returns 404 for unknown vendor", async () => {
  const { status, body } = await api("/vendors/999/reviews");
  assert.equal(status, 404);
  assert.equal(body.error, "VENDOR_NOT_FOUND");
});

// When a new review is posted, the vendor's average rating and total review
// count must update immediately and match the actual reviews.
test("POST valid review → 201; vendor rating + reviewCount update consistently", async () => {
  const before = (await api("/vendors/2")).body;
  const beforeReviews = (await api("/vendors/2/reviews?limit=100")).body.data;

  const { status, body } = await api(
    "/vendors/2/reviews",
    withClient(randomUUID(), jsonPost({ rating: 1, comment: "first test review" }))
  );

  assert.equal(status, 201);
  assert.ok(body.review);
  assert.equal(body.review.vendorId, "2");
  assert.equal(body.review.rating, 1);
  assert.equal(body.review.comment, "first test review");
  assert.ok(body.review.id);
  assert.ok(body.review.createdAt);

  const after = (await api("/vendors/2")).body;
  assert.equal(after.reviewCount, before.reviewCount + 1);

  const expectedMean = (beforeReviews.reduce((s, r) => s + r.rating, 0) + 1) / (before.reviewCount + 1);
  assert.equal(after.rating, Math.round(expectedMean * 10) / 10);
});

// If the user accidentally types extra spaces around their comment, the
// server strips them before saving. Stored comments should look tidy.
test("POST comment is trimmed before storage", async () => {
  const { status, body } = await api(
    "/vendors/3/reviews",
    withClient(randomUUID(), jsonPost({ rating: 4, comment: "   hello world   " }))
  );
  assert.equal(status, 201);
  assert.equal(body.review.comment, "hello world");
});

// If both the rating and the comment are bad, the server tells the form
// exactly which fields are wrong so each one can show its own red message.
test("POST rating 10 + empty comment → 400 with per-field errors", async () => {
  const { status, body } = await api(
    "/vendors/4/reviews",
    withClient(randomUUID(), jsonPost({ rating: 10, comment: "" }))
  );
  assert.equal(status, 400);
  assert.equal(body.error, "VALIDATION_ERROR");
  assert.ok(body.fieldErrors.rating, "expected rating fieldError");
  assert.ok(body.fieldErrors.comment, "expected comment fieldError");
});

// If the user sends an empty body, the server points out both missing
// fields at once — not just the first one it noticed.
test("POST missing fields → 400 with per-field errors for both", async () => {
  const { status, body } = await api(
    "/vendors/5/reviews",
    withClient(randomUUID(), jsonPost({}))
  );
  assert.equal(status, 400);
  assert.equal(body.error, "VALIDATION_ERROR");
  assert.ok(body.fieldErrors.rating);
  assert.ok(body.fieldErrors.comment);
});

// Ratings are whole numbers from 1 to 5. Half-stars like 3.5 aren't allowed
// because the star UI only knows how to draw full stars.
test("POST non-integer rating → 400", async () => {
  const { status, body } = await api(
    "/vendors/6/reviews",
    withClient(randomUUID(), jsonPost({ rating: 3.5, comment: "fine" }))
  );
  assert.equal(status, 400);
  assert.ok(body.fieldErrors.rating);
});

// Zero isn't a valid rating. The minimum is 1 star.
test("POST rating 0 → 400", async () => {
  const { status, body } = await api(
    "/vendors/7/reviews",
    withClient(randomUUID(), jsonPost({ rating: 0, comment: "fine" }))
  );
  assert.equal(status, 400);
  assert.ok(body.fieldErrors.rating);
});

// A comment that's only spaces is really empty. The server trims first,
// then checks length, so "   " gets rejected as empty.
test("POST whitespace-only comment → 400 (trim before min-length check)", async () => {
  const { status, body } = await api(
    "/vendors/8/reviews",
    withClient(randomUUID(), jsonPost({ rating: 4, comment: "   " }))
  );
  assert.equal(status, 400);
  assert.ok(body.fieldErrors.comment);
});

// You can't leave a review on a vendor that doesn't exist. The server
// checks the vendor first, before looking at the review data.
test("POST to unknown vendor → 404 VENDOR_NOT_FOUND", async () => {
  const { status, body } = await api(
    "/vendors/999/reviews",
    withClient(randomUUID(), jsonPost({ rating: 5, comment: "doesn't matter" }))
  );
  assert.equal(status, 404);
  assert.equal(body.error, "VENDOR_NOT_FOUND");
});
