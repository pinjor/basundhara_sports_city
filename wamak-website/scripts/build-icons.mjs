// Regenerates the favicon and Apple touch icon from assets/wamak-logo.png.
// The logo is placed unchanged, centred on a white square; it is never redrawn.
// Usage: npm run build:icons
import sharp from "sharp";
import { renameSync } from "node:fs";

for (const [size, file] of [
  [192, "src/app/icon.png"],
  [180, "src/app/apple-icon.png"],
]) {
  const inner = Math.round(size * 0.86);
  const logo = await sharp("assets/wamak-logo.png").resize(inner, inner, { fit: "contain", background: "#ffffff" }).toBuffer();
  await sharp({ create: { width: size, height: size, channels: 3, background: "#ffffff" } })
    .composite([{ input: logo, gravity: "center" }])
    .png({ palette: true, colours: 64, compressionLevel: 9, effort: 10 })
    .toFile(`${file}.tmp`);
  renameSync(`${file}.tmp`, file);
  console.log(file);
}
