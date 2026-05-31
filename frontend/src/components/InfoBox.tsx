import type { ReactNode } from "react";

type Variant = "info" | "success" | "warning" | "danger" | "neutral";

const styles: Record<Variant, string> = {
  info: "border-sky-100 bg-sky-50 text-sky-900",
  success: "border-emerald-100 bg-emerald-50 text-emerald-900",
  warning: "border-amber-200 bg-amber-50 text-amber-900",
  danger: "border-red-200 bg-red-50 text-red-900",
  neutral: "border-stone-200 bg-stone-100 text-stone-700",
};

export function InfoBox({
  variant = "info",
  children,
  className = "",
}: {
  variant?: Variant;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`rounded-xl border p-3 text-[13px] leading-relaxed ${styles[variant]} ${className}`}>
      {children}
    </div>
  );
}
