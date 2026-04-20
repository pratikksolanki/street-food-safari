import type { z } from "zod";

import { getClientIdSync } from "@/lib/client-id";
import { env } from "@/lib/env";
import { logError } from "@/lib/log-error";

// Single error shape for every call site to pattern-match.
// - `status: 0` + `code: "NETWORK_ERROR"` — request never reached the server.
// - `code: "CONTRACT_ERROR"` — server responded OK but the payload failed the
//   client-side zod schema (server drift caught at the boundary).
// - Otherwise `code` mirrors the server's `error` field (VENDOR_NOT_FOUND,
//   VALIDATION_ERROR, MISSING_CLIENT_ID, …).
export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly fieldErrors?: Record<string, string>;
  readonly path?: string;

  constructor(
    message: string,
    init: {
      status: number;
      code: string;
      fieldErrors?: Record<string, string>;
      path?: string;
    },
  ) {
    super(message);
    this.name = "ApiError";
    this.status = init.status;
    this.code = init.code;
    this.fieldErrors = init.fieldErrors;
    this.path = init.path;
  }

  get isNetworkError(): boolean {
    return this.code === "NETWORK_ERROR";
  }

  get isValidationError(): boolean {
    return this.code === "VALIDATION_ERROR";
  }

  get isNotFound(): boolean {
    return this.status === 404;
  }
}

// Request plumbing -----------------------------------------------------------

type QueryPrimitive = string | number | boolean;
type QueryValue = QueryPrimitive | QueryPrimitive[] | undefined | null;
type Query = Record<string, QueryValue>;

type RequestOptions = {
  method?: "GET" | "POST" | "DELETE";
  body?: unknown;
  query?: Query;
  signal?: AbortSignal;
};

function buildUrl(path: string, query?: Query): string {
  const url = new URL(path, env.EXPO_PUBLIC_API_URL);
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value === undefined || value === null) continue;
      if (Array.isArray(value)) {
        for (const item of value) {
          if (item === undefined || item === null || item === "") continue;
          url.searchParams.append(key, String(item));
        }
        continue;
      }
      if (value === "") continue;
      url.searchParams.set(key, String(value));
    }
  }
  return url.toString();
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseFieldErrors(value: unknown): Record<string, string> | undefined {
  if (!isRecord(value)) return undefined;
  const out: Record<string, string> = {};
  for (const [key, v] of Object.entries(value)) {
    if (typeof v === "string") out[key] = v;
  }
  return Object.keys(out).length > 0 ? out : undefined;
}

function apiErrorFromResponse(status: number, body: unknown): ApiError {
  const obj = isRecord(body) ? body : {};
  const code = typeof obj.error === "string" ? obj.error : "HTTP_ERROR";
  const fieldErrors = parseFieldErrors(obj.fieldErrors);
  const path = typeof obj.path === "string" ? obj.path : undefined;
  return new ApiError(`${code} (HTTP ${status})`, { status, code, fieldErrors, path });
}

async function request<T>(
  path: string,
  schema: z.ZodType<T>,
  options: RequestOptions = {},
): Promise<T> {
  const url = buildUrl(path, options.query);
  const hasBody = options.body !== undefined && options.method !== "GET";

  let response: Response;
  try {
    response = await fetch(url, {
      method: options.method ?? "GET",
      headers: {
        Accept: "application/json",
        "X-Client-Id": getClientIdSync(),
        ...(hasBody ? { "Content-Type": "application/json" } : {}),
      },
      body: hasBody ? JSON.stringify(options.body) : undefined,
      signal: options.signal,
    });
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      // Let TanStack Query handle cancellation; not an ApiError.
      throw error;
    }
    throw new ApiError("Network request failed", {
      status: 0,
      code: "NETWORK_ERROR",
    });
  }

  if (response.status === 204) {
    const parsed = schema.safeParse(undefined);
    if (!parsed.success) {
      logError(parsed.error, { at: "response-parse-204", url });
      throw new ApiError("Unexpected 204 shape", {
        status: 204,
        code: "CONTRACT_ERROR",
      });
    }
    return parsed.data;
  }

  let body: unknown = null;
  try {
    body = await response.json();
  } catch {
    // Non-JSON / empty body; let the error path below decide.
  }

  if (!response.ok) {
    throw apiErrorFromResponse(response.status, body);
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    logError(parsed.error, { at: "response-parse", url, status: response.status });
    throw new ApiError("Unexpected response shape", {
      status: response.status,
      code: "CONTRACT_ERROR",
    });
  }
  return parsed.data;
}

// Public API -----------------------------------------------------------------

type GetOptions = { query?: Query; signal?: AbortSignal };
type PostOptions = { query?: Query; signal?: AbortSignal };
type DeleteOptions = { query?: Query; signal?: AbortSignal };

export const apiClient = {
  get<T>(path: string, schema: z.ZodType<T>, options: GetOptions = {}): Promise<T> {
    return request(path, schema, { method: "GET", ...options });
  },
  post<T>(
    path: string,
    schema: z.ZodType<T>,
    body: unknown,
    options: PostOptions = {},
  ): Promise<T> {
    return request(path, schema, { method: "POST", body, ...options });
  },
  delete<T>(path: string, schema: z.ZodType<T>, options: DeleteOptions = {}): Promise<T> {
    return request(path, schema, { method: "DELETE", ...options });
  },
};
