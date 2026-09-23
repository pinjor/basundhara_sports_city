"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { categories } from "@/content/categories";
import { cn } from "@/lib/cn";
import { CategoryTile } from "./CategoryTile";

const ranges = categories.filter((c) => c.kind === "range");
const sourcing = categories.find((c) => c.kind === "sourcing")!;
// Filter values come only from content that exists.
const materials = [...new Set(ranges.flatMap((c) => c.materials))];
const uses = [...new Set(ranges.flatMap((c) => c.uses))];

function Chips({
  label,
  values,
  value,
  onChange,
}: {
  label: string;
  values: string[];
  value: string | null;
  onChange: (v: string | null) => void;
}) {
  return (
    <div role="group" aria-label={label} className="flex flex-wrap items-center gap-2">
      <span className="me-2 w-full text-small font-semibold text-ink-900 sm:w-auto">{label}</span>
      {[null, ...values].map((v) => {
        const active = value === v;
        return (
          <button
            key={v ?? "all"}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(v)}
            className={cn(
              "inline-flex min-h-11 items-center rounded-full border px-4 text-small font-medium transition-colors duration-150",
              active ? "border-navy-900 bg-navy-900 text-ivory-50" : "border-field text-navy-900 hover:border-navy-900",
            )}
          >
            {v ?? "All"}
          </button>
        );
      })}
    </div>
  );
}

/** Category tiles with material / use filters. The sourcing desk is always shown. */
export function ProductsHub() {
  const [material, setMaterial] = useState<string | null>(null);
  const [use, setUse] = useState<string | null>(null);
  const shown = ranges.filter((c) => (!material || c.materials.includes(material)) && (!use || c.uses.includes(use)));

  return (
    <div>
      <div className="flex flex-col gap-4 border-y border-line py-6">
        <Chips label="Material" values={materials} value={material} onChange={setMaterial} />
        <Chips label="Use" values={uses} value={use} onChange={setUse} />
      </div>
      <p className="mt-6 text-small text-ink-600" aria-live="polite">
        {shown.length === ranges.length ? `All ${ranges.length} product families` : `${shown.length} of ${ranges.length} product families`}
        {(material || use) && (
          <button
            type="button"
            onClick={() => {
              setMaterial(null);
              setUse(null);
            }}
            className="ms-3 inline-flex min-h-11 items-center font-semibold text-leaf-700 underline underline-offset-4"
          >
            Clear filters
          </button>
        )}
      </p>

      <ul className="mt-8 grid gap-x-8 gap-y-14 sm:grid-cols-2 lg:grid-cols-3">
        {shown.map((c) => (
          <li key={c.slug}>
            <CategoryTile category={c} aspect="4 / 5" headingLevel="h2" />
          </li>
        ))}
        <li className="surface-navy relative flex flex-col justify-between gap-8 rounded-card p-8 sm:col-span-2 lg:col-span-1">
          <Icon name="customize" size={32} className="text-jute-300" />
          <div>
            <h2 className="text-h3">{sourcing.name}</h2>
            <p className="mt-3 text-navy-200">{sourcing.summary}</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button href={`/products/${sourcing.slug}`} variant="inverse">
              How it works
            </Button>
            <Button href={`/request-quote?category=${sourcing.slug}`} variant="inverse-secondary">
              Send your requirement
            </Button>
          </div>
        </li>
      </ul>
    </div>
  );
}
