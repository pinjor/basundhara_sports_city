"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, useSyncExternalStore, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { Field, Input, Select } from "@/components/ui/Field";
import { categories } from "@/content/categories";
import { countries } from "@/content/countries";
import { track } from "@/lib/analytics";
import { rfq } from "@/lib/rfq-store";

type Values = { product: string; quantity: string; country: string; email: string };
type Errors = Partial<Record<keyof Values, string>>;

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Four fields that start an RFQ. Deliberately dependency-free (no form or
 * schema library) so the homepage stays light; the full wizard re-validates
 * everything with the shared schemas before anything is sent.
 */
function validate(v: Values): Errors {
  const e: Errors = {};
  if (v.product.trim().length < 2) e.product = "Tell us the product or category, for example jute tote bags.";
  if (!v.quantity.trim()) e.quantity = "Enter an approximate quantity, for example 5,000 pieces.";
  if (!v.country) e.country = "Choose the destination country.";
  if (!EMAIL.test(v.email.trim())) e.email = "Enter a business email address, for example name@company.com.";
  return e;
}

const noop = () => () => {};

export function QuickInquiryForm({ cta }: { cta: string }) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  // Before hydration the form works natively (GET to the wizard, browser validation);
  // once React is running it takes over with its own validation and messages.
  const hydrated = useSyncExternalStore(noop, () => true, () => false);
  const [errors, setErrors] = useState<Errors>({});
  const [pending, setPending] = useState(false);

  const read = (): Values => {
    const fd = new FormData(formRef.current!);
    return {
      product: String(fd.get("product") ?? ""),
      quantity: String(fd.get("quantity") ?? ""),
      country: String(fd.get("country") ?? ""),
      email: emailRef.current?.value ?? "",
    };
  };

  // Clear a field's error as soon as the buyer fixes it, while typing. (Not on blur:
  // clearing on blur shifts the layout at the moment someone taps "Start my request",
  // which moves the button out from under their finger.)
  const onFix = (name: keyof Values) => {
    if (!errors[name] || validate(read())[name]) return;
    setErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    const v = read();
    const found = validate(v);
    setErrors(found);
    const first = (Object.keys(found) as (keyof Values)[])[0];
    if (first) {
      const el = first === "email" ? emailRef.current : formRef.current?.querySelector<HTMLElement>(`[name="${first}"]`);
      el?.focus();
      return;
    }
    setPending(true);
    const match = categories.find((c) => c.name.toLowerCase() === v.product.trim().toLowerCase());
    rfq.saveDraft({ ...v, category: match?.slug });
    track("quick_inquiry_submit", { country: v.country });
    router.push("/request-quote?from=quick");
  };

  return (
    <form
      ref={formRef}
      onSubmit={onSubmit}
      action="/request-quote"
      method="get"
      noValidate={hydrated}
      className="grid gap-x-6 gap-y-6 sm:grid-cols-2"
    >
      <input type="hidden" name="from" value="quick" />
      <Field label="Product or category" required error={errors.product}>
        {(a) => (
          <>
            <Input {...a} name="product" required minLength={2} list="quick-categories" autoComplete="off" onChange={() => onFix("product")} />
            <datalist id="quick-categories">
              {categories.map((c) => (
                <option key={c.slug} value={c.name} />
              ))}
            </datalist>
          </>
        )}
      </Field>
      <Field label="Quantity" required error={errors.quantity}>
        {(a) => <Input {...a} name="quantity" required placeholder="e.g. 5,000 pieces" onChange={() => onFix("quantity")} />}
      </Field>
      <Field label="Destination country" required error={errors.country}>
        {(a) => (
          <Select {...a} name="country" required defaultValue="" autoComplete="country-name" onChange={() => onFix("country")}>
            <option value="" disabled>
              Choose a country
            </option>
            {countries.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </Select>
        )}
      </Field>
      <Field label="Business email" required error={errors.email}>
        {(a) => (
          // No name attribute: the email is never sent in a URL by the no-JS fallback.
          <Input {...a} ref={emailRef} type="email" required autoComplete="email" inputMode="email" onChange={() => onFix("email")} />
        )}
      </Field>
      <div className="sm:col-span-2">
        <Button type="submit" disabled={pending} className="w-full sm:w-auto">
          {cta}
        </Button>
      </div>
    </form>
  );
}
