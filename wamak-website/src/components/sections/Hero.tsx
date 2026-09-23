import { FibreThread } from "@/components/brand/FibreThread";
import { ManifestImage } from "@/components/brand/ManifestImage";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { TextLink } from "@/components/ui/TextLink";
import { home } from "@/content/home";

/**
 * Homepage hero. The single orchestrated load moment: copy rises in,
 * then the fibre thread stitches the three material images together.
 */
export function Hero() {
  const h = home.hero;
  return (
    <section aria-labelledby="hero-title" className="surface-ivory relative overflow-hidden">
      <div className="container-site grid-site relative items-center gap-y-12 pt-8 pb-16 md:pt-14 md:pb-20 xl:min-h-[min(calc(100dvh-76px),860px)] xl:pb-16">
        <div className="relative z-10 col-span-full lg:col-span-7">
          <p className="hero-reveal mb-6 flex items-center gap-2 text-small font-medium text-ink-600">
            <Icon name="pin" size={18} className="text-leaf-700" />
            {h.location}
          </p>
          <h1 id="hero-title" className="hero-reveal text-display font-extrabold" style={{ animationDelay: "60ms" }}>
            {h.title}
          </h1>
          <p className="hero-reveal mt-8 measure text-body-l text-ink-600" style={{ animationDelay: "140ms" }}>
            {h.intro}
          </p>
          <div className="hero-reveal mt-10 flex flex-wrap items-center gap-4" style={{ animationDelay: "200ms" }}>
            <Button href="/request-quote" className="w-full sm:w-auto">
              {h.primary}
            </Button>
            <Button href="/products" variant="secondary" className="w-full sm:w-auto">
              {h.secondary}
            </Button>
            <TextLink href="/resources/catalogue" className="inline-flex min-h-11 items-center gap-2 sm:ms-2">
              <Icon name="download" size={18} />
              {h.tertiary}
            </TextLink>
          </div>
        </div>

        <div className="relative col-span-full md:col-span-6 md:col-start-2 lg:col-span-5 lg:col-start-8">
          <div className="grid grid-cols-6 gap-3 md:gap-4">
            <ManifestImage id="hero-jute" className="col-span-4 row-span-2 rounded-card" priority />
            <ManifestImage id="hero-basket" className="col-span-2 self-end rounded-card" caption={false} />
            <ManifestImage id="hero-loofah" className="col-span-2 self-start rounded-card" caption={false} />
          </div>
          <FibreThread
            variant="hero"
            tone="leaf"
            draw
            duration={1}
            delay={0.2}
            strokeWidth={1.75}
            className="pointer-events-none absolute -top-[8%] -left-[15%] h-[120%] w-[140%]"
          />
        </div>
      </div>
    </section>
  );
}
