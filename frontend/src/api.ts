// Thin fetch wrappers around the GharSehat Flask backend. All endpoints live
// under API_BASE_URL — never hardcode the host anywhere else.

import { API_BASE_URL } from "./config";
import type { AnalyzeResponse, AssessResponse, PatientHistory, Symptoms } from "./types";

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
 * POST /analyze — multipart upload of two wound photos for visual-change
 * detection. The backend may still be WIP; callers must handle failure and
 * must NOT substitute fake values.
 */
export async function analyzePhotos(
  yesterday: File,
  today: File,
): Promise<AnalyzeResponse> {
  const form = new FormData();
  form.append("yesterday", yesterday);
  form.append("today", today);

  const response = await fetch(`${API_BASE_URL}/analyze`, {
    method: "POST",
    body: form,
  });
  return asJson<AnalyzeResponse>(response);
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
