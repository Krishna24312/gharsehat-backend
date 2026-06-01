import {
  AlertCircle,
  Camera,
  CheckCircle2,
  Circle,
  ImageUp,
  Loader2,
  ScanLine,
  Video,
  X,
} from "lucide-react";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
} from "react";
import { useNavigate } from "react-router-dom";
import { analyzePhotos, captureCheck } from "../api";
import { Card, ErrorState } from "../components/common";
import { CTAButton } from "../components/CTAButton";
import { Disclaimer } from "../components/Disclaimer";
import { InfoBox } from "../components/InfoBox";
import { Layout } from "../components/Layout";
import { useCheckIn } from "../context/CheckInContext";
import { useLanguage } from "../context/LanguageContext";
import type { CaptureCheckResponse } from "../types";

type CaptureMode = "camera" | "upload";

/** A single upload slot: mobile file capture + regular file picker + preview. */
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

  const previewUrl = useMemo(() => (file ? URL.createObjectURL(file) : null), [file]);
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  function handleInput(event: ChangeEvent<HTMLInputElement>) {
    const picked = event.target.files?.[0];
    if (picked) onPick(picked);
    event.target.value = "";
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
        <div>
          <PhotoPreview label={label} src={previewUrl} onClear={onClear} />
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

function PhotoPreview({
  label,
  src,
  onClear,
}: {
  label: string;
  src: string;
  onClear: () => void;
}) {
  return (
    <div className="relative">
      <img
        src={src}
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
    </div>
  );
}

function CapturedPhotoCard({
  label,
  file,
  onClear,
}: {
  label: string;
  file: File | null;
  onClear: () => void;
}) {
  const { hiClass } = useLanguage();
  const previewUrl = useMemo(() => (file ? URL.createObjectURL(file) : null), [file]);
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  return (
    <div className="rounded-xl bg-stone-50 p-2 ring-1 ring-stone-100">
      <p className={`mb-1.5 text-xs font-bold text-stone-500 ${hiClass}`}>{label}</p>
      {previewUrl ? (
        <PhotoPreview label={label} src={previewUrl} onClear={onClear} />
      ) : (
        <div className="flex h-28 flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-stone-300 text-stone-400">
          <Camera className="h-5 w-5" />
          <span className={`text-xs font-semibold ${hiClass}`}>{label}</span>
        </div>
      )}
    </div>
  );
}

// Tri-state quality chip. "ok" = requirement met, "warn" = something to fix,
// "info" = neutral guidance (e.g. checking, or a signal the backend can't judge
// yet) so the user isn't shown an alarming amber state for non-problems.
type ChipTone = "ok" | "warn" | "info";

const CHIP_STYLES: Record<ChipTone, string> = {
  ok: "border-emerald-200 bg-emerald-50 text-emerald-700",
  warn: "border-amber-200 bg-amber-50 text-amber-800",
  info: "border-stone-200 bg-stone-100 text-stone-500",
};

const CHIP_ICONS: Record<ChipTone, typeof CheckCircle2> = {
  ok: CheckCircle2,
  warn: AlertCircle,
  info: Circle,
};

function QualityChip({ tone, label }: { tone: ChipTone; label: string }) {
  const Icon = CHIP_ICONS[tone];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-bold ${CHIP_STYLES[tone]}`}
    >
      <Icon className="h-3.5 w-3.5" />
      {label}
    </span>
  );
}

function makeFrameFile(blob: Blob, name: string): File {
  return new File([blob], name, { type: blob.type || "image/jpeg" });
}

const CHECKLIST: { en: string; hi: string }[] = [
  { en: "Good lighting", hi: "अच्छी रोशनी" },
  { en: "Wound in frame", hi: "घाव फ्रेम में है" },
];

export function CheckIn() {
  const navigate = useNavigate();
  const { tr, hiClass } = useLanguage();
  const { yesterdayPhoto, todayPhoto, setYesterdayPhoto, setTodayPhoto, setAnalyze } = useCheckIn();

  const [mode, setMode] = useState<CaptureMode>("camera");
  const [checked, setChecked] = useState<boolean[]>([false, false]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cameraMessage, setCameraMessage] = useState<string | null>(null);
  const [cameraReady, setCameraReady] = useState(false);
  const [quality, setQuality] = useState<CaptureCheckResponse | null>(null);
  const [qualityError, setQualityError] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const checkingRef = useRef(false);

  const bothSelected = Boolean(yesterdayPhoto && todayPhoto);
  const lightingOk = quality ? quality.lighting === "good" && quality.status !== "bad_lighting" : false;
  const sharpOk = quality ? quality.blur === "sharp" && quality.status !== "blurry" : false;
  const nextCaptureTarget = !yesterdayPhoto ? "yesterday" : !todayPhoto ? "today" : "today";

  // Optional placement signals; older backends omit them, so default to unknown.
  const distanceStatus = quality?.distance_status ?? "unknown";
  const framingStatus = quality?.framing_status ?? "unknown";

  const lightingChip: { tone: ChipTone; label: string } = !quality
    ? { tone: "info", label: tr("Checking lighting…", "रोशनी जाँची जा रही है…") }
    : lightingOk
      ? { tone: "ok", label: tr("Lighting OK", "रोशनी ठीक है") }
      : { tone: "warn", label: tr("Improve lighting", "रोशनी सुधारें") };

  const sharpChip: { tone: ChipTone; label: string } = !quality
    ? { tone: "info", label: tr("Checking sharpness…", "साफ़ता जाँची जा रही है…") }
    : sharpOk
      ? { tone: "ok", label: tr("Image sharp", "फोटो साफ है") }
      : { tone: "warn", label: tr("Hold still", "स्थिर रखें") };

  // Distance drives the camera guide frame (border + glow) and the pill on the
  // preview, not a bottom chip. `frame` holds the border/glow classes; the dark
  // vignette (the huge spread shadow) is kept in every state.
  const VIGNETTE = "shadow-[0_0_0_9999px_rgba(0,0,0,0.18)]";
  const distanceGuide: { frame: string; pill: string } =
    !quality || distanceStatus === "unknown"
      ? {
          frame: `border-white/80 ${VIGNETTE}`,
          pill: tr("Place wound inside the frame", "घाव को फ्रेम के अंदर रखें"),
        }
      : distanceStatus === "good"
        ? {
            frame: `border-emerald-400 shadow-[0_0_0_9999px_rgba(0,0,0,0.18),0_0_22px_5px_rgba(16,185,129,0.6)]`,
            pill: tr("Distance looks OK", "दूरी ठीक है"),
          }
        : distanceStatus === "too_close"
          ? {
              frame: `border-amber-400 shadow-[0_0_0_9999px_rgba(0,0,0,0.18),0_0_22px_5px_rgba(245,158,11,0.65)]`,
              pill: tr("Move back", "थोड़ा दूर हटें"),
            }
          : {
              // too_far (and any other non-good state)
              frame: `border-amber-400 shadow-[0_0_0_9999px_rgba(0,0,0,0.18),0_0_22px_5px_rgba(245,158,11,0.65)]`,
              pill: tr("Move closer", "पास आएँ"),
            };

  // Framing chip. Neutral "info" guide when placement can't be judged, rather
  // than a false amber warning.
  const framingChip: { tone: ChipTone; label: string } = !quality
    ? { tone: "info", label: tr("Checking framing…", "फ्रेमिंग जाँची जा रही है…") }
    : framingStatus === "off_center"
      ? { tone: "warn", label: tr("Center wound", "घाव बीच में रखें") }
      : framingStatus === "good"
        ? { tone: "ok", label: tr("Framing OK", "फ्रेमिंग ठीक है") }
        : { tone: "info", label: tr("Place wound inside frame", "घाव फ्रेम में रखें") };

  // One prioritized guidance line: highest-priority fix first, never blocking.
  const guidance: { text: string; ready: boolean } = !quality
    ? { text: tr("Checking photo quality…", "फोटो गुणवत्ता जाँची जा रही है…"), ready: false }
    : !lightingOk
      ? { text: tr("Improve lighting", "रोशनी सुधारें"), ready: false }
      : !sharpOk
        ? { text: tr("Hold phone steady", "फोन स्थिर रखें"), ready: false }
        : distanceStatus === "too_far"
          ? { text: tr("Move closer", "पास आएँ"), ready: false }
          : distanceStatus === "too_close"
            ? { text: tr("Move back", "थोड़ा दूर हटें"), ready: false }
            : framingStatus === "off_center"
              ? { text: tr("Center the wound in the frame", "घाव को फ्रेम के बीच में रखें"), ready: false }
              : framingStatus === "good"
                ? { text: tr("Ready to capture", "फोटो लेने के लिए तैयार"), ready: true }
                : { text: tr("Place wound inside the frame", "घाव को फ्रेम के अंदर रखें"), ready: false };

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraReady(false);
  }, []);

  const frameToBlob = useCallback(async (qualityValue = 0.78): Promise<Blob | null> => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || video.readyState < 2 || video.videoWidth === 0 || video.videoHeight === 0) {
      return null;
    }

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const context = canvas.getContext("2d");
    if (!context) return null;
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    return new Promise((resolve) => {
      canvas.toBlob((blob) => resolve(blob), "image/jpeg", qualityValue);
    });
  }, []);

  const runCaptureCheck = useCallback(async () => {
    if (checkingRef.current) return;
    const blob = await frameToBlob(0.7);
    if (!blob) return;

    checkingRef.current = true;
    try {
      const result = await captureCheck(blob);
      setQuality(result);
      setQualityError(null);
    } catch {
      setQualityError(
        tr(
          "Could not check photo quality. You can still capture or use upload.",
          "फोटो गुणवत्ता जाँची नहीं जा सकी। आप फिर भी फोटो ले सकते हैं या अपलोड का उपयोग कर सकते हैं।",
        ),
      );
    } finally {
      checkingRef.current = false;
    }
  }, [frameToBlob, tr]);

  useEffect(() => {
    if (mode !== "camera") {
      stopCamera();
      return;
    }

    let cancelled = false;

    async function startCamera() {
      setCameraMessage(null);
      setQuality(null);
      setQualityError(null);

      if (!navigator.mediaDevices?.getUserMedia) {
        setCameraMessage(tr("Camera unavailable. Please use file upload instead.", "कैमरा उपलब्ध नहीं है। कृपया फाइल अपलोड का उपयोग करें।"));
        return;
      }

      try {
        let stream: MediaStream;
        try {
          stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
        } catch {
          stream = await navigator.mediaDevices.getUserMedia({ video: true });
        }

        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play().catch(() => undefined);
        }
        setCameraReady(true);
      } catch {
        setCameraMessage(tr("Camera unavailable. Please use file upload instead.", "कैमरा उपलब्ध नहीं है। कृपया फाइल अपलोड का उपयोग करें।"));
        setCameraReady(false);
      }
    }

    void startCamera();

    return () => {
      cancelled = true;
      stopCamera();
    };
  }, [mode, stopCamera, tr]);

  useEffect(() => {
    if (mode !== "camera" || !cameraReady) return undefined;

    void runCaptureCheck();
    const intervalId = window.setInterval(() => {
      void runCaptureCheck();
    }, 500);

    return () => window.clearInterval(intervalId);
  }, [mode, cameraReady, runCaptureCheck]);

  async function handleCaptureFromCamera() {
    const blob = await frameToBlob(0.92);
    if (!blob) return;

    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    if (nextCaptureTarget === "yesterday") {
      setYesterdayPhoto(makeFrameFile(blob, `gharsehat-yesterday-${timestamp}.jpg`));
    } else {
      setTodayPhoto(makeFrameFile(blob, `gharsehat-today-${timestamp}.jpg`));
    }
  }

  async function handleAnalyze() {
    if (!yesterdayPhoto || !todayPhoto) return;
    setLoading(true);
    setError(null);
    try {
      const result = await analyzePhotos(yesterdayPhoto, todayPhoto);
      setAnalyze(result);
      navigate("/symptoms");
    } catch {
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
              "Capture or upload yesterday's and today's photos so GharSehat can compare visual change.",
              "बदलाव की तुलना के लिए कल और आज की फोटो लें या अपलोड करें।",
            )}
          </p>
        </div>

        <div className="grid grid-cols-2 rounded-xl bg-stone-100 p-1">
          <button
            type="button"
            onClick={() => setMode("camera")}
            className={`flex items-center justify-center gap-1.5 rounded-lg py-2 text-sm font-bold transition ${hiClass} ${
              mode === "camera" ? "bg-white text-brand shadow-sm" : "text-stone-500"
            }`}
          >
            <Video className="h-4 w-4" />
            {tr("Use camera", "कैमरा उपयोग करें")}
          </button>
          <button
            type="button"
            onClick={() => setMode("upload")}
            className={`flex items-center justify-center gap-1.5 rounded-lg py-2 text-sm font-bold transition ${hiClass} ${
              mode === "upload" ? "bg-white text-brand shadow-sm" : "text-stone-500"
            }`}
          >
            <ImageUp className="h-4 w-4" />
            {tr("Upload files", "फाइल अपलोड करें")}
          </button>
        </div>

        {mode === "camera" ? (
          <div className="space-y-4">
            <Card className="space-y-3">
              <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-stone-900">
                <video
                  ref={videoRef}
                  playsInline
                  muted
                  autoPlay
                  className={`h-full w-full object-cover ${cameraReady ? "opacity-100" : "opacity-30"}`}
                />
                <canvas ref={canvasRef} className="hidden" />

                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-3">
                  <div
                    className={`h-[58%] w-[78%] rounded-[2rem] border-2 transition-[border-color,box-shadow] duration-300 ${distanceGuide.frame}`}
                  />
                  <div className={`rounded-full bg-black/55 px-3 py-1.5 text-xs font-bold text-white ${hiClass}`}>
                    {distanceGuide.pill}
                  </div>
                </div>

                {!cameraReady && (
                  <div className="absolute inset-0 grid place-items-center text-center text-white">
                    <div className="space-y-2 px-6">
                      <ScanLine className="mx-auto h-10 w-10 text-brand" />
                      <p className={`text-sm font-semibold ${hiClass}`}>
                        {cameraMessage ?? tr("Starting camera…", "कैमरा शुरू हो रहा है…")}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {cameraMessage && (
                <InfoBox variant="warning">
                  <div className="space-y-2">
                    <p className={hiClass}>{cameraMessage}</p>
                    <button
                      type="button"
                      onClick={() => setMode("upload")}
                      className={`rounded-lg bg-white px-3 py-2 text-xs font-bold text-amber-800 ring-1 ring-amber-200 ${hiClass}`}
                    >
                      {tr("Use file upload instead", "फाइल अपलोड का उपयोग करें")}
                    </button>
                  </div>
                </InfoBox>
              )}

              <div className="flex flex-wrap gap-2">
                <QualityChip tone={lightingChip.tone} label={lightingChip.label} />
                <QualityChip tone={sharpChip.tone} label={sharpChip.label} />
                <QualityChip tone={framingChip.tone} label={framingChip.label} />
              </div>

              <p className={`text-sm font-semibold ${guidance.ready ? "text-emerald-700" : "text-amber-700"} ${hiClass}`}>
                {guidance.text}
              </p>

              {qualityError && (
                <p className={`rounded-xl bg-amber-50 px-3 py-2 text-xs font-medium text-amber-800 ${hiClass}`}>
                  {qualityError}
                </p>
              )}

              {quality && !guidance.ready && (
                <p className={`text-xs text-stone-500 ${hiClass}`}>
                  {tr(
                    "You can still capture if needed, or switch to file upload.",
                    "ज़रूरत हो तो आप फिर भी फोटो ले सकते हैं या फाइल अपलोड पर जा सकते हैं।",
                  )}
                </p>
              )}

              <CTAButton
                onClick={() => void handleCaptureFromCamera()}
                disabled={!cameraReady}
                className={`gap-2 ${hiClass}`}
              >
                <Camera className="h-4 w-4" />
                {!yesterdayPhoto
                  ? tr("Capture yesterday photo", "कल की फोटो लें")
                  : !todayPhoto
                    ? tr("Capture today photo", "आज की फोटो लें")
                    : tr("Retake today's photo", "आज की फोटो फिर लें")}
              </CTAButton>

              <button
                type="button"
                onClick={() => setMode("upload")}
                className={`w-full rounded-xl bg-stone-100 py-3 text-sm font-bold text-stone-600 active:scale-[0.99] ${hiClass}`}
              >
                {tr("Use file upload fallback", "फाइल अपलोड विकल्प उपयोग करें")}
              </button>
            </Card>

            <div className="grid grid-cols-2 gap-3">
              <CapturedPhotoCard
                label={tr("Yesterday", "कल")}
                file={yesterdayPhoto}
                onClear={() => setYesterdayPhoto(null)}
              />
              <CapturedPhotoCard
                label={tr("Today", "आज")}
                file={todayPhoto}
                onClear={() => setTodayPhoto(null)}
              />
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <InfoBox>
              <span className={hiClass}>
                {tr(
                  "Upload yesterday's and today's photos. GharSehat compares colour, redness area, and border change. It does not diagnose.",
                  "कल और आज की फोटो अपलोड करें। GharSehat रंग, लालिमा क्षेत्र और किनारे के बदलाव की तुलना करता है। यह निदान नहीं करता।",
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

            <Card>
              <p className={`mb-2 text-sm font-semibold text-stone-700 ${hiClass}`}>
                {tr("Before you analyze", "विश्लेषण से पहले")}
              </p>
              <ul className="space-y-1.5">
                {CHECKLIST.map((item, index) => (
                  <li key={item.en}>
                    <button
                      type="button"
                      onClick={() => setChecked((current) => current.map((value, itemIndex) => (itemIndex === index ? !value : value)))}
                      className={`flex w-full items-center gap-2 text-sm ${
                        checked[index] ? "text-emerald-700" : "text-stone-500"
                      } ${hiClass}`}
                    >
                      {checked[index] ? (
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
          </div>
        )}

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
