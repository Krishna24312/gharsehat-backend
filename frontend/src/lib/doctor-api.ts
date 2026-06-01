import { API_BASE_URL } from "../config";
import type { Status, SymptomKey, Symptoms } from "../types";

export type TriageStatus = Status;

export interface PatientSummary {
  id: string;
  name: string;
  age: number;
  gender: string;
  burn_location: string;
  day_of_recovery: number;
  last_status: TriageStatus;
  last_check_in: string;
}

export interface DoctorHistoryEntry {
  date: string;
  photo_url: string;
  change_score: number;
  symptoms: Symptoms;
  symptom_score: number;
  final_score: number;
  status: TriageStatus;
  // Present on caregiver-submitted check-ins; hardcoded entries omit them.
  // A submitted check-in is a before/today pair; photo_url stays = today_photo_url.
  submitted?: boolean;
  created_at?: string;
  checkin_id?: string;
  today_photo_url?: string | null;
  yesterday_photo_url?: string | null;
}

export interface PatientDetail {
  id: string;
  name: string;
  age: number;
  gender: string;
  burn_location: string;
  burn_type: string;
  day_of_recovery: number;
  history: DoctorHistoryEntry[];
}

export const STATUS_RANK: Record<TriageStatus, number> = { red: 0, amber: 1, green: 2 };

async function asJson<T>(response: Response): Promise<T> {
  if (!response.ok) {
    throw new Error(`Request failed (${response.status})`);
  }
  return (await response.json()) as T;
}

export async function fetchPatients(): Promise<PatientSummary[]> {
  const response = await fetch(`${API_BASE_URL}/patients`);
  return asJson<PatientSummary[]>(response);
}

export async function fetchPatientHistory(id: string): Promise<PatientDetail> {
  const response = await fetch(`${API_BASE_URL}/patient/${id}/history`);
  return asJson<PatientDetail>(response);
}

export function symptomLabels(): Array<{ key: SymptomKey; label: string }> {
  return [
    { key: "fever", label: "Fever" },
    { key: "smell", label: "Smell" },
    { key: "spreading_redness", label: "Spreading redness" },
    { key: "discharge", label: "Discharge" },
    { key: "increasing_pain", label: "Increasing pain" },
  ];
}

export function priorityLabel(status: TriageStatus): string {
  if (status === "red") return "Review today";
  if (status === "amber") return "Monitor closely";
  return "Routine follow-up";
}

export function formatDate(iso: string): string {
  try {
    const date = new Date(iso.includes("T") ? iso : `${iso}T00:00:00`);
    return date.toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
  } catch {
    return iso;
  }
}

export function formatDateTime(): string {
  return new Date().toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function genderLabel(gender: string): string {
  const normalized = gender.trim().toLowerCase();
  if (normalized === "m" || normalized === "male") return "Male";
  if (normalized === "f" || normalized === "female") return "Female";
  return gender;
}

// Re-exported from the shared helper so the doctor portal and patient app
// resolve backend photo URLs identically (no behavior change here).
export { resolvePhotoUrl } from "./photos";
