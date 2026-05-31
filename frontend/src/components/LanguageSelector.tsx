import { LANGUAGES, useLanguage } from "../context/LanguageContext";

/** Row of language chips: Hindi / English / Bengali / Tamil. */
export function LanguageSelector() {
  const { language, setLanguage } = useLanguage();
  return (
    <div className="flex flex-wrap gap-2">
      {LANGUAGES.map((option) => {
        const active = option.code === language;
        return (
          <button
            key={option.code}
            type="button"
            onClick={() => setLanguage(option.code)}
            aria-pressed={active}
            className={`rounded-full px-3 py-1 text-sm font-medium transition ${
              active
                ? "bg-brand text-white shadow-sm"
                : "bg-white/80 text-stone-600 ring-1 ring-stone-200 hover:bg-white"
            }`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

/** Banner shown when an unfinished language (Bengali/Tamil) is selected. */
export function ComingSoonBanner() {
  const { isComingSoon, language } = useLanguage();
  if (!isComingSoon) return null;
  const name = LANGUAGES.find((l) => l.code === language)?.englishName ?? "This language";
  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
      {name} is coming soon — showing English content for now.
    </div>
  );
}
