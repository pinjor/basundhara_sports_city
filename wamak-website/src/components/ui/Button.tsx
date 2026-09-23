import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/cn";
import { Icon, type IconName } from "./Icon";

/**
 * Buttons say what happens: "Request a quote", "Download catalogue",
 * "Add to RFQ". Sentence case. No arrows appended by default.
 */

export type ButtonVariant = "primary" | "secondary" | "inverse" | "inverse-secondary";
export type ButtonSize = "md" | "sm";

const base =
  "inline-flex items-center justify-center gap-2 rounded-control font-sans font-semibold whitespace-nowrap select-none " +
  "transition-[background-color,border-color,color,transform] duration-200 ease-out-soft active:translate-y-px " +
  "disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50";

const variants: Record<ButtonVariant, string> = {
  primary: "bg-navy-900 text-ivory-50 hover:bg-navy-800",
  secondary:
    "border border-navy-900 bg-transparent text-navy-900 hover:bg-navy-900 hover:text-ivory-50",
  inverse: "bg-ivory-50 text-navy-900 hover:bg-jute-300",
  "inverse-secondary":
    "border border-ivory-50/70 bg-transparent text-ivory-50 hover:border-ivory-50 hover:bg-ivory-50 hover:text-navy-900",
};

const sizes: Record<ButtonSize, string> = {
  md: "min-h-12 px-6 text-[1rem]",
  sm: "min-h-11 px-4 text-small",
};

type Common = {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: IconName;
  iconPosition?: "start" | "end";
  className?: string;
  children: ReactNode;
};

type AsLink = Common & { href: string } & Omit<ComponentProps<typeof Link>, "href" | "className" | "children">;
type AsButton = Common & { href?: undefined } & Omit<ComponentProps<"button">, "className" | "children">;

export function buttonClasses(variant: ButtonVariant = "primary", size: ButtonSize = "md", className?: string) {
  return cn(base, variants[variant], sizes[size], className);
}

export function Button(props: AsLink | AsButton) {
  const { variant = "primary", size = "md", icon, iconPosition = "start", className, children } = props;
  const content = (
    <>
      {icon && iconPosition === "start" && <Icon name={icon} size={20} />}
      <span>{children}</span>
      {icon && iconPosition === "end" && <Icon name={icon} size={20} />}
    </>
  );
  const classes = buttonClasses(variant, size, className);

  if (props.href !== undefined) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { variant: _v, size: _s, icon: _i, iconPosition: _p, className: _c, children: _ch, href, ...rest } = props;
    return (
      <Link href={href} className={classes} {...rest}>
        {content}
      </Link>
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { variant: _v, size: _s, icon: _i, iconPosition: _p, className: _c, children: _ch, type = "button", ...rest } = props;
  return (
    <button type={type} className={classes} {...rest}>
      {content}
    </button>
  );
}
