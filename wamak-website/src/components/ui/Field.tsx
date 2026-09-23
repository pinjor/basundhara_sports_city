import { useId, type ComponentProps, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import { Icon } from "./Icon";

/**
 * Form primitives. Labels are always visible (no placeholder-as-label).
 * Most RFQ fields are optional, so the few required ones say "Required".
 * Errors pair text with an icon and are announced politely.
 * All controls accept `ref` directly (React 19) for react-hook-form.
 */

const control =
  "block w-full rounded-control border border-field bg-white px-4 text-body text-ink-900 " +
  "placeholder:text-ink-600/80 transition-[border-color,box-shadow] duration-150 " +
  "hover:border-navy-900 focus-visible:border-navy-900 focus-visible:outline-2 focus-visible:outline-offset-2 " +
  "aria-[invalid=true]:border-danger aria-[invalid=true]:hover:border-danger " +
  "disabled:cursor-not-allowed disabled:bg-mist-100 disabled:text-ink-600";

type FieldProps = {
  label: ReactNode;
  hint?: ReactNode;
  error?: string;
  required?: boolean;
  className?: string;
  children: (a11y: {
    id: string;
    "aria-describedby"?: string;
    "aria-invalid"?: true;
    "aria-required"?: true;
  }) => ReactNode;
};

export function Field({ label, hint, error, required, className, children }: FieldProps) {
  const id = useId();
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(" ") || undefined;

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <label htmlFor={id} className="flex items-baseline justify-between gap-4 text-small font-semibold text-ink-900">
        <span>{label}</span>
        {required && <span className="text-[0.8125rem] font-medium text-ink-600">Required</span>}
      </label>
      {hint && (
        <p id={hintId} className="-mt-1 text-small text-ink-600">
          {hint}
        </p>
      )}
      {children({
        id,
        "aria-describedby": describedBy,
        "aria-invalid": error ? true : undefined,
        "aria-required": required ? true : undefined,
      })}
      <div aria-live="polite" className="empty:hidden">
        {error && (
          <p id={errorId} className="flex items-start gap-2 text-small font-medium text-danger">
            <Icon name="alert" size={18} className="mt-px shrink-0" />
            <span>{error}</span>
          </p>
        )}
      </div>
    </div>
  );
}

export function Input({ className, ...props }: ComponentProps<"input">) {
  return <input className={cn(control, "min-h-12", className)} {...props} />;
}

export function Textarea({ className, rows = 5, ...props }: ComponentProps<"textarea">) {
  return <textarea rows={rows} className={cn(control, "min-h-32 py-3 leading-relaxed", className)} {...props} />;
}

export function Select({ className, children, ...props }: ComponentProps<"select">) {
  return (
    <div className="relative">
      <select className={cn(control, "min-h-12 appearance-none pe-12", className)} {...props}>
        {children}
      </select>
      <Icon
        name="chevronDown"
        size={20}
        className="pointer-events-none absolute end-4 top-1/2 -translate-y-1/2 text-navy-900"
      />
    </div>
  );
}

type CheckboxProps = Omit<ComponentProps<"input">, "type"> & {
  label: ReactNode;
  error?: string;
};

export function Checkbox({ label, error, className, id: idProp, ...props }: CheckboxProps) {
  const autoId = useId();
  const id = idProp ?? autoId;
  const errorId = error ? `${id}-error` : undefined;
  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <label htmlFor={id} className="group flex cursor-pointer items-start gap-3 text-body text-ink-900">
        <span className="relative mt-0.5 inline-grid size-6 shrink-0 place-items-center">
          <input
            id={id}
            type="checkbox"
            aria-invalid={error ? true : undefined}
            aria-describedby={errorId}
            className="peer size-6 cursor-pointer appearance-none rounded-control border border-field bg-white transition-colors checked:border-navy-900 checked:bg-navy-900 hover:border-navy-900 aria-[invalid=true]:border-danger"
            {...props}
          />
          <Icon
            name="check"
            size={16}
            strokeWidth={2}
            className="pointer-events-none absolute text-ivory-50 opacity-0 peer-checked:opacity-100"
          />
        </span>
        <span>{label}</span>
      </label>
      <div aria-live="polite" className="empty:hidden">
        {error && (
          <p id={errorId} className="flex items-start gap-2 ps-9 text-small font-medium text-danger">
            <Icon name="alert" size={18} className="mt-px shrink-0" />
            <span>{error}</span>
          </p>
        )}
      </div>
    </div>
  );
}
