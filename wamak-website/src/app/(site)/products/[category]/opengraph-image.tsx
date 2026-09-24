import { categories, getCategory } from "@/content/categories";
import { brandOgImage, ogSize } from "@/lib/og";

export const alt = "WAMAK GROUP product family";
export const size = ogSize;
export const contentType = "image/png";

export function generateStaticParams() {
  return categories.map((c) => ({ category: c.slug }));
}

export default async function Image({ params }: { params: Promise<{ category: string }> }) {
  const c = getCategory((await params).category);
  return brandOgImage({ eyebrow: "From Bangladesh", title: c?.name ?? "Products from Bangladesh" });
}
