import { Card, ErrorState, Spinner } from "../components/common";
import { Disclaimer } from "../components/Disclaimer";
import { Layout } from "../components/Layout";
import { ComingSoonBanner } from "../components/LanguageSelector";
import { PhotoStrip } from "../components/PhotoStrip";
import { StatusBadge } from "../components/StatusBadge";
import { useLanguage } from "../context/LanguageContext";
import { usePatientHistory } from "../hooks/usePatientHistory";
import { STATUS_META } from "../lib/status";

export function Progress() {
  const { tr, hiClass } = useLanguage();
  const { data, loading, error, reload } = usePatientHistory();

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
          <>
            <Card>
              <PhotoStrip history={data.history} />
            </Card>

            {/* Narrative — matches Ravi's actual day 1-4 green, day 5 red data. */}
            <Card className="border-l-4 border-l-brand">
              <p className={`text-sm leading-relaxed text-stone-700 ${hiClass}`}>
                {tr(
                  "Days 1–4 showed improvement. Day 5 shows a sudden increase in change score. Fever and spreading redness reported today.",
                  "पहले 4 दिनों में सुधार दिखा। दिन 5 पर बदलाव अचानक बढ़ा। आज बुखार और फैलती हुई लालिमा बताई गई।",
                )}
              </p>
            </Card>

            {/* Per-day timeline with change bars. */}
            <Card>
              <p className={`mb-3 text-sm font-semibold text-stone-700 ${hiClass}`}>
                {tr("Daily change score", "रोज़ का बदलाव स्कोर")}
              </p>
              <ul className="space-y-3">
                {data.history.map((entry, i) => {
                  const meta = STATUS_META[entry.status];
                  return (
                    <li key={entry.date} className="flex items-center gap-3">
                      <span className={`w-12 shrink-0 text-sm font-medium text-stone-500 ${hiClass}`}>
                        {tr("Day", "दिन")} {i + 1}
                      </span>
                      <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-stone-100">
                        <div
                          className={`h-full rounded-full ${meta.dot}`}
                          style={{ width: `${Math.min(entry.final_score, 100)}%` }}
                        />
                      </div>
                      <StatusBadge status={entry.status} />
                    </li>
                  );
                })}
              </ul>
            </Card>
          </>
        )}

        <Disclaimer />
      </div>
    </Layout>
  );
}
