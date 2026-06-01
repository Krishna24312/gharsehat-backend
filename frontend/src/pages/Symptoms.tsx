import { Loader2 } from "lucide-react";
import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { assess, submitCheckin } from "../api";
import { DEMO_PATIENT_ID } from "../config";
import { Card, ErrorState } from "../components/common";
import { CTAButton } from "../components/CTAButton";
import { Disclaimer } from "../components/Disclaimer";
import { InfoBox } from "../components/InfoBox";
import { Layout } from "../components/Layout";
import { useCheckIn } from "../context/CheckInContext";
import { useLanguage } from "../context/LanguageContext";
import { EMPTY_SYMPTOMS, type SymptomKey, type Symptoms as SymptomsType } from "../types";

// Question text per backend symptom key, in spec order.
const QUESTIONS: { key: SymptomKey; en: string; hi: string; hintEn: string; hintHi: string }[] = [
  {
    key: "fever",
    en: "Fever above 38°C?",
    hi: "बुखार 38°C से अधिक?",
    hintEn: "Take temperature or check for chills.",
    hintHi: "तापमान लें या ठंड लगने की जाँच करें।",
  },
  {
    key: "smell",
    en: "Bad smell from wound?",
    hi: "घाव से दुर्गंध आ रही है?",
    hintEn: "Notice during dressing change.",
    hintHi: "ड्रेसिंग बदलते समय ध्यान दें।",
  },
  {
    key: "spreading_redness",
    en: "Redness spreading beyond the wound edge?",
    hi: "लालिमा घाव के किनारे से बाहर फैल रही है?",
    hintEn: "Red area looks larger than yesterday.",
    hintHi: "लाल क्षेत्र कल से बड़ा दिख रहा है।",
  },
  {
    key: "discharge",
    en: "Yellow or green discharge?",
    hi: "पीला या हरा स्राव?",
    hintEn: "Fluid seen on the wound or dressing.",
    hintHi: "घाव या ड्रेसिंग पर तरल दिखे।",
  },
  {
    key: "increasing_pain",
    en: "Pain increasing since yesterday?",
    hi: "कल से दर्द बढ़ा है?",
    hintEn: "More painful than 24 hours ago.",
    hintHi: "24 घंटे पहले से अधिक दर्द।",
  },
];

export function Symptoms() {
  const navigate = useNavigate();
  const { tr, hiClass } = useLanguage();
  const {
    changeScore,
    symptoms,
    setSymptoms,
    setAssessResult,
    setCheckinSync,
    todayPhoto,
    yesterdayPhoto,
    analyze,
  } = useCheckIn();

  const [answers, setAnswers] = useState<SymptomsType>({ ...EMPTY_SYMPTOMS, ...symptoms });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Symptoms needs change_score from /analyze — without it, send the user back.
  if (changeScore === null) {
    return <Navigate to="/capture" replace />;
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

      // Best-effort: persist the completed check-in so the doctor portal updates
      // live. Fire-and-forget — a failure here must never block the result
      // screen. We track the outcome (success/failed/skipped) so the result and
      // alerts screens only claim the doctor portal updated when it really did.
      if (todayPhoto) {
        setCheckinSync("pending");
        void submitCheckin({
          patientId: DEMO_PATIENT_ID,
          today: todayPhoto,
          yesterday: yesterdayPhoto,
          changeScore,
          finalScore: result.final_score,
          status: result.status,
          symptoms: answers,
          action: result.action,
          rednessDelta: analyze?.redness_delta,
          borderChange: analyze?.border_change,
          darkAreaDelta: analyze?.dark_area_delta,
          yellowAreaDelta: analyze?.yellow_area_delta,
          woundAreaDelta: analyze?.wound_area_delta,
          combinedBorderChange: analyze?.combined_border_change,
        })
          .then(() => setCheckinSync("success"))
          .catch(() => setCheckinSync("failed"));
      } else {
        // No captured/uploaded photo to attach — nothing to push to the portal.
        setCheckinSync("skipped");
      }

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
    <Layout showBack backTo="/capture">
      <div className="space-y-4">
        <div>
          <h1 className={`text-xl font-bold text-stone-800 ${hiClass}`}>
            {tr("Step 2 of 2 — Symptoms", "चरण 2 / 2 — लक्षण")}
          </h1>
          <p className={`mt-1 text-sm text-stone-500 ${hiClass}`}>
            {tr(
              "Answer about how the patient feels today.",
              "मरीज आज कैसा महसूस कर रहा है, बताएं।",
            )}
          </p>
        </div>

        <InfoBox>
          <span className={hiClass}>
            {tr(
              "These questions help combine visual change with caregiver observations.",
              "ये सवाल दृश्य बदलाव को देखभाल करने वाले की जानकारी से जोड़ते हैं।",
            )}
          </span>
        </InfoBox>

        <div className="space-y-3">
          {QUESTIONS.map((q, i) => (
            <Card key={q.key}>
              <p className={`text-sm font-bold text-stone-800 ${hiClass}`}>
                <span className="mr-1 text-stone-400">{i + 1}.</span>
                {tr(q.en, q.hi)}
              </p>
              <p className={`mt-1 text-xs text-stone-500 ${hiClass}`}>{tr(q.hintEn, q.hintHi)}</p>
              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => setAnswer(q.key, true)}
                  className={`flex-1 rounded-lg border py-2 text-sm font-bold transition ${hiClass} ${
                    answers[q.key]
                      ? "border-brand bg-brand text-white"
                      : "border-stone-200 bg-white text-stone-600 hover:bg-stone-50"
                  }`}
                >
                  {tr("Yes", "हाँ")}
                </button>
                <button
                  type="button"
                  onClick={() => setAnswer(q.key, false)}
                  className={`flex-1 rounded-lg border py-2 text-sm font-bold transition ${hiClass} ${
                    !answers[q.key]
                      ? "border-stone-900 bg-stone-900 text-white"
                      : "border-stone-200 bg-white text-stone-600 hover:bg-stone-50"
                  }`}
                >
                  {tr("No", "नहीं")}
                </button>
              </div>
            </Card>
          ))}
        </div>

        {error && (
          <ErrorState
            title={tr("Couldn't submit", "सबमिट नहीं हुआ")}
            detail={error}
            onRetry={handleSubmit}
            retryLabel={tr("Try again", "फिर कोशिश करें")}
          />
        )}

        <CTAButton
          onClick={handleSubmit}
          disabled={loading}
          className={`gap-2 ${hiClass}`}
        >
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          {loading ? tr("Checking…", "जांच हो रही है…") : tr("See result", "परिणाम देखें")}
        </CTAButton>

        <p className={`text-center text-[11px] text-stone-500 ${hiClass}`}>
          {tr(
            "This checklist leans toward caution. A false alarm is safer than missing an important change.",
            "यह चेकलिस्ट सावधानी की ओर झुकती है। गलत अलार्म, महत्वपूर्ण बदलाव छूटने से बेहतर है।",
          )}
        </p>

        <Disclaimer />
      </div>
    </Layout>
  );
}
