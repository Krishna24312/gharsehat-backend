import { Camera } from "lucide-react";
import { useState } from "react";
import { API_BASE_URL } from "../config";
import { useLanguage } from "../context/LanguageContext";
import { STATUS_META } from "../lib/status";
import type { HistoryEntry } from "../types";

// One day's thumbnail. The backend's /static photos aren't served in the demo,
// so the <img> will fail to load — we fall back to a placeholder card with a
// camera icon, day number, and the status colour (never a fake wound image).
function DayPhoto({ entry, day }: { entry: HistoryEntry; day: number }) {
  const { tr, hiClass } = useLanguage();
  const [failed, setFailed] = useState(false);
  const meta = STATUS_META[entry.status];

  return (
    <div className="flex w-[4.5rem] shrink-0 flex-col items-center gap-1">
      <div className={`relative h-[4.5rem] w-[4.5rem] overflow-hidden rounded-xl bg-stone-100 ring-2 ${meta.accent}`}>
        {!failed ? (
          <img
            src={`${API_BASE_URL}${entry.photo_url}`}
            alt={`Day ${day}`}
            onError={() => setFailed(true)}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-1 text-stone-400">
            <Camera className="h-5 w-5" />
            <span className={`text-[10px] font-semibold ${hiClass}`}>
              {tr("Day", "दिन")} {day}
            </span>
          </div>
        )}
        <span className={`absolute right-1 top-1 h-3 w-3 rounded-full ring-2 ring-white ${meta.dot}`} />
      </div>
      <span className={`text-[11px] font-medium text-stone-500 ${hiClass}`}>
        {tr("Day", "दिन")} {day}
      </span>
    </div>
  );
}

/** Horizontal strip of daily check-in thumbnails with status dots. */
export function PhotoStrip({ history }: { history: HistoryEntry[] }) {
  return (
    <div className="no-scrollbar flex gap-3 overflow-x-auto pb-1">
      {history.map((entry, i) => (
        <DayPhoto key={entry.date} entry={entry} day={i + 1} />
      ))}
    </div>
  );
}
