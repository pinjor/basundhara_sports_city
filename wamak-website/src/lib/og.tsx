import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { site } from "@/content/site";

export const ogSize = { width: 1200, height: 630 };

const font = (weight: 700 | 800) =>
  readFile(join(process.cwd(), `node_modules/@fontsource/manrope/files/manrope-latin-${weight}-normal.woff`));

/**
 * Brand share image: ivory page, navy type, the fibre thread, and the
 * supplied logo on its white plate. Used by every opengraph-image route.
 */
export async function brandOgImage({ eyebrow, title }: { eyebrow?: string; title: string }) {
  const [bold, extra, logo] = await Promise.all([font(700), font(800), readFile(join(process.cwd(), "assets/wamak-logo.png"))]);
  const logoSrc = `data:image/png;base64,${logo.toString("base64")}`;

  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", background: "#F7F5EE", padding: "56px 72px 88px", fontFamily: "Manrope", position: "relative" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", background: "#FFFFFF", borderRadius: 16, padding: 10 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={logoSrc} width={118} height={110} alt="" />
          </div>
          <div style={{ display: "flex", fontSize: 26, color: "#4A5360", fontWeight: 700 }}>Dhaka, Bangladesh</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", maxWidth: 1000 }}>
          {eyebrow && <div style={{ display: "flex", fontSize: 30, color: "#7A5A24", fontWeight: 700, marginBottom: 18 }}>{eyebrow}</div>}
          <div style={{ display: "flex", fontSize: title.length > 48 ? 64 : 76, lineHeight: 1.04, letterSpacing: "-0.03em", color: "#05245C", fontWeight: 800 }}>{title}</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 26, color: "#05245C", fontWeight: 700 }}>
          <span>{site.name}</span>
          <span style={{ color: "#4A5360" }}>{site.brandLine}</span>
        </div>
        {/* The fibre thread runs along the bottom edge, clear of all text. */}
        <svg width="1200" height="48" viewBox="0 0 1200 48" style={{ position: "absolute", left: 0, bottom: 10 }}>
          <path d="M-10 30 C 200 30 320 18 480 20 C 620 22 700 34 800 30 C 850 28 880 8 906 9 C 932 10 936 34 914 36 C 892 38 884 20 904 14 C 980 -2 1080 26 1210 22" stroke="#C9A66B" strokeWidth="3" fill="none" strokeLinecap="round" />
        </svg>
      </div>
    ),
    {
      ...ogSize,
      fonts: [
        { name: "Manrope", data: await bold, weight: 700, style: "normal" },
        { name: "Manrope", data: await extra, weight: 800, style: "normal" },
      ],
    },
  );
}
