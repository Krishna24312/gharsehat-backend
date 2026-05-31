import { Loader2 } from "lucide-react";
import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { assess } from "../api";
import { Card, ErrorState } from "../components/common";
import { Disclaimer } from "../components/Disclaimer";
import { Layout } from "../components/Layout";
import { useCheckIn } from "../context/CheckInContext";
import { useLanguage } from "../context/LanguageContext";
import { EMPTY_SYMPTOMS, type SymptomKey, type Symptoms as SymptomsType } from "../types";

// Question text per backend symptom key, in spec order.
const QUESTIONS: { key: SymptomKey; en: string; hi: string }[] = [
  { key: "fever", en: "Fever?", hi: "बुखार है?" },
  { key: "smell", en: "Bad smell from wound?", hi: "घाव से दुर्गंध आ रही है?" },
  { key: "spreading_redness", en: "Redness spreading?", hi: "लालिमा फैल रही है?" },
  { key: "discharge", en: "Discharge / pus?", hi: "घाव से स्राव / पीप?" },
  { key: "increasing_pain", en: "Increasing pain?", hi: "दर्द बढ़ रहा है?" },
];

export function Symptoms() {
  const navigate = useNavigate();
  const { tr, hiClass } = useLanguage();
  const { changeScore, symptoms, setSymptoms, setAssessResult } = useCheckIn();

  const [answers, setAnswers] = useState<SymptomsType>({ ...EMPTY_SYMPTOMS, ...symptoms });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Symptoms needs change_score from /analyze — without it, send the user back.
  if (changeScore === null) {
    return <Navigate to="/checkin" replace />;
  }

  function setAnswer(key: SymptomKey, value: boolean) {
    setAnswers((a) => ({ ...a, [key]: value }));
  }

  async function handleSubmit() {
    if (changeScore === null) return;
    setLoading(true);
    setError(null);
    try {
      setSymptoms(answers);
      const result = await assess(changeScore, answers);
      setAssessResult(result);
      navigate("/result");
    } catch {
      setError(
        tr(
          "Could not submit your answers. Please check the connection and try again.",
          "आपके उत्तर सबमिट नहीं हो सके। कृपया कनेक्शन जांचें और फिर कोशिश करें।",
        ),
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <Layout showBack backTo="/checkin">
      <div className="space-y-4">
        <div>
          <h1 className={`text-xl font-bold text-stone-800 ${hiClass}`}>
            {tr("A few quick questions", "कुछ छोटे सवाल")}
          </h1>
          <p className={`mt-1 text-sm text-stone-500 ${hiClass}`}>
            {tr(
              "Answer about how the patient feels today.",
              "मरीज आज कैसा महसूस कर रहा है, बताएं।",
            )}
          </p>
        </div>

        <Card className="divide-y divide-stone-100">
          {QUESTIONS.map((q, i) => (
            <div key={q.key} className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
              <span className={`text-sm font-medium text-stone-700 ${hiClass}`}>
                <span className="mr-1 text-stone-400">{i + 1}.</span>
                {tr(q.en, q.hi)}
              </span>
              <div className="flex shrink-0 overflow-hidden rounded-lg ring-1 ring-stone-200">
                <button
                  type="button"
                  onClick={() => setAnswer(q.key, false)}
                  className={`px-3.5 py-1.5 text-sm font-semibold transition ${hiClass} ${
                    !answers[q.key] ? "bg-emerald-500 text-white" : "bg-white text-stone-500"
                  }`}
                >
                  {tr("No", "नहीं")}
                </button>
                <button
                  type="button"
                  onClick={() => setAnswer(q.key, true)}
                  className={`px-3.5 py-1.5 text-sm font-semibold transition ${hiClass} ${
                    answers[q.key] ? "bg-brand text-white" : "bg-white text-stone-500"
                  }`}
                >
                  {tr("Yes", "हाँ")}
                </button>
              </div>
            </div>
          ))}
        </Card>

        {error && (
          <ErrorState
            title={tr("Couldn't submit", "सबमिट नहीं हुआ")}
            detail={error}
            onRetry={handleSubmit}
            retryLabel={tr("Try again", "फिर कोशिश करें")}
          />
        )}

        <button
          type="button"
          onClick={handleSubmit}
          disabled={loading}
          className={`flex w-full items-center justify-center gap-2 rounded-xl bg-brand py-3.5 font-semibold text-white shadow-card transition active:scale-[0.99] disabled:opacity-60 ${hiClass}`}
        >
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          {loading ? tr("Checking…", "जांच हो रही है…") : tr("See result", "परिणाम देखें")}
        </button>

        <Disclaimer />
      </div>
    </Layout>
  );
}
