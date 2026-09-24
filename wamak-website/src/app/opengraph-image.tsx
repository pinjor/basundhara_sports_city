import { brandOgImage, ogSize } from "@/lib/og";

export const alt = "WAMAK GROUP: Connecting Bangladesh to the Global Market";
export const size = ogSize;
export const contentType = "image/png";

export default function Image() {
  return brandOgImage({ eyebrow: "B2B exporter and sourcing partner", title: "Reliable sourcing from Bangladesh, built for global buyers." });
}
