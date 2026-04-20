# Street Food Safari – Software Engineer (Mobile) Challenge

> **Solution write-up:** see [`app/README.md`](app/README.md) for how to run, architecture and design decisions, and the rationale behind Task A and Task B.

Welcome to **Street Food Safari** 🥡🌮🍜

Imagine you’re traveling through vibrant cities around the world, searching for the best street food vendors hidden in corners and alleys. From steaming bowls of ramen in Tokyo to crispy lángos in Budapest, your mission is to build an app that helps hungry travelers discover and explore these vendors.

This challenge is your chance to show how you think about architecture, polish, performance, and user experience when building a real-world mobile app.

## Repository Structure

This repo contains two parts:

- **`/api`**
  A simple Express server that provides street food vendor data, menus, and some fun endpoints. You’ll run this locally to power your app.

- **`/app`**
  This is where your Expo React Native mobile app will live. Create it from scratch inside this folder. The app should run on both iOS and Android.

## Your Task

Build a mobile app using **Expo** that consumes the Street Food Safari API and provides a smooth, polished experience.

Note: this isn't purely a client-side challenge. Part of the work is on the server — you'll need to **modify and extend the Express API** in `/api`, not just consume it.

### Client Requirements

- **Navigation**
  - Tabs: `Vendors`, `Favorites`, `About`
  - Vendors → Vendor Details flow

- **Vendor List**
  - Fetch from `/vendors?page=1&limit=20`
  - Infinite scroll + pull-to-refresh
  - Show image, name, cuisine, rating, city, price level
  - Tapping an item → details

- **Vendor Details**
  - Fetch from `/vendors/:id`
  - Show description + menu items
  - Menu items should show small badges (e.g. spicy/vegan)
  - Favorite toggle (see Backend Task A for the endpoint design)
  - View and submit reviews (see Backend Task B)

- **Search**
  - Use `/search?q=`
  - Debounced input in a header search bar
  - Filters (Optional): filter vendors by city or cuisine via `/vendors?city=&cuisine=`

- **Documentation**
  - Add a README in `/app` explaining:
    - How to run the app
    - Any design/architecture decisions
    - Tradeoffs or extra features you added

### Backend Requirements

- **Task A — Fix the favorites bug**
  - Today, `POST /vendors/:id/favorite` flips a global `isFavorite` boolean on the shared vendor record. That means every client sees every other client's favorites — which is obviously wrong.
  - Redesign favorites so they're scoped to the individual client. You decide how the server identifies a client, what the request/response shape looks like, and how to handle duplicate/repeated calls.
  - Expose whatever endpoints your app needs (e.g. list favorites, add, remove).
  - Be ready to explain your choices in the `/app` README.

- **Task B — Add reviews**
  - `POST /vendors/:id/reviews` — accepts a rating (1–5) and a comment. Validate the input server-side and return sensible errors for bad input vs. unknown vendor.
  - `GET /vendors/:id/reviews` — paginated list.
  - A vendor's `rating` should be the average of its reviews, and the vendor payload should expose a review count. Think about how this stays consistent after a new review is posted.
  - Unlike favorites, reviews are public — all clients see the same reviews for a vendor.
  - The client should let the user view existing reviews on the vendor details screen and submit a new one.

## Time Expectation

We estimate this challenge should take around **6 hours**.
You’re welcome to spend more if you want to polish or add extras, but we’ll mainly be looking at:

- How you structure and reason about both the app and the API changes
- How you model state that belongs to a user vs. state that's shared
- How you handle data fetching, validation, and error cases
- Attention to detail in the UI and UX
- How you consider performance

## Getting Started

### API

```bash
cd api
npm install
npm run dev
```

Server runs at <http://localhost:3333>. You can find a Postman collection in the `/postman` folder to explore the endpoints.

## Final Words

This isn’t about cranking out every single feature perfectly—it’s about showing us how you think, how you code, and how you approach building a small but complete app. We’re excited to see your creativity, polish, and engineering choices shine through.

Good luck, and have fun exploring the world of Street Food Safari! 🚀
