import { API_BASE_URL } from "../config";

/**
 * Resolve a backend `photo_url` into a usable <img> src.
 *
 * - missing/empty        -> "" (caller should render a placeholder)
 * - absolute (http/https) -> used as-is
 * - relative (/uploads/…, /static/…) -> prefixed with the backend API base URL
 *
 * Shared by the patient app (PhotoStrip, Progress) and the doctor portal so
 * uploaded check-in photos resolve identically everywhere. Never hardcodes the
 * host — it uses API_BASE_URL from config.
 */
export function resolvePhotoUrl(photoUrl: string | null | undefined): string {
  if (!photoUrl) return "";
  if (photoUrl.startsWith("http://") || photoUrl.startsWith("https://")) return photoUrl;
  return `${API_BASE_URL}${photoUrl}`;
}
