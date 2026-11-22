import { test } from "node:test";
import assert from "node:assert/strict";
import type { AddressInfo } from "node:net";
import { createApp } from "../server/app.ts";
import { cities, defaultProfile } from "../shared/domain.ts";

test("API validation, safety, fallbacks, provider contract and air data", async (t) => {
  const originalFetch = globalThis.fetch;
  const originalKey = process.env.GEMINI_API_KEY;
  delete process.env.GEMINI_API_KEY;
  const server = createApp().listen(0, "127.0.0.1");
  await new Promise<void>((resolve) => server.once("listening", resolve));
  const base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  const payload = {
    message: "How can I keep indoor air cleaner?",
    profile: defaultProfile,
    location: cities[0],
    aqi: 312,
    mode: "demo",
  };
  const post = (body: unknown) =>
    originalFetch(`${base}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  try {
    await t.test(
      "health has security headers and correct assistant state",
      async () => {
        const res = await originalFetch(`${base}/api/health`);
        assert.equal((await res.json()).assistant, "local");
        assert.ok(res.headers.get("content-security-policy"));
        assert.equal(res.headers.get("x-powered-by"), null);
      },
    );
    await t.test(
      "invalid requests are rejected before any upstream request",
      async () => {
        for (const route of [
          "/api/air?lat=91&lon=0",
          "/api/air",
          "/api/locations?q=a",
        ])
          assert.equal((await originalFetch(base + route)).status, 400);
        assert.equal(
          (await post({ ...payload, message: "x".repeat(2001) })).status,
          400,
        );
        assert.equal((await post({ ...payload, aqi: -1 })).status, 400);
      },
    );
    await t.test("keyless chat is explicitly local", async () => {
      const data = await (await post(payload)).json();
      assert.equal(data.mode, "local");
      assert.match(data.answer, /HEPA/);
    });
    await t.test("urgent symptoms bypass Gemini", async () => {
      process.env.GEMINI_API_KEY = "test-secret";
      const data = await (
        await post({ ...payload, message: "My child cannot breathe" })
      ).json();
      assert.equal(data.mode, "safety");
      assert.match(data.answer, /emergency/);
    });
    await t.test(
      "Gemini uses a server header and omits name from profile context",
      async () => {
        globalThis.fetch = (async (url, options) => {
          assert.match(
            String(url),
            /^https:\/\/generativelanguage.googleapis.com\/v1beta\/models\//,
          );
          assert.equal(
            new Headers(options?.headers).get("x-goog-api-key"),
            "test-secret",
          );
          assert.doesNotMatch(String(url), /test-secret/);
          const body = JSON.parse(String(options?.body));
          assert.ok(
            body.systemInstruction.parts[0].text.includes("US EPA AQI"),
          );
          assert.doesNotMatch(body.contents[0].parts[0].text, /"name":"Alex"/);
          return new Response(
            JSON.stringify({
              candidates: [
                { content: { parts: [{ text: "Try a smoke-free room." }] } },
              ],
            }),
            { status: 200 },
          );
        }) as typeof fetch;
        const data = await (await post(payload)).json();
        assert.equal(data.mode, "ai");
        assert.equal(data.answer, "Try a smoke-free room.");
      },
    );
    await t.test(
      "Gemini failure degrades honestly to the local guide",
      async () => {
        globalThis.fetch = (async () =>
          new Response("Unavailable", { status: 503 })) as typeof fetch;
        const data = await (await post(payload)).json();
        assert.equal(data.mode, "local");
        assert.match(data.notice, /unavailable/);
      },
    );
    await t.test(
      "current model data is normalized and null forecast values are excluded",
      async () => {
        const time = new Date();
        time.setUTCMinutes(0, 0, 0);
        const iso = time.toISOString().slice(0, 16);
        globalThis.fetch = (async () =>
          new Response(
            JSON.stringify({
              current: { time: iso, us_aqi: 75, pm2_5: 13, pm10: 22 },
              hourly: {
                time: [
                  iso,
                  new Date(time.getTime() + 3600000).toISOString().slice(0, 16),
                ],
                us_aqi: [75, null],
              },
            }),
          )) as typeof fetch;
        const response = await originalFetch(
          `${base}/api/air?lat=51.5074&lon=-0.1278`,
        );
        const data = await response.json();
        assert.equal(response.status, 200);
        assert.equal(data.mode, "model");
        assert.equal(data.hours.length, 1);
        assert.ok(data.time.endsWith("Z"));
      },
    );
    await t.test(
      "upstream failure returns unavailable instead of invented current readings",
      async () => {
        globalThis.fetch = (async () => {
          throw new Error("offline");
        }) as typeof fetch;
        const response = await originalFetch(
          `${base}/api/air?lat=12.3&lon=45.6`,
        );
        assert.equal(response.status, 503);
        assert.match((await response.json()).error, /unavailable/);
      },
    );
    await t.test("unknown endpoints return JSON errors", async () => {
      const res = await originalFetch(`${base}/api/missing`);
      assert.equal(res.status, 404);
      assert.ok((await res.json()).error);
    });
  } finally {
    globalThis.fetch = originalFetch;
    if (originalKey === undefined) delete process.env.GEMINI_API_KEY;
    else process.env.GEMINI_API_KEY = originalKey;
    server.closeAllConnections();
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }
});
