import { expect, test } from "@playwright/test";
import { axe } from "./helpers";

const routes = [
  "/services",
  "/services/export",
  "/services/oem-private-label",
  "/how-we-work",
  "/why-wamak",
  "/global-markets",
  "/commercial-terms",
  "/about",
  "/about/leadership",
  "/resources/catalogue",
  "/resources/gallery",
  "/resources/faq",
  "/careers",
  "/privacy",
  "/terms",
  "/accessibility",
];

for (const route of routes) {
  test(`${route}: axe, one h1, no overflow`, async ({ page }) => {
    const res = await page.goto(route);
    expect(res?.status()).toBe(200);
    await expect(page.locator("h1")).toHaveCount(1);
    const results = await axe(page);
    expect(results.violations, JSON.stringify(results.violations, null, 2)).toEqual([]);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(0);
  });
}

test("designed 404 for unknown URLs and unpublished templates", async ({ page }) => {
  for (const url of ["/this-does-not-exist", "/insights/anything", "/case-studies/anything"]) {
    const res = await page.goto(url);
    expect(res?.status()).toBe(404);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("This thread doesn't lead anywhere.");
    await expect(page.getByRole("link", { name: "Request a quote" }).first()).toBeVisible();
  }
  const results = await axe(page);
  expect(results.violations, JSON.stringify(results.violations, null, 2)).toEqual([]);
});

test("every internal link resolves (no 404s)", async ({ page, request }) => {
  const seen = new Set<string>();
  for (const route of ["/", "/products", "/about", "/services", "/resources/faq"]) {
    await page.goto(route);
    const hrefs = await page.$$eval("a[href^='/']", (as) => as.map((a) => (a as HTMLAnchorElement).getAttribute("href")!.split("#")[0]));
    hrefs.forEach((h) => seen.add(h));
  }
  const broken: string[] = [];
  for (const href of seen) {
    const res = await request.get(href);
    if (res.status() >= 400) broken.push(`${href} → ${res.status()}`);
  }
  expect(broken).toEqual([]);
});

test("leadership messages are visibly marked as drafts", async ({ page }) => {
  await page.goto("/about/leadership");
  await expect(page.getByText("[DRAFT — REQUIRES APPROVAL BY CHAIRMAN/MD]")).toHaveCount(2);
  await expect(page.getByRole("heading", { name: "Building business beyond borders" })).toBeVisible();
});

test("no proof blocks, prices or WhatsApp render while data is empty", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "What buyers say" })).toHaveCount(0);
  await expect(page.getByRole("region", { name: "Key figures" })).toHaveCount(0);
  await expect(page.getByText(/whatsapp/i)).toHaveCount(0);
  await expect(page.getByText(/add to cart|checkout|\$\d/i)).toHaveCount(0);
});

test("Journey D: home, catalogue, request, contact", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("link", { name: "Download catalogue" }).first().click();
  await expect(page).toHaveURL(/\/resources\/catalogue$/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Explore the WAMAK GROUP product catalogue");
  await page.getByRole("link", { name: "Request the latest catalogue" }).click();
  await expect(page).toHaveURL(/\/contact\?topic=catalogue/);
  await expect(page.getByLabel("Topic")).toHaveValue("Catalogue request");
});

test("Journey E: about, why WAMAK, contact", async ({ page }) => {
  await page.goto("/about");
  await expect(page.getByText(/To connect international buyers with suitable producers/)).toBeVisible();
  await page.getByRole("link", { name: "Why WAMAK" }).first().click();
  await expect(page).toHaveURL(/\/why-wamak$/);
  await page.locator("main").getByRole("link", { name: "Contact us" }).click();
  await expect(page).toHaveURL(/\/contact$/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Contact WAMAK GROUP");
});
