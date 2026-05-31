import { Stethoscope } from "lucide-react";
import { Card } from "../components/common";
import { Disclaimer } from "../components/Disclaimer";
import { Layout } from "../components/Layout";
import { ComingSoonBanner } from "../components/LanguageSelector";
import { useLanguage } from "../context/LanguageContext";

// Generic home dressing steps. No specific medicines are ever named — step 4
// only says "if prescribed by your doctor".
const STEPS: { titleEn: string; titleHi: string; bodyEn: string; bodyHi: string }[] = [
  {
    titleEn: "Wash hands",
    titleHi: "हाथ धोएं",
    bodyEn: "Wash hands with soap for 20 seconds.",
    bodyHi: "साबुन से 20 सेकंड तक हाथ धोएं।",
  },
  {
    titleEn: "Prepare clean dressing material",
    titleHi: "साफ ड्रेसिंग सामग्री तैयार करें",
    bodyEn: "Keep clean gauze, saline, and prescribed ointment ready.",
    bodyHi: "साफ गॉज़, सलाइन और डॉक्टर की बताई मलहम तैयार रखें।",
  },
  {
    titleEn: "Remove old dressing gently",
    titleHi: "पुरानी ड्रेसिंग धीरे से हटाएं",
    bodyEn: "Remove old dressing slowly. If stuck, moisten with saline.",
    bodyHi: "पुरानी ड्रेसिंग धीरे से हटाएं। अगर चिपकी हो तो सलाइन से गीला करें।",
  },
  {
    titleEn: "Apply prescribed ointment",
    titleHi: "बताई गई मलहम लगाएं",
    bodyEn: "Apply ointment only if prescribed by your doctor.",
    bodyHi: "मलहम केवल तभी लगाएं जब डॉक्टर ने बताया हो।",
  },
  {
    titleEn: "Apply new dressing",
    titleHi: "नई ड्रेसिंग लगाएं",
    bodyEn: "Cover with fresh non-stick dressing. Do not make it too tight.",
    bodyHi: "ताज़ी नॉन-स्टिक ड्रेसिंग से ढकें। बहुत कसकर न बांधें।",
  },
];

export function DressingGuide() {
  const { tr, hiClass } = useLanguage();

  return (
    <Layout>
      <div className="space-y-4">
        <ComingSoonBanner />

        <div>
          <h1 className={`text-xl font-bold text-stone-800 ${hiClass}`}>
            {tr("Dressing guide", "ड्रेसिंग गाइड")}
          </h1>
          <p className={`mt-1 text-sm text-stone-500 ${hiClass}`}>
            {tr(
              "Simple daily steps for changing the dressing safely.",
              "ड्रेसिंग सुरक्षित रूप से बदलने के आसान रोज़ाना कदम।",
            )}
          </p>
        </div>

        <ol className="space-y-3">
          {STEPS.map((step, i) => (
            <li key={step.titleEn}>
              <Card>
                <div className="flex items-start gap-3">
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-brand text-sm font-bold text-white">
                    {i + 1}
                  </span>
                  <div>
                    <p className={`font-semibold text-stone-800 ${hiClass}`}>
                      {tr(step.titleEn, step.titleHi)}
                    </p>
                    <p className={`mt-0.5 text-sm text-stone-500 ${hiClass}`}>
                      {tr(step.bodyEn, step.bodyHi)}
                    </p>
                  </div>
                </div>
              </Card>
            </li>
          ))}
        </ol>

        {/* Generic escalation — no named doctor. */}
        <div className="flex items-start gap-2 rounded-xl border border-brand/20 bg-brand/5 px-3 py-2.5 text-sm text-stone-700">
          <Stethoscope className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
          <span className={hiClass}>
            {tr(
              "If anything looks worse or you are unsure, consult your doctor.",
              "अगर कुछ बिगड़ता दिखे या संदेह हो, तो अपने डॉक्टर से सलाह लें।",
            )}
          </span>
        </div>

        <Disclaimer />
      </div>
    </Layout>
  );
}
