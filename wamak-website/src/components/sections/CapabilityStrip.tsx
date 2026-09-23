import { Icon } from "@/components/ui/Icon";
import { home } from "@/content/home";

/** Quiet row of true capabilities. No numbers. */
export function CapabilityStrip() {
  return (
    <section aria-label="Capabilities" className="surface-ivory">
      <div className="container-site">
        <ul className="grid grid-cols-1 border-y border-line sm:grid-cols-2 lg:grid-cols-5">
          {home.capabilities.map((c, i) => (
            <li
              key={c.label}
              className={`flex items-center gap-3 py-5 text-[0.9375rem] font-medium text-navy-900 lg:justify-center lg:px-4 ${
                i > 0 ? "border-t border-line sm:border-t-0 lg:border-s" : ""
              } ${i % 2 === 1 ? "sm:ps-6 lg:ps-4" : ""} ${i > 1 ? "sm:border-t lg:border-t-0" : ""}`}
            >
              <Icon name={c.icon} className="shrink-0 text-leaf-700" />
              {c.label}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
