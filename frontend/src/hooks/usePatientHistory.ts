import { useCallback, useEffect, useState } from "react";
import { fetchPatientHistory } from "../api";
import { DEMO_PATIENT_ID } from "../config";
import type { PatientHistory } from "../types";

interface HistoryState {
  data: PatientHistory | null;
  loading: boolean;
  error: string | null;
  reload: () => void;
}

/** Loads GET /patient/<id>/history with loading/error/retry state. */
export function usePatientHistory(id: string = DEMO_PATIENT_ID): HistoryState {
  const [data, setData] = useState<PatientHistory | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const reload = useCallback(() => setReloadKey((k) => k + 1), []);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    fetchPatientHistory(id)
      .then((d) => {
        if (active) setData(d);
      })
      .catch(() => {
        if (active) setError("Could not reach the GharSehat server. Is the backend running on port 5000?");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [id, reloadKey]);

  return { data, loading, error, reload };
}
