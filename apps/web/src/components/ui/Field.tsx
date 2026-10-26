import {
  Children,
  isValidElement,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
} from "react";
import { statusLabel } from "./StatusBadge";

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="mb-3 block">
      <span className="mb-1.5 block text-[13px] font-medium text-text-dim">{label}</span>
      {children}
    </div>
  );
}

const inputBase =
  "w-full min-h-11 rounded-lg border border-[var(--border-strong)] bg-surface-2 px-3 py-2.5 text-sm text-text placeholder:text-text-dimmer transition-colors focus-visible:border-gold focus-visible:shadow-[0_0_0_3px_rgba(242,184,29,0.12)]";

export function TextInput(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`${inputBase} ${props.className ?? ""}`} />;
}

interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

function optionsFromChildren(children: ReactNode): SelectOption[] {
  return Children.toArray(children).flatMap((child) => {
    if (!isValidElement(child) || child.type !== "option") return [];
    const props = child.props as { value?: string | number; children?: ReactNode; disabled?: boolean };
    const label = Children.toArray(props.children).filter((part) => typeof part === "string" || typeof part === "number").join("");
    const value = props.value === undefined || props.value === null ? label : String(props.value);
    return [{ value, label: label === value ? statusLabel(label) : label, disabled: props.disabled }];
  });
}

export function SelectInput({
  children,
  value,
  onChange,
  disabled,
  className = "",
  name,
  required,
  id,
  "aria-label": ariaLabel,
}: SelectHTMLAttributes<HTMLSelectElement>) {
  const options = useMemo(() => optionsFromChildren(children), [children]);
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const [menu, setMenu] = useState({ top: 0, left: 0, width: 240 });

  const current = String(value ?? "");
  const selected = options.find((option) => option.value === current) ?? options[0];

  function place() {
    const rect = btnRef.current?.getBoundingClientRect();
    if (!rect) return;
    const height = Math.min(280, options.length * 40 + 12);
    const up = window.innerHeight - rect.bottom < height + 12 && rect.top > height;
    setMenu({
      top: up ? rect.top - height - 8 : rect.bottom + 6,
      left: rect.left,
      width: Math.max(rect.width, 180),
    });
  }

  useEffect(() => {
    if (!open) return;
    place();
    const close = (event: MouseEvent) => {
      if (!wrapRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    const onReposition = () => place();
    window.addEventListener("mousedown", close);
    window.addEventListener("keydown", onKey);
    window.addEventListener("resize", onReposition);
    window.addEventListener("scroll", onReposition, true);
    return () => {
      window.removeEventListener("mousedown", close);
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", onReposition);
      window.removeEventListener("scroll", onReposition, true);
    };
  }, [open, options.length]);

  function pick(next: string) {
    onChange?.({ target: { value: next, name } } as unknown as ChangeEvent<HTMLSelectElement>);
    setOpen(false);
  }

  return (
    <div ref={wrapRef} className={`relative ${className}`}>
      <button
        ref={btnRef}
        id={id}
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-required={required}
        aria-label={ariaLabel}
        onClick={() => {
          if (disabled) return;
          setOpen((next) => !next);
        }}
        className={`${inputBase} flex items-center justify-between gap-3 text-left disabled:cursor-not-allowed disabled:opacity-50 ${
          open ? "border-gold shadow-[0_0_0_3px_rgba(242,184,29,0.12)]" : ""
        }`}
      >
        <span className={`min-w-0 text-left leading-snug [overflow-wrap:anywhere] ${selected?.label ? "text-text" : "text-text-dimmer"}`}>{selected?.label || "Select"}</span>
        <svg
          viewBox="0 0 20 20"
          className={`h-4 w-4 shrink-0 text-gold transition-transform ${open ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
        >
          <path d="M5 7.5 10 12.5 15 7.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      {open && (
        <ul
          role="listbox"
          style={{ top: menu.top, left: menu.left, width: menu.width }}
          className="thin-scroll fixed z-[80] max-h-72 overflow-auto rounded-lg border border-[var(--border-strong)] bg-[var(--surface-primary)] p-1 shadow-[var(--shadow-pop)]"
        >
          {options.map((option) => {
            const active = option.value === current;
            return (
              <li key={`${option.value}-${option.label}`}>
                <button
                  type="button"
                  role="option"
                  aria-selected={active}
                  disabled={option.disabled}
                  onClick={() => pick(option.value)}
                  className={`flex w-full items-center justify-between rounded-sm px-3 py-2 text-left text-sm transition-colors ${
                    active ? "bg-gold/20 text-gold" : "text-text hover:bg-hover hover:text-gold-soft"
                  } disabled:opacity-40`}
                >
                  <span className="min-w-0 leading-snug [overflow-wrap:anywhere]">{option.label}</span>
                  {active && <span className="ml-3 text-[10px] tracking-[0.16em] text-gold">●</span>}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
