import type { Status } from "../types";

// Visual + textual treatment for each status band. Labels describe *change*
// only — never a diagnosis claim.
interface StatusMeta {
  /** Tailwind classes for a solid badge. */
  badge: string;
  /** Tailwind classes for a soft tinted card. */
  soft: string;
  /** Background colour for the small timeline dot. */
  dot: string;
  /** Ring/border accent. */
  accent: string;
  labelEn: string;
  labelHi: string;
}

export const STATUS_META: Record<Status, StatusMeta> = {
  green: {
    badge: "bg-emerald-600 text-white",
    soft: "bg-emerald-50 text-emerald-800 border-emerald-200",
    dot: "bg-emerald-500",
    accent: "border-emerald-300",
    labelEn: "Low change",
    labelHi: "कम बदलाव",
  },
  amber: {
    badge: "bg-amber-500 text-white",
    soft: "bg-amber-50 text-amber-800 border-amber-200",
    dot: "bg-amber-500",
    accent: "border-amber-300",
    labelEn: "Some change",
    labelHi: "कुछ बदलाव",
  },
  red: {
    badge: "bg-red-600 text-white",
    soft: "bg-red-50 text-red-800 border-red-200",
    dot: "bg-red-500",
    accent: "border-red-300",
    labelEn: "High change",
    labelHi: "ज़्यादा बदलाव",
  },
};
