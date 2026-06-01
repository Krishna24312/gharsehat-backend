import { AlertCircle, Camera, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { BottomNav } from "../components/BottomNav";
import { CTAButton } from "../components/CTAButton";
import { Disclaimer } from "../components/Disclaimer";
import { LanguageSelector } from "../components/LanguageSelector";
import { ProgressBar } from "../components/ProgressBar";
import { useCheckIn } from "../context/CheckInContext";
import { useLanguage } from "../context/LanguageContext";

const PHOTO_DAYS = [1, 3, 4];

export function Home() {
  const navigate = useNavigate();
  const { tr, hiClass } = useLanguage();
  const { reset } = useCheckIn();

  function startCheckIn() {
    reset();
    navigate("/capture");
  }

  return (
    <div className="flex min-h-screen justify-center bg-stone-100">
      <div className="relative flex min-h-screen w-full max-w-md flex-col bg-white pb-16 shadow-sm">
        <main className="flex-1 px-5 pb-4 pt-6">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h1 className="text-2xl font-bold tracking-tight text-brand">GharSehat</h1>
              <p className={`mt-1 text-sm leading-snug text-slate-500 ${hiClass}`}>
                {tr(
                  "Namaste, Sunita ji — Day 5 of recovery",
                  "नमस्ते, सुनीता जी — स्वस्थ होने का दिन 5",
                )}
              </p>
            </div>
            <div className="shrink-0">
              <LanguageSelector />
            </div>
          </div>

          <div className="mt-6 space-y-5">
            <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-900" />
              <div>
                <p className={`text-sm font-semibold text-amber-950 ${hiClass}`}>
                  {tr("Daily check-in due", "आज की जाँच बाकी है")}
                </p>
                <p className={`mt-0.5 text-xs text-amber-900/80 ${hiClass}`}>
                  {tr("takes 2 minutes", "केवल 2 मिनट लगते हैं")}
                </p>
              </div>
            </div>

            <div className="rounded-xl border border-stone-200 bg-white p-4 shadow-card">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className={`text-xs font-semibold uppercase tracking-wide text-slate-500 ${hiClass}`}>
                    {tr("Wound", "घाव")}
                  </p>
                  <p className={`mt-0.5 text-sm font-semibold text-slate-950 ${hiClass}`}>
                    {tr(
                      "Left forearm — 2nd degree burn",
                      "बायाँ अग्र-बाहु — दूसरी डिग्री का जला",
                    )}
                  </p>
                </div>
                <span className={`rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-[11px] font-semibold text-amber-800 ${hiClass}`}>
                  {tr("Monitor", "निगरानी")}
                </span>
              </div>

              <div className="mt-5 space-y-4">
                <ProgressBar
                  label={tr("Healing trend", "स्वस्थ होने की प्रवृत्ति")}
                  value={58}
                  tone="green"
                  badge={tr("Improving", "सुधार हो रहा है")}
                />
                <ProgressBar
                  label={tr("Last change", "पिछला बदलाव")}
                  value={15}
                  tone="green"
                  badge={tr("Minimal", "बहुत कम")}
                />
              </div>
            </div>

            <div>
              <p className={`mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500 ${hiClass}`}>
                {tr("Photo history", "फोटो इतिहास")}
              </p>

              <div className="grid grid-cols-4 gap-2">
                {PHOTO_DAYS.map((day) => (
                  <div
                    key={day}
                    className="flex aspect-square flex-col items-center justify-center gap-1 rounded-lg bg-slate-100"
                  >
                    <Camera className="h-[18px] w-[18px] text-slate-500" />
                    <span className={`text-[10px] font-medium text-slate-500 ${hiClass}`}>
                      {tr("Day", "दिन")} {day}
                    </span>
                  </div>
                ))}

                <button
                  type="button"
                  onClick={startCheckIn}
                  className="flex aspect-square flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-brand/40 text-brand hover:bg-brand/5 active:scale-[0.99]"
                >
                  <Plus className="h-[18px] w-[18px]" />
                  <span className={`text-[10px] font-medium ${hiClass}`}>
                    {tr("Day", "दिन")} 5
                  </span>
                </button>
              </div>
            </div>

            <CTAButton onClick={startCheckIn} className={`mt-2 ${hiClass}`}>
              {tr("Start today's check-in", "आज की जाँच शुरू करें")}
            </CTAButton>
          </div>
        </main>

        <Disclaimer className="px-5 pb-4 pt-2" />
        <BottomNav />
      </div>
    </div>
  );
}
