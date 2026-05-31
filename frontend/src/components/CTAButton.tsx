import type { ReactNode } from "react";
import { Link } from "react-router-dom";

type Variant = "primary" | "dark" | "secondary";

const styles: Record<Variant, string> = {
  primary: "bg-brand text-white hover:bg-brand-dark",
  dark: "bg-stone-900 text-white hover:bg-stone-800",
  secondary: "bg-stone-100 text-stone-700 hover:bg-stone-200",
};

const base =
  "inline-flex w-full items-center justify-center rounded-xl px-4 py-3.5 text-sm font-bold transition active:scale-[0.99] disabled:cursor-not-allowed disabled:bg-stone-300 disabled:text-white disabled:shadow-none";

export function CTAButton({
  variant = "primary",
  children,
  className = "",
  onClick,
  type = "button",
  disabled = false,
}: {
  variant?: Variant;
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  type?: "button" | "submit";
  disabled?: boolean;
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${base} ${styles[variant]} ${className}`}
    >
      {children}
    </button>
  );
}

export function CTALink({
  variant = "primary",
  children,
  className = "",
  to,
  href,
}: {
  variant?: Variant;
  children: ReactNode;
  className?: string;
  to?: string;
  href?: string;
}) {
  if (href) {
    return <a href={href} className={`${base} ${styles[variant]} ${className}`}>{children}</a>;
  }
  return <Link to={to ?? "/home"} className={`${base} ${styles[variant]} ${className}`}>{children}</Link>;
}
