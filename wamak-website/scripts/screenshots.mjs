// Usage: node scripts/screenshots.mjs <route> <outDir> [widths...]
// Captures full-page screenshots at the given widths (defaults 390/768/1280/1440).
// Scrolls the page first so lazy-loaded images are present.
import { chromium } from "@playwright/test";

const [route = "/", outDir = "screenshots", ...w] = process.argv.slice(2);
const widths = w.length ? w.map(Number) : [390, 768, 1280, 1440];
const base = process.env.BASE_URL ?? "http://localhost:3100";
const reduce = process.env.REDUCED_MOTION === "1";

const browser = await chromium.launch();
for (const width of widths) {
  const page = await browser.newPage({ viewport: { width, height: 900 }, reducedMotion: reduce ? "reduce" : "no-preference" });
  await page.goto(base + route, { waitUntil: "load" });
  await page.evaluate(async () => {
    for (let y = 0; y < document.body.scrollHeight; y += 600) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 60));
    }
    window.scrollTo(0, 0);
  });
  await page.waitForTimeout(1600);
  const name = route === "/" ? "home" : route.replace(/^\//, "").replace(/\//g, "_");
  await page.screenshot({ path: `${outDir}/${name}-${width}.png`, fullPage: true });
  console.log(`${outDir}/${name}-${width}.png`);
  await page.close();
}
await browser.close();
