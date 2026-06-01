import type { CheckinSync } from "../context/CheckInContext";
import { useLanguage } from "../context/LanguageContext";

/**
 * Truthful doctor-portal sync note for the patient app.
 *
 * Only claims the doctor portal updated when the POST /checkins save actually
 * succeeded. On failure it shows a quiet, non-blocking fallback. For idle /
 * pending / skipped it renders nothing, so the UI never makes a false claim.
 */
export function DoctorSyncNote({ sync }: { sync: CheckinSync }) {
  const { tr, hiClass } = useLanguage();

  if (sync === "success") {
    return (
      <div className={`rounded-xl bg-stone-100 px-3 py-2.5 text-center text-sm text-stone-600 ${hiClass}`}>
        {tr(
          "Doctor portal updated for review.",
          "डॉक्टर पोर्टल समीक्षा के लिए अपडेट किया गया है।",
        )}
      </div>
    );
  }

  if (sync === "failed") {
    return (
      <div className={`rounded-xl bg-amber-50 px-3 py-2.5 text-center text-sm text-amber-800 ${hiClass}`}>
        {tr(
          "Check-in saved locally for this session. Doctor portal update could not be confirmed.",
          "इस सत्र के लिए चेक-इन सहेजा गया। डॉक्टर पोर्टल अपडेट की पुष्टि नहीं हो सकी।",
        )}
      </div>
    );
  }

  return null;
}
