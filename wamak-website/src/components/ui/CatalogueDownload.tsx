"use client";

import { Button } from "@/components/ui/Button";
import { track } from "@/lib/analytics";

/** Direct download link for the catalogue PDF. Rendered only once a file exists. */
export function CatalogueDownload({ href }: { href: string }) {
  return (
    <Button href={href} icon="download" download prefetch={false} onClick={() => track("catalogue_download")}>
      Download catalogue (PDF)
    </Button>
  );
}
