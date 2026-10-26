import type { ButtonHTMLAttributes } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger";
}

const VARIANT_CLASSES: Record<NonNullable<ButtonProps["variant"]>, string> = {
  primary: "gold-btn",
  secondary:
    "border border-gold/65 bg-transparent text-gold hover:border-gold hover:bg-hover",
  ghost: "text-text-dim hover:text-gold hover:bg-hover",
  danger: "border border-red/45 bg-surface-2 text-red hover:border-red/70 hover:bg-red/15",
};

export function Button({ variant = "primary", className = "", ...props }: ButtonProps) {
  return (
    <button
      className={`inline-flex items-center gap-2 min-h-10 rounded-lg px-4 py-2.5 text-sm font-semibold transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-50 ${VARIANT_CLASSES[variant]} ${className}`}
      {...props}
    />
  );
}
