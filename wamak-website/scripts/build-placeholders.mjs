// Renders every placeholder texture used by the site to public/placeholders/<variant>-<seed>.svg.
// Runs automatically before `dev` and `build` (see package.json). Output is generated, not committed.
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { build } from "esbuild";

const root = path.resolve(import.meta.dirname, "..");
const out = path.join(root, "public/placeholders");
const tmp = path.join(root, "node_modules/.cache/placeholders.cjs");

// Bundle the texture components and the image manifest into one CommonJS file.
await build({
  stdin: {
    contents: `
      export { PlaceholderArt, MATERIAL_VARIANTS } from "./src/components/brand/placeholder-art";
      export { images } from "./src/content/images";
      export { renderToStaticMarkup } from "react-dom/server";
      export { createElement } from "react";
    `,
    resolveDir: root,
    loader: "ts",
  },
  bundle: true,
  platform: "node",
  format: "cjs",
  jsx: "automatic",
  outfile: tmp,
  alias: { "@": path.join(root, "src") },
  logLevel: "error",
});

const require = createRequire(import.meta.url);
const { PlaceholderArt, MATERIAL_VARIANTS, images, renderToStaticMarkup, createElement } = require(tmp);

const files = new Map();
for (const i of images) files.set(`${i.placeholder}-${i.seed ?? 7}`, [i.placeholder, i.seed ?? 7]);
// Seeds 1–12 of every variant cover the styleguide and ad-hoc uses.
for (const v of MATERIAL_VARIANTS) for (let s = 1; s <= 12; s++) files.set(`${v}-${s}`, [v, s]);
// Styleguide seeds beyond 12.
for (const [v, s] of [["fibre", 21]]) files.set(`${v}-${s}`, [v, s]);

rmSync(out, { recursive: true, force: true });
mkdirSync(out, { recursive: true });
let bytes = 0;
for (const [name, [variant, seed]] of files) {
  const svg = renderToStaticMarkup(createElement(PlaceholderArt, { variant, seed }));
  writeFileSync(path.join(out, `${name}.svg`), svg);
  bytes += svg.length;
}
console.log(`placeholders: ${files.size} SVG files, ${(bytes / 1024).toFixed(0)} KB total`);
