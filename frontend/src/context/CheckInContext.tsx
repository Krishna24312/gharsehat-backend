import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { EMPTY_SYMPTOMS, type AnalyzeResponse, type AssessResponse, type Symptoms } from "../types";

// Holds the entire check-in flow state: the two photos, the /analyze result,
// the symptom answers, and the /assess result. The result screen reads from
// here, and Home resets it when a new check-in starts.
interface CheckInState {
  yesterdayPhoto: File | null;
  todayPhoto: File | null;
  analyze: AnalyzeResponse | null;
  symptoms: Symptoms;
  assessResult: AssessResponse | null;
}

interface CheckInContextValue extends CheckInState {
  setYesterdayPhoto: (file: File | null) => void;
  setTodayPhoto: (file: File | null) => void;
  setAnalyze: (result: AnalyzeResponse) => void;
  setSymptoms: (symptoms: Symptoms) => void;
  setAssessResult: (result: AssessResponse) => void;
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
  const reset = useCallback(() => setState({ ...initialState, symptoms: { ...EMPTY_SYMPTOMS } }), []);

  const value = useMemo<CheckInContextValue>(
    () => ({
      ...state,
      setYesterdayPhoto,
      setTodayPhoto,
      setAnalyze,
      setSymptoms,
      setAssessResult,
      reset,
      changeScore: state.analyze ? state.analyze.change_score : null,
      hasResult: state.assessResult !== null,
    }),
    [state, setYesterdayPhoto, setTodayPhoto, setAnalyze, setSymptoms, setAssessResult, reset],
  );

  return <CheckInContext.Provider value={value}>{children}</CheckInContext.Provider>;
}

export function useCheckIn(): CheckInContextValue {
  const ctx = useContext(CheckInContext);
  if (!ctx) throw new Error("useCheckIn must be used within CheckInProvider");
  return ctx;
}
