"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/Button";
import { Field, Input, Select } from "@/components/ui/Field";
import { categories } from "@/content/categories";
import { countries } from "@/content/countries";
import { track } from "@/lib/analytics";
import { rfq } from "@/lib/rfq-store";

const schema = z.object({
  product: z.string().trim().min(2, "Tell us the product or category, for example jute tote bags."),
  quantity: z.string().trim().min(1, "Enter an approximate quantity, for example 5,000 pieces."),
  country: z.string().min(1, "Choose the destination country."),
  email: z.email("Enter a business email address, for example name@company.com."),
});

type Values = z.infer<typeof schema>;

/** Four fields that start an RFQ; the wizard picks the values up from session storage. */
export function QuickInquiryForm({ cta }: { cta: string }) {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Values>({ resolver: zodResolver(schema), mode: "onTouched" });

  const onSubmit = (v: Values) => {
    const match = categories.find((c) => c.name.toLowerCase() === v.product.toLowerCase());
    rfq.saveDraft({ ...v, category: match?.slug });
    track("quick_inquiry_submit", { country: v.country });
    router.push("/request-quote?from=quick");
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="grid gap-x-6 gap-y-6 sm:grid-cols-2">
      <Field label="Product or category" required error={errors.product?.message}>
        {(a) => (
          <>
            <Input {...a} {...register("product")} list="quick-categories" autoComplete="off" />
            <datalist id="quick-categories">
              {categories.map((c) => (
                <option key={c.slug} value={c.name} />
              ))}
            </datalist>
          </>
        )}
      </Field>
      <Field label="Quantity" required error={errors.quantity?.message}>
        {(a) => <Input {...a} {...register("quantity")} placeholder="e.g. 5,000 pieces" />}
      </Field>
      <Field label="Destination country" required error={errors.country?.message}>
        {(a) => (
          <Select {...a} {...register("country")} defaultValue="" autoComplete="country-name">
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
      <Field label="Business email" required error={errors.email?.message}>
        {(a) => <Input {...a} {...register("email")} type="email" autoComplete="email" inputMode="email" />}
      </Field>
      <div className="sm:col-span-2">
        <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto">
          {cta}
        </Button>
      </div>
    </form>
  );
}
