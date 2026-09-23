"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { useForm, useWatch, type Path } from "react-hook-form";
import { Button } from "@/components/ui/Button";
import { Checkbox, Field, Input, Select, Textarea } from "@/components/ui/Field";
import { FileUpload } from "@/components/ui/FileUpload";
import { Icon } from "@/components/ui/Icon";
import { categories, getCategory } from "@/content/categories";
import { countries } from "@/content/countries";
import { productHref } from "@/content/navigation";
import { getProduct } from "@/content/products";
import { site } from "@/content/site";
import { submitRfq } from "@/lib/actions/rfq";
import { track } from "@/lib/analytics";
import { readAttribution } from "@/lib/attribution";
import { cn } from "@/lib/cn";
import { rfq, useRfqList } from "@/lib/rfq-store";
import { CUSTOMIZATION, INCOTERMS, rfqStep1, rfqStep2, rfqStep3, UNITS } from "@/lib/validators";

type Values = {
  category: string;
  product: string;
  quantity: string;
  unit: (typeof UNITS)[number];
  packaging: string;
  customization: string[];
  destinationCountry: string;
  destinationPort: string;
  incoterm: string;
  requiredDate: string;
  targetPrice: string;
  company: string;
  contactName: string;
  email: string;
  phone: string;
  companyCountry: string;
  notes: string;
  consent: boolean;
  website: string; // honeypot
};

const DRAFT_KEY = "wamak:rfq-wizard";
export const SENT_KEY = "wamak:rfq-sent";

const EMPTY: Values = {
  category: "",
  product: "",
  quantity: "",
  unit: "Pieces",
  packaging: "",
  customization: [],
  destinationCountry: "",
  destinationPort: "",
  incoterm: "Not sure",
  requiredDate: "",
  targetPrice: "",
  company: "",
  contactName: "",
  email: "",
  phone: "",
  companyCountry: "",
  notes: "",
  consent: false,
  website: "",
};

const STEPS = [
  { title: "What you need", short: "Product" },
  { title: "Delivery", short: "Delivery" },
  { title: "About you", short: "You" },
] as const;

function loadDraft(): Partial<Values> {
  try {
    return JSON.parse(sessionStorage.getItem(DRAFT_KEY) ?? "{}");
  } catch {
    return {};
  }
}

/**
 * Three-step RFQ. Only product/category, quantity, destination country,
 * company, contact name, business email and consent are required.
 * Progress is saved to sessionStorage; product context flows in from the
 * RFQ list, query parameters (?product=, ?category=, ?privateLabel=1) and
 * the homepage quick inquiry.
 */
export function RfqWizard() {
  const router = useRouter();
  const search = useSearchParams();
  const items = useRfqList();
  const [step, setStep] = useState(0);
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string>();
  const [formError, setFormError] = useState<string>();
  // null = follow the data (open when extras are filled); otherwise the buyer's choice.
  const [extrasToggle, setExtrasToggle] = useState<boolean | null>(null);
  const [pending, startTransition] = useTransition();
  const headingRef = useRef<HTMLHeadingElement>(null);
  const firstRender = useRef(true);

  const form = useForm<Values>({ defaultValues: EMPTY, mode: "onTouched" });
  const { register, handleSubmit, setError, clearErrors, getValues, reset, control, formState } = form;
  const errors = formState.errors;

  // Prefill once: saved draft, then quick inquiry, then URL context.
  useEffect(() => {
    const draft = loadDraft();
    const quick = search.get("from") === "quick" ? rfq.readDraft() : null;
    const next: Values = { ...EMPTY, ...draft };
    if (quick) {
      next.product = next.product || (quick.category ? "" : (quick.product ?? ""));
      next.quantity = next.quantity || (quick.quantity ?? "");
      next.destinationCountry = next.destinationCountry || (quick.country ?? "");
      next.email = next.email || (quick.email ?? "");
      if (quick.category) next.category = quick.category;
    }
    const cat = search.get("category");
    if (cat && getCategory(cat)) next.category = cat;
    const prod = search.get("product");
    if (prod) {
      const [c, s] = prod.split("/");
      const p = getProduct(c, s);
      if (p) {
        rfq.add({ category: p.category, slug: p.slug, name: p.name });
        next.category = next.category || p.category;
      }
    }
    if (search.get("privateLabel") === "1" && !next.customization.includes("Private label")) {
      next.customization = [...next.customization, "Private label"];
    }
    reset(next);
    track("rfq_start", { source: search.get("from") ?? (prod ? "product" : cat ? "category" : "direct") });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Save progress (never the file or the honeypot).
  useEffect(() => {
    const sub = form.subscribe({
      formState: { values: true },
      callback: ({ values: v }) => {
        try {
          const { website: _w, ...rest } = v as Values;
          void _w;
          sessionStorage.setItem(DRAFT_KEY, JSON.stringify(rest));
        } catch {
          /* storage unavailable */
        }
      },
    });
    return sub;
  }, [form]);

  // Move focus to the new step's heading (not on first load).
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    headingRef.current?.focus();
  }, [step]);

  const validateStep = (n: number) => {
    const v = getValues();
    const schema = [rfqStep1, rfqStep2, rfqStep3][n];
    const input = n === 0 ? { ...v, items } : v;
    const result = schema.safeParse(input);
    clearErrors();
    if (result.success) return true;
    let first: Path<Values> | null = null;
    // Report in on-screen order so focus lands on the first field with a problem.
    const order = Object.keys(EMPTY);
    const issues = [...result.error.issues].sort(
      (x, y) => order.indexOf(String(x.path[0])) - order.indexOf(String(y.path[0])),
    );
    for (const issue of issues) {
      const name = issue.path[0] as Path<Values>;
      if (!name || name === ("items" as string)) continue;
      setError(name, { message: issue.message });
      first ??= name;
    }
    // Focus the first field with a problem once the error has rendered.
    if (first) requestAnimationFrame(() => form.setFocus(first!));
    return false;
  };

  const onSubmit = () => {
    setFormError(undefined);
    if (!validateStep(step)) return;
    if (step < 2) {
      track("rfq_step_complete", { step: step + 1 });
      setStep(step + 1);
      return;
    }
    const v = getValues();
    const payload = {
      items,
      category: v.category,
      product: v.product,
      quantity: v.quantity,
      unit: v.unit,
      packaging: v.packaging,
      customization: v.customization,
      destinationCountry: v.destinationCountry,
      destinationPort: v.destinationPort,
      incoterm: v.incoterm,
      requiredDate: v.requiredDate,
      targetPrice: v.targetPrice,
      company: v.company,
      contactName: v.contactName,
      email: v.email,
      phone: v.phone,
      companyCountry: v.companyCountry,
      notes: v.notes,
      consent: v.consent,
      context: readAttribution(),
    };
    const fd = new FormData();
    fd.set("payload", JSON.stringify(payload));
    fd.set("website", v.website);
    if (file) fd.set("file", file);

    startTransition(async () => {
      let res;
      try {
        res = await submitRfq(fd);
      } catch {
        setFormError(`We couldn't send your request just now. Please try again, or email it to ${site.email}.`);
        return;
      }
      if (!res.ok) {
        const fe = res.fieldErrors ?? {};
        setFormError(res.formError ?? (fe.file ? `Your file couldn't be accepted: ${fe.file}` : undefined));
        if (fe.file) {
          // The upload lives in step 1: go back there with the section open.
          setFileError(fe.file);
          setExtrasToggle(true);
          setStep(0);
        }
        // Send the buyer back to the first step with a problem.
        const stepOf = (k: string) => (k in rfqStep1.shape ? 0 : k in rfqStep2.shape ? 1 : 2);
        const keys = Object.keys(fe).filter((k) => k !== "file");
        if (keys.length) setStep(Math.min(...keys.map(stepOf), fe.file ? 0 : 2));
        keys.forEach((k) => setError(k as Path<Values>, { message: fe[k] }));
        return;
      }
      track("rfq_submit", { items: items.length, incoterm: v.incoterm });
      const categoryName = v.category ? (getCategory(v.category)?.name ?? v.category) : "";
      const summary = {
        ref: res.ref,
        email: v.email,
        rows: [
          ["Products", items.length ? items.map((i) => (i.note ? `${i.name} (${i.note})` : i.name)).join(", ") : "—"],
          ["Category", categoryName || "—"],
          ["Product and specification", v.product || "—"],
          ["Quantity", `${v.quantity} ${v.unit.toLowerCase()}`],
          ["Destination", [v.destinationPort, v.destinationCountry].filter(Boolean).join(", ")],
          ["Incoterm", v.incoterm],
          ["Attachment", file?.name ?? "—"],
          ["Company", v.company],
          ["Contact", `${v.contactName}, ${v.email}`],
        ],
      };
      try {
        sessionStorage.setItem(SENT_KEY, JSON.stringify(summary));
        sessionStorage.removeItem(DRAFT_KEY);
        sessionStorage.removeItem("wamak:rfq-draft");
      } catch {
        /* ignore */
      }
      rfq.clear();
      router.push(`/request-quote/thank-you?ref=${encodeURIComponent(res.ref)}`);
    });
  };

  const v = { ...EMPTY, ...useWatch({ control }) } as Values;
  const showExtras = extrasToggle ?? (v.packaging !== "" || v.customization.length > 0 || file !== null);
  const incotermHint = INCOTERMS.find((i) => i.value === v.incoterm)?.hint;

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate aria-labelledby="rfq-step-title" className="flex flex-col">
      {/* Progress */}
      <ol className="grid grid-cols-3 gap-2" aria-label="Progress">
        {STEPS.map((s, i) => {
          const done = i < step;
          const current = i === step;
          return (
            <li key={s.title} aria-current={current ? "step" : undefined} className="flex flex-col gap-2">
              <span className={cn("h-1 rounded-full transition-colors duration-300", done || current ? "bg-navy-900" : "bg-line")} />
              <span className={cn("flex items-center gap-2 text-small", current ? "font-semibold text-navy-900" : "text-ink-600")}>
                {done ? <Icon name="check" size={16} className="text-leaf-700" /> : <span className="tabular-nums">{i + 1}.</span>}
                <span className="sm:hidden">{s.short}</span>
                <span className="hidden sm:inline">{s.title}</span>
                {done && <span className="sr-only">(completed)</span>}
              </span>
            </li>
          );
        })}
      </ol>

      <div key={step} className="mt-10 animate-[step-in_300ms_var(--ease-out-soft)]">
        <h2 id="rfq-step-title" ref={headingRef} tabIndex={-1} className="text-h3 focus:outline-none">
          <span className="sr-only">Step {step + 1} of 3: </span>
          {STEPS[step].title}
        </h2>

        {formError && (
          <p role="alert" className="mt-6 flex items-start gap-2 rounded-control border border-danger bg-white p-4 text-small font-medium text-danger">
            <Icon name="alert" size={18} className="mt-px shrink-0" />
            {formError}
          </p>
        )}

        {/* Step 1: what you need */}
        {step === 0 && (
          <div className="mt-8 flex flex-col gap-7">
            {items.length > 0 && (
              <section aria-labelledby="rfq-items-title" className="rounded-card border border-line bg-ivory-50 p-5">
                <h3 id="rfq-items-title" className="font-display font-semibold text-navy-900">
                  Products on your RFQ list ({items.length})
                </h3>
                <ul className="mt-3 divide-y divide-line">
                  {items.map((item) => {
                    const noteId = `wiz-note-${item.category}-${item.slug}`;
                    return (
                      <li key={`${item.category}/${item.slug}`} className="grid gap-2 py-3 sm:grid-cols-[1fr_16rem_auto] sm:items-center sm:gap-4">
                        <Link href={productHref(item.category, item.slug)} className="font-medium text-navy-900 hover:underline hover:underline-offset-4">
                          {item.name}
                        </Link>
                        <div>
                          <label htmlFor={noteId} className="sr-only">
                            Quantity or notes for {item.name}
                          </label>
                          <input
                            id={noteId}
                            defaultValue={item.note}
                            onBlur={(e) => rfq.setNote(item, e.target.value)}
                            placeholder="Quantity or notes (optional)"
                            className="min-h-11 w-full rounded-control border border-field bg-white px-3 text-small hover:border-navy-900"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => rfq.remove(item)}
                          className="inline-flex min-h-11 items-center justify-self-start text-small font-medium text-ink-600 underline underline-offset-4 hover:text-danger"
                        >
                          Remove<span className="sr-only"> {item.name}</span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
                <p className="mt-2 text-small text-ink-600">
                  <Link href="/products" className="font-medium text-leaf-700 underline underline-offset-4">
                    Add more products
                  </Link>
                </p>
              </section>
            )}

            <div className="grid gap-7 sm:grid-cols-2">
              <Field label="Category" hint="Choose the closest family, or customized sourcing." className="sm:col-span-2">
                {(a) => (
                  <Select {...a} {...register("category")}>
                    <option value="">Not sure / mixed</option>
                    {categories.map((c) => (
                      <option key={c.slug} value={c.slug}>
                        {c.name}
                      </option>
                    ))}
                  </Select>
                )}
              </Field>

              <Field
                label={items.length ? "Anything else about these products" : "Product and specification"}
                required={items.length === 0 && !v.category}
                hint="Size, material, colour, finish, grade, or a reference product. Leave out what you don't know yet."
                error={errors.product?.message}
                className="sm:col-span-2"
              >
                {(a) => <Textarea {...a} {...register("product")} rows={4} />}
              </Field>

              <Field label="Quantity" required hint="Total, or per item if it differs." error={errors.quantity?.message}>
                {(a) => <Input {...a} {...register("quantity")} placeholder="e.g. 5,000" />}
              </Field>
              <Field label="Unit">
                {(a) => (
                  <Select {...a} {...register("unit")}>
                    {UNITS.map((u) => (
                      <option key={u}>{u}</option>
                    ))}
                  </Select>
                )}
              </Field>
            </div>

            <div className="border-t border-line pt-6">
              <button
                type="button"
                aria-expanded={showExtras}
                aria-controls="rfq-extras"
                onClick={() => setExtrasToggle(!showExtras)}
                className="inline-flex min-h-11 items-center gap-2 font-semibold text-navy-900"
              >
                <Icon name="plus" size={20} className={cn("transition-transform duration-200", showExtras && "rotate-45")} />
                Packaging, customization and files
                <span className="font-normal text-ink-600">(optional)</span>
              </button>
              {showExtras && (
                <div id="rfq-extras" className="mt-6 flex flex-col gap-7">
                  <fieldset>
                    <legend className="text-small font-semibold text-ink-900">Customization</legend>
                    <div className="mt-3 grid gap-3 sm:grid-cols-2">
                      {CUSTOMIZATION.map((c) => (
                        <Checkbox key={c} label={c} value={c} {...register("customization")} />
                      ))}
                    </div>
                  </fieldset>
                  <Field label="Packaging" hint="Bulk or retail packing, labels, barcodes, carton marks.">
                    {(a) => <Textarea {...a} {...register("packaging")} rows={3} />}
                  </Field>
                  <FileUpload
                    label="Specification, drawing or photo"
                    hint="Optional. One file."
                    file={file}
                    error={fileError}
                    onChange={(f, err) => {
                      setFile(f);
                      setFileError(err);
                    }}
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {/* Step 2: delivery */}
        {step === 1 && (
          <div className="mt-8 grid gap-7 sm:grid-cols-2">
            <Field label="Destination country" required error={errors.destinationCountry?.message}>
              {(a) => (
                <Select {...a} {...register("destinationCountry")} autoComplete="country-name">
                  <option value="">Choose a country</option>
                  {countries.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </Select>
              )}
            </Field>
            <Field label="Destination port or airport" hint="e.g. Rotterdam, Jebel Ali, JFK">
              {(a) => <Input {...a} {...register("destinationPort")} />}
            </Field>

            <fieldset className="sm:col-span-2">
              <legend className="text-small font-semibold text-ink-900">Preferred Incoterm</legend>
              <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
                {INCOTERMS.map((t) => (
                  <label
                    key={t.value}
                    className="relative flex min-h-12 cursor-pointer items-center justify-center rounded-control border border-field bg-white px-3 text-center font-semibold text-navy-900 transition-colors hover:border-navy-900 has-[:checked]:border-navy-900 has-[:checked]:bg-navy-900 has-[:checked]:text-ivory-50 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-leaf-700"
                  >
                    <input type="radio" value={t.value} {...register("incoterm")} className="sr-only" />
                    {t.label}
                  </label>
                ))}
              </div>
              <p className="mt-3 min-h-12 text-small text-ink-600" aria-live="polite">
                {incotermHint}{" "}
                <Link href="/commercial-terms" className="font-medium text-leaf-700 underline underline-offset-4">
                  About Incoterms
                </Link>
              </p>
            </fieldset>

            <Field label="Required by" hint="Optional. Approximate is fine.">
              {(a) => <Input {...a} {...register("requiredDate")} type="date" />}
            </Field>
            <Field label="Target price" hint="Optional. Per unit or total, with currency.">
              {(a) => <Input {...a} {...register("targetPrice")} placeholder="e.g. USD 1.20 per piece FOB" />}
            </Field>
          </div>
        )}

        {/* Step 3: about you */}
        {step === 2 && (
          <div className="mt-8 flex flex-col gap-8">
            <div className="rounded-card border border-line bg-ivory-50 p-5 text-small">
              <p className="font-display font-semibold text-navy-900">Your request so far</p>
              <dl className="mt-3 grid gap-x-6 gap-y-2 sm:grid-cols-[auto_1fr]">
                <dt className="text-ink-600">Products</dt>
                <dd className="text-ink-900">
                  {[items.map((i) => i.name).join(", "), v.category && !items.length ? getCategory(v.category)?.name : "", v.product]
                    .filter(Boolean)
                    .join(". ") || "—"}{" "}
                  <button type="button" onClick={() => setStep(0)} className="ms-1 font-medium text-leaf-700 underline underline-offset-4">
                    Edit<span className="sr-only"> products</span>
                  </button>
                </dd>
                <dt className="text-ink-600">Quantity</dt>
                <dd className="text-ink-900">
                  {v.quantity} {v.unit.toLowerCase()}
                </dd>
                <dt className="text-ink-600">Delivery</dt>
                <dd className="text-ink-900">
                  {[v.destinationPort, v.destinationCountry].filter(Boolean).join(", ")}, {v.incoterm}{" "}
                  <button type="button" onClick={() => setStep(1)} className="ms-1 font-medium text-leaf-700 underline underline-offset-4">
                    Edit<span className="sr-only"> delivery</span>
                  </button>
                </dd>
              </dl>
            </div>

            <div className="grid gap-7 sm:grid-cols-2">
              <Field label="Company" required error={errors.company?.message}>
                {(a) => <Input {...a} {...register("company")} autoComplete="organization" />}
              </Field>
              <Field label="Contact person" required error={errors.contactName?.message}>
                {(a) => <Input {...a} {...register("contactName")} autoComplete="name" />}
              </Field>
              <Field label="Business email" required error={errors.email?.message}>
                {(a) => <Input {...a} {...register("email")} type="email" autoComplete="email" inputMode="email" />}
              </Field>
              <Field label="Phone or WhatsApp" hint="Optional, with country code.">
                {(a) => <Input {...a} {...register("phone")} type="tel" autoComplete="tel" />}
              </Field>
              <Field label="Your company's country">
                {(a) => (
                  <Select {...a} {...register("companyCountry")}>
                    <option value="">Choose a country</option>
                    {countries.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </Select>
                )}
              </Field>
              <Field label="Notes" hint="Anything else we should know." className="sm:col-span-2">
                {(a) => <Textarea {...a} {...register("notes")} rows={4} />}
              </Field>
            </div>

            {/* Honeypot: hidden from people and assistive technology. */}
            <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
              <label htmlFor="rfq-website">Website</label>
              <input id="rfq-website" tabIndex={-1} autoComplete="off" {...register("website")} />
            </div>

            <Checkbox
              {...register("consent")}
              error={errors.consent?.message}
              label={
                <>
                  WAMAK GROUP may use these details to reply to this request. See our{" "}
                  <Link href="/privacy" className="font-medium text-leaf-700 underline underline-offset-4">
                    privacy notice
                  </Link>
                  .
                </>
              }
            />
          </div>
        )}
      </div>

      <div className="mt-10 flex flex-col-reverse gap-3 border-t border-line pt-6 sm:flex-row sm:items-center sm:justify-between">
        {step > 0 ? (
          <Button type="button" variant="secondary" onClick={() => setStep(step - 1)} disabled={pending}>
            Back
          </Button>
        ) : (
          <span />
        )}
        <Button type="submit" disabled={pending} className="sm:min-w-56">
          {step < 2 ? "Continue" : pending ? "Sending your request…" : "Send your requirement"}
        </Button>
      </div>
      <p className="sr-only" aria-live="polite">
        {pending ? "Sending your request" : ""}
      </p>
    </form>
  );
}
