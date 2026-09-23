"use client";

import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { PENDING } from "@/content/site";
import { track } from "@/lib/analytics";

/** Bottom action bar below the xl breakpoint. WhatsApp appears only once a number exists. */
export function StickyMobileCTA() {
  const pathname = usePathname();
  if (pathname.startsWith("/request-quote")) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-ivory-50 px-4 py-3 xl:hidden print:hidden">
      <div className="mx-auto flex max-w-xl gap-3">
        <Button href="/request-quote" className="flex-1">
          Request a quote
        </Button>
        {PENDING.whatsapp && (
          <a
            href={`https://wa.me/${PENDING.whatsapp.replace(/\D/g, "")}`}
            onClick={() => track("whatsapp_click", { location: "sticky_bar" })}
            className="inline-flex min-h-12 items-center gap-2 rounded-control border border-navy-900 px-4 font-semibold text-navy-900"
          >
            <Icon name="phone" size={20} />
            WhatsApp
          </a>
        )}
      </div>
    </div>
  );
}
