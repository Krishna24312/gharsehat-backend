import { ShieldAlert } from "lucide-react";
import { useLanguage } from "../context/LanguageContext";

// Fixed safety disclaimer. "Diagnosis" is permitted ONLY inside this text.
const DISCLAIMER_EN = "Not a medical diagnosis. Always consult your doctor.";
const DISCLAIMER_HI = "यह चिकित्सा निदान नहीं है। हमेशा अपने डॉक्टर से सलाह लें।";

interface DisclaimerProps {
  /** Prefer the backend-provided disclaimer strings when available. */
  english?: string;
  hindi?: string;
  className?: string;
}

/** The always-on caregiver disclaimer shown across screens. */
export function Disclaimer({ english, hindi, className = "" }: DisclaimerProps) {
  const { isHindi, hiClass } = useLanguage();
  const text = isHindi ? (hindi ?? DISCLAIMER_HI) : (english ?? DISCLAIMER_EN);
  return (
    <div
      className={`flex items-start gap-2 rounded-xl bg-stone-100 px-3 py-2.5 text-xs leading-relaxed text-stone-500 ${className}`}
    >
      <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-stone-400" />
      <span className={isHindi ? hiClass : ""}>{text}</span>
    </div>
  );
}
