import express from "express";
import cors from "cors";
import morgan from "morgan";
import { faker } from "@faker-js/faker";

const app = express();
app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

const PORT = process.env.PORT || 3333;

// ---------- Data seed ----------
faker.seed(42);

const cities = ["Copenhagen", "Berlin", "Budapest", "Lisbon", "Tokyo"];
const cuisines = [
  "Mexican",
  "Thai",
  "Japanese",
  "Korean",
  "Italian",
  "Indian",
  "Turkish",
  "Vietnamese",
  "Greek",
  "Hungarian",
];
const priceLevels = ["$", "$$", "$$$"];

const IMG = (id) => `https://picsum.photos/seed/vendor-${id}/320/240`;

const vendors = Array.from({ length: 80 }, (_, i) => {
  const city = faker.helpers.arrayElement(cities);
  const cuisine = faker.helpers.arrayElement(cuisines);
  const rating = Number((Math.random() * 2 + 3).toFixed(1)); // 3.0–5.0
  const menuSize = faker.number.int({ min: 4, max: 10 });

  const menu = Array.from({ length: menuSize }, (_, j) => ({
    id: `${i + 1}-${j + 1}`,
    name: `${cuisine} ${faker.commerce.productName()}`,
    price: Number(faker.commerce.price({ min: 5, max: 20, dec: 2 })),
    spicy: Math.random() < 0.3,
    vegan: Math.random() < 0.4,
  }));

  return {
    id: String(i + 1),
    name: `${faker.person.firstName()}'s ${cuisine} ${faker.company.buzzNoun()}`,
    cuisine,
    city,
    rating,
    priceLevel: faker.helpers.arrayElement(priceLevels),
    thumbnail: IMG(i + 1),
    description: faker.lorem.sentences({ min: 1, max: 2 }),
    location: {
      lat: Number((55 + Math.random()).toFixed(5)),
      lng: Number((12 + Math.random()).toFixed(5)),
    },
    menu,
    isFeatured: Math.random() < 0.15,
    isFavorite: false,
  };
});

// ---------- Helpers ----------
const paginate = (items, page = 1, limit = 20) => {
  const p = Math.max(1, Number(page));
  const l = Math.max(1, Math.min(100, Number(limit)));
  const start = (p - 1) * l;
  return {
    page: p,
    limit: l,
    total: items.length,
    totalPages: Math.ceil(items.length / l),
    data: items.slice(start, start + l),
  };
};

const filterVendors = ({ city, cuisine }) =>
  vendors.filter(
    (v) =>
      (!city || v.city.toLowerCase() === String(city).toLowerCase()) &&
      (!cuisine || v.cuisine.toLowerCase() === String(cuisine).toLowerCase())
  );

// ---------- Endpoints ----------
app.get("/", (_req, res) => {
  res.json({
    name: "Street Food Safari API",
    version: "1.0.0",
    endpoints: [
      "GET /vendors?page=&limit=&city=&cuisine=",
      "GET /vendors/:id",
      "GET /vendors/:id/menu",
      "POST /vendors/:id/favorite",
      "GET /search?q=",
      "GET /featured",
      "GET /stats",
    ],
  });
});

app.get("/vendors", (req, res) => {
  const { page = 1, limit = 20, city, cuisine } = req.query;
  const items = filterVendors({ city, cuisine });
  res.json(paginate(items, page, limit));
});

app.get("/vendors/:id", (req, res) => {
  const v = vendors.find((x) => x.id === req.params.id);
  if (!v) return res.status(404).json({ error: "Not found" });
  res.json(v);
});

app.get("/vendors/:id/menu", (req, res) => {
  const v = vendors.find((x) => x.id === req.params.id);
  if (!v) return res.status(404).json({ error: "Not found" });
  res.json({ vendorId: v.id, items: v.menu });
});

app.get("/search", (req, res) => {
  const q = String(req.query.q || "")
    .trim()
    .toLowerCase();
  if (!q) return res.json({ data: [] });
  const data = vendors.filter(
    (v) => v.name.toLowerCase().includes(q) || v.cuisine.toLowerCase().includes(q) || v.city.toLowerCase().includes(q)
  );
  res.json(paginate(data, 1, Number(req.query.limit) || 20));
});

app.get("/featured", (_req, res) => {
  res.json({ data: vendors.filter((v) => v.isFeatured) });
});

app.get("/stats", (_req, res) => {
  const byCity = Object.fromEntries(cities.map((c) => [c, vendors.filter((v) => v.city === c).length]));
  const byCuisine = Object.fromEntries(cuisines.map((cz) => [cz, vendors.filter((v) => v.cuisine === cz).length]));
  res.json({ total: vendors.length, byCity, byCuisine });
});

app.post("/vendors/:id/favorite", (req, res) => {
  const v = vendors.find((x) => x.id === req.params.id);
  if (!v) return res.status(404).json({ error: "Not found" });
  v.isFavorite = !v.isFavorite;
  res.json({ id: v.id, isFavorite: v.isFavorite });
});

// ---------- Start ----------
app.listen(PORT, () => {
  console.log(`Street Food Safari API running on http://localhost:${PORT}`);
});
