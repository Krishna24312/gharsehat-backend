// Shared timeline labeling so Home, Progress, PhotoStrip and the Doctor Portal
// agree on day labels and keys.
//
// Rule: hardcoded historical entries are the leading block of the timeline, so
// their position is their recovery day -> "Day 1".."Day 5". Caregiver-submitted
// check-ins are NOT new recovery days (the backend appends them with sequential
// display dates, but recovery day is unchanged) — the most recent reads as
// "Today" and any earlier same-period submissions read as "Recent".

interface TimelineEntryLike {
  date: string;
  submitted?: boolean;
  created_at?: string;
}

export interface EntryMeta {
  submitted: boolean;
  isLatest: boolean;
  /** Recovery-day number for hardcoded historical entries; null for submitted. */
  recoveryDay: number | null;
}

export function entryMeta(history: TimelineEntryLike[], index: number): EntryMeta {
  const entry = history[index];
  const submitted = entry.submitted === true;
  return {
    submitted,
    isLatest: index === history.length - 1,
    recoveryDay: submitted ? null : index + 1,
  };
}

/** Bilingual short label. Submitted -> Today/Recent; hardcoded -> Day N. */
export function entryLabel(meta: EntryMeta): { en: string; hi: string } {
  if (meta.submitted) {
    return meta.isLatest ? { en: "Today", hi: "आज" } : { en: "Recent", hi: "हाल का" };
  }
  return { en: `Day ${meta.recoveryDay}`, hi: `दिन ${meta.recoveryDay}` };
}

/**
 * Stable, unique React key for a history entry. created_at is unique per
 * submission, so this is safe even if two submitted entries share a date.
 */
export function entryKey(entry: TimelineEntryLike, index: number): string {
  return entry.created_at ?? `${entry.date || "entry"}-${index}`;
}
