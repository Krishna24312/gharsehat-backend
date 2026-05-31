import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

// v1 language support:
//  - en: fully functional
//  - hi: UI chrome translated + backend message_hindi shown where available
//  - bn / ta: "coming soon", content falls back to English (never faked)
export type LangCode = "hi" | "en" | "bn" | "ta";

export interface LanguageOption {
  code: LangCode;
  /** Label shown on the chip, in its own script. */
  label: string;
  /** English name, for the "coming soon" note. */
  englishName: string;
  comingSoon: boolean;
}

// Chip order per spec: Hindi / English / Bengali / Tamil.
export const LANGUAGES: LanguageOption[] = [
  { code: "hi", label: "हिंदी", englishName: "Hindi", comingSoon: false },
  { code: "en", label: "English", englishName: "English", comingSoon: false },
  { code: "bn", label: "বাংলা", englishName: "Bengali", comingSoon: true },
  { code: "ta", label: "தமிழ்", englishName: "Tamil", comingSoon: true },
];

interface LanguageContextValue {
  language: LangCode;
  setLanguage: (code: LangCode) => void;
  isHindi: boolean;
  /** True for Bengali/Tamil — we fall back to English content. */
  isComingSoon: boolean;
  /** Inline translate: returns Hindi only when Hindi is active and provided. */
  tr: (en: string, hi?: string) => string;
  /** Class to apply to Devanagari text so it uses the Noto font. */
  hiClass: string;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

const STORAGE_KEY = "gharsehat.language";

function readStoredLanguage(): LangCode {
  const stored = localStorage.getItem(STORAGE_KEY) as LangCode | null;
  if (stored && LANGUAGES.some((l) => l.code === stored)) return stored;
  return "en";
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<LangCode>(readStoredLanguage);

  const setLanguage = useCallback((code: LangCode) => {
    setLanguageState(code);
    localStorage.setItem(STORAGE_KEY, code);
  }, []);

  const value = useMemo<LanguageContextValue>(() => {
    const isHindi = language === "hi";
    const isComingSoon = language === "bn" || language === "ta";
    return {
      language,
      setLanguage,
      isHindi,
      isComingSoon,
      tr: (en, hi) => (isHindi && hi ? hi : en),
      hiClass: isHindi ? "font-hi" : "",
    };
  }, [language, setLanguage]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage(): LanguageContextValue {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used within LanguageProvider");
  return ctx;
}
