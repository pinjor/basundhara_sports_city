import { FibreThread } from "@/components/brand/FibreThread";
import { Logo } from "@/components/brand/Logo";
import { Button } from "@/components/ui/Button";
import { site } from "@/content/site";

/**
 * Temporary holding page for Phase 1. The full homepage is built in Phase 2.
 */
export default function Home() {
  return (
    <main id="main" className="surface-ivory relative grid min-h-dvh place-items-center overflow-hidden px-4">
      <div className="relative z-10 flex max-w-2xl flex-col items-start gap-8">
        <Logo height={72} priority />
        <h1 className="text-h1">{site.brandLine}</h1>
        <p className="text-body-l text-ink-600">
          The WAMAK GROUP website is in development. Phase 1 establishes the design system.
        </p>
        <Button href="/styleguide">View the styleguide</Button>
      </div>
      <FibreThread variant="hero" tone="leaf" draw className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 w-full" />
    </main>
  );
}
