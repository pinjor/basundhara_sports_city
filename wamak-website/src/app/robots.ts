import type { MetadataRoute } from "next";
import { absolute } from "@/lib/schema";

export default function robots(): MetadataRoute.Robots {
  // Keep previews out of search engines until the production domain is set.
  const production = Boolean(process.env.NEXT_PUBLIC_SITE_URL) && process.env.VERCEL_ENV !== "preview";
  return {
    rules: production
      ? { userAgent: "*", allow: "/", disallow: ["/styleguide", "/request-quote/thank-you"] }
      : { userAgent: "*", disallow: "/" },
    sitemap: absolute("/sitemap.xml"),
  };
}
