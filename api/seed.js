import { faker } from "@faker-js/faker";

faker.seed(42);

export const CITIES = ["Copenhagen", "Berlin", "Budapest", "Lisbon", "Tokyo"];

export const CUISINES = [
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

const PRICE_LEVELS = ["$", "$$", "$$$"];
const VENDOR_COUNT = 80;

const thumbnailFor = (n) => `https://picsum.photos/seed/vendor-${n}/320/240`;

function makeVendors() {
  return Array.from({ length: VENDOR_COUNT }, (_, i) => {
    const id = String(i + 1);
    const cuisine = faker.helpers.arrayElement(CUISINES);
    const city = faker.helpers.arrayElement(CITIES);
    const menuSize = faker.number.int({ min: 4, max: 10 });

    const menu = Array.from({ length: menuSize }, (_, j) => ({
      id: `${id}-${j + 1}`,
      name: `${cuisine} ${faker.commerce.productName()}`,
      price: Number(faker.commerce.price({ min: 5, max: 20, dec: 2 })),
      spicy: faker.datatype.boolean({ probability: 0.3 }),
      vegan: faker.datatype.boolean({ probability: 0.4 }),
    }));

    return {
      id,
      name: `${faker.person.firstName()}'s ${cuisine} ${faker.company.buzzNoun()}`,
      cuisine,
      city,
      priceLevel: faker.helpers.arrayElement(PRICE_LEVELS),
      thumbnail: thumbnailFor(i + 1),
      description: faker.lorem.sentences({ min: 1, max: 2 }),
      location: {
        lat: Number((55 + faker.number.float({ min: 0, max: 1 })).toFixed(5)),
        lng: Number((12 + faker.number.float({ min: 0, max: 1 })).toFixed(5)),
      },
      menu,
      isFeatured: faker.datatype.boolean({ probability: 0.15 }),
      // rating + reviewCount are derived from reviews; recomputed at boot and on every write.
    };
  });
}

function makeReviews(vendors) {
  const byVendor = new Map();
  for (const vendor of vendors) {
    const count = faker.number.int({ min: 3, max: 5 });
    const list = Array.from({ length: count }, () => ({
      id: faker.string.uuid(),
      vendorId: vendor.id,
      // Opaque seed-time UUIDs so seeded reviews render as "someone else's"
      // for every real client (no client will ever hold these IDs).
      clientId: faker.string.uuid(),
      rating: faker.number.int({ min: 3, max: 5 }),
      comment: faker.lorem.sentence({ min: 6, max: 20 }),
      createdAt: faker.date.past({ years: 1 }).toISOString(),
    })).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    byVendor.set(vendor.id, list);
  }
  return byVendor;
}

export function seedStore() {
  const vendors = makeVendors();
  const reviews = makeReviews(vendors);
  return { vendors, reviews };
}
