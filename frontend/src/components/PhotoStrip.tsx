import { Camera } from "lucide-react";
import { useState } from "react";
import { useLanguage } from "../context/LanguageContext";
import { resolvePhotoUrl } from "../lib/photos";
import { STATUS_META } from "../lib/status";
import type { TimelinePhoto } from "../lib/timeline";

// One photo tile. Submitted check-ins carry real /uploads URLs (rendered here);
// hardcoded entries use /static URLs that aren't served, so the <img> fails and
// we fall back to a placeholder card with a camera icon, label, and status
// colour (never a fake wound image).
function DayPhoto({ photo }: { photo: TimelinePhoto }) {
  const { tr, hiClass } = useLanguage();
  const [failed, setFailed] = useState(false);
  const statusMeta = STATUS_META[photo.status];
  const src = resolvePhotoUrl(photo.url);
  const showImage = Boolean(src) && !failed;
  const caption = tr(photo.labelEn, photo.labelHi);

  return (
    <div className="flex w-[4.5rem] shrink-0 flex-col items-center gap-1">
      <div className={`relative h-[4.5rem] w-[4.5rem] overflow-hidden rounded-xl bg-stone-100 ring-2 ${statusMeta.accent}`}>
        {showImage ? (
          <img
            src={src}
            alt={caption}
            onError={() => setFailed(true)}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-1 text-stone-400">
            <Camera className="h-5 w-5" />
            <span className={`text-[10px] font-semibold ${hiClass}`}>{caption}</span>
          </div>
        )}
        <span className={`absolute right-1 top-1 h-3 w-3 rounded-full ring-2 ring-white ${statusMeta.dot}`} />
      </div>
      <span className={`text-[11px] font-medium text-stone-500 ${hiClass}`}>{caption}</span>
    </div>
  );
}

/** Horizontal strip of day / before / today thumbnails with status dots. */
export function PhotoStrip({ photos }: { photos: TimelinePhoto[] }) {
  return (
    <div className="no-scrollbar flex gap-3 overflow-x-auto pb-1">
      {photos.map((photo) => (
        <DayPhoto key={photo.key} photo={photo} />
      ))}
    </div>
  );
}
