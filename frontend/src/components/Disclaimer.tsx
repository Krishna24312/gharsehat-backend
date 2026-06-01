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
    <p className={`text-center text-[11px] leading-relaxed text-slate-500 ${className} ${isHindi ? hiClass : ""}`}>
      {text}
    </p>
  );
}
