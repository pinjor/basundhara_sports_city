import { expect, test } from "@playwright/test";
import { axe } from "./helpers";

const routes = ["/", "/styleguide"];

for (const route of routes) {
  test(`${route} has no axe violations`, async ({ page }) => {
    await page.goto(route);
    const results = await axe(page);
    expect(results.violations, JSON.stringify(results.violations, null, 2)).toEqual([]);
  });

  test(`${route} has no horizontal overflow`, async ({ page }) => {
    await page.goto(route);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow).toBeLessThanOrEqual(0);
  });
}

test("styleguide renders exactly one h1", async ({ page }) => {
  await page.goto("/styleguide");
  await expect(page.locator("h1")).toHaveCount(1);
});
