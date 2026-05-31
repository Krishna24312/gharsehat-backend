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

// POST /analyze response. `message` is optional and intentionally NOT shown.
export interface AnalyzeResponse {
  change_score: number;
  redness_delta: number;
  border_change: number;
  disclaimer?: string;
  message?: string;
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
