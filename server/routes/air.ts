import express from "express";
import { z } from "zod";
import { type AirData } from "../../shared/domain.ts";
import { fetchJson } from "../services/cachedFetch.ts";
const airSchema = z.object({
  current: z.object({
    time: z.string(),
    us_aqi: z.number().min(0).max(1000),
    pm2_5: z.number().nonnegative(),
    pm10: z.number().nonnegative(),
  }),
  hourly: z.object({
    time: z.array(z.string()),
    us_aqi: z.array(z.number().nullable()),
  }),
});

export function registerAirRoutes(app: express.Express) {
  app.get("/api/locations", async (req, res) => {
    const parsed = z.string().trim().min(2).max(80).safeParse(req.query.q);
    if (!parsed.success) {
      res
        .status(400)
        .json({ error: "Enter a city name between 2 and 80 characters." });
      return;
    }
    try {
      const raw = await fetchJson(
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(parsed.data)}&count=8&language=en&format=json`,
      );
      const data = z
        .object({
          results: z
            .array(
              z.object({
                name: z.string(),
                country: z.string().optional(),
                admin1: z.string().optional(),
                latitude: z.number(),
                longitude: z.number(),
              }),
            )
            .optional(),
        })
        .parse(raw);
      res.json(
        (data.results || []).map((item) => ({
          name: item.name,
          country: [item.admin1, item.country].filter(Boolean).join(", "),
          latitude: item.latitude,
          longitude: item.longitude,
        })),
      );
    } catch {
      res.status(503).json({
        error:
          "City search is temporarily unavailable. Choose a featured city or try again.",
      });
    }
  });
  app.get("/api/air", async (req, res) => {
    const parsed = z
      .object({
        lat: z.coerce.number().min(-90).max(90),
        lon: z.coerce.number().min(-180).max(180),
      })
      .safeParse(req.query);
    if (!parsed.success) {
      res
        .status(400)
        .json({ error: "Valid latitude and longitude are required." });
      return;
    }
    try {
      const { lat, lon } = parsed.data;
      const url = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat.toFixed(3)}&longitude=${lon.toFixed(3)}&current=us_aqi,pm2_5,pm10&hourly=us_aqi&forecast_days=2&timezone=GMT`;
      const data = airSchema.parse(await fetchJson(url));
      const air: AirData = {
        aqi: Math.round(data.current.us_aqi),
        pm25: data.current.pm2_5,
        pm10: data.current.pm10,
        time: data.current.time + "Z",
        timezone: "UTC",
        mode: "model",
        hours: data.hourly.time
          .map((time, i) => ({ time: time + "Z", aqi: data.hourly.us_aqi[i] }))
          .filter(
            (h): h is { time: string; aqi: number } =>
              typeof h.aqi === "number" &&
              h.aqi >= 0 &&
              h.aqi <= 1000 &&
              Date.parse(h.time) >= Date.parse(data.current.time + "Z"),
          )
          .slice(0, 12),
      };
      if (
        !air.hours.length ||
        Math.abs(Date.now() - Date.parse(air.time)) > 3 * 3600000
      )
        throw new Error("Stale or missing data");
      res.json(air);
    } catch {
      res.status(503).json({
        error:
          "Current model data is unavailable. Demo readings are illustrative; check your local monitoring authority before making plans.",
      });
    }
  });
}
