import {
  Activity,
  CalendarCheck,
  Camera,
  Check,
  CheckCircle2,
  FileText,
  Flag,
  Info,
  Stethoscope,
  TrendingDown,
  Volume2,
} from "lucide-react";
import type { ReactNode } from "react";
import { Card, ErrorState, Spinner } from "../components/common";
import { CTAButton } from "../components/CTAButton";
import { Disclaimer } from "../components/Disclaimer";
import { Layout } from "../components/Layout";
import { ComingSoonBanner } from "../components/LanguageSelector";
import { PhotoStrip } from "../components/PhotoStrip";
import { useLanguage } from "../context/LanguageContext";
import { usePatientHistory } from "../hooks/usePatientHistory";
import { STATUS_META } from "../lib/status";
import type { Status } from "../types";

export function Progress() {
  const { tr, hiClass, language } = useLanguage();
  const { data, loading, error, reload } = usePatientHistory();

  function speak(text: string) {
    try {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = language === "hi" ? "hi-IN" : "en-IN";
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(utterance);
    } catch {
      // Speech synthesis is optional demo polish.
    }
  }

  return (
    <Layout>
      <div className="space-y-4">
        <ComingSoonBanner />

        <div>
          <h1 className={`text-xl font-bold text-stone-800 ${hiClass}`}>
            {tr("Recovery progress", "स्वस्थ होने की प्रगति")}
          </h1>
          <p className={`mt-1 text-sm text-stone-500 ${hiClass}`}>
            {tr("Day-by-day visual change over the last 5 days.", "पिछले 5 दिनों का रोज़ का बदलाव।")}
          </p>
        </div>

        {loading && <Spinner label={tr("Loading progress…", "प्रगति लोड हो रही है…")} />}

        {!loading && error && (
          <ErrorState
            title={tr("Couldn't load progress", "प्रगति लोड नहीं हो सकी")}
            detail={error}
            onRetry={reload}
            retryLabel={tr("Try again", "फिर कोशिश करें")}
          />
        )}

        {!loading && !error && data && (
          <ProgressBody data={data} onSpeak={speak} />
        )}

        <Disclaimer />
      </div>
    </Layout>
  );
}

function ProgressBody({
  data,
  onSpeak,
}: {
  data: NonNullable<ReturnType<typeof usePatientHistory>["data"]>;
  onSpeak: (text: string) => void;
}) {
  const { tr, hiClass } = useLanguage();
  const latest = data.history[data.history.length - 1];
  const first = data.history[0];
  const verdict =
    latest.status === "red"
      ? tr("High visual change today", "आज बदलाव ज़्यादा है")
      : latest.status === "amber"
        ? tr("Some visual change today", "आज कुछ बदलाव है")
        : tr("Low visual change today", "आज बदलाव कम है");
  const detail =
    latest.status === "red"
      ? tr(
          "Review today's change and symptoms. Show this to your doctor today.",
          "आज का बदलाव और लक्षण देखें। आज ही डॉक्टर को दिखाएँ।",
        )
      : latest.status === "amber"
        ? tr(
            "Watch closely and continue daily check-ins.",
            "ध्यान से निगरानी रखें और रोज़ चेक-इन जारी रखें।",
          )
        : tr(
            "Continue the current dressing care and daily check-ins.",
            "मौजूदा ड्रेसिंग देखभाल और रोज़ चेक-इन जारी रखें।",
          );

  const days = data.history.map((entry, index) => ({
    day: index + 1,
    entry,
    flagged: Object.values(entry.symptoms).some(Boolean),
  }));

  return (
    <>
      <Card className={latest.status === "red" ? "border-l-4 border-l-red-500" : latest.status === "amber" ? "border-l-4 border-l-amber-500" : "border-l-4 border-l-emerald-500"}>
        <div className="flex items-start gap-3">
          <CheckCircle2 className={`mt-0.5 h-7 w-7 shrink-0 ${latest.status === "red" ? "text-red-600" : latest.status === "amber" ? "text-amber-600" : "text-emerald-600"}`} />
          <div className="min-w-0 flex-1">
            <p className={`text-xs font-bold uppercase tracking-wide text-stone-400 ${hiClass}`}>
              {tr("Latest visual-change summary", "नवीनतम बदलाव सारांश")}
            </p>
            <p className={`mt-1 text-[15px] font-bold leading-snug text-stone-800 ${hiClass}`}>{verdict}</p>
            <p className={`mt-2 flex items-center gap-1 text-xs text-stone-500 ${hiClass}`}>
              <Info className="h-3.5 w-3.5" />
              {detail}
            </p>
          </div>
          <button
            type="button"
            onClick={() => onSpeak(verdict)}
            aria-label={tr("Listen", "सुनें")}
            className="shrink-0 rounded-full bg-stone-100 p-2 text-stone-500 hover:bg-stone-200"
          >
            <Volume2 className="h-4 w-4" />
          </button>
        </div>
      </Card>

      <div>
        <p className={`mb-2 text-xs font-bold uppercase tracking-wide text-stone-500 ${hiClass}`}>
          {tr("Before and now", "पहले और अब")}
        </p>
        <div className="grid grid-cols-2 gap-3">
          <PhotoCompareCard label={tr("Day 1", "दिन 1")} status={first.status} />
          <PhotoCompareCard label={tr("Today", "आज")} status={latest.status} />
        </div>
      </div>

      <Card>
        <p className={`mb-3 text-sm font-bold text-stone-700 ${hiClass}`}>
          {tr("Full photo timeline", "पूरी फोटो समयरेखा")}
        </p>
        <PhotoStrip history={data.history} />
      </Card>

      <Card>
        <p className={`mb-3 text-xs font-bold uppercase tracking-wide text-stone-400 ${hiClass}`}>
          {tr("What changed", "क्या बदला")}
        </p>
        <ul className="space-y-2.5">
          <ChangeLine
            icon={<TrendingDown className="h-4 w-4" />}
            text={tr(
              `Latest final score is ${latest.final_score}. Day 1 was ${first.final_score}.`,
              `नवीनतम अंतिम स्कोर ${latest.final_score} है। दिन 1 पर ${first.final_score} था।`,
            )}
          />
          <ChangeLine
            icon={<Activity className="h-4 w-4" />}
            text={tr(
              `${latest.change_score} visual change score on the latest check-in.`,
              `नवीनतम चेक-इन में बदलाव स्कोर ${latest.change_score} है।`,
            )}
          />
          <ChangeLine
            icon={<CalendarCheck className="h-4 w-4" />}
            text={tr(
              `You have ${data.history.length} check-ins in this demo timeline.`,
              `इस डेमो समयरेखा में ${data.history.length} चेक-इन हैं।`,
            )}
          />
        </ul>
      </Card>

      <div>
        <p className={`mb-2 text-xs font-bold uppercase tracking-wide text-stone-500 ${hiClass}`}>
          {tr("Symptom history", "लक्षण इतिहास")}
        </p>
        <div className="grid grid-cols-5 gap-2">
          {days.map((day) => (
            <div
              key={day.entry.date}
              className={`flex flex-col items-center gap-1 rounded-lg border p-2 ${
                day.flagged ? "border-amber-200 bg-amber-50" : "border-emerald-100 bg-emerald-50"
              }`}
              title={day.flagged ? tr("Symptoms reported", "लक्षण बताए गए") : tr("No symptoms reported", "कोई लक्षण नहीं बताया गया")}
            >
              {day.flagged ? (
                <Flag className="h-4 w-4 text-amber-700" />
              ) : (
                <Check className="h-4 w-4 text-emerald-700" />
              )}
              <span className={`text-[10px] font-bold text-stone-500 ${hiClass}`}>
                {tr("Day", "दिन")} {day.day}
              </span>
            </div>
          ))}
        </div>
      </div>

      {(latest.status === "red" || latest.status === "amber") && (
        <Card>
          <p className={`mb-3 text-xs font-bold uppercase tracking-wide text-stone-400 ${hiClass}`}>
            {tr("Doctor / review", "डॉक्टर / समीक्षा")}
          </p>
          <div className="flex items-start gap-2.5">
            <Stethoscope className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
            <p className={`text-sm leading-snug text-stone-700 ${hiClass}`}>
              {tr(
                "Doctor portal updated quietly for review.",
                "डॉक्टर पोर्टल समीक्षा के लिए शांत रूप से अपडेट हुआ।",
              )}
            </p>
          </div>
        </Card>
      )}

      <CTAButton variant="secondary" className={`gap-2 ${hiClass}`}>
        <FileText className="h-4 w-4" />
        {tr("Show your doctor — generate report", "डॉक्टर को दिखाएँ — रिपोर्ट बनाएं")}
      </CTAButton>
    </>
  );
}

function PhotoCompareCard({ label, status }: { label: string; status: Status }) {
  const meta = STATUS_META[status];
  const iconColor: Record<Status, string> = {
    green: "text-emerald-500",
    amber: "text-amber-500",
    red: "text-red-500",
  };
  return (
    <div>
      <div className={`flex aspect-square items-center justify-center rounded-lg border-2 ${meta.accent} bg-stone-100`}>
        <Camera className={`h-7 w-7 ${iconColor[status]}`} />
      </div>
      <p className="mt-1.5 text-center text-[11px] font-semibold text-stone-500">{label}</p>
    </div>
  );
}

function ChangeLine({ icon, text }: { icon: ReactNode; text: string }) {
  return (
    <li className="flex items-start gap-2.5">
      <span className="mt-0.5 text-brand">{icon}</span>
      <span className="text-sm leading-snug text-stone-700">{text}</span>
    </li>
  );
}
