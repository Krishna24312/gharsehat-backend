// Shared types mirroring Krishna's Flask backend response shapes.

export type Status = "green" | "amber" | "red";

export type AssessAction =
  | "continue_care"
  | "watch_closely"
  | "show_doctor_today"
  | "call_108";

// The five backend symptom keys. Order here drives the checklist UI.
export const SYMPTOM_KEYS = [
  "fever",
  "smell",
  "spreading_redness",
  "discharge",
  "increasing_pain",
] as const;

export type SymptomKey = (typeof SYMPTOM_KEYS)[number];

export type Symptoms = Record<SymptomKey, boolean>;

export const EMPTY_SYMPTOMS: Symptoms = {
  fever: false,
  smell: false,
  spreading_redness: false,
  discharge: false,
  increasing_pain: false,
};

// POST /analyze (or /analyze-real) response. `message` is optional and
// intentionally NOT shown. `mock` and `debug` are optional; `debug` (only sent
// by /analyze-real) is intentionally ignored by the UI.
export interface AnalyzeResponse {
  change_score: number;
  redness_delta: number;
  border_change: number;
  disclaimer?: string;
  message?: string;
  mock?: boolean;
  debug?: Record<string, unknown>;
}

export type CaptureCheckStatus = "good" | "bad_lighting" | "blurry";

export type DistanceStatus = "good" | "too_close" | "too_far" | "unknown";
export type FramingStatus = "good" | "off_center" | "guide_only" | "unknown";

export interface CaptureCheckResponse {
  status: CaptureCheckStatus;
  lighting: "good" | "too_dark" | "too_bright" | string;
  brightness: number;
  blur: "sharp" | "blurry" | string;
  blur_score: number;
  framing: "guide_only" | string;
  message: string;
  // Optional, backwards-compatible placement signals. The backend may omit
  // these on older builds; treat missing as "unknown". Absolute distance needs
  // a scale reference we don't have yet, so it stays "unknown" — never faked.
  framing_status?: FramingStatus;
  framing_message?: string;
  distance_status?: DistanceStatus;
  distance_message?: string;
  // Distance-proxy debug fields (0–1). skin_fill = largest skin blob over the
  // guide box; center_fill = how much of the guide's centre core that blob
  // covers (drives the verdict). Exposed for transparency; may be absent.
  skin_fill?: number;
  center_fill?: number;
  blob_texture?: number;
  blob_short_span?: number;
}

// POST /assess response.
export interface AssessResponse {
  status: Status;
  change_score: number;
  symptom_score: number;
  final_score: number;
  positive_symptoms: SymptomKey[];
  message_hindi: string;
  message_english: string;
  action: AssessAction;
  disclaimer_hindi: string;
  disclaimer_english: string;
}

// One day's check-in inside GET /patient/<id>/history.
export interface HistoryEntry {
  date: string;
  photo_url: string;
  change_score: number;
  symptoms: Symptoms;
  symptom_score: number;
  final_score: number;
  status: Status;
  // Present on caregiver-submitted check-ins; older hardcoded entries omit them.
  submitted?: boolean;
  created_at?: string;
}

// GET /patient/<id>/history response.
export interface PatientHistory {
  id: string;
  name: string;
  age: number;
  gender: string;
  burn_location: string;
  burn_type: string;
  day_of_recovery: number;
  history: HistoryEntry[];
}
