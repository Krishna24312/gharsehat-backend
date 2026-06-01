// Thin fetch wrappers around the GharSehat Flask backend. All endpoints live
// under API_BASE_URL — never hardcode the host anywhere else.

import {
  ANALYSIS_MODE_KEY,
  API_BASE_URL,
  DEFAULT_ANALYZE_ENDPOINT,
  ENV_ANALYZE_ENDPOINT,
  REAL_ANALYZE_ENDPOINT,
  type AnalysisMode,
} from "./config";
import type {
  AnalyzeResponse,
  AssessResponse,
  CaptureCheckResponse,
  PatientHistory,
  Symptoms,
} from "./types";

/** Read the persisted demo analysis mode, if a valid one is stored. */
export function getAnalysisMode(): AnalysisMode | null {
  if (typeof localStorage === "undefined") return null;
  const value = localStorage.getItem(ANALYSIS_MODE_KEY);
  return value === "mock" || value === "real" ? value : null;
}

/** Persist the demo analysis mode so it survives reloads during a demo. */
export function setAnalysisMode(mode: AnalysisMode): void {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(ANALYSIS_MODE_KEY, mode);
}

/**
 * Resolve which analyze endpoint to call. Precedence (exact):
 *   localStorage "real" -> /analyze-real
 *   localStorage "mock" -> /analyze
 *   VITE_ANALYZE_ENDPOINT (if set) -> that value
 *   otherwise -> /analyze (default)
 */
export function resolveAnalyzeEndpoint(): string {
  const mode = getAnalysisMode();
  if (mode === "real") return REAL_ANALYZE_ENDPOINT;
  if (mode === "mock") return DEFAULT_ANALYZE_ENDPOINT;
  if (ENV_ANALYZE_ENDPOINT) return ENV_ANALYZE_ENDPOINT;
  return DEFAULT_ANALYZE_ENDPOINT;
}

/** Friendly error type so callers can distinguish network/HTTP failures. */
export class ApiError extends Error {
  status?: number;
  constructor(message: string, status?: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

async function asJson<T>(response: Response): Promise<T> {
  if (!response.ok) {
    throw new ApiError(`Request failed (${response.status})`, response.status);
  }
  return (await response.json()) as T;
}

/** GET /patient/<id>/history — the full 5-day timeline for one patient. */
export async function fetchPatientHistory(id: string): Promise<PatientHistory> {
  const response = await fetch(`${API_BASE_URL}/patient/${id}/history`);
  return asJson<PatientHistory>(response);
}

/**
 * POST /analyze (or /analyze-real) — multipart upload of two wound photos for
 * visual-change detection. The endpoint is chosen by resolveAnalyzeEndpoint();
 * the request/response shape is identical for both. Callers must handle failure
 * and must NOT substitute fake values. Any `debug` field is ignored here.
 */
export async function analyzePhotos(
  yesterday: File,
  today: File,
): Promise<AnalyzeResponse> {
  const form = new FormData();
  form.append("yesterday", yesterday);
  form.append("today", today);

  const response = await fetch(`${API_BASE_URL}${resolveAnalyzeEndpoint()}`, {
    method: "POST",
    body: form,
  });
  return asJson<AnalyzeResponse>(response);
}

/** POST /capture-check — live camera preview quality check for one frame. */
export async function captureCheck(frame: Blob): Promise<CaptureCheckResponse> {
  const form = new FormData();
  form.append("frame", frame, "preview-frame.jpg");

  const response = await fetch(`${API_BASE_URL}/capture-check`, {
    method: "POST",
    body: form,
  });
  return asJson<CaptureCheckResponse>(response);
}

/** POST /assess — score the check-in (change_score + symptoms) into a status. */
export async function assess(
  changeScore: number,
  symptoms: Symptoms,
): Promise<AssessResponse> {
  const response = await fetch(`${API_BASE_URL}/assess`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ change_score: changeScore, symptoms }),
  });
  return asJson<AssessResponse>(response);
}
