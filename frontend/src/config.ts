// Single source of truth for the backend base URL. Override at build time with
// VITE_API_BASE_URL if the backend ever moves off localhost:5000.
export const API_BASE_URL: string =
  import.meta.env.VITE_API_BASE_URL ?? "http://localhost:5000";

// The live demo patient. Krishna's backend hardcodes Ravi as patient id "1".
export const DEMO_PATIENT_ID = "1";
