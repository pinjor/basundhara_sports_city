// Screenshot review helper: starts `next start`, captures full-page shots of
// the given routes at 390/768/1280/1440, writes 1000px-wide tiles, stops the server.
// Usage: node scripts/review.mjs <outDir> /route [/route...]
import { spawn } from "node:child_process";
import { mkdirSync } from "node:fs";
import { chromium } from "@playwright/test";
import sharp from "sharp";

const [outDir = "screenshots", ...routes] = process.argv.slice(2);
const widths = (process.env.WIDTHS ?? "390,768,1280,1440").split(",").map(Number);
const port = 3100;
mkdirSync(outDir, { recursive: true });

const server = spawn("npx", ["next", "start", "-p", String(port)], { stdio: "ignore", detached: true });
const stop = () => { try { process.kill(-server.pid, "SIGTERM"); } catch {} };
process.on("exit", stop);

for (let i = 0; i < 40; i++) {
  try { await fetch(`http://localhost:${port}/`); break; } catch { await new Promise((r) => setTimeout(r, 500)); }
}

const browser = await chromium.launch();
for (const route of routes.length ? routes : ["/"]) {
  for (const width of widths) {
    const page = await browser.newPage({ viewport: { width, height: 900 } });
    await page.goto(`http://localhost:${port}${route}`, { waitUntil: "load" });
    await page.evaluate(async () => {
      for (let y = 0; y < document.body.scrollHeight; y += 600) { window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 50)); }
      window.scrollTo(0, 0);
    });
    await page.waitForTimeout(1500);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    const name = route === "/" ? "home" : route.slice(1).replace(/\//g, "_");
    const file = `${outDir}/${name}-${width}.png`;
    await page.screenshot({ path: file, fullPage: true });
    const meta = await sharp(file).metadata();
    const step = width < 800 ? 2200 : 1600;
    const n = Math.ceil(meta.height / step);
    for (let t = 0; t < n; t++) {
      const top = t * step;
      await sharp(file).extract({ left: 0, top, width: meta.width, height: Math.min(step, meta.height - top) })
        .resize({ width: Math.min(meta.width, 1000) }).toFile(`${outDir}/${name}-${width}-t${t}.png`);
    }
    console.log(`${name}-${width}: ${meta.height}px, ${n} tiles, overflow ${overflow}px`);
    await page.close();
  }
}
await browser.close();
stop();
process.exit(0);
