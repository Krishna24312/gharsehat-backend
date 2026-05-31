import { Camera, CheckCircle2, Circle, ImageUp, Loader2, ScanLine, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { analyzePhotos } from "../api";
import { Card, ErrorState } from "../components/common";
import { CTAButton } from "../components/CTAButton";
import { Disclaimer } from "../components/Disclaimer";
import { InfoBox } from "../components/InfoBox";
import { Layout } from "../components/Layout";
import { useCheckIn } from "../context/CheckInContext";
import { useLanguage } from "../context/LanguageContext";

/** A single photo slot: take-a-photo + upload-from-files + preview. */
function PhotoSlot({
  step,
  label,
  hint,
  file,
  onPick,
  onClear,
}: {
  step: number;
  label: string;
  hint: string;
  file: File | null;
  onPick: (file: File) => void;
  onClear: () => void;
}) {
  const { tr, hiClass } = useLanguage();
  const cameraRef = useRef<HTMLInputElement>(null);
  const uploadRef = useRef<HTMLInputElement>(null);

  // Object URL for the preview thumbnail; revoked on change/unmount.
  const previewUrl = useMemo(() => (file ? URL.createObjectURL(file) : null), [file]);
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  function handleInput(e: React.ChangeEvent<HTMLInputElement>) {
    const picked = e.target.files?.[0];
    if (picked) onPick(picked);
    e.target.value = ""; // allow re-picking the same file
  }

  return (
    <Card>
      <div className="mb-3 flex items-center gap-2">
        <span className="grid h-6 w-6 place-items-center rounded-full bg-brand/10 text-xs font-bold text-brand">
          {step}
        </span>
        <div>
          <p className={`font-semibold text-stone-800 ${hiClass}`}>{label}</p>
          <p className={`text-xs text-stone-400 ${hiClass}`}>{hint}</p>
        </div>
      </div>

      {/* Hidden inputs: camera (mobile) and generic file upload. */}
      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleInput}
      />
      <input ref={uploadRef} type="file" accept="image/*" className="hidden" onChange={handleInput} />

      {file && previewUrl ? (
        <div className="relative">
          <img
            src={previewUrl}
            alt={label}
            className="h-44 w-full rounded-xl object-cover ring-1 ring-stone-200"
          />
          <button
            type="button"
            onClick={onClear}
            aria-label="Remove photo"
            className="absolute right-2 top-2 grid h-8 w-8 place-items-center rounded-full bg-black/60 text-white active:scale-95"
          >
            <X className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => uploadRef.current?.click()}
            className={`mt-2 w-full rounded-lg bg-stone-100 py-2 text-sm font-medium text-stone-600 active:scale-[0.99] ${hiClass}`}
          >
            {tr("Change photo", "फोटो बदलें")}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => cameraRef.current?.click()}
            className={`flex flex-col items-center gap-1.5 rounded-xl border-2 border-dashed border-stone-300 py-6 text-stone-500 active:scale-[0.99] ${hiClass}`}
          >
            <Camera className="h-6 w-6 text-brand" />
            <span className="text-sm font-medium">{tr("Take photo", "फोटो लें")}</span>
          </button>
          <button
            type="button"
            onClick={() => uploadRef.current?.click()}
            className={`flex flex-col items-center gap-1.5 rounded-xl border-2 border-dashed border-stone-300 py-6 text-stone-500 active:scale-[0.99] ${hiClass}`}
          >
            <ImageUp className="h-6 w-6 text-brand" />
            <span className="text-sm font-medium">{tr("Upload file", "फाइल चुनें")}</span>
          </button>
        </div>
      )}
    </Card>
  );
}

const CHECKLIST: { en: string; hi: string }[] = [
  { en: "Reference card visible", hi: "रेफरेंस कार्ड दिख रहा है" },
  { en: "Good lighting", hi: "अच्छी रोशनी" },
  { en: "Wound in frame", hi: "घाव फ्रेम में है" },
];

export function CheckIn() {
  const navigate = useNavigate();
  const { tr, hiClass } = useLanguage();
  const { yesterdayPhoto, todayPhoto, setYesterdayPhoto, setTodayPhoto, setAnalyze } = useCheckIn();

  const [checked, setChecked] = useState<boolean[]>([false, false, false]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const bothSelected = Boolean(yesterdayPhoto && todayPhoto);

  async function handleAnalyze() {
    if (!yesterdayPhoto || !todayPhoto) return;
    setLoading(true);
    setError(null);
    try {
      const result = await analyzePhotos(yesterdayPhoto, todayPhoto);
      setAnalyze(result); // stores change_score, redness_delta, border_change + full response
      navigate("/symptoms");
    } catch {
      // No fake fallback — surface the failure honestly.
      setError(
        tr(
          "Could not analyze photos. Please check that both photos are clear and try again.",
          "फोटो का विश्लेषण नहीं हो सका। कृपया जांचें कि दोनों फोटो स्पष्ट हैं और फिर कोशिश करें।",
        ),
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <Layout showBack backTo="/home">
      <div className="space-y-4">
        <div>
          <h1 className={`text-xl font-bold text-stone-800 ${hiClass}`}>
            {tr("Step 1 of 2 — Photos", "चरण 1 / 2 — फोटो")}
          </h1>
          <p className={`mt-1 text-sm text-stone-500 ${hiClass}`}>
            {tr(
              "Add yesterday's and today's photos so GharSehat can compare visual change.",
              "बदलाव की तुलना के लिए कल और आज की फोटो जोड़ें।",
            )}
          </p>
        </div>

        <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-stone-900">
          <span className="absolute left-3 top-3 h-8 w-8 rounded-tl-md border-l-2 border-t-2 border-brand" />
          <span className="absolute right-3 top-3 h-8 w-8 rounded-tr-md border-r-2 border-t-2 border-brand" />
          <span className="absolute bottom-3 left-3 h-8 w-8 rounded-bl-md border-b-2 border-l-2 border-brand" />
          <span className="absolute bottom-3 right-3 h-8 w-8 rounded-br-md border-b-2 border-r-2 border-brand" />
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-brand">
            <ScanLine className="h-14 w-14" />
            <p className={`text-xs font-semibold text-white/80 ${hiClass}`}>
              {tr("Keep the reference card visible", "रेफरेंस कार्ड दिखना चाहिए")}
            </p>
          </div>
        </div>

        <InfoBox>
          <span className={hiClass}>
            {tr(
              "GharSehat compares today vs yesterday for colour, redness area, and border change. It does not diagnose.",
              "GharSehat आज और कल की तुलना रंग, लालिमा क्षेत्र और किनारे के बदलाव के लिए करता है। यह निदान नहीं करता।",
            )}
          </span>
        </InfoBox>

        <PhotoSlot
          step={1}
          label={tr("Yesterday's photo", "कल की फोटो")}
          hint={tr("From the previous day", "पिछले दिन की")}
          file={yesterdayPhoto}
          onPick={setYesterdayPhoto}
          onClear={() => setYesterdayPhoto(null)}
        />

        <PhotoSlot
          step={2}
          label={tr("Today's photo", "आज की फोटो")}
          hint={tr("Taken just now", "अभी ली गई")}
          file={todayPhoto}
          onPick={setTodayPhoto}
          onClear={() => setTodayPhoto(null)}
        />

        {/* UI-only, non-blocking checklist */}
        <Card>
          <p className={`mb-2 text-sm font-semibold text-stone-700 ${hiClass}`}>
            {tr("Before you analyze", "विश्लेषण से पहले")}
          </p>
          <ul className="space-y-1.5">
            {CHECKLIST.map((item, i) => (
              <li key={item.en}>
                <button
                  type="button"
                  onClick={() => setChecked((c) => c.map((v, j) => (j === i ? !v : v)))}
                  className={`flex w-full items-center gap-2 text-sm ${
                    checked[i] ? "text-emerald-700" : "text-stone-500"
                  } ${hiClass}`}
                >
                  {checked[i] ? (
                    <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                  ) : (
                    <Circle className="h-5 w-5 text-stone-300" />
                  )}
                  {tr(item.en, item.hi)}
                </button>
              </li>
            ))}
          </ul>
        </Card>

        {error && (
          <ErrorState
            title={tr("Analysis failed", "विश्लेषण विफल")}
            detail={error}
            onRetry={handleAnalyze}
            retryLabel={tr("Try again", "फिर कोशिश करें")}
          />
        )}

        <CTAButton
          onClick={handleAnalyze}
          disabled={!bothSelected || loading}
          className={`gap-2 ${hiClass}`}
        >
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          {loading
            ? tr("Analyzing change…", "बदलाव का विश्लेषण…")
            : tr("Analyze Change", "बदलाव का विश्लेषण करें")}
        </CTAButton>

        {!bothSelected && (
          <p className={`text-center text-xs text-stone-400 ${hiClass}`}>
            {tr("Add both photos to continue.", "जारी रखने के लिए दोनों फोटो जोड़ें।")}
          </p>
        )}

        <Disclaimer />
      </div>
    </Layout>
  );
}
