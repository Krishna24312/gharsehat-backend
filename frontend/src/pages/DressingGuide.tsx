import { Check, Stethoscope } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { CTAButton } from "../components/CTAButton";
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

// Steps 1 and 2 start completed, step 3 (index 2) is the current step.
const INITIAL_ACTIVE_STEP = 2;
// Persist today's progress so a refresh doesn't reset the checklist; the stored
// date makes it reset naturally on a new day.
const PROGRESS_KEY = "gharsehat_dressing_progress";

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

function loadActiveStep(): number {
  if (typeof localStorage === "undefined") return INITIAL_ACTIVE_STEP;
  try {
    const raw = localStorage.getItem(PROGRESS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as { date?: string; activeStep?: number };
      if (parsed.date === today() && typeof parsed.activeStep === "number") {
        return Math.min(Math.max(parsed.activeStep, INITIAL_ACTIVE_STEP), STEPS.length);
      }
    }
  } catch {
    // Ignore corrupt/unavailable storage — fall back to the default.
  }
  return INITIAL_ACTIVE_STEP;
}

function saveActiveStep(activeStep: number): void {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(PROGRESS_KEY, JSON.stringify({ date: today(), activeStep }));
  } catch {
    // Ignore storage write failures (e.g. private mode).
  }
}

export function DressingGuide() {
  const { tr, hiClass } = useLanguage();
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState<number>(loadActiveStep);

  const allComplete = activeStep >= STEPS.length;

  function markStepDone() {
    setActiveStep((prev) => {
      const next = Math.min(prev + 1, STEPS.length);
      saveActiveStep(next);
      return next;
    });
  }

  return (
    <Layout showBack backTo="/home">
      <div className="space-y-4">
        <ComingSoonBanner />

        <div className="flex items-start justify-between gap-2">
          <div>
            <h1 className={`text-xl font-bold text-stone-800 ${hiClass}`}>
              {tr("Dressing guide — Day 5", "ड्रेसिंग गाइड — दिन 5")}
            </h1>
            <p className={`mt-1 text-sm text-stone-500 ${hiClass}`}>
              {tr("Step-by-step dressing support.", "चरण-दर-चरण ड्रेसिंग सहायता।")}
            </p>
          </div>
          <span className="shrink-0 rounded-full bg-stone-100 px-2.5 py-1 text-[11px] font-bold tabular-nums text-stone-500">
            {Math.min(activeStep, STEPS.length)} / {STEPS.length}
          </span>
        </div>

        <ol className="space-y-2.5">
          {STEPS.map((step, i) => {
            const done = i < activeStep;
            const active = i === activeStep; // false once every step is complete
            const cardCls = active
              ? "bg-brand/5 ring-1 ring-brand/30"
              : done
                ? "bg-white ring-1 ring-stone-100"
                : "bg-stone-50 ring-1 ring-stone-100";
            const iconCls = done
              ? "bg-emerald-100 text-emerald-700"
              : active
                ? "bg-brand text-white"
                : "bg-stone-200 text-stone-500";
            return (
              <li key={step.titleEn}>
                <div className={`rounded-2xl p-3 shadow-card ${cardCls}`}>
                  <div className="flex items-start gap-2.5">
                    <span
                      className={`grid h-7 w-7 shrink-0 place-items-center rounded-full text-xs font-bold ${iconCls}`}
                    >
                      {done ? <Check className="h-3.5 w-3.5" /> : i + 1}
                    </span>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <p className={`text-sm font-semibold text-stone-800 ${hiClass}`}>
                          {tr(step.titleEn, step.titleHi)}
                        </p>
                        {active && (
                          <span className={`rounded-full bg-brand/10 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-brand ${hiClass}`}>
                            {tr("Now", "अभी")}
                          </span>
                        )}
                      </div>
                      <p className={`mt-0.5 text-[13px] leading-snug text-stone-500 ${hiClass}`}>
                        {tr(step.bodyEn, step.bodyHi)}
                      </p>
                    </div>
                  </div>
                </div>
              </li>
            );
          })}
        </ol>

        {allComplete && (
          <div className="flex items-start gap-2.5 rounded-2xl bg-emerald-50 p-3 ring-1 ring-emerald-200">
            <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-emerald-100 text-emerald-700">
              <Check className="h-4 w-4" />
            </span>
            <div className="min-w-0">
              <p className={`text-sm font-semibold text-emerald-800 ${hiClass}`}>
                {tr("Dressing done for today", "आज की ड्रेसिंग पूरी हुई")}
              </p>
              <p className={`mt-0.5 text-[13px] leading-snug text-emerald-700/80 ${hiClass}`}>
                {tr(
                  "All steps complete. Come back for the next dressing change.",
                  "सभी चरण पूरे हुए। अगली ड्रेसिंग बदलने पर फिर आएँ।",
                )}
              </p>
            </div>
          </div>
        )}

        <CTAButton onClick={allComplete ? () => navigate("/home") : markStepDone} className={hiClass}>
          {allComplete
            ? tr("Back to home", "होम पर वापस जाएँ")
            : tr("Mark step done", "यह चरण पूरा करें")}
        </CTAButton>

        {/* Generic escalation — no named doctor. */}
        <div className="flex items-start gap-2 rounded-xl border border-brand/20 bg-brand/5 px-3 py-2.5 text-[13px] text-stone-700">
          <Stethoscope className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
          <span className={`leading-snug ${hiClass}`}>
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
