import type { Metadata } from "next";
import Image from "next/image";
import { PageHero } from "@/components/sections/PageHero";
import { Button } from "@/components/ui/Button";
import { images } from "@/content/images";

export const metadata: Metadata = {
  title: "Gallery",
  description: "Photographs of WAMAK GROUP products and materials from Bangladesh.",
  alternates: { canonical: "/resources/gallery" },
};

/**
 * Shows only real photography (manifest entries with status "final").
 * Until photos are supplied, it says so plainly instead of showing stand-ins.
 */
export default function GalleryPage() {
  const photos = images.filter((i) => i.status === "final" && i.src);
  return (
    <>
      <PageHero
        crumbs={[
          { name: "Resources", href: "/resources/catalogue" },
          { name: "Gallery", href: "/resources/gallery" },
        ]}
        title="Gallery"
        intro={
          photos.length
            ? "Products and materials we source in Bangladesh."
            : "Product photography is being prepared. Until it is ready, browse the ranges or request the catalogue, and we can send photos of specific products on request."
        }
        actions={
          photos.length ? undefined : (
            <>
              <Button href="/products">Browse products</Button>
              <Button href="/contact?topic=catalogue" variant="secondary">
                Request photos or the catalogue
              </Button>
            </>
          )
        }
      />
      {photos.length > 0 && (
        <section aria-label="Photographs" className="surface-ivory pb-20 md:pb-28">
          <ul className="container-site columns-1 gap-6 sm:columns-2 lg:columns-3">
            {photos.map((p) => (
              <li key={p.id} className="mb-6 break-inside-avoid">
                <Image src={p.src!} alt={p.alt} width={p.width ?? 1200} height={p.height ?? 1500} sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw" className="h-auto w-full rounded-card" />
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  );
}
