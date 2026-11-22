import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test("reset clears household changes and saved commitments", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Personalize", exact: true }).click();
  await page.getByLabel("What should we call you?").fill("Taylor");
  await page.getByRole("button", { name: "Save my preferences" }).click();
  await page.getByRole("button", { name: "Community", exact: true }).click();
  await page.getByRole("button", { name: "I’m in" }).first().click();
  await page.getByRole("button", { name: "About & resources" }).click();
  await page.getByRole("button", { name: "Reset my local data" }).click();
  await expect(page.getByRole("button", { name: "Committed" })).toHaveCount(0);
  await page.reload();
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Alex");
  await expect(page.getByRole("button", { name: /Demo data/ })).toBeVisible();
});

test("daily plan download preserves source attribution and completion", async ({
  page,
}) => {
  await page.goto("/");
  await page
    .getByRole("button", { name: "Complete: Take rail for essential trips" })
    .click();
  await page.getByRole("button", { name: "My daily plan" }).click();
  const downloadEvent = page.waitForEvent("download");
  await page.getByRole("button", { name: "Save plan" }).click();
  const download = await downloadEvent;
  expect(download.suggestedFilename()).toBe("saans-daily-plan.txt");
  const stream = await download.createReadStream();
  const chunks: Buffer[] = [];
  for await (const chunk of stream!) chunks.push(chunk);
  const text = Buffer.concat(chunks).toString("utf8");
  expect(text).toContain("[x] On your way: Take rail for essential trips");
  expect(text).toContain("Illustrative demo");
  expect(text).toContain("https://www.airnow.gov/aqi/aqi-basics/");
});

test("desktop dashboard, plan, profile, impact, chat and resources work together", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Alex");
  await page.screenshot({ path: "artifacts/desktop.png", fullPage: true });
  await page
    .getByRole("button", { name: "Complete: Take rail for essential trips" })
    .click();
  await page.getByRole("button", { name: "My impact", exact: true }).click();
  await expect(page.getByText("1.56", { exact: false }).first()).toBeVisible();
  await page.getByRole("button", { name: "Personalize", exact: true }).click();
  await page.getByLabel("What should we call you?").fill("Sam");
  await page.getByLabel("Usual commute").selectOption("home");
  await page.getByRole("button", { name: "Save my preferences" }).click();
  await page.getByRole("button", { name: "My daily plan" }).click();
  await expect(
    page.getByRole("heading", { name: "Keep the commute off your calendar" }),
  ).toBeVisible();
  await page.reload();
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Sam");
  await page
    .getByRole("button", { name: "Can the kids play outside today?" })
    .click();
  await expect(page.locator(".message.assistant")).toContainText("outdoor", {
    timeout: 15000,
  });
  await page.getByRole("button", { name: "Community", exact: true }).click();
  await page.getByRole("button", { name: "I’m in" }).first().click();
  await expect(page.getByRole("button", { name: "Committed" })).toBeVisible();
  await page.getByRole("button", { name: "About & resources" }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).not.toBeVisible();
  expect(errors).toEqual([]);
});

test("worldwide search updates location, and failures are explicitly demo", async ({
  page,
}) => {
  await page.route("**/api/locations?*", (route) =>
    route.fulfill({
      json: [
        { name: "Tokyo", country: "Japan", latitude: 35.68, longitude: 139.69 },
      ],
    }),
  );
  await page.route("**/api/air?*", (route) =>
    route.fulfill({
      status: 503,
      json: { error: "Current model data is unavailable. Showing demo data." },
    }),
  );
  await page.goto("/");
  await page.getByRole("button", { name: /New Delhi, India/ }).click();
  await page.getByRole("textbox", { name: "Search cities" }).fill("Tokyo");
  await page.getByRole("button", { name: "Tokyo Japan" }).click();
  await expect(
    page.getByRole("button", { name: /Tokyo, Japan/ }),
  ).toBeVisible();
  await expect(page.getByRole("status")).toContainText("unavailable");
  await expect(page.getByRole("button", { name: /Demo data/ })).toBeVisible();
});

test("mobile navigation and assistant fit a narrow viewport", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page.screenshot({ path: "artifacts/mobile.png", fullPage: true });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.getByRole("button", { name: "Toggle navigation" }).click();
  await page.getByRole("button", { name: "Healthy home", exact: true }).click();
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "breathing space",
  );
  await page.getByRole("button", { name: "Ask Saans" }).click();
  await expect(
    page.getByRole("textbox", { name: "Ask Saans a question" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Close assistant" }).click();
  await expect(
    page.getByRole("textbox", { name: "Ask Saans a question" }),
  ).not.toBeVisible();
});

test("dashboard and profile meet automated accessibility checks", async ({
  page,
}) => {
  await page.goto("/");
  const dashboard = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
    .analyze();
  expect(
    dashboard.violations.map((v) => ({
      id: v.id,
      nodes: v.nodes.map((n) => ({
        target: n.target,
        summary: n.failureSummary,
      })),
    })),
  ).toEqual([]);
  await page.getByRole("button", { name: "Personalize", exact: true }).click();
  const profile = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
    .analyze();
  expect(
    profile.violations.map((v) => ({
      id: v.id,
      nodes: v.nodes.map((n) => ({
        target: n.target,
        summary: n.failureSummary,
      })),
    })),
  ).toEqual([]);
});

test("secondary pages and mobile retain accessible contrast and layout", async ({
  page,
}) => {
  await page.goto("/");
  for (const name of [
    "My daily plan",
    "Healthy home",
    "My impact",
    "Community",
  ]) {
    await page
      .getByRole("button", { name, exact: name !== "My daily plan" })
      .first()
      .click();
    const report = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
      .analyze();
    expect(
      report.violations.map((v) => ({
        page: name,
        id: v.id,
        nodes: v.nodes.map((n) => ({
          target: n.target,
          summary: n.failureSummary,
        })),
      })),
    ).toEqual([]);
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page.reload();
  const mobile = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
    .analyze();
  expect(
    mobile.violations.map((v) => ({
      id: v.id,
      nodes: v.nodes.map((n) => ({
        target: n.target,
        summary: n.failureSummary,
      })),
    })),
  ).toEqual([]);
});
