import { ArrowRight, CalendarCheck, TrendingUp } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Card, ErrorState, Spinner } from "../components/common";
import { Disclaimer } from "../components/Disclaimer";
import { Layout } from "../components/Layout";
import { ComingSoonBanner } from "../components/LanguageSelector";
import { PhotoStrip } from "../components/PhotoStrip";
import { StatusBadge } from "../components/StatusBadge";
import { useCheckIn } from "../context/CheckInContext";
import { useLanguage } from "../context/LanguageContext";
import { usePatientHistory } from "../hooks/usePatientHistory";

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

  function startCheckIn() {
    reset(); // fresh check-in flow from Home
    navigate("/checkin");
  }

  return (
    <Layout>
      <div className="space-y-4">
        <ComingSoonBanner />

        {/* Greeting */}
        <div>
          <h1 className={`text-xl font-bold text-stone-800 ${hiClass}`}>
            {isHindi
              ? `नमस्ते, रवि जी — स्वस्थ होने का दिन ${patient.day_of_recovery}`
              : `Namaste, ${patient.name} ji — Day ${patient.day_of_recovery} of recovery`}
          </h1>
          <p className="mt-1 text-sm text-stone-500">
            {tr(
              `${patient.name} · ${patient.age} · ${patient.gender} · ${patient.burn_location} · ${patient.burn_type}`,
              `${patient.age} वर्ष · ${patient.burn_location} · ${patient.burn_type}`,
            )}
          </p>
        </div>

        {/* Daily check-in due card */}
        <Card className="border-l-4 border-l-brand">
          <div className="flex items-start gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand/10 text-brand">
              <CalendarCheck className="h-5 w-5" />
            </span>
            <div className="min-w-0 flex-1">
              <p className={`font-semibold text-stone-800 ${hiClass}`}>
                {tr("Daily check-in due", "आज का चेक-इन बाकी है")}
              </p>
              <p className={`mt-0.5 flex items-center gap-1 text-sm text-stone-500 ${hiClass}`}>
                <TrendingUp className="h-4 w-4 text-emerald-500" />
                {tr("Previous trend: improving", "पिछला रुझान: सुधार")}
              </p>
              <p className={`mt-1 text-sm text-stone-500 ${hiClass}`}>
                {tr(
                  "Complete today's check-in to compare change.",
                  "बदलाव की तुलना के लिए आज का चेक-इन पूरा करें।",
                )}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={startCheckIn}
            className={`mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-brand py-3 font-semibold text-white shadow-card transition active:scale-[0.99] ${hiClass}`}
          >
            {tr("Start today's check-in", "आज का चेक-इन शुरू करें")}
            <ArrowRight className="h-4 w-4" />
          </button>
        </Card>

        {/* Recent days strip */}
        <Card>
          <div className="mb-3 flex items-center justify-between">
            <h2 className={`font-semibold text-stone-800 ${hiClass}`}>
              {tr("Recent days", "हाल के दिन")}
            </h2>
            {latest && (
              <span className="flex items-center gap-1.5 text-xs text-stone-400">
                <span className={hiClass}>{tr("Latest", "नवीनतम")}</span>
                <StatusBadge status={latest.status} />
              </span>
            )}
          </div>

          {loading && <Spinner label={tr("Loading history…", "इतिहास लोड हो रहा है…")} />}

          {!loading && error && (
            <ErrorState
              title={tr("Couldn't load history", "इतिहास लोड नहीं हो सका")}
              detail={error}
              onRetry={reload}
              retryLabel={tr("Try again", "फिर कोशिश करें")}
            />
          )}

          {!loading && !error && data && <PhotoStrip history={data.history} />}
        </Card>

        <Disclaimer />
      </div>
    </Layout>
  );
}
