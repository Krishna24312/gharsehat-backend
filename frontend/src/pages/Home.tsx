import { AlertCircle, Camera, Plus, TrendingDown } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Card, ErrorState, Spinner } from "../components/common";
import { CTAButton } from "../components/CTAButton";
import { Disclaimer } from "../components/Disclaimer";
import { Layout } from "../components/Layout";
import { ComingSoonBanner } from "../components/LanguageSelector";
import { PhotoStrip } from "../components/PhotoStrip";
import { ProgressBar } from "../components/ProgressBar";
import { StatusBadge } from "../components/StatusBadge";
import { useCheckIn } from "../context/CheckInContext";
import { useLanguage } from "../context/LanguageContext";
import { usePatientHistory } from "../hooks/usePatientHistory";
import { STATUS_META } from "../lib/status";

// Static fallback for the demo patient, used only if the backend is unreachable
// so the caregiver can still reach the check-in flow.
const RAVI_FALLBACK = {
  name: "Ravi",
  age: 34,
  gender: "male",
  burn_location: "left forearm",
  burn_type: "2nd-degree burn",
  day_of_recovery: 5,
};

export function Home() {
  const navigate = useNavigate();
  const { tr, hiClass, isHindi } = useLanguage();
  const { reset } = useCheckIn();
  const { data, loading, error, reload } = usePatientHistory();

  const patient = data ?? RAVI_FALLBACK;
  const latest = data?.history.at(-1);
  const previous = data && data.history.length > 1 ? data.history[data.history.length - 2] : null;
  const lastChange = latest && previous ? Math.abs(latest.final_score - previous.final_score) : 15;
  const trendTone = latest?.status ?? "green";
  const trendLabel = latest ? STATUS_META[latest.status].labelEn : "Low change";

  function startCheckIn() {
    reset(); // fresh check-in flow from Home
    navigate("/capture");
  }

  return (
    <Layout>
      <div className="space-y-4">
        <ComingSoonBanner />

        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-2xl font-extrabold tracking-tight text-brand">GharSehat</h1>
            <p className={`mt-1 text-sm text-stone-500 ${hiClass}`}>
              {isHindi
                ? `नमस्ते, रवि जी — स्वस्थ होने का दिन ${patient.day_of_recovery}`
                : `Namaste, ${patient.name} ji — Day ${patient.day_of_recovery} of recovery`}
            </p>
          </div>
          {latest && <StatusBadge status={latest.status} />}
        </div>

        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" />
            <div>
              <p className={`text-sm font-bold text-amber-900 ${hiClass}`}>
                {tr("Daily check-in due", "आज की जाँच बाकी है")}
              </p>
              <p className={`mt-0.5 text-xs text-amber-800/80 ${hiClass}`}>
                {tr("Takes about 2 minutes.", "लगभग 2 मिनट लगते हैं।")}
              </p>
            </div>
          </div>
        </div>

        <Card>
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className={`text-xs font-bold uppercase tracking-wide text-stone-400 ${hiClass}`}>
                {tr("Wound", "घाव")}
              </p>
              <p className={`mt-0.5 text-sm font-bold text-stone-800 ${hiClass}`}>
                {tr(
                  `${patient.burn_location} — ${patient.burn_type}`,
                  `${patient.burn_location} — ${patient.burn_type}`,
                )}
              </p>
            </div>
            <span className={`rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-[11px] font-bold text-amber-700 ${hiClass}`}>
              {tr("Monitor", "निगरानी")}
            </span>
          </div>
          <div className="mt-4 space-y-3">
            <ProgressBar
              label={tr("Visual change trend", "बदलाव का रुझान")}
              value={latest ? latest.final_score : 20}
              tone={trendTone}
              badge={tr(trendLabel, STATUS_META[trendTone].labelHi)}
            />
            <ProgressBar
              label={tr("Last day-to-day change", "पिछला रोज़ का बदलाव")}
              value={lastChange}
              tone={lastChange >= 30 ? "red" : lastChange >= 15 ? "amber" : "green"}
              badge={tr(lastChange >= 30 ? "Large" : lastChange >= 15 ? "Some" : "Minimal", lastChange >= 30 ? "ज़्यादा" : lastChange >= 15 ? "कुछ" : "बहुत कम")}
            />
          </div>
        </Card>

        <div>
          <p className={`mb-2 text-xs font-bold uppercase tracking-wide text-stone-500 ${hiClass}`}>
            {tr("Photo history", "फोटो इतिहास")}
          </p>

          {loading && <Spinner label={tr("Loading history…", "इतिहास लोड हो रहा है…")} />}

          {!loading && error && (
            <ErrorState
              title={tr("Couldn't load history", "इतिहास लोड नहीं हो सका")}
              detail={error}
              onRetry={reload}
              retryLabel={tr("Try again", "फिर कोशिश करें")}
            />
          )}

          {!loading && !error && data && (
            <Card>
              <PhotoStrip history={data.history} />
            </Card>
          )}

          {!data && !loading && (
            <div className="grid grid-cols-4 gap-2">
              {[1, 2, 3].map((day) => (
                <div key={day} className="flex aspect-square flex-col items-center justify-center gap-1 rounded-lg bg-stone-100">
                  <Camera className="h-4 w-4 text-stone-400" />
                  <span className={`text-[10px] font-semibold text-stone-500 ${hiClass}`}>
                    {tr("Day", "दिन")} {day}
                  </span>
                </div>
              ))}
              <button
                type="button"
                onClick={startCheckIn}
                className="flex aspect-square flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-brand/40 text-brand"
              >
                <Plus className="h-4 w-4" />
                <span className={`text-[10px] font-bold ${hiClass}`}>{tr("Today", "आज")}</span>
              </button>
            </div>
          )}
        </div>

        <CTAButton onClick={startCheckIn} className={hiClass}>
          {tr("Start today's check-in", "आज की जाँच शुरू करें")}
        </CTAButton>

        <div className="rounded-xl border border-emerald-100 bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
          <div className="flex items-start gap-2">
            <TrendingDown className="mt-0.5 h-4 w-4 shrink-0" />
            <p className={hiClass}>
              {tr(
                "Keep taking photos from the same distance with the reference card visible.",
                "रेफरेंस कार्ड दिखाते हुए एक ही दूरी से फोटो लेते रहें।",
              )}
            </p>
          </div>
        </div>

        <Disclaimer />
      </div>
    </Layout>
  );
}
