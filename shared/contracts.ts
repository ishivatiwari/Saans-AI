import { z } from "zod";
import { locationSchema, profileSchema, type AirData } from "./domain.ts";

export const CHAT_LIMITS = {
  message: 2000,
  history: 8,
  historyMessage: 4000,
} as const;
export const chatRequestSchema = z.object({
  message: z.string().trim().min(1).max(CHAT_LIMITS.message),
  profile: profileSchema,
  location: locationSchema,
  aqi: z.number().min(0).max(1000),
  mode: z.enum(["demo", "model"]),
  history: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().max(CHAT_LIMITS.historyMessage),
      }),
    )
    .max(CHAT_LIMITS.history)
    .default([]),
});
export type ChatRequest = z.infer<typeof chatRequestSchema>;
export const healthResponseSchema = z.object({
  status: z.literal("ok"),
  assistant: z.enum(["ai", "local"]),
});
export const locationsResponseSchema = z.array(locationSchema);
const timestampSchema = z
  .string()
  .refine((value) => Number.isFinite(Date.parse(value)), "Invalid timestamp");
const aqiSchema = z.number().min(0).max(1000);
export const airResponseSchema: z.ZodType<AirData> = z.object({
  aqi: aqiSchema,
  pm25: z.number().nonnegative(),
  pm10: z.number().nonnegative(),
  time: timestampSchema,
  timezone: z.string(),
  mode: z.enum(["demo", "model"]),
  hours: z
    .array(z.object({ time: timestampSchema, aqi: aqiSchema }))
    .min(1)
    .max(12),
});
export const chatResponseSchema = z.object({
  answer: z.string().min(1),
  mode: z.enum(["ai", "local", "safety"]),
  notice: z.string().optional(),
  sources: z.array(
    z.object({
      title: z.string(),
      url: z.string().url(),
      provider: z.string(),
    }),
  ),
});
export type ChatResponse = z.infer<typeof chatResponseSchema>;
export const apiErrorSchema = z.object({ error: z.string().min(1) });
