import { z } from "zod";

export const reviewInputSchema = z.object({
  rating: z.number().int().min(1).max(5),
  comment: z.string().trim().min(1).max(500),
});

export const favoriteBodySchema = z.object({
  vendorId: z.string().min(1),
});

export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export function zodFieldErrors(error) {
  const fieldErrors = {};
  for (const [field, messages] of Object.entries(error.flatten().fieldErrors)) {
    if (messages?.[0]) fieldErrors[field] = messages[0];
  }
  return fieldErrors;
}

export function readPagination(query) {
  const result = paginationSchema.safeParse(query);
  return result.success ? result.data : { page: 1, limit: 20 };
}

export function paginate(items, { page, limit }) {
  const start = (page - 1) * limit;
  return {
    page,
    limit,
    total: items.length,
    totalPages: Math.max(1, Math.ceil(items.length / limit)),
    data: items.slice(start, start + limit),
  };
}
