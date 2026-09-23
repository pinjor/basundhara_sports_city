import Link from "next/link";
import { JsonLd } from "@/components/brand/JsonLd";
import { cn } from "@/lib/cn";
import { breadcrumbSchema, type Crumb } from "@/lib/schema";

/** Visible trail plus BreadcrumbList JSON-LD. The last crumb is the current page. */
export function Breadcrumbs({ items, className, tone = "default" }: { items: Crumb[]; className?: string; tone?: "default" | "inverse" }) {
  const all = [{ name: "Home", href: "/" }, ...items];
  return (
    <nav aria-label="Breadcrumb" className={cn("text-small", className)}>
      <ol className="flex flex-wrap items-center gap-x-2 gap-y-1">
        {all.map((c, i) => {
          const last = i === all.length - 1;
          return (
            <li key={c.href} className="flex items-center gap-2">
              {i > 0 && (
                <span aria-hidden="true" className={tone === "inverse" ? "text-navy-200" : "text-ink-600"}>
                  /
                </span>
              )}
              {last ? (
                <span aria-current="page" className={tone === "inverse" ? "text-ivory-50" : "text-ink-900"}>
                  {c.name}
                </span>
              ) : (
                <Link
                  href={c.href}
                  className={cn(
                    "inline-flex min-h-8 items-center underline-offset-4 hover:underline",
                    tone === "inverse" ? "text-navy-200 hover:text-ivory-50" : "text-ink-600 hover:text-leaf-700",
                  )}
                >
                  {c.name}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
      <JsonLd data={breadcrumbSchema(all)} />
    </nav>
  );
}
