// Single source of truth for the backend base URL. Override at build time with
// VITE_API_BASE_URL if the backend ever moves off localhost:5000.
export const API_BASE_URL: string =
  import.meta.env.VITE_API_BASE_URL ?? "http://localhost:5000";

// The live demo patient. Krishna's backend hardcodes Ravi as patient id "1".
export const DEMO_PATIENT_ID = "1";

// --- Analyze endpoint selection -------------------------------------------
// The check-in flow can call either the stable demo endpoint (/analyze) or the
// real OpenCV endpoint (/analyze-real). The default is always /analyze; the
// real endpoint is opt-in via the demo toggle (persisted in localStorage) or a
// build-time env var. Resolution lives in api.ts (resolveAnalyzeEndpoint).
export const DEFAULT_ANALYZE_ENDPOINT = "/analyze";
export const REAL_ANALYZE_ENDPOINT = "/analyze-real";

// Optional build-time override, used only when no localStorage selection exists.
export const ENV_ANALYZE_ENDPOINT: string | undefined =
  import.meta.env.VITE_ANALYZE_ENDPOINT;

// Persisted demo-mode selection. Valid values: "mock" -> /analyze, "real" ->
// /analyze-real. Anything else is ignored and falls back to the default.
export const ANALYSIS_MODE_KEY = "gharsehat_analysis_mode";
export type AnalysisMode = "mock" | "real";
