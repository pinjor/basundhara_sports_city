import AxeBuilder from "@axe-core/playwright";
import type { Page } from "@playwright/test";

/** Wait for running CSS/WAAPI animations so contrast isn't measured mid-fade. */
export async function settle(page: Page) {
  await page.evaluate(() => Promise.all(document.getAnimations().map((a) => a.finished.catch(() => undefined))));
}

export async function axe(page: Page) {
  await settle(page);
  return new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"]).analyze();
}
