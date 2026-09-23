import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { home } from "@/content/home";

/** Asymmetric benefits: a lead statement that stays put, and a ruled list beside it. */
export function WhyWamak() {
  const w = home.why;
  return (
    <section aria-labelledby="why-title" className="surface-ivory py-20 md:py-28">
      <div className="container-site grid-site gap-y-12">
        <div className="col-span-full lg:col-span-5">
          <div className="lg:sticky lg:top-28">
            <h2 id="why-title" className="text-h2">
              {w.title}
            </h2>
            <p className="mt-6 font-display text-h3 font-medium tracking-[-0.015em] text-ink-900">{w.lead}</p>
            <div className="mt-10">
              <Button href="/why-wamak" variant="secondary">
                {w.cta}
              </Button>
            </div>
          </div>
        </div>

        <ul className="col-span-full grid gap-x-10 md:grid-cols-2 lg:col-span-6 lg:col-start-7">
          {w.items.map((item, i) => (
            <li key={item.title} className={`flex flex-col gap-3 border-t border-line py-8 ${i === 0 ? "md:col-span-2 md:pb-12" : ""}`}>
              <Icon name={item.icon} size={28} className="text-leaf-700" />
              <h3 className={i === 0 ? "text-h3" : "text-[1.25rem] leading-tight font-semibold tracking-[-0.015em]"}>{item.title}</h3>
              <p className={i === 0 ? "measure text-body-l text-ink-600" : "text-ink-600"}>{item.body}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
