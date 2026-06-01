// Shared timeline labeling/photo logic so Home, Progress, PhotoStrip and the
// Doctor Portal agree on day labels, keys, and which photos to show.
//
// Rule: hardcoded historical entries are the leading block of the timeline, so
// their position is their recovery day -> "Day 1".."Day 5". A caregiver-
// submitted check-in is a before/today PAIR (yesterday_photo_url +
// today_photo_url), not a new recovery day — it renders as "Before" + "Today".

import type { Status } from "../types";

interface TimelineEntryLike {
  date: string;
  status?: Status;
  submitted?: boolean;
  created_at?: string;
  checkin_id?: string;
  photo_url?: string | null;
  today_photo_url?: string | null;
  yesterday_photo_url?: string | null;
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
 * Stable, unique React key for a history entry. checkin_id / created_at are
 * unique per submission, so this is safe even if two entries share a date.
 */
export function entryKey(entry: TimelineEntryLike, index: number): string {
  return entry.checkin_id ?? entry.created_at ?? `${entry.date || "entry"}-${index}`;
}

/** The most recent caregiver-submitted check-in (the before/today pair), if any. */
export function latestSubmitted<T extends TimelineEntryLike>(history: T[]): T | null {
  for (let i = history.length - 1; i >= 0; i -= 1) {
    if (history[i].submitted === true) return history[i];
  }
  return null;
}

// One renderable photo tile: a resolved-or-null url plus a bilingual label.
export interface TimelinePhoto {
  key: string;
  url: string | null;
  labelEn: string;
  labelHi: string;
  status: Status;
}

/**
 * Build the photo timeline shared by Home, Progress and the Doctor Portal.
 * Hardcoded days render as Day 1..N. The LATEST submitted check-in renders as a
 * before/today PAIR ("Before" + "Today") — earlier submitted check-ins are not
 * shown as separate tiles, so the same today photo never repeats as fake days.
 */
export function buildPhotoTimeline(history: TimelineEntryLike[]): TimelinePhoto[] {
  const photos: TimelinePhoto[] = [];
  history.forEach((entry, index) => {
    if (entry.submitted) return; // submitted entries handled as the latest pair
    photos.push({
      key: entryKey(entry, index),
      url: entry.photo_url ?? null,
      labelEn: `Day ${index + 1}`,
      labelHi: `दिन ${index + 1}`,
      status: entry.status ?? "green",
    });
  });

  const sub = latestSubmitted(history);
  if (sub) {
    const status = sub.status ?? "green";
    const base = sub.checkin_id ?? sub.created_at ?? "checkin";
    const todayUrl = sub.today_photo_url ?? sub.photo_url ?? null;
    if (sub.yesterday_photo_url && sub.yesterday_photo_url !== todayUrl) {
      photos.push({ key: `${base}-before`, url: sub.yesterday_photo_url, labelEn: "Before", labelHi: "पहले", status });
    }
    photos.push({ key: `${base}-today`, url: todayUrl, labelEn: "Today", labelHi: "आज", status });
  }
  return photos;
}

export interface BeforeToday {
  beforeUrl: string | null;
  todayUrl: string | null;
  status: Status;
}

/**
 * The before/today pair for the "Before and now" comparison. Prefers the latest
 * submitted check-in's yesterday/today photos; falls back to the first/last
 * timeline photos. Guarantees the two are different URLs when possible.
 */
export function beforeTodayPair(history: TimelineEntryLike[]): BeforeToday {
  const first = history[0];
  const last = history[history.length - 1];
  const sub = latestSubmitted(history);
  if (sub) {
    const todayUrl = sub.today_photo_url ?? sub.photo_url ?? null;
    let beforeUrl = sub.yesterday_photo_url ?? null;
    if (!beforeUrl || beforeUrl === todayUrl) {
      beforeUrl = first?.photo_url ?? null;
    }
    return { beforeUrl, todayUrl, status: sub.status ?? "green" };
  }
  return {
    beforeUrl: first?.photo_url ?? null,
    todayUrl: last?.photo_url ?? null,
    status: last?.status ?? "green",
  };
}
