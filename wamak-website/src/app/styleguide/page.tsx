import type { Metadata } from "next";
import type { ReactNode } from "react";
import { FibreThread } from "@/components/brand/FibreThread";
import { Logo } from "@/components/brand/Logo";
import { ManifestImage } from "@/components/brand/ManifestImage";
import { MaterialPlaceholder, type MaterialVariant } from "@/components/brand/MaterialPlaceholder";
import { Monogram } from "@/components/brand/Monogram";
import { ProductCard } from "@/components/product/ProductCard";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import type { Product } from "@/content/products";
import { Button } from "@/components/ui/Button";
import { Checkbox, Field, Input, Select, Textarea } from "@/components/ui/Field";
import { Icon, type IconName } from "@/components/ui/Icon";
import { TextLink } from "@/components/ui/TextLink";
import { site } from "@/content/site";
import { ReplayThread } from "./ReplayThread";

export const metadata: Metadata = {
  title: "Styleguide",
  robots: { index: false, follow: false },
};

const palette = [
  { token: "navy-900", hex: "#05245C", use: "Brand, headings, header, primary buttons", text: "ivory-50 · 13.6:1" },
  { token: "navy-950", hex: "#031738", use: "Deepest sections, footer", text: "ivory-50 · 16.3:1" },
  { token: "leaf-500", hex: "#3C9426", use: "Leaf accent, thread — graphics only", text: "Graphics · 3.5:1 on ivory" },
  { token: "leaf-700", hex: "#287433", use: "Links, focus ring on light", text: "On ivory · 5.3:1" },
  { token: "ivory-50", hex: "#F7F5EE", use: "Main page background", text: "ink-900 · 14.7:1" },
  { token: "jute-300", hex: "#C9A66B", use: "Material accent, rules, highlights on navy", text: "On navy · 6.5:1" },
  { token: "ink-900", hex: "#1B222B", use: "Body text", text: "On ivory · 14.7:1" },
  { token: "mist-100", hex: "#E9EEF3", use: "Cool secondary surfaces, form panels", text: "ink-900 · 13.7:1" },
  { token: "white", hex: "#FFFFFF", use: "Cards on ivory, form fields", text: "ink-900 · 16.0:1" },
] as const;

const support = [
  { token: "ink-600", hex: "#4A5360", use: "Secondary text on light (7.1:1)" },
  { token: "jute-700", hex: "#7A5A24", use: "Jute-toned text on light (5.8:1)" },
  { token: "navy-200", hex: "#B9C4D8", use: "Secondary text on navy (8.5:1)" },
  { token: "navy-800", hex: "#0B3272", use: "Hover on navy fills" },
  { token: "field", hex: "#767063", use: "Form borders (4.9:1 on white)" },
  { token: "line", hex: "#DDD6C6", use: "Decorative hairlines only" },
  { token: "danger", hex: "#B3261E", use: "Errors (6.5:1 on white)" },
] as const;

const swatchBg: Record<string, string> = {
  "navy-900": "bg-navy-900",
  "navy-950": "bg-navy-950",
  "leaf-500": "bg-leaf-500",
  "leaf-700": "bg-leaf-700",
  "ivory-50": "bg-ivory-50",
  "jute-300": "bg-jute-300",
  "ink-900": "bg-ink-900",
  "mist-100": "bg-mist-100",
  white: "bg-white",
  "ink-600": "bg-ink-600",
  "jute-700": "bg-jute-700",
  "navy-200": "bg-navy-200",
  "navy-800": "bg-navy-800",
  field: "bg-field",
  line: "bg-line",
  danger: "bg-danger",
};

const typeScale = [
  { name: "Display", cls: "text-display font-extrabold", range: "44 → 80px · Manrope 800 · −0.035em", sample: "From Bangladesh to the world" },
  { name: "H1", cls: "text-h1 font-bold", range: "40 → 64px · Manrope 700 · −0.03em", sample: "Reliable sourcing from Bangladesh" },
  { name: "H2", cls: "text-h2 font-bold", range: "32 → 48px · Manrope 700 · −0.025em", sample: "A sourcing partner on the ground" },
  { name: "H3", cls: "text-h3 font-semibold", range: "22 → 30px · Manrope 600 · −0.02em", sample: "Jute & eco-friendly products" },
] as const;

const materials: { variant: MaterialVariant; label: string; alt: string }[] = [
  { variant: "fibre", label: "fibre — jute macro", alt: "Macro photograph of combed golden jute fibre" },
  { variant: "weave", label: "weave — basketry", alt: "Close view of a hand-woven jute basket" },
  { variant: "twine", label: "twine — sisal rope", alt: "Plied natural sisal rope in soft daylight" },
  { variant: "loofah", label: "loofah — cellular", alt: "Cut section of a dried natural loofah" },
  { variant: "harvest", label: "harvest — agriculture", alt: "Close view of fresh pineapple skin" },
  { variant: "tide", label: "tide — seafood", alt: "Estuary water in the Bangladesh delta" },
  { variant: "canvas", label: "canvas — art", alt: "Primed linen canvas with a soft painted wash" },
];

const productIcons: IconName[] = [
  "fibre", "leaf", "package", "quality", "document", "ship",
  "globe", "sample", "customize", "handshake", "factory", "pin",
];
const uiIcons: IconName[] = [
  "arrowRight", "external", "plus", "minus", "close", "menu", "chevronDown",
  "check", "upload", "mail", "phone", "download", "addToList", "rfq", "info", "alert",
];

const spacing = [4, 8, 12, 16, 24, 32, 48, 64, 96, 128];

const STRESS_PRODUCT: Product = {
  slug: "stress-test",
  category: "handicrafts-home-decor",
  name: "Extra-large hand-woven natural fibre storage basket set with reinforced handles, removable cotton lining and custom colour banding",
  summary:
    "A deliberately long description used to check that cards, clamps and wrapping behave when real product copy runs longer than expected, including in narrow columns on small phones.",
  features: [],
  specs: [],
  privateLabel: true,
};

function Section({
  id,
  title,
  intro,
  children,
  surface = "ivory",
}: {
  id: string;
  title: string;
  intro?: ReactNode;
  children: ReactNode;
  surface?: "ivory" | "navy" | "white";
}) {
  const bg = surface === "navy" ? "surface-navy" : surface === "white" ? "bg-white" : "surface-ivory";
  return (
    <section id={id} aria-labelledby={`${id}-title`} className={`${bg} border-t border-line py-16 md:py-24`}>
      <div className="container-site">
        <div className="grid-site mb-10 gap-y-3 md:mb-14">
          <h2 id={`${id}-title`} className="col-span-full text-h2 lg:col-span-5">
            {title}
          </h2>
          {intro && (
            <div
              className={`col-span-full measure text-body-l lg:col-span-6 lg:col-start-7 ${
                surface === "navy" ? "text-navy-200" : "text-ink-600"
              }`}
            >
              {intro}
            </div>
          )}
        </div>
        {children}
      </div>
    </section>
  );
}

export default function StyleguidePage() {
  return (
    <main id="main">
      {/* ---------- Header strip ---------- */}
      <header className="surface-ivory">
        <div className="container-site flex items-center justify-between gap-6 py-4">
          <Logo height={60} priority />
          <p className="text-small text-ink-600">Design system, Phase 1 — internal page, not indexed</p>
        </div>
      </header>

      {/* ---------- Hero composition study ---------- */}
      <section aria-labelledby="study-title" className="surface-ivory relative overflow-hidden">
        <div className="container-site grid-site relative items-center gap-y-12 pt-10 pb-20 md:pt-16 lg:min-h-[calc(100dvh-92px)] lg:pb-24">
          <div className="relative z-10 col-span-full lg:col-span-7">
            <p className="hero-reveal mb-6 flex items-center gap-2 text-small font-medium text-ink-600">
              <Icon name="pin" size={18} className="text-leaf-700" />
              {site.location}
            </p>
            <h1 id="study-title" className="hero-reveal text-display font-extrabold" style={{ animationDelay: "60ms" }}>
              Reliable sourcing from Bangladesh, built for global buyers.
            </h1>
            <p className="hero-reveal mt-8 measure text-body-l text-ink-600" style={{ animationDelay: "140ms" }}>
              WAMAK GROUP connects international buyers with jute, natural fibres, handicrafts, home décor,
              agriculture, seafood, artwork and customized sourcing from Bangladesh.
            </p>
            <div className="hero-reveal mt-10 flex flex-wrap items-center gap-x-4 gap-y-4" style={{ animationDelay: "200ms" }}>
              <Button href="#forms" className="w-full sm:w-auto">
                Request a quote
              </Button>
              <Button href="#materials" variant="secondary" className="w-full sm:w-auto">
                Explore products
              </Button>
              <TextLink href="#type" className="inline-flex min-h-11 items-center gap-2 sm:ms-2">
                <Icon name="download" size={18} />
                Download catalogue
              </TextLink>
            </div>
          </div>

          {/* Editorial mosaic: three material studies, deliberately unequal. */}
          <div className="relative col-span-full md:col-span-6 md:col-start-2 lg:col-span-5 lg:col-start-8">
            <div className="grid grid-cols-6 grid-rows-[auto_auto] gap-3 md:gap-4">
            <MaterialPlaceholder
              variant="fibre"
              alt="Macro photograph of combed golden jute fibre"
              className="col-span-4 row-span-2 rounded-card"
              aspect="4 / 5"
              seed={11}
            />
            <MaterialPlaceholder
              variant="weave"
              alt="Close view of a hand-woven jute basket"
              className="col-span-2 self-end rounded-card"
              aspect="3 / 4"
              caption={false}
            />
            <MaterialPlaceholder
              variant="loofah"
              alt="Cut section of a dried natural loofah"
              className="col-span-2 self-start rounded-card"
              aspect="1 / 1"
              seed={5}
              caption={false}
            />
            </div>
            {/* The thread stitches the three materials together and runs off the page edge. */}
            <FibreThread
              variant="hero"
              tone="leaf"
              draw
              duration={1}
              delay={0.2}
              strokeWidth={1.75}
              className="pointer-events-none absolute -top-[8%] -right-[25%] -bottom-[12%] -left-[15%] h-[120%] w-[140%]"
            />
          </div>
        </div>
      </section>

      {/* ---------- Colour ---------- */}
      <Section
        id="colour"
        title="Colour"
        intro={
          <p>
            Navy carries trust and most of the weight. Ivory is the page. Jute is the material accent. Leaf green is
            rationed — the thread, the logo leaf and interactive states on light surfaces. The page never turns
            “eco-green”. Full pairing results live in <code className="font-mono text-small">docs/contrast.md</code>.
          </p>
        }
      >
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {palette.map((c) => (
            <li key={c.token} className="overflow-hidden rounded-card border border-line bg-white">
              <div className={`h-28 ${swatchBg[c.token]} ${c.token === "white" || c.token === "ivory-50" ? "border-b border-line" : ""}`} />
              <div className="flex flex-col gap-1 p-4">
                <p className="flex items-baseline justify-between gap-4 font-display font-semibold text-navy-900">
                  <span>{c.token}</span>
                  <span className="font-mono text-small font-normal text-ink-600">{c.hex}</span>
                </p>
                <p className="text-small text-ink-900">{c.use}</p>
                <p className="text-small text-ink-600">{c.text}</p>
              </div>
            </li>
          ))}
        </ul>
        <h3 className="mt-14 mb-5 text-h3">Supporting tones</h3>
        <ul className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-7">
          {support.map((c) => (
            <li key={c.token} className="flex flex-col gap-2">
              <div className={`h-14 rounded-control ${swatchBg[c.token]}`} />
              <p className="font-display text-small font-semibold text-navy-900">{c.token}</p>
              <p className="-mt-1 text-[0.8125rem] leading-snug text-ink-600">{c.use}</p>
            </li>
          ))}
        </ul>
      </Section>

      {/* ---------- Type ---------- */}
      <Section
        id="type"
        title="Typography"
        intro={
          <p>
            Manrope for display and headings, set tight and large so the type itself does the work. Inter for body
            and interface. Sentence case throughout — no tracked capitals, no highlighted words.
          </p>
        }
      >
        <div className="flex flex-col divide-y divide-line border-y border-line">
          {typeScale.map((t) => (
            <div key={t.name} className="grid-site items-baseline gap-y-2 py-8">
              <p className="col-span-full text-small text-ink-600 lg:col-span-3">
                <span className="block font-semibold text-ink-900">{t.name}</span>
                {t.range}
              </p>
              <p className={`col-span-full font-display text-navy-900 lg:col-span-9 ${t.cls}`} style={{ textWrap: "balance" }}>
                {t.sample}
              </p>
            </div>
          ))}
          <div className="grid-site gap-y-2 py-8">
            <p className="col-span-full text-small text-ink-600 lg:col-span-3">
              <span className="block font-semibold text-ink-900">Body large</span>18 → 20px · Inter 400 · 1.6
            </p>
            <p className="col-span-full measure text-body-l lg:col-span-7">
              Tell us the product, the quantity and where it needs to arrive. We review the requirement, identify
              suitable producers in Bangladesh and return a quotation with the commercial terms that apply.
            </p>
          </div>
          <div className="grid-site gap-y-2 py-8">
            <p className="col-span-full text-small text-ink-600 lg:col-span-3">
              <span className="block font-semibold text-ink-900">Body</span>16 → 17px · Inter 400 · 1.6
            </p>
            <p className="col-span-full measure lg:col-span-7">
              Minimum order quantities vary by product and are confirmed in the quotation. Samples are available
              depending on the product and terms. Specifications not shown here are confirmed on request.
            </p>
          </div>
          <div className="grid-site gap-y-2 py-8">
            <p className="col-span-full text-small text-ink-600 lg:col-span-3">
              <span className="block font-semibold text-ink-900">Small</span>14px · Inter 400/500
            </p>
            <p className="col-span-full text-small text-ink-600 lg:col-span-7">
              Availability of agricultural products and seafood can be seasonal and depends on destination-country
              regulations.
            </p>
          </div>
        </div>
      </Section>

      {/* ---------- Thread ---------- */}
      <Section
        id="thread"
        title="The fibre thread"
        intro={
          <p>
            One device, used consistently: a single fine jute thread with one small loop. It draws itself once in
            the hero, runs through the sourcing process, becomes the route line on the markets map and divides
            category heroes. Nothing else decorates the site.
          </p>
        }
      >
        <div className="grid gap-12 lg:grid-cols-12">
          <div className="lg:col-span-8">
            <p className="mb-4 text-small font-semibold text-ink-900">Hero draw — ≤ 1.2s, once, fully drawn with reduced motion</p>
            <ReplayThread>
              <div className="rounded-card border border-line bg-white p-4">
                <FibreThread variant="hero" tone="leaf" draw duration={1} delay={0.2} className="aspect-[5/4] w-full" />
              </div>
            </ReplayThread>
          </div>
          <div className="flex flex-col gap-10 lg:col-span-4">
            <div>
              <p className="mb-4 text-small font-semibold text-ink-900">Divider — category heroes</p>
              <FibreThread variant="divider" tone="jute" className="h-8 w-full" />
            </div>
            <div>
              <p className="mb-4 text-small font-semibold text-ink-900">Short — captions and small spaces</p>
              <FibreThread variant="short" tone="navy" className="h-8 w-60" />
            </div>
            <div className="flex items-start gap-6">
              <FibreThread variant="vertical" tone="leaf" className="h-56 w-8 shrink-0" />
              <p className="text-small text-ink-600">
                Vertical — the “How we work” spine. In Phase 2 it fills with scroll progress; no scroll-jacking.
              </p>
            </div>
          </div>
        </div>
      </Section>

      {/* ---------- Buttons & links ---------- */}
      <Section id="buttons" title="Buttons and links" intro={<p>Labels say what happens. One primary action per block.</p>}>
        <div className="grid gap-10 lg:grid-cols-2">
          <div className="flex flex-col gap-6">
            <div className="flex flex-wrap items-center gap-4">
              <Button>Request a quote</Button>
              <Button variant="secondary">Explore products</Button>
              <Button variant="secondary" icon="addToList">
                Add to RFQ
              </Button>
            </div>
            <div className="flex flex-wrap items-center gap-4">
              <Button size="sm">Send your requirement</Button>
              <Button size="sm" variant="secondary" icon="upload">
                Upload specification
              </Button>
              <Button size="sm" disabled>
                Sending…
              </Button>
            </div>
            <p className="measure">
              Inline links look like this: read the <TextLink href="#buttons">commercial terms</TextLink> before
              requesting samples, or <TextLink href="#buttons">ask about private label</TextLink>.
            </p>
          </div>
          <div className="surface-navy flex flex-col gap-6 rounded-card p-8">
            <div className="flex flex-wrap items-center gap-4">
              <Button variant="inverse">Request a quote</Button>
              <Button variant="inverse-secondary">Download catalogue</Button>
            </div>
            <p className="text-navy-200">
              On navy chapters, links switch tone:{" "}
              <TextLink href="#buttons" tone="inverse">
                see how we work
              </TextLink>
              . The focus ring turns jute here, because leaf green drops below 3:1 on navy.
            </p>
          </div>
        </div>
      </Section>

      {/* ---------- Forms ---------- */}
      <Section
        id="forms"
        title="Form fields"
        intro={
          <p>
            Visible labels, generous 48px targets, specific errors that don’t apologise. Most RFQ fields are
            optional, so the few that aren’t say “Required”.
          </p>
        }
      >
        <form className="grid gap-x-8 gap-y-7 rounded-card bg-mist-100 p-6 md:grid-cols-2 md:p-10" noValidate>
          <Field label="Product or category" required hint="For example: jute tote bags, natural loofah, mud crab.">
            {(a) => <Input {...a} name="product" placeholder="What do you need?" />}
          </Field>
          <Field label="Quantity" required error="Enter a quantity, for example 5,000 pieces or 2 × 40ft containers.">
            {(a) => <Input {...a} name="qty" defaultValue="" />}
          </Field>
          <Field label="Preferred Incoterm">
            {(a) => (
              <Select {...a} name="incoterm" defaultValue="">
                <option value="" disabled>
                  Choose a term
                </option>
                <option>EXW</option>
                <option>FOB</option>
                <option>CFR</option>
                <option>CIF</option>
                <option>Other</option>
                <option>Not sure yet</option>
              </Select>
            )}
          </Field>
          <Field label="Destination port or airport" hint="Disabled state">
            {(a) => <Input {...a} name="port" disabled placeholder="Unavailable in this state" />}
          </Field>
          <Field label="Specification and notes" className="md:col-span-2">
            {(a) => <Textarea {...a} name="notes" placeholder="Size, material, colour, packing, labelling…" />}
          </Field>
          <Checkbox
            className="md:col-span-2"
            name="consent"
            label="I agree that WAMAK GROUP may use these details to respond to my request."
          />
          <Checkbox
            className="md:col-span-2"
            name="consent-error"
            label="Consent — error state"
            error="Please confirm consent so we can reply to your request."
          />
        </form>
      </Section>

      {/* ---------- Icons ---------- */}
      <Section id="icons" title="Icons" intro={<p>Lucide base, 1.5px stroke, round joins, 24px grid. One library only.</p>}>
        <div className="grid gap-12 lg:grid-cols-2">
          <ul className="grid grid-cols-3 gap-px overflow-hidden rounded-card border border-line bg-line sm:grid-cols-4">
            {productIcons.map((n) => (
              <li key={n} className="flex flex-col items-center gap-3 bg-white px-2 py-6 text-navy-900">
                <Icon name={n} size={28} />
                <span className="text-small text-ink-600">{n}</span>
              </li>
            ))}
          </ul>
          <ul className="grid grid-cols-4 content-start gap-px overflow-hidden rounded-card border border-line bg-line">
            {uiIcons.map((n) => (
              <li key={n} className="flex flex-col items-center gap-2 bg-white px-2 py-4 text-navy-900">
                <Icon name={n} size={22} />
                <span className="text-[0.75rem] text-ink-600">{n}</span>
              </li>
            ))}
          </ul>
        </div>
      </Section>

      {/* ---------- Materials ---------- */}
      <Section
        id="materials"
        title="Material placeholders"
        intro={
          <p>
            Until real WAMAK photography exists, every image slot shows a material study — never a stock photo of
            factories, ships, offices or people. Each one is labelled so nobody mistakes it for the real thing.
          </p>
        }
      >
        <ul className="grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-7">
          {materials.map((m, i) => (
            <li key={m.variant} className="flex flex-col gap-3">
              <MaterialPlaceholder variant={m.variant} alt={m.alt} aspect="4 / 5" seed={i + 3} caption={false} className="rounded-card" />
              <span className="text-small text-ink-600">{m.label}</span>
            </li>
          ))}
        </ul>
        <div className="mt-10 grid gap-4 md:grid-cols-3">
          <MaterialPlaceholder variant="fibre" alt="Macro photograph of combed golden jute fibre" aspect="16 / 9" className="rounded-card md:col-span-2" seed={21} />
          <MaterialPlaceholder variant="canvas" alt="Primed linen canvas with a soft painted wash" aspect="1 / 1" className="rounded-card" />
        </div>
      </Section>

      {/* ---------- Brand marks ---------- */}
      <Section
        id="brand"
        title="Logo and leadership marks"
        surface="navy"
        intro={
          <p>
            The logo is used exactly as supplied. The PNG is small (332 × 311) with a white ground, so it stays
            compact and sits on a white plate over navy until the vector master arrives. Leadership portraits are
            monograms until real photographs are supplied.
          </p>
        }
      >
        <div className="grid items-start gap-10 lg:grid-cols-12">
          <div className="flex flex-wrap items-center gap-8 lg:col-span-5">
            <div className="rounded-card bg-ivory-50 p-6">
              <Logo height={72} href={null} />
            </div>
            <Logo height={72} surface="dark" href={null} />
          </div>
          <ul className="grid grid-cols-2 gap-6 lg:col-span-6 lg:col-start-7">
            {site.leadership.map((p) => (
              <li key={p.name} className="flex flex-col gap-4">
                <Monogram initials={p.initials} name={p.name} tone="deep" />
                <div>
                  <p className="font-display text-body-l font-semibold text-ivory-50">{p.name}</p>
                  <p className="text-small text-navy-200">{p.role}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </Section>

      {/* ---------- Space & radius ---------- */}
      <Section id="space" title="Space and radius" intro={<p>Spacing steps are fixed; section rhythm varies on purpose.</p>}>
        <div className="grid gap-12 lg:grid-cols-2">
          <ul className="flex min-w-0 flex-col gap-3">
            {spacing.map((s) => (
              <li key={s} className="flex items-center gap-4">
                <span className="w-12 text-end font-mono text-small text-ink-600">{s}</span>
                <span className="h-3 max-w-full min-w-0 rounded-[2px] bg-jute-300" style={{ width: s * 2.5 }} />
              </li>
            ))}
          </ul>
          <div className="flex flex-wrap items-end gap-6">
            <div className="flex flex-col gap-2">
              <div className="size-24 rounded-control border border-navy-900 bg-white" />
              <span className="text-small text-ink-600">4px — controls</span>
            </div>
            <div className="flex flex-col gap-2">
              <div className="size-24 rounded-card bg-jute-300" />
              <span className="text-small text-ink-600">12px — image cards</span>
            </div>
            <div className="flex flex-col gap-2">
              <div className="h-24 w-40 bg-navy-900" />
              <span className="text-small text-ink-600">0px — full-bleed</span>
            </div>
          </div>
        </div>
      </Section>

      {/* ---------- Content stress test ---------- */}
      <Section
        id="stress"
        title="Content stress test"
        intro={<p>Long names, long unbroken words and a missing image entry must never break the layout or the page.</p>}
      >
        <div data-testid="stress" className="grid gap-8 md:grid-cols-3">
          <ProductCard product={STRESS_PRODUCT} />
          <ProductCard product={{ ...STRESS_PRODUCT, slug: "missing-image-entry", name: "Handwovenjutetotebagwithreinforcedgussetandcottonlining" }} />
          <div className="flex flex-col gap-4">
            <ManifestImage id="this-id-does-not-exist" className="rounded-card" />
            <Breadcrumbs
              items={[
                { name: "Products", href: "/products" },
                { name: "Handicrafts & home décor", href: "/products/handicrafts-home-decor" },
                { name: STRESS_PRODUCT.name, href: "/styleguide#stress" },
              ]}
            />
          </div>
        </div>
      </Section>

      <footer className="surface-deep py-10">
        <div className="container-site flex flex-wrap items-center justify-between gap-4 text-small text-navy-200">
          <p>{site.name} — {site.brandLine}</p>
          <FibreThread variant="short" tone="jute" className="h-6 w-40" />
        </div>
      </footer>
    </main>
  );
}
