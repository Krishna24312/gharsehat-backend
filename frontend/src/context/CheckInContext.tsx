import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { EMPTY_SYMPTOMS, type AnalyzeResponse, type AssessResponse, type Symptoms } from "../types";

// Outcome of the best-effort POST /checkins that runs after /assess. Drives
// truthful UI: we only claim the doctor portal updated when this is "success".
//   idle    — no submission attempted this session
//   pending — POST /checkins in flight
//   success — saved (doctor portal reflects it)
//   failed  — save could not be confirmed
//   skipped — nothing to submit (e.g. no photo captured)
export type CheckinSync = "idle" | "pending" | "success" | "failed" | "skipped";

// Holds the entire check-in flow state: the two photos, the /analyze result,
// the symptom answers, the /assess result, and the /checkins sync outcome. The
// result screen reads from here, and Home resets it when a new check-in starts.
interface CheckInState {
  yesterdayPhoto: File | null;
  todayPhoto: File | null;
  analyze: AnalyzeResponse | null;
  symptoms: Symptoms;
  assessResult: AssessResponse | null;
  checkinSync: CheckinSync;
}

interface CheckInContextValue extends CheckInState {
  setYesterdayPhoto: (file: File | null) => void;
  setTodayPhoto: (file: File | null) => void;
  setAnalyze: (result: AnalyzeResponse) => void;
  setSymptoms: (symptoms: Symptoms) => void;
  setAssessResult: (result: AssessResponse) => void;
  setCheckinSync: (sync: CheckinSync) => void;
  reset: () => void;
  /** Convenience: change_score from /analyze, or null if not analyzed yet. */
  changeScore: number | null;
  /** True once /assess has run — used to guard the result screen. */
  hasResult: boolean;
}

const initialState: CheckInState = {
  yesterdayPhoto: null,
  todayPhoto: null,
  analyze: null,
  symptoms: { ...EMPTY_SYMPTOMS },
  assessResult: null,
  checkinSync: "idle",
};

const CheckInContext = createContext<CheckInContextValue | null>(null);

export function CheckInProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<CheckInState>(initialState);

  const setYesterdayPhoto = useCallback(
    (file: File | null) => setState((s) => ({ ...s, yesterdayPhoto: file })),
    [],
  );
  const setTodayPhoto = useCallback(
    (file: File | null) => setState((s) => ({ ...s, todayPhoto: file })),
    [],
  );
  const setAnalyze = useCallback(
    (result: AnalyzeResponse) => setState((s) => ({ ...s, analyze: result })),
    [],
  );
  const setSymptoms = useCallback(
    (symptoms: Symptoms) => setState((s) => ({ ...s, symptoms })),
    [],
  );
  const setAssessResult = useCallback(
    (result: AssessResponse) => setState((s) => ({ ...s, assessResult: result })),
    [],
  );
  const setCheckinSync = useCallback(
    (sync: CheckinSync) => setState((s) => ({ ...s, checkinSync: sync })),
    [],
  );
  const reset = useCallback(() => setState({ ...initialState, symptoms: { ...EMPTY_SYMPTOMS } }), []);

  const value = useMemo<CheckInContextValue>(
    () => ({
      ...state,
      setYesterdayPhoto,
      setTodayPhoto,
      setAnalyze,
      setSymptoms,
      setAssessResult,
      setCheckinSync,
      reset,
      changeScore: state.analyze ? state.analyze.change_score : null,
      hasResult: state.assessResult !== null,
    }),
    [state, setYesterdayPhoto, setTodayPhoto, setAnalyze, setSymptoms, setAssessResult, setCheckinSync, reset],
  );

  return <CheckInContext.Provider value={value}>{children}</CheckInContext.Provider>;
}

export function useCheckIn(): CheckInContextValue {
  const ctx = useContext(CheckInContext);
  if (!ctx) throw new Error("useCheckIn must be used within CheckInProvider");
  return ctx;
}
