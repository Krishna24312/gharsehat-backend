import { ArrowRight, Bandage, Phone, Stethoscope } from "lucide-react";
import { Navigate, useNavigate } from "react-router-dom";
import { Card } from "../components/common";
import { CTALink } from "../components/CTAButton";
import { Disclaimer } from "../components/Disclaimer";
import { InfoBox } from "../components/InfoBox";
import { Layout } from "../components/Layout";
import { ProgressBar } from "../components/ProgressBar";
import { StatusBadge } from "../components/StatusBadge";
import { useCheckIn } from "../context/CheckInContext";
import { useLanguage } from "../context/LanguageContext";
import { STATUS_META } from "../lib/status";

/** One metric tile in the change-detail grid. */
function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl bg-stone-50 px-3 py-2.5 text-center ring-1 ring-stone-100">
      <p className="text-lg font-bold text-stone-800">{value}</p>
      <p className="mt-0.5 text-[11px] font-medium leading-tight text-stone-400">{label}</p>
    </div>
  );
}

export function Result() {
  const navigate = useNavigate();
  const { tr, hiClass, isHindi } = useLanguage();
  const { assessResult, analyze, hasResult } = useCheckIn();

  // Opened directly without a completed check-in → back to Home.
  if (!hasResult || !assessResult) {
    return <Navigate to="/home" replace />;
  }

  const meta = STATUS_META[assessResult.status];
  const isRed = assessResult.status === "red";
  const isCall108 = assessResult.action === "call_108";
  const message = isHindi ? assessResult.message_hindi : assessResult.message_english;
  const dash = "—";
  const barTone = assessResult.status;
  const symptomPercent = Math.min(100, assessResult.symptom_score);
  const rednessValue = analyze ? Math.min(100, Math.abs(analyze.redness_delta)) : 0;
  const borderValue = analyze ? Math.min(100, Math.abs(analyze.border_change)) : 0;

  return (
    <Layout showBack backTo="/home">
      <div className="space-y-4">
        {/* Status hero */}
        <div className={`rounded-2xl border p-5 ${meta.soft}`}>
          <p className={`mb-3 text-xs font-bold uppercase tracking-wide opacity-70 ${hiClass}`}>
            {tr("Today's assessment", "आज का मूल्यांकन")}
          </p>
          <div className="flex items-center justify-between">
            <StatusBadge status={assessResult.status} />
            <span className="text-right">
              <span className="block text-2xl font-extrabold leading-none">
                {assessResult.final_score}
              </span>
              <span className={`text-[11px] font-medium opacity-70 ${hiClass}`}>
                {tr("final score", "अंतिम स्कोर")}
              </span>
            </span>
          </div>
          <p className={`mt-3 text-sm font-medium leading-relaxed ${isHindi ? "font-hi" : ""}`}>
            {message}
          </p>
        </div>

        <Card>
          <p className={`mb-3 text-xs font-bold uppercase tracking-wide text-stone-400 ${hiClass}`}>
            {tr("What GharSehat compared", "GharSehat ने क्या तुलना की")}
          </p>
          <div className="space-y-3">
            <ProgressBar
              label={tr("Overall change score", "कुल बदलाव स्कोर")}
              value={assessResult.change_score}
              tone={barTone}
              badge={tr(meta.labelEn, meta.labelHi)}
            />
            <ProgressBar
              label={tr("Redness area", "लालिमा क्षेत्र")}
              value={rednessValue}
              tone={rednessValue >= 60 ? "red" : rednessValue >= 30 ? "amber" : "green"}
              badge={analyze ? `${Math.round(analyze.redness_delta)}%` : tr("Not available", "उपलब्ध नहीं")}
            />
            <ProgressBar
              label={tr("Border spread", "किनारे का फैलाव")}
              value={borderValue}
              tone={borderValue >= 60 ? "red" : borderValue >= 30 ? "amber" : "green"}
              badge={analyze ? `${Math.round(analyze.border_change)}%` : tr("Not available", "उपलब्ध नहीं")}
            />
            <ProgressBar
              label={tr("Symptoms", "लक्षण")}
              value={symptomPercent}
              tone={symptomPercent >= 60 ? "red" : symptomPercent >= 30 ? "amber" : "green"}
              badge={`${assessResult.positive_symptoms.length} / 5`}
            />
          </div>
        </Card>

        <Card>
          <p className={`mb-3 text-sm font-semibold text-stone-700 ${hiClass}`}>
            {tr("Detected change", "मापा गया बदलाव")}
          </p>
          <div className="grid grid-cols-2 gap-2.5">
            <Metric label={tr("Change score", "बदलाव स्कोर")} value={assessResult.change_score} />
            <Metric label={tr("Symptom score", "लक्षण स्कोर")} value={assessResult.symptom_score} />
            <Metric
              label={tr("Redness change", "लालिमा बदलाव")}
              value={analyze ? analyze.redness_delta : dash}
            />
            <Metric
              label={tr("Border change", "किनारा बदलाव")}
              value={analyze ? analyze.border_change : dash}
            />
          </div>
        </Card>

        {/* Red escalation block */}
        {isRed && (
          <div className="space-y-3">
            {isCall108 ? (
              <a
                href="tel:108"
                className={`flex w-full items-center justify-center gap-2 rounded-xl bg-red-600 py-4 text-lg font-bold text-white shadow-card active:scale-[0.99] ${hiClass}`}
              >
                <Phone className="h-5 w-5" />
                {tr("Call 108", "108 पर कॉल करें")}
              </a>
            ) : (
              <button
                type="button"
                onClick={() => navigate("/alerts")}
                className={`flex w-full items-center justify-center gap-2 rounded-xl bg-red-600 py-4 text-lg font-bold text-white shadow-card active:scale-[0.99] ${hiClass}`}
              >
                <Stethoscope className="h-5 w-5" />
                {tr("Show Doctor Today", "आज डॉक्टर को दिखाएँ")}
              </button>
            )}
            <div className={`rounded-xl bg-stone-100 px-3 py-2.5 text-center text-sm text-stone-600 ${hiClass}`}>
              {tr(
                "Doctor portal has been updated for review.",
                "डॉक्टर पोर्टल समीक्षा के लिए अपडेट किया गया है।",
              )}
            </div>
          </div>
        )}

        {assessResult.status === "amber" && (
          <InfoBox variant="warning">
            <span className={hiClass}>
              {tr(
                "Some visual change was detected. Watch closely and show this at the next doctor visit.",
                "कुछ बदलाव दिखा है। ध्यान से निगरानी रखें और अगली डॉक्टर मुलाकात में दिखाएँ।",
              )}
            </span>
          </InfoBox>
        )}

        {/* Green / amber CTA */}
        {!isRed && (
          <CTALink to="/dressing" className={`gap-2 ${hiClass}`}>
            <Bandage className="h-4 w-4" />
            {tr("View Dressing Guide", "ड्रेसिंग गाइड देखें")}
            <ArrowRight className="h-4 w-4" />
          </CTALink>
        )}

        <Disclaimer
          english={assessResult.disclaimer_english}
          hindi={assessResult.disclaimer_hindi}
        />
      </div>
    </Layout>
  );
}
