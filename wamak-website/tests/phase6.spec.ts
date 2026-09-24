import { writeFileSync } from "node:fs";
import { expect, test } from "@playwright/test";
import { axe, settle } from "./helpers";

async function sitemapPaths(baseURL: string) {
  const xml = await (await fetch(`${baseURL}/sitemap.xml`)).text();
  return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => new URL(m[1]).pathname);
}

test.describe("every sitemap route", () => {
  test.describe.configure({ mode: "parallel" });

  test("axe, one h1, unique title/description, canonical, no overflow at 360px", async ({ page, baseURL }) => {
    test.setTimeout(8 * 60_000);
    const paths = await sitemapPaths(baseURL!);
    expect(paths.length).toBeGreaterThan(60);
    const titles = new Map<string, string>();
    const descriptions = new Map<string, string>();
    const problems: string[] = [];
    await page.setViewportSize({ width: 360, height: 800 });

    for (const path of paths) {
      const res = await page.goto(path);
      if (res?.status() !== 200) problems.push(`${path}: status ${res?.status()}`);
      if ((await page.locator("h1").count()) !== 1) problems.push(`${path}: h1 count ${await page.locator("h1").count()}`);
      const title = await page.title();
      const desc = (await page.locator('meta[name="description"]').getAttribute("content")) ?? "";
      if (!desc) problems.push(`${path}: no description`);
      if (titles.has(title)) problems.push(`${path}: duplicate title with ${titles.get(title)}`);
      if (descriptions.has(desc)) problems.push(`${path}: duplicate description with ${descriptions.get(desc)}`);
      titles.set(title, path);
      descriptions.set(desc, path);
      if (path !== "/request-quote/thank-you" && !(await page.locator('link[rel="canonical"]').count())) problems.push(`${path}: no canonical`);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      if (overflow > 0) problems.push(`${path}: overflows by ${overflow}px at 360px`);
      const results = await axe(page);
      for (const v of results.violations) problems.push(`${path}: axe ${v.id} (${v.nodes.length})`);
    }
    writeFileSync(test.info().outputPath("crawl-problems.json"), JSON.stringify(problems, null, 2));
    expect(problems).toEqual([]);
  });
});

test("skip link is the first stop and moves focus to main content", async ({ page, isMobile }) => {
  test.skip(isMobile, "keyboard walkthrough on desktop");
  await page.goto("/products");
  await page.keyboard.press("Tab");
  const skip = page.getByRole("link", { name: "Skip to content" });
  await expect(skip).toBeFocused();
  await expect(skip).toBeVisible();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/#main$/);
  // The next Tab lands inside main, not back in the header.
  await page.keyboard.press("Tab");
  expect(await page.evaluate(() => !!document.activeElement?.closest("main"))).toBe(true);
});

test("keyboard-only: reach the quote form from the header and see a focus ring", async ({ page, isMobile }) => {
  test.skip(isMobile, "keyboard walkthrough on desktop");
  await page.goto("/");
  let reached = false;
  for (let i = 0; i < 20 && !reached; i++) {
    await page.keyboard.press("Tab");
    reached = await page.evaluate(() => document.activeElement?.textContent?.trim() === "Request a quote");
  }
  expect(reached).toBe(true);
  const outline = await page.evaluate(() => getComputedStyle(document.activeElement!).outlineStyle);
  expect(outline).not.toBe("none");
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/request-quote$/);
});

test("reduced motion: hero thread is fully drawn with no animation", async ({ browser }) => {
  const ctx = await browser.newContext({ reducedMotion: "reduce" });
  const page = await ctx.newPage();
  await page.goto("/");
  const path = page.locator("path.fibre-draw").first();
  const state = await path.evaluate((el) => {
    const cs = getComputedStyle(el);
    return { animation: cs.animationName, offset: cs.strokeDashoffset };
  });
  expect(state.animation).toBe("none");
  expect(parseFloat(state.offset)).toBe(0);
  await ctx.close();
});

test("structured data: Organization and breadcrumbs, and no Product schema anywhere", async ({ page }) => {
  await page.goto("/products/jute-eco-friendly/jute-tote-bags");
  const blocks = await page.$$eval('script[type="application/ld+json"]', (s) => s.map((x) => JSON.parse(x.textContent!)));
  const types = blocks.map((b) => b["@type"]);
  expect(types).toContain("Organization");
  expect(types).toContain("BreadcrumbList");
  expect(types).not.toContain("Product");
  const org = blocks.find((b) => b["@type"] === "Organization");
  expect(org.email).toBe("wamakgroup@gmail.com");
  expect(org.telephone).toBeUndefined();
});

test("content stress: long names and a missing image never break the layout", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await page.goto("/styleguide#stress");
  await settle(page);
  const stress = page.getByTestId("stress");
  await expect(stress.getByRole("img", { name: "Image to be supplied" })).toBeVisible();
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(0);
  const box = await stress.boundingBox();
  expect(box!.x + box!.width).toBeLessThanOrEqual(360);
});
