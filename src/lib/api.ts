import { type z } from "zod";
import {
  airResponseSchema,
  apiErrorSchema,
  chatResponseSchema,
  healthResponseSchema,
  locationsResponseSchema,
  type ChatRequest,
} from "../../shared/contracts.ts";
import type { Location } from "../../shared/domain.ts";

/** Validate untrusted JSON before it reaches application state. */
export async function requestJson<T>(
  path: string,
  schema: z.ZodType<T>,
  options?: RequestInit,
): Promise<T> {
  const response = await fetch(path, options);
  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    throw new Error(
      "The server returned an unreadable response. Please try again.",
    );
  }
  if (!response.ok) {
    const error = apiErrorSchema.safeParse(payload);
    throw new Error(
      error.success
        ? error.data.error
        : "The request could not be completed. Please try again.",
    );
  }
  const parsed = schema.safeParse(payload);
  if (!parsed.success)
    throw new Error("The server returned incomplete data. Please try again.");
  return parsed.data;
}

export const api = {
  health: () => requestJson("/api/health", healthResponseSchema),
  locations: (query: string, signal: AbortSignal) =>
    requestJson(
      `/api/locations?q=${encodeURIComponent(query)}`,
      locationsResponseSchema,
      { signal },
    ),
  air: (location: Location) =>
    requestJson(
      `/api/air?lat=${location.latitude}&lon=${location.longitude}`,
      airResponseSchema,
      { signal: AbortSignal.timeout(15000) },
    ),
  chat: (request: ChatRequest) =>
    requestJson("/api/chat", chatResponseSchema, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(request),
      signal: AbortSignal.timeout(30000),
    }),
};
