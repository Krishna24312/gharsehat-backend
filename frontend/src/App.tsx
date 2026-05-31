import { Navigate, Route, Routes } from "react-router-dom";
import { Home } from "./pages/Home";
import { CheckIn } from "./pages/CheckIn";
import { Symptoms } from "./pages/Symptoms";
import { Result } from "./pages/Result";
import { DressingGuide } from "./pages/DressingGuide";
import { Progress } from "./pages/Progress";
import { Alerts } from "./pages/Alerts";
import { DoctorPortal } from "./pages/DoctorPortal";
import { RoleSelect } from "./pages/RoleSelect";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<RoleSelect />} />
      <Route path="/home" element={<Home />} />
      <Route path="/capture" element={<CheckIn />} />
      <Route path="/symptoms" element={<Symptoms />} />
      <Route path="/result" element={<Result />} />
      <Route path="/dressing" element={<DressingGuide />} />
      <Route path="/progress" element={<Progress />} />
      <Route path="/alerts" element={<Alerts />} />
      <Route path="/doctor" element={<DoctorPortal />} />

      {/* Legacy routes folded into the new flow. */}
      <Route path="/checkin" element={<Navigate to="/capture" replace />} />
      <Route path="/dressing-guide" element={<Navigate to="/dressing" replace />} />
      <Route path="/result-green" element={<Navigate to="/home" replace />} />
      <Route path="/result-red" element={<Navigate to="/home" replace />} />

      {/* Unknown routes fall back home. */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
