import type { Status } from "../types";

const toneBar: Record<Status, string> = {
  green: "bg-emerald-500",
  amber: "bg-amber-500",
  red: "bg-red-500",
};

const toneText: Record<Status, string> = {
  green: "text-emerald-700",
  amber: "text-amber-700",
  red: "text-red-700",
};

export function ProgressBar({
  label,
  value,
  tone,
  badge,
}: {
  label: string;
  value: number;
  tone: Status;
  badge: string;
}) {
  const clamped = Math.max(4, Math.min(100, Math.round(value)));
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between gap-3 text-[12px]">
        <span className="font-semibold text-stone-700">{label}</span>
        <span className={`shrink-0 font-bold ${toneText[tone]}`}>
          {clamped}% · {badge}
        </span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-stone-100">
        <div className={`h-full rounded-full ${toneBar[tone]}`} style={{ width: `${clamped}%` }} />
      </div>
    </div>
  );
}
