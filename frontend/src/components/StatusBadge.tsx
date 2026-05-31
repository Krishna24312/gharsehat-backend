import { useLanguage } from "../context/LanguageContext";
import { STATUS_META } from "../lib/status";
import type { Status } from "../types";

interface StatusBadgeProps {
  status: Status;
  className?: string;
}

/** A pill describing the visual-change band (green / amber / red). */
export function StatusBadge({ status, className = "" }: StatusBadgeProps) {
  const { tr, hiClass } = useLanguage();
  const meta = STATUS_META[status];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-semibold ${meta.badge} ${hiClass} ${className}`}
    >
      <span className="h-2 w-2 rounded-full bg-white/90" />
      {tr(meta.labelEn, meta.labelHi)}
    </span>
  );
}
