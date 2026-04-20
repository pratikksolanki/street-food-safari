import { test } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { setupServer, api, withClient, jsonPost } from "./_helpers.js";

setupServer();

// Without a client ID in the header, the server doesn't know whose
// favorites to change, so it refuses the request.
test("POST /me/favorites without X-Client-Id → 400 MISSING_CLIENT_ID", async () => {
  const { status, body } = await api("/me/favorites", jsonPost({ vendorId: "1" }));
  assert.equal(status, 400);
  assert.equal(body.error, "MISSING_CLIENT_ID");
});

// Same rule for reading favourites, must know which client's list to return.
test("GET /me/favorites without X-Client-Id → 400 MISSING_CLIENT_ID", async () => {
  const { status, body } = await api("/me/favorites");
  assert.equal(status, 400);
  assert.equal(body.error, "MISSING_CLIENT_ID");
});

// Same rule for unfavoriting, no ID means the server doesn't know whose
// favorite to remove.
test("DELETE /me/favorites/:id without X-Client-Id → 400 MISSING_CLIENT_ID", async () => {
  const { status, body } = await api("/me/favorites/1", { method: "DELETE" });
  assert.equal(status, 400);
  assert.equal(body.error, "MISSING_CLIENT_ID");
});

// Adding a favorite returns the full vendor so the app can show it
// immediately without a second request. Also checks that the old global
// isFavorite flag (the original bug) is not leaking back in the response.
test("POST add favorite → 200 { favorited: true, vendor }", async () => {
  const clientId = randomUUID();
  const { status, body } = await api(
    "/me/favorites",
    withClient(clientId, jsonPost({ vendorId: "1" }))
  );
  assert.equal(status, 200);
  assert.equal(body.favorited, true);
  assert.equal(body.vendor.id, "1");
  assert.ok(typeof body.vendor.rating === "number");
  assert.equal(body.vendor.isFavorite, undefined, "server must not leak isFavorite");
});

// If the user taps favorite twice, or the network retries a request, the
// vendor should only show up in the list once — not duplicated.
test("POST add is idempotent — second call still 200, list remains size 1", async () => {
  const clientId = randomUUID();
  for (const attempt of [1, 2]) {
    const { status } = await api(
      "/me/favorites",
      withClient(clientId, jsonPost({ vendorId: "5" }))
    );
    assert.equal(status, 200, `attempt ${attempt} should return 200`);
  }
  const { body } = await api("/me/favorites", withClient(clientId));
  assert.equal(body.total, 1);
  assert.deepEqual(body.data.map((v) => v.id), ["5"]);
});

// Every client has its own private favorites list. Example: Alice's favorites
// should never show up for Bob.
test("favorites are isolated per client", async () => {
  const alice = randomUUID();
  const bob = randomUUID();

  await api("/me/favorites", withClient(alice, jsonPost({ vendorId: "10" })));
  await api("/me/favorites", withClient(alice, jsonPost({ vendorId: "11" })));

  const aliceList = (await api("/me/favorites", withClient(alice))).body;
  assert.equal(aliceList.total, 2);
  assert.deepEqual(
    aliceList.data.map((v) => v.id).sort(),
    ["10", "11"]
  );

  const bobList = (await api("/me/favorites", withClient(bob))).body;
  assert.equal(bobList.total, 0, "bob must not see alice's favorites");
});

// Unfavoriting the same vendor twice is fine. The second call doesn't
// error out just because the favorite is already gone.
test("DELETE favorite → 204; second DELETE of same vendor → still 204", async () => {
  const clientId = randomUUID();

  await api("/me/favorites", withClient(clientId, jsonPost({ vendorId: "20" })));

  for (const attempt of [1, 2]) {
    const { status } = await api(
      "/me/favorites/20",
      withClient(clientId, { method: "DELETE" })
    );
    assert.equal(status, 204, `DELETE attempt ${attempt}`);
  }

  const { body } = await api("/me/favorites", withClient(clientId));
  assert.equal(body.total, 0);
});

// Can't favorite a vendor that doesn't exist. Protects the favorites
// list from filling up with broken references.
test("POST unknown vendor → 404 VENDOR_NOT_FOUND", async () => {
  const clientId = randomUUID();
  const { status, body } = await api(
    "/me/favorites",
    withClient(clientId, jsonPost({ vendorId: "999" }))
  );
  assert.equal(status, 404);
  assert.equal(body.error, "VENDOR_NOT_FOUND");
});

// If the body is missing a vendorId, the server rejects the whole
// request. Nothing gets saved.
test("POST empty body → 400 VALIDATION_ERROR", async () => {
  const clientId = randomUUID();
  const { status, body } = await api(
    "/me/favorites",
    withClient(clientId, jsonPost({}))
  );
  assert.equal(status, 400);
  assert.equal(body.error, "VALIDATION_ERROR");
});

// Listing favorites returns the full vendor info, not just IDs. That way
// the Favorites tab can render vendor cards in one round trip instead of
// making a separate request for each one.
test("GET /me/favorites returns full vendor payloads (not just IDs)", async () => {
  const clientId = randomUUID();
  await api("/me/favorites", withClient(clientId, jsonPost({ vendorId: "30" })));

  const { body } = await api("/me/favorites", withClient(clientId));
  assert.equal(body.total, 1);
  const [v] = body.data;
  assert.equal(v.id, "30");
  assert.ok(v.name);
  assert.ok(v.cuisine);
  assert.ok(v.city);
  assert.ok(v.thumbnail);
  assert.ok(Array.isArray(v.menu));
});
