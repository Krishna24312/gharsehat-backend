import { ArrowRight, Bandage, Phone, Stethoscope } from "lucide-react";
import { Navigate, useNavigate } from "react-router-dom";
import { Card } from "../components/common";
import { CTALink } from "../components/CTAButton";
import { Disclaimer } from "../components/Disclaimer";
import { DoctorSyncNote } from "../components/DoctorSyncNote";
import { Layout } from "../components/Layout";
import { useCheckIn } from "../context/CheckInContext";
import { useLanguage } from "../context/LanguageContext";
import { STATUS_META } from "../lib/status";
import type { AssessAction, Status, SymptomKey } from "../types";

const toneText: Record<Status, string> = {
  green: "text-emerald-700",
  amber: "text-amber-700",
  red: "text-red-700",
};
const toneBar: Record<Status, string> = {
  green: "bg-emerald-500",
  amber: "bg-amber-500",
  red: "bg-red-600",
};

// Care-level scale shown on the compact meter, low → high. `.en` matches the
// backend's care_level_label values so the active step can be highlighted.
const CARE_LEVELS: { en: string; hi: string }[] = [
  { en: "Stable", hi: "स्थिर" },
  { en: "Watch closely", hi: "ध्यान रखें" },
  { en: "Doctor review", hi: "डॉक्टर जांच" },
  { en: "Urgent care", hi: "तुरंत देखभाल" },
];

type Severity = "high" | "medium" | "low";

/** Bucket a 0–100 metric into a caregiver-friendly severity tier. */
function metricSeverityLabel(value: number): Severity {
  const v = Math.abs(value);
  if (v >= 60) return "high";
  if (v >= 30) return "medium";
  return "low";
}

const SEVERITY_TEXT: Record<Severity, { en: string; hi: string }> = {
  high: { en: "High", hi: "ज़्यादा" },
  medium: { en: "Medium", hi: "मध्यम" },
  low: { en: "Low", hi: "कम" },
};
const SEVERITY_TONE: Record<Severity, Status> = { high: "red", medium: "amber", low: "green" };

/** Plain-language count of reported symptoms (no raw score). */
function symptomCountLabel(positiveSymptoms: SymptomKey[]): { en: string; hi: string } {
  const count = positiveSymptoms.length;
  if (count === 0) return { en: "None reported", hi: "कोई नहीं" };
  return { en: `${count} reported`, hi: `${count} दर्ज` };
}

// Bilingual CTA label for the primary action; null for green/amber (no
// alarming CTA — those use the dressing-guide link instead).
function actionCtaLabel(action: AssessAction): { en: string; hi: string } | null {
  if (action === "call_108") return { en: "Call 108", hi: "108 पर कॉल करें" };
  if (action === "show_doctor_today") return { en: "Show Doctor Today", hi: "आज डॉक्टर को दिखाएँ" };
  return null;
}

// Bilingual fallback patient titles when the backend omits patient_title.
const FALLBACK_TITLE: Record<string, { en: string; hi: string }> = {
  green: { en: "Looking stable today", hi: "आज स्थिति स्थिर है" },
  amber: { en: "Watch closely", hi: "ध्यान से देखें" },
  show_doctor_today: { en: "Doctor review recommended", hi: "डॉक्टर जांच की सलाह" },
  call_108: { en: "Urgent care recommended", hi: "तुरंत देखभाल आवश्यक" },
};

// Fallback care-level label (matches CARE_LEVELS .en) from status/action.
function fallbackCareLabel(status: Status, action: AssessAction): string {
  if (status === "green") return "Stable";
  if (status === "amber") return "Watch closely";
  if (action === "call_108") return "Urgent care";
  return "Doctor review";
}

/** One photo-comparison row: human label + severity word + optional thin bar.
 *  Intentionally shows NO raw percentage — those live in "For doctor review". */
function ComparisonRow({
  label,
  severity,
  tone,
  value,
  showBar = true,
}: {
  label: string;
  severity: string;
  tone: Status;
  value?: number;
  showBar?: boolean;
}) {
  const width = value === undefined ? 0 : Math.max(4, Math.min(100, Math.round(value)));
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between gap-3 text-[13px]">
        <span className="font-medium text-stone-600">{label}</span>
        <span className={`shrink-0 font-semibold ${toneText[tone]}`}>{severity}</span>
      </div>
      {showBar && (
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-stone-100">
          <div className={`h-full rounded-full ${toneBar[tone]}`} style={{ width: `${width}%` }} />
        </div>
      )}
    </div>
  );
}

export function Result() {
  const navigate = useNavigate();
  const { tr, hiClass, isHindi } = useLanguage();
  const { assessResult, analyze, hasResult, checkinSync } = useCheckIn();

  // Opened directly without a completed check-in → back to Home.
  if (!hasResult || !assessResult) {
    return <Navigate to="/home" replace />;
  }

  const meta = STATUS_META[assessResult.status];
  const status = assessResult.status;
  const isCall108 = assessResult.action === "call_108";
  const message = isHindi ? assessResult.message_hindi : assessResult.message_english;
  const dash = "—";

  // Patient-friendly guidance, with bilingual fallbacks so the screen still
  // reads correctly on older backends that omit the optional fields.
  const fallbackTitle =
    FALLBACK_TITLE[assessResult.action] ?? FALLBACK_TITLE[status] ?? {
      en: "Review recommended",
      hi: "जांच की सलाह",
    };
  const heroTitle = assessResult.patient_title ?? tr(fallbackTitle.en, fallbackTitle.hi);
  const heroSummary =
    isHindi ? message : assessResult.patient_summary ?? assessResult.message_english;

  // Care level — label + meter position, both with fallbacks.
  const careLabel =
    assessResult.care_level_label ?? fallbackCareLabel(status, assessResult.action);
  const carePosition = Math.max(
    0,
    Math.min(100, assessResult.care_level_position ?? assessResult.final_score),
  );
  const careText = CARE_LEVELS.find((l) => l.en === careLabel) ?? { en: careLabel, hi: careLabel };
  const careDisplay = tr(careText.en, careText.hi);

  // Next step — friendly text with a bilingual fallback to the fixed message.
  const nextStep = assessResult.next_step ?? message;

  // Photo-comparison severities (kept separate from the triage guidance).
  const cs = assessResult.change_score;
  const changeTone: Status = cs >= 60 ? "red" : cs >= 30 ? "amber" : "green";
  const visualChangeLabel =
    assessResult.visual_change_label ??
    (cs >= 60
      ? tr("High visual change", "ज़्यादा बदलाव")
      : cs >= 30
        ? tr("Some visual change", "कुछ बदलाव")
        : tr("Low visual change", "कम बदलाव"));

  const rednessValue = analyze ? Math.min(100, Math.abs(analyze.redness_delta)) : 0;
  const borderValue = analyze ? Math.min(100, Math.abs(analyze.border_change)) : 0;
  const rednessSev = metricSeverityLabel(rednessValue);
  const borderSev = metricSeverityLabel(borderValue);
  const symptomPercent = Math.min(100, assessResult.symptom_score);
  const symptomSev = metricSeverityLabel(symptomPercent);
  const symptomCount = symptomCountLabel(assessResult.positive_symptoms);

  const cta = actionCtaLabel(assessResult.action);

  // Compact, secondary numeric line for the doctor.
  const docMetrics: { label: string; value: string | number }[] = [
    { label: tr("Visual", "दृश्य"), value: assessResult.change_score },
    { label: tr("Symptoms", "लक्षण"), value: assessResult.symptom_score },
    { label: tr("Final", "अंतिम"), value: assessResult.final_score },
    { label: tr("Redness", "लालिमा"), value: analyze ? analyze.redness_delta : dash },
    { label: tr("Border", "किनारा"), value: analyze ? analyze.border_change : dash },
  ];

  return (
    <Layout showBack backTo="/home">
      <div className="space-y-4">
        {/* 1. Hero guidance — leads with the patient-friendly title. */}
        <div className={`rounded-2xl border p-5 ${meta.soft}`}>
          <div className="mb-2 flex items-center justify-between gap-2">
            <p className={`text-xs font-bold uppercase tracking-wide opacity-70 ${hiClass}`}>
              {tr("Today's assessment", "आज का मूल्यांकन")}
            </p>
            <span
              className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold ${meta.badge} ${hiClass}`}
            >
              {careDisplay}
            </span>
          </div>
          <h2 className={`text-xl font-extrabold leading-tight ${assessResult.patient_title ? "" : hiClass}`}>
            {heroTitle}
          </h2>
          <p className={`mt-2 text-sm font-medium leading-relaxed ${isHindi ? "font-hi" : ""}`}>
            {heroSummary}
          </p>
        </div>

        {/* 2. Primary action, immediately after the hero. */}
        <Card className={`border ${meta.accent}`}>
          <p className={`mb-1 text-xs font-bold uppercase tracking-wide text-stone-400 ${hiClass}`}>
            {tr("Next step", "अगला कदम")}
          </p>
          <p className="text-sm font-semibold leading-relaxed text-stone-800">{nextStep}</p>

          {cta && (
            <div className="mt-3">
              {isCall108 ? (
                <a
                  href="tel:108"
                  className={`flex w-full items-center justify-center gap-2 rounded-xl bg-red-600 py-4 text-lg font-bold text-white shadow-card active:scale-[0.99] ${hiClass}`}
                >
                  <Phone className="h-5 w-5" />
                  {tr(cta.en, cta.hi)}
                </a>
              ) : (
                <button
                  type="button"
                  onClick={() => navigate("/alerts")}
                  className={`flex w-full items-center justify-center gap-2 rounded-xl bg-red-600 py-4 text-lg font-bold text-white shadow-card active:scale-[0.99] ${hiClass}`}
                >
                  <Stethoscope className="h-5 w-5" />
                  {tr(cta.en, cta.hi)}
                </button>
              )}
            </div>
          )}

          {/* Green / amber: a calm dressing-guide link, not an alarming CTA. */}
          {!cta && (
            <CTALink to="/dressing" variant="secondary" className={`mt-3 gap-2 ${hiClass}`}>
              <Bandage className="h-4 w-4" />
              {tr("View Dressing Guide", "ड्रेसिंग गाइड देखें")}
              <ArrowRight className="h-4 w-4" />
            </CTALink>
          )}
        </Card>

        {/* 3. Truthful doctor-portal sync note — near the action/result area.
            Only claims success when the /checkins save succeeded. */}
        <DoctorSyncNote sync={checkinSync} />

        {/* 4. Why this result — concise reason chips. */}
        {assessResult.reason_summary && assessResult.reason_summary.length > 0 && (
          <Card>
            <p className={`mb-2.5 text-xs font-bold uppercase tracking-wide text-stone-400 ${hiClass}`}>
              {tr("Why this result", "यह परिणाम क्यों")}
            </p>
            <ul className="space-y-2">
              {assessResult.reason_summary.map((reason, i) => (
                <li key={i} className="flex items-start gap-2 text-[13px] leading-relaxed text-stone-700">
                  <span className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${meta.dot}`} />
                  <span>{reason}</span>
                </li>
              ))}
            </ul>
          </Card>
        )}

        {/* 5. Care level — compact line + small meter, does not dominate. */}
        <Card>
          <p className={`text-sm font-semibold text-stone-700 ${hiClass}`}>
            {tr("Care level", "देखभाल स्तर")}: <span className={toneText[status]}>{careDisplay}</span>
          </p>
          <div className="relative mb-1.5 mt-3 h-1.5 rounded-full bg-stone-100">
            <div
              className={`absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full ring-2 ring-white ${toneBar[status]}`}
              style={{ left: `${carePosition}%` }}
            />
          </div>
          <div className="grid grid-cols-4 gap-1">
            {CARE_LEVELS.map((level) => (
              <span
                key={level.en}
                className={`text-center text-[10px] leading-tight ${hiClass} ${
                  level.en === careLabel ? "font-bold text-stone-700" : "text-stone-400"
                }`}
              >
                {tr(level.en, level.hi)}
              </span>
            ))}
          </div>
        </Card>

        {/* 6. Photo comparison — caregiver-friendly labels only (no raw %). */}
        <Card>
          <p className={`mb-3 text-xs font-bold uppercase tracking-wide text-stone-400 ${hiClass}`}>
            {tr("Photo comparison", "फ़ोटो तुलना")}
          </p>
          <div className="space-y-3">
            <ComparisonRow
              label={tr("Visual change", "दृश्य बदलाव")}
              severity={visualChangeLabel}
              tone={changeTone}
              value={cs}
            />
            <ComparisonRow
              label={tr("Redness change", "लालिमा बदलाव")}
              severity={analyze ? tr(SEVERITY_TEXT[rednessSev].en, SEVERITY_TEXT[rednessSev].hi) : tr("Not available", "उपलब्ध नहीं")}
              tone={analyze ? SEVERITY_TONE[rednessSev] : "green"}
              value={rednessValue}
              showBar={!!analyze}
            />
            <ComparisonRow
              label={tr("Border spread", "किनारे का फैलाव")}
              severity={analyze ? tr(SEVERITY_TEXT[borderSev].en, SEVERITY_TEXT[borderSev].hi) : tr("Not available", "उपलब्ध नहीं")}
              tone={analyze ? SEVERITY_TONE[borderSev] : "green"}
              value={borderValue}
              showBar={!!analyze}
            />
            <ComparisonRow
              label={tr("Symptoms", "लक्षण")}
              severity={tr(symptomCount.en, symptomCount.hi)}
              tone={SEVERITY_TONE[symptomSev]}
              value={symptomPercent}
            />
          </div>
        </Card>

        {/* 7. For doctor review — compact, muted, secondary metadata. */}
        <div className="px-1">
          <p className={`mb-1 text-[10px] font-bold uppercase tracking-wide text-stone-300 ${hiClass}`}>
            {tr("For doctor review", "डॉक्टर समीक्षा हेतु")}
          </p>
          <p className="flex flex-wrap gap-x-2 gap-y-0.5 text-[11px] text-stone-400">
            {docMetrics.map((m, i) => (
              <span key={m.label}>
                {i > 0 && <span className="text-stone-300">· </span>}
                {m.label} <span className="font-semibold text-stone-500">{m.value}</span>
              </span>
            ))}
          </p>
        </div>

        <Disclaimer
          english={assessResult.disclaimer_english}
          hindi={assessResult.disclaimer_hindi}
        />
      </div>
    </Layout>
  );
}
