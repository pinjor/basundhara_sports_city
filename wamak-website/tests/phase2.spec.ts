import { expect, test } from "@playwright/test";
import { axe } from "./helpers";

test.describe("desktop header", () => {
  test.skip(({ isMobile }) => isMobile, "desktop only");

  test("products mega menu works by keyboard and passes axe", async ({ page }) => {
    await page.goto("/");
    const trigger = page.getByRole("button", { name: "Products", exact: true });
    await trigger.focus();
    await page.keyboard.press("ArrowDown");
    await expect(trigger).toHaveAttribute("aria-expanded", "true");
    await expect(page.getByRole("navigation", { name: "Product families" }).getByRole("link").first()).toBeFocused();
    await page.keyboard.press("ArrowDown");
    await expect(page.getByRole("link", { name: /Handicrafts & home décor/ }).first()).toBeFocused();
    const results = await axe(page);
    expect(results.violations, JSON.stringify(results.violations, null, 2)).toEqual([]);
    await page.keyboard.press("Escape");
    await expect(trigger).toHaveAttribute("aria-expanded", "false");
    await expect(trigger).toBeFocused();
  });
});

test.describe("mobile header", () => {
  test.skip(({ isMobile }) => !isMobile, "mobile only");

  test("menu opens as a modal dialog and closes with Escape", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Open menu" }).click();
    const dialog = page.getByRole("dialog", { name: "Menu" });
    await expect(dialog).toBeVisible();
    const results = await axe(page);
    expect(results.violations, JSON.stringify(results.violations, null, 2)).toEqual([]);
    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
  });

  test("sticky quote bar is present", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("link", { name: "Request a quote" }).last()).toBeVisible();
  });
});

test("adding a product shows the RFQ indicator", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("button", { name: /^RFQ list/ })).toHaveCount(0);
  const add = page.getByRole("button", { name: "Add Jute shopping bags to your RFQ list" });
  await add.scrollIntoViewIfNeeded();
  await add.click();
  await expect(page.getByRole("button", { name: "RFQ list, 1 product" })).toBeVisible();
  await expect(page.getByRole("button", { name: /Jute shopping bags is on your RFQ list/ })).toHaveAttribute("aria-pressed", "true");
});

test("quick inquiry validates, then continues to the RFQ with a saved draft", async ({ page }) => {
  await page.goto("/");
  const form = page.locator("#quick-title").locator("xpath=ancestor::section");
  // Wait for hydration: React switches the form to its own validation.
  await expect(form.locator("form")).toHaveAttribute("novalidate", "");
  await form.getByRole("button", { name: "Start my request" }).click();
  await expect(form.getByText("Tell us the product or category")).toBeVisible();
  await expect(form.getByText("Enter a business email address")).toBeVisible();

  await form.getByLabel("Product or category").fill("Jute & eco-friendly products");
  await form.getByLabel("Quantity").fill("5,000 pieces");
  await form.getByLabel("Destination country").selectOption("Germany");
  await form.getByLabel("Business email").fill("buyer@example.com");
  await form.getByRole("button", { name: "Start my request" }).click();
  await expect(page).toHaveURL(/\/request-quote\?from=quick/);
  const draft = await page.evaluate(() => sessionStorage.getItem("wamak:rfq-draft"));
  expect(JSON.parse(draft!)).toMatchObject({ country: "Germany", category: "jute-eco-friendly" });
});

test("home has exactly one h1 and every image slot is labelled", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("h1")).toHaveCount(1);
  const unlabelled = await page.locator('[role="img"]:not([aria-label])').count();
  expect(unlabelled).toBe(0);
});

test("reduced motion shows the process thread fully drawn", async ({ browser }) => {
  const ctx = await browser.newContext({ reducedMotion: "reduce" });
  const page = await ctx.newPage();
  await page.goto("/");
  const clip = page.locator("#process-title").locator("xpath=ancestor::section").locator("[style*='clip-path']");
  await expect(clip).toHaveAttribute("style", /inset\(0(px)? 0(px)? 0%/);
  await ctx.close();
});

test("quick inquiry works before JavaScript loads (native GET, no email in the URL)", async ({ browser }) => {
  const ctx = await browser.newContext({ javaScriptEnabled: false });
  const page = await ctx.newPage();
  await page.goto("/");
  const form = page.locator("#quick-title").locator("xpath=ancestor::section");
  await form.getByLabel("Product or category").fill("Sisal rope");
  await form.getByLabel("Quantity").fill("20 tonnes");
  await form.getByLabel("Destination country").selectOption("Kenya");
  await form.getByLabel("Business email").fill("buyer@example.com");
  await form.getByRole("button", { name: "Start my request" }).click();
  await expect(page).toHaveURL(/\/request-quote\?from=quick&product=Sisal\+rope&quantity=20\+tonnes&country=Kenya$/);
  expect(page.url()).not.toContain("example.com");
  await ctx.close();
});
