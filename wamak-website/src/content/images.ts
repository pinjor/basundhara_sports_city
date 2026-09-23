import type { MaterialVariant } from "@/components/brand/MaterialPlaceholder";
import { categories } from "./categories";
import { products } from "./products";

/**
 * Image manifest. Every image slot on the site is listed here.
 * status "temp" renders a labelled MaterialPlaceholder; "final" renders
 * `src` through next/image. To publish a real photo: add the file under
 * public/images/, set src, set status "final", keep the alt accurate.
 */
export type ImageEntry = {
  id: string;
  alt: string;
  /** CSS aspect-ratio of the slot, e.g. "4 / 5". */
  aspect: string;
  /** Brief for the photographer: the ideal real shot. */
  brief: string;
  status: "temp" | "final";
  src?: string;
  width?: number;
  height?: number;
  placeholder: MaterialVariant;
  seed?: number;
};

const base: ImageEntry[] = [
  { id: "hero-jute", alt: "Close-up of golden jute fibre", aspect: "4 / 5", brief: "Macro of combed golden jute fibre in soft side light; warm, shallow depth of field.", status: "temp", placeholder: "fibre", seed: 11 },
  { id: "hero-basket", alt: "Detail of a hand-woven basket", aspect: "3 / 4", brief: "Tight crop of a hand-woven jute or natural-fibre basket showing the weave.", status: "temp", placeholder: "weave" },
  { id: "hero-loofah", alt: "Cut section of dried natural loofah", aspect: "1 / 1", brief: "Top-down cross-section of dried loofah on an ivory surface.", status: "temp", placeholder: "loofah", seed: 5 },
  { id: "material-story", alt: "Natural jute fibre drying in daylight", aspect: "16 / 9", brief: "Wide texture shot of jute, sisal or loofah material in natural light; no people, no buildings.", status: "temp", placeholder: "fibre", seed: 31 },
  { id: "catalogue", alt: "Woven jute texture", aspect: "4 / 3", brief: "Styled flat-lay of catalogue product samples on linen (once a catalogue exists).", status: "temp", placeholder: "weave", seed: 4 },
  { id: "sourcing-chapter", alt: "Plied sisal rope", aspect: "4 / 5", brief: "Coiled sisal rope or twine, macro, warm light.", status: "temp", placeholder: "twine" },
];

const categoryImages: ImageEntry[] = categories.map((c, i) => ({
  id: c.imageId,
  alt: `${c.name}: representative material texture`,
  aspect: "4 / 5",
  brief: `Hero product photograph for ${c.name.toLowerCase()}: real WAMAK-sourced products, natural light, ivory or linen ground.`,
  status: "temp",
  placeholder: c.material,
  seed: 40 + i,
}));

// Alternate placeholder textures within a category so rows don't repeat one texture.
const altTexture: Partial<Record<string, MaterialVariant>> = {
  "jute-eco-friendly": "weave",
  "handicrafts-home-decor": "twine",
  "sisal-natural-fibre": "fibre",
  "customized-sourcing": "twine",
};

const productImages: ImageEntry[] = products.map((p, i) => {
  const cat = categories.find((c) => c.slug === p.category)!;
  const indexInCategory = products.filter((x) => x.category === p.category).indexOf(p);
  const alt = altTexture[cat.slug];
  return {
    id: `product-${p.slug}`,
    alt: `${p.name}: product photograph to be supplied`,
    aspect: "1 / 1",
    brief: `Square product photograph of ${p.name.toLowerCase()} on a neutral ground, plus one detail shot.`,
    status: "temp",
    placeholder: alt && indexInCategory % 2 === 1 ? alt : cat.material,
    seed: 100 + i,
  };
});

export const images: ImageEntry[] = [...base, ...categoryImages, ...productImages];

export function getImage(id: string): ImageEntry {
  const img = images.find((i) => i.id === id);
  if (!img) throw new Error(`Image "${id}" is missing from src/content/images.ts`);
  return img;
}
