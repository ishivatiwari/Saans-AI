import { test } from "node:test";
import assert from "node:assert/strict";
import { requestJson } from "../src/lib/api.ts";
import {
  airResponseSchema,
  chatResponseSchema,
  healthResponseSchema,
  chatRequestSchema,
} from "../shared/contracts.ts";
import { cities, defaultProfile, demoAir } from "../shared/domain.ts";

test("client validates responses before updating application state", async (t) => {
  const originalFetch = globalThis.fetch;
  const respond = (body: unknown, status = 200) => {
    globalThis.fetch = async () =>
      new Response(JSON.stringify(body), { status });
  };
  try {
    await t.test("valid air data passes through unchanged", async () => {
      const air = demoAir();
      respond(air);
      assert.deepEqual(await requestJson("/api/air", airResponseSchema), air);
    });
    await t.test(
      "missing forecasts and invalid readings are rejected",
      async () => {
        for (const invalid of [
          { ...demoAir(), hours: [] },
          { ...demoAir(), aqi: -1 },
          { ...demoAir(), time: "not-a-date" },
        ]) {
          respond(invalid);
          await assert.rejects(
            requestJson("/api/air", airResponseSchema),
            /incomplete data/,
          );
        }
      },
    );
    await t.test("rate-limit messages are preserved", async () => {
      respond({ error: "Please wait a minute." }, 429);
      await assert.rejects(
        requestJson("/api/health", healthResponseSchema),
        /Please wait a minute/,
      );
    });
    await t.test("HTML errors produce a readable fallback", async () => {
      globalThis.fetch = async () =>
        new Response("<html>Upstream diagnostic</html>", { status: 502 });
      await assert.rejects(
        requestJson("/api/health", healthResponseSchema),
        /unreadable response/,
      );
    });
    await t.test(
      "chat requires a recognized mode and nonempty answer",
      async () => {
        for (const invalid of [
          { answer: "", mode: "ai", sources: [] },
          { answer: "Hello", mode: "unknown", sources: [] },
        ]) {
          respond(invalid);
          await assert.rejects(
            requestJson("/api/chat", chatResponseSchema),
            /incomplete data/,
          );
        }
      },
    );
    await t.test("cancellation propagates through the API client", async () => {
      const controller = new AbortController();
      controller.abort();
      globalThis.fetch = async (_input, init) => {
        assert.equal(init?.signal, controller.signal);
        throw new DOMException("Aborted", "AbortError");
      };
      await assert.rejects(
        requestJson("/api/health", healthResponseSchema, {
          signal: controller.signal,
        }),
        { name: "AbortError" },
      );
    });
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("shared chat limits reject oversized messages and history", () => {
  const valid = {
    message: "Indoor air tips?",
    profile: defaultProfile,
    location: cities[0],
    aqi: 312,
    mode: "demo",
    history: [],
  };
  assert.equal(chatRequestSchema.safeParse(valid).success, true);
  assert.equal(
    chatRequestSchema.safeParse({ ...valid, message: "x".repeat(2001) })
      .success,
    false,
  );
  assert.equal(
    chatRequestSchema.safeParse({
      ...valid,
      history: Array.from({ length: 9 }, () => ({
        role: "user",
        content: "Hello",
      })),
    }).success,
    false,
  );
});
