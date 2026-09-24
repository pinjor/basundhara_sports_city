"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { useForm, type Path } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/Button";
import { Checkbox, Field, Input, Select, Textarea } from "@/components/ui/Field";
import { Icon } from "@/components/ui/Icon";
import { countries } from "@/content/countries";
import { site } from "@/content/site";
import { submitContact } from "@/lib/actions/contact";
import { track } from "@/lib/analytics";
import { CONTACT_TOPICS, contactSchema, type ContactValues } from "@/lib/validators";

type Values = ContactValues & { website: string };
type FormInput = z.input<typeof contactSchema> & { website: string };

const TOPIC_PARAM: Record<string, (typeof CONTACT_TOPICS)[number]> = {
  catalogue: "Catalogue request",
  sourcing: "Sourcing partnership",
  supplier: "Supplier introduction",
};

export function ContactForm() {
  const params = useSearchParams();
  const [sent, setSent] = useState<string | null>(null);
  const [formError, setFormError] = useState<string>();
  const [pending, startTransition] = useTransition();
  const doneRef = useRef<HTMLDivElement>(null);

  const { register, handleSubmit, setError, formState } = useForm<FormInput, unknown, Values>({
    resolver: zodResolver(contactSchema.extend({ website: z.string() })),
    mode: "onSubmit",
    reValidateMode: "onChange",
    defaultValues: { topic: TOPIC_PARAM[params.get("topic") ?? ""] ?? "Product inquiry", website: "" },
  });
  const errors = formState.errors;

  useEffect(() => {
    if (sent) doneRef.current?.focus();
  }, [sent]);

  const onSubmit = (v: Values) => {
    setFormError(undefined);
    const { website, ...data } = v;
    const fd = new FormData();
    fd.set("payload", JSON.stringify(data));
    fd.set("website", website ?? "");
    startTransition(async () => {
      try {
        const res = await submitContact(fd);
        if (res.ok) {
          track("contact_submit", { topic: data.topic });
          setSent(res.ref);
          return;
        }
        setFormError(res.formError);
        Object.entries(res.fieldErrors ?? {}).forEach(([k, m]) => setError(k as Path<FormInput>, { message: m }));
      } catch {
        setFormError(`We couldn't send your message just now. Please email ${site.email}.`);
      }
    });
  };

  if (sent) {
    return (
      <div ref={doneRef} tabIndex={-1} role="status" className="flex flex-col items-start gap-4 focus:outline-none">
        <Icon name="check" size={32} className="text-leaf-700" />
        <h2 className="text-h3">Thank you. Your message is on its way.</h2>
        <p className="text-ink-600">
          Your reference is <strong className="text-navy-900">{sent}</strong>. We&apos;ll reply by email.
        </p>
        <p className="text-ink-600">
          Looking for a price? The{" "}
          <Link href="/request-quote" className="font-medium text-leaf-700 underline underline-offset-4">
            RFQ form
          </Link>{" "}
          gets you a quotation faster.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="grid gap-7 sm:grid-cols-2">
      {formError && (
        <p role="alert" className="flex items-start gap-2 rounded-control border border-danger bg-white p-4 text-small font-medium text-danger sm:col-span-2">
          <Icon name="alert" size={18} className="mt-px shrink-0" />
          {formError}
        </p>
      )}
      <Field label="Topic" className="sm:col-span-2">
        {(a) => (
          <Select {...a} {...register("topic")}>
            {CONTACT_TOPICS.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </Select>
        )}
      </Field>
      <Field label="Name" required error={errors.name?.message}>
        {(a) => <Input {...a} {...register("name")} autoComplete="name" />}
      </Field>
      <Field label="Company">
        {(a) => <Input {...a} {...register("company")} autoComplete="organization" />}
      </Field>
      <Field label="Email" required error={errors.email?.message}>
        {(a) => <Input {...a} {...register("email")} type="email" autoComplete="email" />}
      </Field>
      <Field label="Country">
        {(a) => (
          <Select {...a} {...register("country")} autoComplete="country-name">
            <option value="">Choose a country</option>
            {countries.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </Select>
        )}
      </Field>
      <Field label="Message" required error={errors.message?.message} className="sm:col-span-2">
        {(a) => <Textarea {...a} {...register("message")} rows={6} />}
      </Field>
      <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
        <label htmlFor="contact-website">Website</label>
        <input id="contact-website" tabIndex={-1} autoComplete="off" {...register("website")} />
      </div>
      <Checkbox
        className="sm:col-span-2"
        {...register("consent")}
        error={errors.consent?.message}
        label={
          <>
            WAMAK GROUP may use these details to reply. See our{" "}
            <Link href="/privacy" className="font-medium text-leaf-700 underline underline-offset-4">
              privacy notice
            </Link>
            .
          </>
        }
      />
      <div className="sm:col-span-2">
        <Button type="submit" disabled={pending} className="w-full sm:w-auto">
          {pending ? "Sending…" : "Send message"}
        </Button>
      </div>
    </form>
  );
}
