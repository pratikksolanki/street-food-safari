import express from "express";
import cors from "cors";
import morgan from "morgan";

import vendorRoutes from "./routes/vendors.js";
import reviewRoutes from "./routes/reviews.js";
import favoriteRoutes from "./routes/favorites.js";

const app = express();
app.use(cors());
app.use(express.json());

if (process.env.NODE_ENV !== "test") {
  app.use(morgan("dev"));
}

app.get("/", (_req, res) => {
  res.json({
    name: "Street Food Safari API",
    version: "2.0.0",
    endpoints: [
      "GET    /vendors?page=&limit=&city=&cuisine=",
      "GET    /vendors/:id",
      "GET    /vendors/:id/menu",
      "GET    /vendors/:id/reviews?page=&limit=",
      "POST   /vendors/:id/reviews   body: { rating: 1..5, comment: 1..500 }",
      "GET    /search?q=&page=&limit=&city=&cuisine=  (response includes byCity/byCuisine facets)",
      "GET    /me/favorites?page=&limit=            (X-Client-Id required)",
      "POST   /me/favorites    body: { vendorId }   (X-Client-Id required)",
      "DELETE /me/favorites/:vendorId               (X-Client-Id required)",
      "GET    /me/reviews?page=&limit=              (X-Client-Id required)",
    ],
  });
});

app.use(vendorRoutes);
app.use("/vendors/:id/reviews", reviewRoutes);
app.use("/me", favoriteRoutes);

app.use((req, res) => {
  res.status(404).json({ error: "NOT_FOUND", path: req.path });
});

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: "INTERNAL_ERROR" });
});

export default app;
