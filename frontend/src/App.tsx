import { Navigate, Route, Routes } from "react-router-dom";
import { Home } from "./pages/Home";
import { CheckIn } from "./pages/CheckIn";
import { Symptoms } from "./pages/Symptoms";
import { Result } from "./pages/Result";
import { DressingGuide } from "./pages/DressingGuide";
import { Progress } from "./pages/Progress";
import { Alerts } from "./pages/Alerts";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/checkin" element={<CheckIn />} />
      <Route path="/symptoms" element={<Symptoms />} />
      <Route path="/result" element={<Result />} />
      <Route path="/dressing-guide" element={<DressingGuide />} />
      <Route path="/progress" element={<Progress />} />
      <Route path="/alerts" element={<Alerts />} />

      {/* Legacy routes folded into the new flow. */}
      <Route path="/capture" element={<Navigate to="/checkin" replace />} />
      <Route path="/result-green" element={<Navigate to="/" replace />} />
      <Route path="/result-red" element={<Navigate to="/" replace />} />

      {/* Unknown routes fall back home. */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
