# Solution

## How to run

```bash
# API
cd api 
npm install 
npm run dev        # http://localhost:3333

# API Tests
cd api 
npm test

# App (first run builds the dev client)
cd app/street-food-safari-expo
npm install
npx expo start --dev-client --clear
npx expo run:ios       # or: npx expo run:android (use --device to target intended simulator/physical device)

```

Env: `app/street-food-safari-expo/.env.development` with `EXPO_PUBLIC_API_URL=http://localhost:3333` or replace `localhost` with your machine's LAN IP.


## Backend Tasks

### Task A: Per-client favourites

The original API mutated a global `isFavorite` boolean on the shared vendor record, so every client saw every other client's favourites. The fix:

- **Client identity via `X-Client-Id` header.** Each install generates a UUID on first launch and stores it in `expo-secure-store` (iOS Keychain / Android Keystore), so the ID survives app restarts and reinstalls but stays on-device. Every per-client route requires the header; missing or empty → `400 MISSING_CLIENT_ID`.
- **Per-user state lives under `/me/*`, public catalogue stays on public routes.** The namespace makes the trust boundary obvious at a glance and makes it impossible to accidentally leak per-client data through a public route. The split *is* the guardrail. Routes added:
  - `GET /me/favorites?page=&limit=`: paginated list of the caller's favourited vendors.
  - `POST /me/favorites` with body `{ vendorId }`: returns `{ favorited: true, vendor }`. Unknown vendor → `404 VENDOR_NOT_FOUND`; bad body → `400 VALIDATION_ERROR`.
  - `DELETE /me/favorites/:vendorId`: returns `204` whether or not the favourite existed.
- **Idempotency by design.** Favourites are stored as a `Map<clientId, Set<vendorId>>`, so a repeated `POST` of the same `{ vendorId }` converges to the same state instead of creating a duplicate or erroring. `DELETE` is idempotent in the same way. Retrying a dropped request never produces a wrong outcome.
- **`isFavorite` removed from the public vendor shape.** The per-client flag used to live on the vendor itself; favourite state is now derived on the client by intersecting the vendor list with `/me/favorites`, so the main list and detail screen can never show conflicting state.
- **Not real auth.** `X-Client-Id` is self-asserted for the purpose of this challenge. In a production situation this becomes a JWT-verifier middleware swap where every per-client handler reads the caller from the same header in one place, so the route bodies would not need to change.

### Task B: Reviews

- **Server-side validation via zod (`api/schemas.js`, `reviewInputSchema`).** `rating` must be an integer 1–5; `comment` is a trimmed string of length 1–500. Bad body → `400 VALIDATION_ERROR` with a `fieldErrors` map keyed by field name, which the client form renders inline. Unknown vendor IDs → `404 VENDOR_NOT_FOUND`. The two failure modes carry distinct codes so the client can branch cleanly.
- **Matching schema on both sides.** The Expo app defines a semantically identical `reviewInputSchema` at `src/api/schemas.ts` and parses the form input *before* the POST, so the form surfaces field errors without a round-trip while the server stays the source of truth.
- **One review per `(vendorId, clientId)` pair, upsert on POST.** `POST /vendors/:id/reviews` replaces the caller's existing review for that vendor rather than creating a duplicate (see `upsertReview` in `api/store.js`). Edit-in-place falls out of this design, so there's no separate `PUT` endpoint. The same (vendor, client) pair always resolves to one review, so rating average and review count can't drift regardless of how many times the client retries.
- **Rating and review count are *derived*, never stored.** `vendor.rating` is the mean of the current review list (rounded to 1 decimal); `vendor.reviewCount` is its length. Both are recomputed on every review write inside `recomputeVendorStats()` in `api/store.js`, so the vendor header shown on the list/detail screens can never disagree with the reviews list below it. This ensures consistency after a new review is posted.
- **Reviews are public, not per-client.** `GET /vendors/:id/reviews?page=&limit=` is ungated; all clients see the same list. Only `POST` and `DELETE` require `X-Client-Id`, because only the caller can create or remove their own review.
- **Non-optimistic `POST`.** The server response carries the canonical `id`, `createdAt`, and the freshly recomputed vendor stats, so the client waits once and then renders authoritative data. Cheaper than reconciling optimistic state, and rating averages can't flicker while the request is in flight.
- **Cross-vendor "My Reviews".** `GET /me/reviews` (Task A's namespace) returns every review the caller has written with a vendor snapshot (name / city / cuisine / price / thumbnail) per row, so the About tab's "My Reviews" screen renders in one round-trip without fetching per-vendor endpoints.


## Architecture and Design Decisions

- **Client identity established via `X-Client-Id` header and UUID stored in `expo-secure-store`** because favourites and "my reviews" need to be per-device, and keychain/Keystore is the right place for an identifier that should survive app restarts.
- **Split per-user state under `/me/*`, shared catalogue on public routes** to make the trust boundary obvious on the server and prevent the bug in the original API where everyone can sees everyone else's favourite vendors.
- **Rating and review count derived from the review list, it's not stored.** The value is recomputed on every write, to prevent drift between the vendor header and the review pages.
- **One review per (vendor, client) pair, upsert on POST.** `POST /vendors/:id/reviews` replaces the caller's existing review instead of creating a duplicate, so edit-in-place can exist without a separate `PUT` endpoint.
- **Route group per tab, each with its own `i/[id]` detail stack.** This ensures back-navigation from a vendor returns to the list you came from (Vendors or Favourites), instead of jumping tabs.
- **zod schemas at the network boundary (`src/api/client.ts`).** Every response is parsed before it reaches a component. Catches server drift at one seam as `CONTRACT_ERROR`, to prevent `(example) undefined is not a function` errors deep in the render tree.
- **Matching zod schema on client and server for reviews.** The form (`src/api/schemas.ts`) and the server route (`api/schemas.js`) validate against semantically identical schemas, so the form can surface field errors without a round-trip, and the server still validates as the source of truth.
- **One `ApiError` shape with `status`, `code`, optional `fieldErrors`.** Every call site pattern-matches the same way. Retry policy lives in one place: no retries on 4xx, two on network / 5xx.
- **Hierarchical query keys.** Related caches live under a shared prefix, so invalidating a parent key cascades to everything nested beneath it. The UI can't show a stale vendor header next to a freshly refetched list, and new nested queries inherit the same invalidation behaviour without touching any existing call site.
- **TanStack Query cache persisted to AsyncStorage.** Cold launches render the previous session's data while revalidating, and the app still shows content when opened offline.
- **`NetInfo` wired into `onlineManager`.** Queries pause on disconnect and resume on reconnect. Offline banner is just a UI hint on top of that.
- **Search uses `useDeferredValue`, not a timer-based debounce.** This keeps the input at 60 fps and advances the query key only when the input is idle. Avoids a fixed time constant and catches up immediately on pause.
- **Optimistic favourite toggle with rollback.** Cache updates on tap, request fires, previous state is restored on error. Zero perceived latency, and incorrect state never sticks.
- **Reviews are not optimistic.** The server response carries the canonical `id`, `createdAt`, and the new rating average.


## Extra Features

- **Faceted filters.** Each list response includes per-city and per-cuisine counts showing how many vendors would match if the user picked that option next. Options that would return zero results are hidden, so the user never taps a filter and lands on an empty results screen. All drill-downs come from a single round trip.
- **Home-screen featured strip.** Horizontal carousel of editorial picks above the Vendors list, shown only in the default landing state (hides the moment a city or cuisine filter is applied). Derived client-side from the `isFeatured` flag already on each vendor in the list response, so there's no extra round-trip and the strip renders from the persisted cache offline.
- **Cross-vendor "My Reviews" screen.** `/me/reviews` returns every review the caller has written, each row carrying a vendor snapshot (name, city, cuisine, price, thumbnail).
- **Edit + delete your own review.** Upsert on `POST`, idempotent `DELETE`. Same controls on the detail screen and My Reviews.
- **Sticky Menu / Reviews tabs on the detail screen.** The tab bar pins under the nav bar once the user scrolls past the header, so switching between Menu and Reviews is always one tap away without scrolling back up.
- **Recent searches** are persisted locally and are individually removable or can be cleared all at once.
- **Offline-aware toasts.** When an action fails, the toast checks whether the device is offline and shows "You're offline" instead of a generic "Something went wrong," so users know it's a connection issue and not a real failure.
- **API integration tests.** `api/tests/` covers vendors, favourites, and reviews for validation, 404s, pagination, and idempotency.
- **All user reviews** located under the About tab to see all user reviews at a quick glance.


# Tradeoffs

- **In-memory server store.** State resets on API restart. A database was intentionally scoped out for this assessment to complete the challenge within the time suggestion.
- **Client ID is self-asserted, not real auth.** The app generates its own UUID and sends it as `X-Client-Id`. Theoretically anyone who guesses another device's ID could impersonate it. Real auth was out of scope for the 6-hour window, however in production this would become a JWT-verifier middleware swap, with minimal/zero changes to route handlers.
- **Dev client required (no Expo Go).** The Client ID lives in `expo-secure-store` (iOS Keychain / Android Keystore), which isn't available in Expo Go. Keychain-backed storage is the right default for a device identifier that must survive reinstalls and never leak to other apps, so the dev-client requirement is a worthwhile tradeoff for the purpose of this challenge.
- **Featured is a home-screen concept that is not filter-aware.** The featured strip hides as soon as a filter is applied, matching how most food apps handle editorial surfaces. This was deliberate choice over adding a `featured=true` param to `/vendors` or keeping the old `/featured` endpoint. Instead featured vendors have a distinct visual cue throughout the app.


