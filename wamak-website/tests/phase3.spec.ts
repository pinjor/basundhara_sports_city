import { expect, test } from "@playwright/test";
import { axe } from "./helpers";

const routes = [
  "/products",
  "/products/jute-eco-friendly",
  "/products/art-paintings",
  "/products/agriculture",
  "/products/customized-sourcing",
  "/products/seafood/mud-crab",
  "/products/jute-eco-friendly/jute-tote-bags",
];

for (const route of routes) {
  test(`${route}: axe, one h1, no overflow`, async ({ page }) => {
    await page.goto(route);
    await expect(page.locator("h1")).toHaveCount(1);
    const results = await axe(page);
    expect(results.violations, JSON.stringify(results.violations, null, 2)).toEqual([]);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(0);
  });
}

test("unknown category and product return 404", async ({ page }) => {
  expect((await page.goto("/products/not-a-category"))?.status()).toBe(404);
  expect((await page.goto("/products/jute-eco-friendly/not-a-product"))?.status()).toBe(404);
});

test("regulated categories show the seasonal and regulatory notice", async ({ page }) => {
  for (const route of ["/products/agriculture", "/products/seafood", "/products/seafood/mud-crab", "/products/agriculture/pineapple"]) {
    await page.goto(route);
    await expect(page.getByRole("complementary", { name: "Before you request a quote" })).toContainText("Availability can be seasonal");
  }
  await page.goto("/products/jute-eco-friendly");
  await expect(page.getByRole("complementary", { name: "Before you request a quote" })).toHaveCount(0);
});

test("products hub filters only change the listed families", async ({ page }) => {
  await page.goto("/products");
  const tiles = page.getByRole("region", { name: "Product families" }).getByRole("heading", { level: 2 });
  const all = await tiles.count();
  await page.getByRole("group", { name: "Material" }).getByRole("button", { name: "Loofah" }).click();
  await expect(page.getByText("1 of 7 product families")).toBeVisible();
  expect(await tiles.count()).toBeLessThan(all);
  await page.getByRole("button", { name: "Clear filters" }).click();
  await expect(page.getByText("All 7 product families")).toBeVisible();
});

test("RFQ drawer: add products, add a note, remove one", async ({ page }) => {
  await page.goto("/products/jute-eco-friendly");
  await page.getByRole("button", { name: "Add Jute tote bags to your RFQ list" }).click();
  await expect(page.getByRole("status")).toContainText("Jute tote bags added to your RFQ list");
  await page.getByRole("button", { name: "Add Jute baskets to your RFQ list" }).click();

  await page.getByRole("button", { name: "RFQ list, 2 products" }).click();
  const drawer = page.getByRole("dialog", { name: /Your RFQ list/ });
  await expect(drawer).toBeVisible();
  const results = await axe(page);
  expect(results.violations, JSON.stringify(results.violations, null, 2)).toEqual([]);

  const note = drawer.getByLabel("Quantity or notes (optional)").first();
  await note.fill("3,000 pcs, natural");
  await note.blur();
  await drawer.getByRole("button", { name: "Remove Jute baskets" }).click();
  await expect(drawer.getByRole("link", { name: "Jute baskets" })).toHaveCount(0);
  await expect(drawer.getByRole("link", { name: "Request a quote for 1 product" })).toBeVisible();

  const stored = await page.evaluate(() => JSON.parse(sessionStorage.getItem("wamak:rfq-list") ?? "[]"));
  expect(stored).toEqual([{ category: "jute-eco-friendly", slug: "jute-tote-bags", name: "Jute tote bags", note: "3,000 pcs, natural" }]);

  await page.keyboard.press("Escape");
  await expect(drawer).toBeHidden();
});

test("product gallery lightbox works by keyboard", async ({ page }) => {
  await page.goto("/products/jute-eco-friendly/jute-tote-bags");
  const opener = page.getByRole("button", { name: /Enlarge image 1 of 3/ });
  await opener.focus();
  await page.keyboard.press("Enter");
  const box = page.getByRole("dialog", { name: /Jute tote bags: image 1 of 3/ });
  await expect(box).toBeVisible();
  await page.keyboard.press("ArrowRight");
  await expect(page.getByRole("dialog", { name: /image 2 of 3/ })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(page.getByRole("button", { name: /Enlarge image 2 of 3/ })).toBeFocused();
});

test("art gallery filters by real tags", async ({ page }) => {
  await page.goto("/products/art-paintings");
  const group = page.getByRole("group", { name: "Filter by style or medium" });
  await group.getByRole("button", { name: "Commission" }).click();
  await expect(page.getByText("Showing 1 work")).toBeAttached();
});
